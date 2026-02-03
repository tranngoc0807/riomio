"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Check,
  X,
  Loader2,
  Save,
  ChevronDown,
  ChevronRight,
  Factory,
  Package,
  ShoppingCart,
  Wallet,
  FileBarChart,
  Users,
  Settings,
  Building2,
  Boxes,
  Hammer,
  Image,
  ClipboardList,
  Calculator,
  Cog,
  PackageSearch,
  Receipt,
  HandCoins,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserCog,
  FileText,
  Clock,
  Banknote,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserRole } from "@/context/AuthContext";
import { clearPermissionsCache } from "@/context/RolePermissionsContext";

// Menu structure definition
interface MenuItemDef {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  subItems?: { id: string; name: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
}

const MENU_STRUCTURE: MenuItemDef[] = [
  {
    id: "san-xuat",
    name: "Sản xuất",
    icon: Factory,
    subItems: [
      { id: "san-xuat/nguyen-phu-lieu", name: "Nguyên phụ liệu", icon: Boxes },
      { id: "san-xuat/gia-cong", name: "Gia công", icon: Hammer },
      { id: "san-xuat/hinh-in", name: "Hình In", icon: Image },
      { id: "san-xuat/ke-hoach", name: "Kế hoạch sản xuất", icon: ClipboardList },
      { id: "san-xuat/gia-thanh", name: "Giá thành", icon: Calculator },
      { id: "san-xuat/cong-doan", name: "Công đoạn sản xuất", icon: Cog },
      { id: "san-xuat/san-pham", name: "Sản phẩm", icon: PackageSearch },
      { id: "san-xuat/chi-phi-khac", name: "Chi phí khác", icon: Receipt },
    ],
  },
  {
    id: "san-pham",
    name: "Sản phẩm",
    icon: Package,
  },
  {
    id: "ban-hang",
    name: "Bán hàng",
    icon: ShoppingCart,
    subItems: [
      { id: "ban-hang/don-hang", name: "Đơn hàng", icon: ShoppingCart },
      { id: "ban-hang/khach-hang", name: "Khách hàng", icon: Users },
      { id: "ban-hang/chuong-trinh", name: "Chương trình bán hàng", icon: FileBarChart },
      { id: "ban-hang/chi-phi", name: "Chi phí bán hàng", icon: Receipt },
    ],
  },
  {
    id: "dong-tien",
    name: "Dòng tiền",
    icon: Wallet,
    subItems: [
      { id: "quan-ly-tien-vay", name: "Quản lý tiền vay", icon: HandCoins },
      { id: "so-quy", name: "Sổ quỹ", icon: BookOpen },
    ],
  },
  {
    id: "bao-cao",
    name: "Báo cáo",
    icon: FileBarChart,
    subItems: [
      { id: "bao-cao/tai-chinh", name: "Báo cáo tài chính", icon: DollarSign },
      { id: "bao-cao/ban-hang", name: "Báo cáo bán hàng", icon: TrendingUp },
      { id: "bao-cao/kho", name: "Báo cáo kho", icon: Package },
      { id: "bao-cao/dong-tien", name: "Báo cáo dòng tiền", icon: Wallet },
      { id: "bao-cao/chi-phi", name: "Báo cáo chi phí", icon: Receipt },
    ],
  },
  {
    id: "nhan-su",
    name: "Nhân sự",
    icon: UserCog,
    subItems: [
      { id: "nhan-su/danh-sach", name: "Danh sách nhân viên", icon: Users },
      { id: "nhan-su/quy-che-hop-dong", name: "Quy chế & Hợp đồng", icon: FileText },
      { id: "nhan-su/cham-cong", name: "Chấm công nhân viên", icon: Clock },
      { id: "nhan-su/bang-luong", name: "Bảng lương", icon: Banknote },
      { id: "nhan-su/bao-hiem", name: "Bảo hiểm", icon: Shield },
    ],
  },
  {
    id: "cau-hinh",
    name: "Cấu hình",
    icon: Settings,
  },
];

const ALL_ROLES: UserRole[] = [
  "admin",
  "tong_hop",
  "ke_toan",
  "pattern",
  "may_mau",
  "thiet_ke",
  "quan_ly_don_hang",
  "sale_si",
  "sale_san",
  "thu_kho",
  "hinh_anh",
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  tong_hop: "Tổng hợp",
  ke_toan: "Kế toán",
  pattern: "Pattern",
  may_mau: "May mẫu",
  thiet_ke: "Thiết kế",
  quan_ly_don_hang: "Quản lý đơn hàng",
  sale_si: "Sale sỉ",
  sale_san: "Sale sàn",
  thu_kho: "Thủ kho",
  hinh_anh: "Hình ảnh",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-500",
  tong_hop: "bg-blue-500",
  ke_toan: "bg-green-500",
  pattern: "bg-purple-500",
  may_mau: "bg-pink-500",
  thiet_ke: "bg-indigo-500",
  quan_ly_don_hang: "bg-orange-500",
  sale_si: "bg-yellow-500",
  sale_san: "bg-amber-500",
  thu_kho: "bg-teal-500",
  hinh_anh: "bg-cyan-500",
};

interface RolePermissionData {
  role: string;
  permissions: string[];
}

export default function RolePermissionsConfig() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("tong_hop");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(
    MENU_STRUCTURE.filter((m) => m.subItems).map((m) => m.id)
  );

  // Fetch permissions for selected role
  useEffect(() => {
    fetchPermissions(selectedRole);
  }, [selectedRole]);

  const fetchPermissions = async (role: UserRole) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/role-permissions?role=${role}`);
      const result = await response.json();

      if (result.success && result.data) {
        const perms = result.data.permissions || [];
        setPermissions(perms);
        setOriginalPermissions(perms);
      } else {
        setPermissions([]);
        setOriginalPermissions([]);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Không thể tải cấu hình phân quyền");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/role-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          permissions,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Đã lưu phân quyền cho ${ROLE_LABELS[selectedRole]}`);
        setOriginalPermissions(permissions);
        // Clear cache to force refetch on next page load
        clearPermissionsCache();
      } else {
        toast.error(result.error || "Không thể lưu phân quyền");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Lỗi khi lưu phân quyền");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPermissions(originalPermissions);
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isPermissionEnabled = (menuId: string) => {
    return permissions.includes(menuId);
  };

  const togglePermission = (menuId: string, hasSubItems: boolean) => {
    // Admin always has all permissions, don't allow changes
    if (selectedRole === "admin") {
      toast.error("Không thể thay đổi quyền của Admin");
      return;
    }

    setPermissions((prev) => {
      if (prev.includes(menuId)) {
        // Removing permission
        let newPerms = prev.filter((p) => p !== menuId);

        // If it's a parent menu, also remove all sub-item permissions
        if (hasSubItems) {
          const menu = MENU_STRUCTURE.find((m) => m.id === menuId);
          if (menu?.subItems) {
            const subIds = menu.subItems.map((s) => s.id);
            newPerms = newPerms.filter((p) => !subIds.includes(p));
          }
        }

        return newPerms;
      } else {
        // Adding permission
        let newPerms = [...prev, menuId];

        // If it's a parent menu, also add all sub-item permissions
        if (hasSubItems) {
          const menu = MENU_STRUCTURE.find((m) => m.id === menuId);
          if (menu?.subItems) {
            const subIds = menu.subItems.map((s) => s.id);
            subIds.forEach((id) => {
              if (!newPerms.includes(id)) {
                newPerms.push(id);
              }
            });
          }
        }

        // If it's a sub-item, also add parent permission
        const parentMenu = MENU_STRUCTURE.find((m) =>
          m.subItems?.some((s) => s.id === menuId)
        );
        if (parentMenu && !newPerms.includes(parentMenu.id)) {
          newPerms.push(parentMenu.id);
        }

        return newPerms;
      }
    });
  };

  const hasChanges = JSON.stringify(permissions.sort()) !== JSON.stringify(originalPermissions.sort());

  // Get count of enabled sub-items
  const getSubItemCount = (menu: MenuItemDef) => {
    if (!menu.subItems) return { enabled: 0, total: 0 };
    const total = menu.subItems.length;
    const enabled = menu.subItems.filter((s) => permissions.includes(s.id)).length;
    return { enabled, total };
  };

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Chọn vai trò để cấu hình</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.filter((r) => r !== "admin").map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedRole === role
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${ROLE_COLORS[role]}`}></span>
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          * Admin mặc định có quyền truy cập tất cả các trang
        </p>
      </div>

      {/* Permissions Editor */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${ROLE_COLORS[selectedRole]}`}></div>
            <h3 className="font-semibold text-gray-900">
              Quyền truy cập của: {ROLE_LABELS[selectedRole]}
            </h3>
          </div>
          {hasChanges && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Có thay đổi chưa lưu
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Đang tải...</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {MENU_STRUCTURE.map((menu) => {
              const Icon = menu.icon;
              const hasSubItems = !!menu.subItems;
              const isExpanded = expandedMenus.includes(menu.id);
              const isEnabled = isPermissionEnabled(menu.id);
              const subCount = getSubItemCount(menu);

              return (
                <div key={menu.id}>
                  {/* Parent Menu Item */}
                  <div
                    className={`flex items-center gap-3 px-4 py-3 ${
                      isEnabled ? "bg-green-50/50" : "bg-white"
                    }`}
                  >
                    {hasSubItems ? (
                      <button
                        onClick={() => toggleMenu(menu.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown size={18} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-500" />
                        )}
                      </button>
                    ) : (
                      <div className="w-7" />
                    )}

                    <Icon size={20} className={isEnabled ? "text-blue-600" : "text-gray-400"} />

                    <span className={`flex-1 font-medium ${isEnabled ? "text-gray-900" : "text-gray-500"}`}>
                      {menu.name}
                    </span>

                    {hasSubItems && (
                      <span className="text-xs text-gray-500">
                        {subCount.enabled}/{subCount.total} mục
                      </span>
                    )}

                    <button
                      onClick={() => togglePermission(menu.id, hasSubItems)}
                      className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${
                        isEnabled
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                      disabled={selectedRole === "admin"}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                          isEnabled ? "translate-x-6" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sub Items */}
                  {hasSubItems && isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {menu.subItems?.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubEnabled = isPermissionEnabled(subItem.id);

                        return (
                          <div
                            key={subItem.id}
                            className={`flex items-center gap-3 px-4 py-2.5 pl-14 ${
                              isSubEnabled ? "bg-green-50/30" : ""
                            }`}
                          >
                            <SubIcon
                              size={16}
                              className={isSubEnabled ? "text-blue-500" : "text-gray-400"}
                            />

                            <span
                              className={`flex-1 text-sm ${
                                isSubEnabled ? "text-gray-800" : "text-gray-500"
                              }`}
                            >
                              {subItem.name}
                            </span>

                            <button
                              onClick={() => togglePermission(subItem.id, false)}
                              className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                                isSubEnabled
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                              disabled={selectedRole === "admin"}
                            >
                              <span
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                  isSubEnabled ? "translate-x-5" : ""
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {hasChanges && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Lưu thay đổi
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <Shield size={18} />
          Hướng dẫn
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Bật/tắt quyền truy cập vào từng trang cho mỗi vai trò</li>
          <li>• Khi bật menu cha, tất cả menu con sẽ được bật tự động</li>
          <li>• Khi tắt menu cha, tất cả menu con sẽ bị tắt</li>
          <li>• Thay đổi sẽ được áp dụng khi người dùng đăng nhập lại hoặc tải lại trang</li>
        </ul>
      </div>
    </div>
  );
}
