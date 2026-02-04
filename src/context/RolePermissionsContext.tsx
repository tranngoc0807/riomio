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

  const fetchPermissions = useCallback(async (role: string) => {
    // Check cache first
    const cached = permissionsCache[role];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPermissions(cached.permissions);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/role-permissions?role=${role}`);
      const result = await response.json();

      if (result.success && result.data) {
        const perms = result.data.permissions || [];
        setPermissions(perms);
        // Cache the result
        permissionsCache[role] = {
          permissions: perms,
          timestamp: Date.now(),
        };
      } else {
        // If no permissions found, set empty array
        setPermissions([]);
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized && profile?.role) {
      fetchPermissions(profile.role);
    } else if (initialized && !profile) {
      // Not logged in, clear permissions
      setPermissions([]);
      setLoading(false);
    }
  }, [initialized, profile?.role, fetchPermissions]);

  // Check if user has access to a specific menu
  const hasAccess = useCallback((menuId: string): boolean => {
    // If no profile (not logged in or profile failed to load), deny access
    if (!profile) {
      return false;
    }

    // Admin always has access
    if (profile.role === "admin") {
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
    if (profile?.role) {
      // Clear cache for this role
      delete permissionsCache[profile.role];
      await fetchPermissions(profile.role);
    }
  }, [profile?.role, fetchPermissions]);

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
