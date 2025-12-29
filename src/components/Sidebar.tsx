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
} from "lucide-react";
import { useState, useEffect } from "react";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  subItems?: { name: string; href: string; icon: React.ComponentType<{ size?: number }> }[];
}

const menuItems: MenuItem[] = [
  {
    name: "Thông tin công ty",
    href: "/thong-tin-cong-ty",
    icon: Building2,
  },
  {
    name: "Sản xuất",
    href: "/san-xuat",
    icon: Factory,
  },
  {
    name: "Sản phẩm",
    href: "/san-pham",
    icon: Package,
  },
  {
    name: "Bán hàng",
    href: "/ban-hang",
    icon: ShoppingCart,
  },
  {
    name: "Dòng tiền",
    href: "/dong-tien",
    icon: Wallet,
    subItems: [
      {
        name: "Lương & Bảo hiểm",
        href: "/luong-bao-hiem",
        icon: Users,
      },
      {
        name: "Quản lý tiền vay",
        href: "/quan-ly-tien-vay",
        icon: HandCoins,
      },
    ],
  },
  {
    name: "Báo cáo",
    href: "/bao-cao",
    icon: FileBarChart,
  },
  {
    name: "Cấu hình",
    href: "/cau-hinh",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Auto-expand parent menu if a sub-item is active
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some((sub) => pathname === sub.href);
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
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen overflow-y-auto bg-gradient-to-b from-blue-900 to-blue-800 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="block p-6 border-b border-blue-700 hover:bg-blue-700/30 transition-colors cursor-pointer"
        >
          <h1 className="text-xl font-bold">Riomio Shop</h1>
          <p className="text-blue-300 text-sm mt-1">Hệ thống quản lý</p>
        </Link>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.includes(item.href);
              const isActive = pathname === item.href;
              const hasActiveSubItem = hasSubItems && item.subItems?.some((sub) => pathname === sub.href);

              return (
                <li key={item.href}>
                  {hasSubItems ? (
                    <>
                      {/* Parent menu with sub-items */}
                      <div className="flex flex-col">
                        <div
                          className={`flex items-center rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-white shadow-lg"
                              : hasActiveSubItem
                              ? "bg-blue-700/50"
                              : "hover:bg-blue-700/50"
                          }`}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex-1 flex items-center gap-3 px-4 py-3 transition-colors ${
                              isActive
                                ? "text-blue-900"
                                : "text-blue-100"
                            }`}
                          >
                            <Icon size={20} />
                            <span className="font-medium">{item.name}</span>
                          </Link>
                          <button
                            onClick={() => toggleMenu(item.href)}
                            className={`px-3 py-3 transition-colors ${
                              isActive
                                ? "text-blue-900 hover:bg-blue-100 rounded-r-lg"
                                : "text-blue-100 hover:bg-blue-600/50 rounded-r-lg"
                            }`}
                          >
                            <ChevronDown
                              size={18}
                              className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Sub-items */}
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            isExpanded ? "max-h-40 mt-1" : "max-h-0"
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
                                    <span className="font-medium">{subItem.name}</span>
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
          <p className="text-blue-300 text-xs text-center">
            &copy; {new Date().getFullYear()} Riomio Shop
          </p>
        </div>
      </aside>
    </>
  );
}
