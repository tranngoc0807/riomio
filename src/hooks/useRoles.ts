"use client";

import { useState, useEffect, useCallback } from "react";
import type { Role } from "@/types/roles";

// Fallback roles khi chưa tạo bảng roles trong Supabase
const FALLBACK_ROLES: Role[] = [
  { id: "admin", display_name: "Admin", color: "bg-red-500", is_system: true, sort_order: 0 },
  { id: "tong_hop", display_name: "Tổng hợp", color: "bg-blue-500", is_system: true, sort_order: 1 },
  { id: "ke_toan", display_name: "Kế toán", color: "bg-green-500", is_system: true, sort_order: 2 },
  { id: "pattern", display_name: "Pattern", color: "bg-purple-500", is_system: true, sort_order: 3 },
  { id: "may_mau", display_name: "May mẫu", color: "bg-pink-500", is_system: true, sort_order: 4 },
  { id: "thiet_ke", display_name: "Thiết kế", color: "bg-indigo-500", is_system: true, sort_order: 5 },
  { id: "quan_ly_don_hang", display_name: "Quản lý đơn hàng", color: "bg-orange-500", is_system: true, sort_order: 6 },
  { id: "sale_si", display_name: "Sale sỉ", color: "bg-yellow-500", is_system: true, sort_order: 7 },
  { id: "sale_san", display_name: "Sale sàn", color: "bg-amber-500", is_system: true, sort_order: 8 },
  { id: "thu_kho", display_name: "Thủ kho", color: "bg-teal-500", is_system: true, sort_order: 9 },
  { id: "hinh_anh", display_name: "Hình ảnh", color: "bg-cyan-500", is_system: true, sort_order: 10 },
];

let rolesCache: { roles: Role[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function clearRolesCache() {
  rolesCache = null;
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>(rolesCache?.roles || FALLBACK_ROLES);
  const [loading, setLoading] = useState(!rolesCache);

  const fetchRoles = useCallback(async (skipCache = false) => {
    if (!skipCache && rolesCache && Date.now() - rolesCache.timestamp < CACHE_DURATION) {
      setRoles(rolesCache.roles);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/roles");
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        setRoles(result.data);
        rolesCache = { roles: result.data, timestamp: Date.now() };
      } else {
        // API trả về empty hoặc lỗi → dùng fallback
        setRoles(FALLBACK_ROLES);
        rolesCache = { roles: FALLBACK_ROLES, timestamp: Date.now() };
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      // Lỗi kết nối → dùng fallback
      setRoles(FALLBACK_ROLES);
      rolesCache = { roles: FALLBACK_ROLES, timestamp: Date.now() };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const getRoleLabel = useCallback(
    (roleId: string) => {
      return roles.find((r) => r.id === roleId)?.display_name || roleId;
    },
    [roles]
  );

  const getRoleColor = useCallback(
    (roleId: string) => {
      return roles.find((r) => r.id === roleId)?.color || "bg-gray-500";
    },
    [roles]
  );

  return { roles, loading, fetchRoles, getRoleLabel, getRoleColor };
}
