"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Factory,
  ShoppingCart,
  Wallet,
  Users,
  HandCoins,
  FileBarChart,
  Menu,
  X,
  Package,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Boxes,
  Hammer,
  Image,
  ClipboardList,
  Calculator,
  Cog,
  PackageSearch,
  Receipt,
  BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  roles?: UserRole[]; // Roles that can access this menu
  subItems?: {
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number }>;
    roles?: UserRole[];
  }[];
}

// Define role groups for easier management
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

const FINANCIAL_ROLES: UserRole[] = ["admin", "ke_toan", "quan_ly_don_hang"];

const menuItems: MenuItem[] = [
  {
    name: "Thông tin công ty",
    href: "/thong-tin-cong-ty",
    icon: Building2,
    roles: ALL_ROLES,
  },
  {
    name: "Sản xuất",
    href: "/san-xuat",
    icon: Factory,
    roles: ALL_ROLES,
    subItems: [
      {
        name: "Nguyên phụ liệu",
        href: "/san-xuat/nguyen-phu-lieu",
        icon: Boxes,
        roles: ALL_ROLES,
      },
      {
        name: "Gia công",
        href: "/san-xuat/gia-cong",
        icon: Hammer,
        roles: ALL_ROLES,
      },
      {
        name: "Hình In",
        href: "/san-xuat/hinh-in",
        icon: Image,
        roles: ALL_ROLES,
      },
      {
        name: "Kế hoạch sản xuất",
        href: "/san-xuat/ke-hoach",
        icon: ClipboardList,
        roles: ALL_ROLES,
      },
      {
        name: "Giá thành",
        href: "/san-xuat/gia-thanh",
        icon: Calculator,
        roles: ALL_ROLES,
      },
      {
        name: "Công đoạn sản xuất",
        href: "/san-xuat/cong-doan",
        icon: Cog,
        roles: ALL_ROLES,
      },
      {
        name: "Sản phẩm",
        href: "/san-xuat/san-pham",
        icon: PackageSearch,
        roles: ALL_ROLES,
      },
      {
        name: "Chi phí khác",
        href: "/san-xuat/chi-phi-khac",
        icon: Receipt,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    name: "Sản phẩm",
    href: "/san-pham",
    icon: Package,
    roles: ALL_ROLES,
  },
  {
    name: "Bán hàng",
    href: "/ban-hang",
    icon: ShoppingCart,
    roles: ALL_ROLES,
    subItems: [
      {
        name: "Đơn hàng",
        href: "/ban-hang/don-hang",
        icon: ShoppingCart,
        roles: ALL_ROLES,
      },
      {
        name: "Khách hàng",
        href: "/ban-hang/khach-hang",
        icon: Users,
        roles: ALL_ROLES,
      },
      {
        name: "Chương trình bán hàng",
        href: "/ban-hang/chuong-trinh",
        icon: FileBarChart,
        roles: ALL_ROLES,
      },
      {
        name: "Chi phí bán hàng",
        href: "/ban-hang/chi-phi",
        icon: Receipt,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    name: "Dòng tiền",
    href: "/dong-tien",
    icon: Wallet,
    roles: FINANCIAL_ROLES,
    subItems: [
      {
        name: "Lương & Bảo hiểm",
        href: "/luong-bao-hiem",
        icon: Users,
        roles: FINANCIAL_ROLES,
      },
      {
        name: "Quản lý tiền vay",
        href: "/quan-ly-tien-vay",
        icon: HandCoins,
        roles: FINANCIAL_ROLES,
      },
      {
        name: "Sổ quỹ",
        href: "/so-quy",
        icon: BookOpen,
        roles: FINANCIAL_ROLES,
      },
    ],
  },
  {
    name: "Báo cáo",
    href: "/bao-cao",
    icon: FileBarChart,
    roles: FINANCIAL_ROLES,
  },
  {
    name: "Cấu hình",
    href: "/cau-hinh",
    icon: Settings,
    roles: ["admin"],
  },
];

const roleLabels: Record<UserRole, string> = {
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

const roleColors: Record<UserRole, string> = {
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

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { profile, session, signOut, initialized } = useAuth();

  // Filter menu items based on user role
  const filteredMenuItems = menuItems
    .filter((item) => {
      if (!profile) return true; // Show all menus as fallback if profile not loaded
      if (!item.roles) return true;
      return item.roles.includes(profile.role);
    })
    .map((item) => {
      if (item.subItems) {
        return {
          ...item,
          subItems: item.subItems.filter((sub) => {
            if (!profile) return true; // Show all sub-items as fallback
            if (!sub.roles) return true;
            return sub.roles.includes(profile.role);
          }),
        };
      }
      return item;
    });

  // Auto-expand parent menu if a sub-item is active
  useEffect(() => {
    filteredMenuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          (sub) => pathname === sub.href
        );
        if (hasActiveSubItem) {
          setExpandedMenus((prev) =>
            prev.includes(item.href) ? prev : [...prev, item.href]
          );
        }
      }
    });
  }, [pathname]);

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  // Don't render sidebar if not initialized or not authenticated
  if (!initialized || !session) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="block p-6 border-b border-blue-700 hover:bg-blue-700/30 transition-colors cursor-pointer flex-shrink-0"
        >
          <h1 className="text-xl font-bold">Riomio Shop</h1>
          <p className="text-blue-300 text-sm mt-1">Hệ thống quản lý</p>
        </Link>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.includes(item.href);
              const isActive = pathname === item.href;
              const hasActiveSubItem =
                hasSubItems &&
                item.subItems?.some((sub) => pathname === sub.href);

              return (
                <li key={item.href}>
                  {hasSubItems ? (
                    <>
                      {/* Parent menu with sub-items */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => toggleMenu(item.href)}
                          className={`w-full flex items-center justify-between rounded-lg transition-all duration-200 px-4 py-3 ${
                            hasActiveSubItem
                              ? "bg-blue-700/50 text-blue-100"
                              : "hover:bg-blue-700/50 text-blue-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={20} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Sub-items */}
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            isExpanded ? "max-h-96 mt-1" : "max-h-0"
                          }`}
                        >
                          <ul className="ml-4 pl-4 border-l border-blue-600 space-y-1">
                            {item.subItems?.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = pathname === subItem.href;

                              return (
                                <li key={subItem.href}>
                                  <Link
                                    href={subItem.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                                      isSubActive
                                        ? "bg-white text-blue-900 shadow-lg"
                                        : "hover:bg-blue-700/50 text-blue-200"
                                    }`}
                                  >
                                    <SubIcon size={18} />
                                    <span className="font-medium leading-tight">
                                      {subItem.name}
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Regular menu item without sub-items
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-white text-blue-900 shadow-lg"
                          : "hover:bg-blue-700/50 text-blue-100"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section - User Profile */}
        <div className="flex-shrink-0 border-t border-blue-700">
          <div className="px-4 py-4">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 hover:bg-blue-700/30 rounded-lg p-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-sm truncate">
                  {profile?.full_name || session?.user?.email || "User"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {profile ? (
                    <>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          roleColors[profile.role]
                        }`}
                      ></span>
                      <span className="text-xs text-blue-300">
                        {roleLabels[profile.role]}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-blue-300">
                      {session?.user?.email}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="mt-2 bg-blue-800 rounded-lg shadow-lg border border-blue-700 overflow-hidden">
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </div>
            )}
          </div>

          {/* <div className="border-t border-blue-700 py-3">
            <p className="text-blue-400 text-xs text-center">
              &copy; {new Date().getFullYear()} Riomio Shop
            </p>
          </div> */}
        </div>
      </aside>
    </>
  );
}
