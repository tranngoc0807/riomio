"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

interface RolePermissionsContextType {
  permissions: string[];
  loading: boolean;
  hasAccess: (menuId: string) => boolean;
  refetchPermissions: () => Promise<void>;
}

const RolePermissionsContext = createContext<RolePermissionsContextType | undefined>(undefined);

// Cache for permissions to avoid refetching
const permissionsCache: Record<string, { permissions: string[]; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function RolePermissionsProvider({ children }: { children: ReactNode }) {
  const { profile, initialized } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch permissions cho 1 role (có cache)
  const fetchOneRole = async (role: string): Promise<string[]> => {
    const cached = permissionsCache[role];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.permissions;
    }
    try {
      const response = await fetch(`/api/role-permissions?role=${role}`);
      const result = await response.json();
      const perms: string[] = result.success && result.data ? result.data.permissions || [] : [];
      permissionsCache[role] = { permissions: perms, timestamp: Date.now() };
      return perms;
    } catch (error) {
      console.error(`Error fetching permissions for role "${role}":`, error);
      return [];
    }
  };

  // Fetch + gộp (union) permissions từ tất cả roles của user
  const fetchPermissions = useCallback(async (roles: string[]) => {
    if (roles.length === 0) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = await Promise.all(roles.map(fetchOneRole));
    const merged = Array.from(new Set(results.flat()));
    setPermissions(merged);
    setLoading(false);
  }, []);

  // Key ổn định để useEffect chỉ chạy khi danh sách roles đổi
  const rolesKey = profile?.roles ? [...profile.roles].sort().join("|") : "";

  useEffect(() => {
    if (!initialized) return;
    // Có roles → fetch; không thì coi như rỗng (không kẹt loading)
    if (profile?.roles?.length) {
      fetchPermissions(profile.roles);
    } else if (profile?.role) {
      // Fallback: profile cache cũ chưa có roles[], dùng role string
      fetchPermissions([profile.role]);
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [initialized, rolesKey, fetchPermissions, profile]);

  // Check if user has access to a specific menu
  const hasAccess = useCallback((menuId: string): boolean => {
    // If no profile (not logged in or profile failed to load), deny access
    if (!profile) {
      return false;
    }

    // Admin always has access (kiểm tra bất kỳ role nào là admin)
    if (profile.roles?.includes("admin") || profile.role === "admin") {
      return true;
    }

    // If permissions not loaded yet, deny access
    if (loading) {
      return false;
    }

    // If no permissions configured for this role, deny access (safer default)
    if (permissions.length === 0) {
      return false;
    }

    // Convert href to menu ID format
    // e.g., "/san-xuat/nguyen-phu-lieu" -> "san-xuat/nguyen-phu-lieu"
    const normalizedMenuId = menuId.startsWith("/") ? menuId.slice(1) : menuId;

    return permissions.includes(normalizedMenuId);
  }, [permissions, loading, profile]);

  // Refetch permissions (useful after admin updates)
  const refetchPermissions = useCallback(async () => {
    if (profile?.roles?.length) {
      // Clear cache cho mọi role của user
      profile.roles.forEach((r) => delete permissionsCache[r]);
      await fetchPermissions(profile.roles);
    }
  }, [profile?.roles, fetchPermissions]);

  return (
    <RolePermissionsContext.Provider
      value={{
        permissions,
        loading,
        hasAccess,
        refetchPermissions,
      }}
    >
      {children}
    </RolePermissionsContext.Provider>
  );
}

export function useRolePermissions() {
  const context = useContext(RolePermissionsContext);
  if (context === undefined) {
    throw new Error("useRolePermissions must be used within a RolePermissionsProvider");
  }
  return context;
}

// Export helper to clear all cached permissions (useful when admin updates permissions)
export function clearPermissionsCache() {
  Object.keys(permissionsCache).forEach((key) => {
    delete permissionsCache[key];
  });
}
