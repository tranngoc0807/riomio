"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export type UserRole = string;

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;       // Legacy: role chính, giữ để backward-compat
  roles: UserRole[];    // Multi-role (luôn là mảng sau khi normalize)
  created_at: string;
}

// Normalize: đảm bảo roles luôn là mảng. Nếu DB chưa có roles thì fallback từ role.
const normalizeProfile = (raw: any): Profile => {
  const roles: string[] =
    Array.isArray(raw.roles) && raw.roles.length > 0
      ? raw.roles
      : raw.role
        ? [raw.role]
        : [];
  return { ...raw, roles, role: roles[0] || raw.role || "" };
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signingOut: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const PROFILE_CACHE_KEY = "riomio_profile_cache";
  const PROFILE_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours - longer cache to avoid issues

  // Get cached profile from localStorage
  const getCachedProfile = (userId: string, ignoreExpiry: boolean = false): Profile | null => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const { profile: cachedProfile, timestamp, cachedUserId } = JSON.parse(cached);
        if (cachedUserId === userId) {
          const isExpired = Date.now() - timestamp >= PROFILE_CACHE_EXPIRY;
          if (!isExpired || ignoreExpiry) {
            console.log(`📋 fetchProfile: Using cached profile (expired: ${isExpired})`);
            // Normalize để đảm bảo cache cũ chưa có roles[] vẫn dùng được
            return normalizeProfile(cachedProfile);
          }
        }
      }
    } catch (e) {
      console.warn("📋 fetchProfile: Cache read error", e);
    }
    return null;
  };

  // Save profile to localStorage cache
  const setCachedProfile = (userId: string, profileData: Profile) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
        profile: profileData,
        timestamp: Date.now(),
        cachedUserId: userId,
      }));
    } catch (e) {
      console.warn("📋 fetchProfile: Cache write error", e);
    }
  };

  // Clear profile cache
  const clearProfileCache = () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch (e) {
      console.warn("📋 fetchProfile: Cache clear error", e);
    }
  };

  const fetchProfile = async (userId: string, useCache = true): Promise<Profile | null> => {
    // Try to get from valid cache first (not expired)
    const validCached = getCachedProfile(userId, false);
    if (useCache && validCached) {
      return validCached;
    }

    try {
      console.log("📋 fetchProfile: Fetching from Supabase...");

      // Add timeout to prevent hanging forever
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn("⚠️ fetchProfile: Timeout after 10 seconds");
          resolve(null);
        }, 10000);
      });

      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
        .then((response: { data: any; error: Error | null }) => {
          if (response.error) {
            console.error("📋 fetchProfile: Error:", response.error);
            return null;
          }
          return response.data ? normalizeProfile(response.data) : null;
        });

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      if (result) {
        console.log("📋 fetchProfile: Success, caching profile");
        setCachedProfile(userId, result);
        return result;
      }

      // If fetch failed, return cached profile as fallback (even if expired)
      const expiredCached = getCachedProfile(userId, true); // ignoreExpiry = true
      if (expiredCached) {
        console.log("📋 fetchProfile: Fetch failed, using expired cached profile as fallback");
        return expiredCached;
      }

      return null;
    } catch (err) {
      console.error("📋 fetchProfile: Exception:", err);
      // Return cached profile as fallback on error (even if expired)
      const expiredCached = getCachedProfile(userId, true);
      if (expiredCached) {
        console.log("📋 fetchProfile: Exception, using expired cached profile as fallback");
        return expiredCached;
      }
      return null;
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let mounted = true;
    let hasInitialized = false;

    // Listen for auth changes FIRST (must be before getSession)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        if (!mounted) return;

        // IMPORTANT: Set fetchingProfile BEFORE session to prevent auto-logout race condition
        if (newSession?.user) {
          setFetchingProfile(true);
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id);
          if (mounted) {
            setProfile(profileData);
            setFetchingProfile(false);
          }
        } else {
          setProfile(null);
          setFetchingProfile(false);
        }

        // Set initialized after handling session (only once)
        if (mounted && !hasInitialized) {
          hasInitialized = true;
          setInitialized(true);
        }
      }
    );

    // Initialize session AFTER setting up listener
    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();
        console.log(
          "🟡 AuthProvider: getSession result, session:",
          currentSession ? "exists" : "null",
          "error:",
          error
        );

        if (!isSubscribed) return;

        // IMPORTANT: Set fetchingProfile BEFORE session to prevent auto-logout race condition
        if (currentSession?.user) {
          setFetchingProfile(true);
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          if (isSubscribed) {
            setProfile(profileData);
            setFetchingProfile(false);
          }
        } else {
          setProfile(null);
          setFetchingProfile(false);
        }

        hasInitialized = true;
        setInitialized(true);
      } catch (error) {
        console.error("🔴 AuthProvider: Error initializing auth:", error);
        if (isSubscribed) {
          hasInitialized = true;
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      isSubscribed = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-logout if session exists but profile is null (profile fetch failed completely)
  useEffect(() => {
    // Don't auto-logout while profile is being fetched
    if (initialized && session && !profile && !signingOut && !fetchingProfile) {
      console.warn("⚠️ AuthProvider: Session exists but no profile found. Forcing re-login...");
      // Clear everything and force re-login
      clearProfileCache();
      supabase.auth.signOut().then(() => {
        setUser(null);
        setProfile(null);
        setSession(null);
        router.push("/login");
        router.refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, session, profile, signingOut, fetchingProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Don't redirect here - let LayoutWrapper handle it automatically
    // when session state updates via onAuthStateChange

    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = "tong_hop"
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { error: error as Error };
    }

    // Create profile after signup
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: role,
        roles: [role],
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return { error: profileError as Error };
      }
    }

    return { error: null };
  };

  // Function to manually refetch profile (useful when profile fails to load)
  const refetchProfile = async () => {
    if (user?.id) {
      console.log("📋 refetchProfile: Manually refetching profile...");
      setFetchingProfile(true);
      const profileData = await fetchProfile(user.id, false); // Skip cache
      setProfile(profileData);
      setFetchingProfile(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true); // Show loading overlay immediately
    clearProfileCache(); // Clear cached profile on logout
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);

    // Check if admin exists to redirect to correct page
    const { data: adminData } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    const hasAdmin = adminData && adminData.length > 0;
    router.push(hasAdmin ? "/login" : "/register");
    router.refresh();

    // Reset signingOut after a short delay to allow page transition
    setTimeout(() => {
      setSigningOut(false);
    }, 500);
  };

  const hasPermission = (requiredRoles: UserRole[]) => {
    if (!profile) return false;
    // User có quyền nếu BẤT KỲ role nào của họ nằm trong requiredRoles
    return profile.roles.some((r) => requiredRoles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        initialized,
        signingOut,
        signIn,
        signUp,
        signOut,
        hasPermission,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
