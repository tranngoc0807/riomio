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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn("⚠️ fetchProfile: TIMEOUT after 5 seconds");
          resolve(null);
        }, 5000);
      });

      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
        .then((response: any) => {
          if (response.error) {
            console.error("📋 fetchProfile: Error:", response.error);
            return null;
          }
          return response.data as Profile;
        });

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      return result;
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

  const signOut = async () => {
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
        signIn,
        signUp,
        signOut,
        hasPermission,
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
