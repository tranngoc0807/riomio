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

export type UserRole =
  | "admin"
  | "tong_hop" // Tổng hợp
  | "ke_toan" // Kế toán
  | "pattern" // Pattern
  | "may_mau" // May mẫu
  | "thiet_ke" // Thiết kế
  | "quan_ly_don_hang" // Quản lý đơn hàng
  | "sale_si" // Sale sỉ
  | "sale_san" // Sale sàn
  | "thu_kho" // Thủ kho
  | "hinh_anh"; // Hình ảnh

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

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
  const router = useRouter();
  const supabase = createClient();

  const PROFILE_CACHE_KEY = "riomio_profile_cache";
  const PROFILE_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Get cached profile from localStorage
  const getCachedProfile = (userId: string): Profile | null => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const { profile: cachedProfile, timestamp, cachedUserId } = JSON.parse(cached);
        if (cachedUserId === userId && Date.now() - timestamp < PROFILE_CACHE_EXPIRY) {
          console.log("📋 fetchProfile: Using cached profile");
          return cachedProfile;
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
    // Try to get from cache first
    if (useCache) {
      const cached = getCachedProfile(userId);
      if (cached) {
        return cached;
      }
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
        .then((response: { data: Profile | null; error: Error | null }) => {
          if (response.error) {
            console.error("📋 fetchProfile: Error:", response.error);
            return null;
          }
          return response.data;
        });

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      if (result) {
        console.log("📋 fetchProfile: Success, caching profile");
        setCachedProfile(userId, result);
        return result;
      }

      return null;
    } catch (err) {
      console.error("📋 fetchProfile: Exception:", err);
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

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
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

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          if (isSubscribed) setProfile(profileData);
        } else {
          setProfile(null);
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
      const profileData = await fetchProfile(user.id, false); // Skip cache
      setProfile(profileData);
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
    return requiredRoles.includes(profile.role);
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
