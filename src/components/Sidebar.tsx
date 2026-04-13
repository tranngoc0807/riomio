"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
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
  DollarSign,
  TrendingUp,
  UserCog,
  FileText,
  Clock,
  Banknote,
  Shield,
  Key,
  Eye,
  EyeOff,
  Loader2,
  UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRolePermissions } from "@/context/RolePermissionsContext";
import { useRoles } from "@/hooks/useRoles";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  subItems?: {
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number }>;
  }[];
}

const menuItems: MenuItem[] = [
  {
    name: "Sản xuất",
    href: "/san-xuat",
    icon: Factory,

    subItems: [
      {
        name: "Nguyên phụ liệu",
        href: "/san-xuat/nguyen-phu-lieu",
        icon: Boxes,
      },
      {
        name: "Gia công",
        href: "/san-xuat/gia-cong",
        icon: Hammer,
      },
      {
        name: "Hình In",
        href: "/san-xuat/hinh-in",
        icon: Image,
      },
      {
        name: "Kế hoạch sản xuất",
        href: "/san-xuat/ke-hoach",
        icon: ClipboardList,
      },
      {
        name: "Giá thành",
        href: "/san-xuat/gia-thanh",
        icon: Calculator,
      },
      {
        name: "Công đoạn sản xuất",
        href: "/san-xuat/cong-doan",
        icon: Cog,
      },
      {
        name: "Sản phẩm",
        href: "/san-xuat/san-pham",
        icon: PackageSearch,
      },
      {
        name: "Chi phí khác",
        href: "/san-xuat/chi-phi-khac",
        icon: Receipt,
      },
    ],
  },
  {
    name: "Sản phẩm",
    href: "/san-pham",
    icon: Package,
  },
  {
    name: "Hình ảnh",
    href: "/hinh-anh",
    icon: Image,

    subItems: [
      {
        name: "Sản phẩm",
        href: "/hinh-anh?tab=san-pham",
        icon: Package,
      },
      {
        name: "Nguyên phụ liệu",
        href: "/hinh-anh?tab=nguyen-phu-lieu",
        icon: Boxes,
      },
      {
        name: "Hình in",
        href: "/hinh-anh?tab=hinh-in",
        icon: Image,
      },
    ],
  },
  {
    name: "Bán hàng",
    href: "/ban-hang",
    icon: ShoppingCart,

    subItems: [
      {
        name: "Đơn hàng",
        href: "/ban-hang/don-hang",
        icon: ShoppingCart,
      },
      {
        name: "Khách hàng",
        href: "/ban-hang/khach-hang",
        icon: Users,
      },
      {
        name: "Chương trình bán hàng",
        href: "/ban-hang/chuong-trinh",
        icon: FileBarChart,
      },
      {
        name: "Chi phí bán hàng",
        href: "/ban-hang/chi-phi",
        icon: Receipt,
      },
    ],
  },
  {
    name: "Dòng tiền",
    href: "/dong-tien",
    icon: Wallet,

    subItems: [
      {
        name: "Quản lý tiền vay",
        href: "/quan-ly-tien-vay",
        icon: HandCoins,
      },
      {
        name: "Sổ quỹ",
        href: "/so-quy",
        icon: BookOpen,
      },
    ],
  },
  {
    name: "Báo cáo",
    href: "/bao-cao",
    icon: FileBarChart,

    subItems: [
      {
        name: "Báo cáo tài chính",
        href: "/bao-cao?tab=tai-chinh",
        icon: DollarSign,
      },
      {
        name: "Báo cáo bán hàng",
        href: "/bao-cao?tab=ban-hang",
        icon: TrendingUp,
      },
      {
        name: "Báo cáo kho",
        href: "/bao-cao?tab=kho",
        icon: Package,
      },
      {
        name: "Báo cáo dòng tiền",
        href: "/bao-cao?tab=dong-tien",
        icon: Wallet,
      },
      {
        name: "Báo cáo chi phí",
        href: "/bao-cao?tab=chi-phi",
        icon: Receipt,
      },
    ],
  },
  {
    name: "Nhân sự",
    href: "/nhan-su",
    icon: UserCog,

    subItems: [
      {
        name: "Danh sách nhân viên",
        href: "/nhan-su?tab=danh-sach",
        icon: Users,
      },
      {
        name: "Quy chế & Hợp đồng",
        href: "/nhan-su?tab=quy-che-hop-dong",
        icon: FileText,
      },
      {
        name: "Chấm công nhân viên",
        href: "/nhan-su?tab=cham-cong",
        icon: Clock,
      },
      {
        name: "Bảng lương",
        href: "/nhan-su?tab=bang-luong",
        icon: Banknote,
      },
      {
        name: "Bảo hiểm",
        href: "/nhan-su?tab=bao-hiem",
        icon: Shield,
      },
    ],
  },
  {
    name: "Cấu hình",
    href: "/cau-hinh",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const { profile, session, signOut, initialized } = useAuth();
  const { getRoleLabel, getRoleColor } = useRoles();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();

  // Reset password form when modal closes
  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setChangingPassword(true);
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Đổi mật khẩu thành công!");
        setShowProfileModal(false);
        resetPasswordForm();
      } else {
        toast.error(result.error || "Không thể đổi mật khẩu");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Lỗi khi đổi mật khẩu");
    } finally {
      setChangingPassword(false);
    }
  };

  // Helper function to check if a link is active (including query params)
  const isLinkActive = (href: string) => {
    const [hrefPath, hrefQuery] = href.split("?");

    // Check pathname
    if (pathname !== hrefPath) return false;

    // If no query params in href, just check pathname
    if (!hrefQuery) return true;

    // Parse query params from href
    const hrefParams = new URLSearchParams(hrefQuery);

    // Check all query params match
    for (const [key, value] of hrefParams.entries()) {
      if (searchParams.get(key) !== value) return false;
    }

    return true;
  };

  // Convert href to menu ID for permission check
  const getMenuIdFromHref = (href: string): string => {
    // Remove leading slash and query params
    const [path] = href.split("?");
    return path.startsWith("/") ? path.slice(1) : path;
  };

  // Filter menu items based on dynamic permissions from Supabase
  const filteredMenuItems = menuItems
    .filter((item) => {
      // Use dynamic permissions
      const menuId = getMenuIdFromHref(item.href);
      return hasAccess(menuId);
    })
    .map((item) => {
      if (item.subItems) {
        return {
          ...item,
          subItems: item.subItems.filter((sub) => {
            const subMenuId = getMenuIdFromHref(sub.href);
            return hasAccess(subMenuId);
          }),
        };
      }
      return item;
    });

  // Auto-expand parent menu if a sub-item is active
  useEffect(() => {
    filteredMenuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some((sub) =>
          isLinkActive(sub.href),
        );
        if (hasActiveSubItem) {
          setExpandedMenus((prev) =>
            prev.includes(item.href) ? prev : [...prev, item.href],
          );
        }
      }
    });
  }, [pathname, searchParams]);

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href],
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
          <h1 className="text-xl font-bold">RIOMIO</h1>
          <p className="text-blue-300 text-sm mt-1">Hệ thống quản lý</p>
        </Link>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.includes(item.href);
              const isActive = isLinkActive(item.href);
              const hasActiveSubItem =
                hasSubItems &&
                item.subItems?.some((sub) => isLinkActive(sub.href));

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
                              const isSubActive = isLinkActive(subItem.href);

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
                          getRoleColor(profile.role)
                        }`}
                      ></span>
                      <span className="text-xs text-blue-300">
                        {getRoleLabel(profile.role)}
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
                <Link
                  href="/profile"
                  onClick={() => { setShowUserMenu(false); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 transition-colors border-b border-blue-700"
                >
                  <UserCircle size={18} />
                  <span className="font-medium">Thông tin cá nhân</span>
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 transition-colors border-b border-blue-700"
                >
                  <Key size={18} />
                  <span className="font-medium">Đổi mật khẩu</span>
                </button>
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

      {/* Profile Modal - Change Password */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <div className="text-white">
                  <h2 className="text-xl font-bold">
                    {profile?.full_name || "Người dùng"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        profile ? getRoleColor(profile.role) : "bg-gray-400"
                      }`}
                    ></span>
                    <span className="text-blue-100 text-sm">
                      {profile ? getRoleLabel(profile.role) : ""}
                    </span>
                  </div>
                  <p className="text-blue-200 text-sm mt-1">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Content - Change Password Form */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Key size={20} className="text-blue-600" />
                Đổi mật khẩu
              </h3>

              <div className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {newPassword &&
                  confirmPassword &&
                  newPassword !== confirmPassword && (
                    <p className="text-red-500 text-sm">
                      Mật khẩu xác nhận không khớp
                    </p>
                  )}

                {newPassword && newPassword.length < 6 && (
                  <p className="text-orange-500 text-sm">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  resetPasswordForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={changingPassword}
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                disabled={
                  changingPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 6
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Key size={18} />
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
