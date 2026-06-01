"use client";

import {
  BookOpen,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Wallet,
  Calendar,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useRolePermissions } from "@/context/RolePermissionsContext";
import DongTienTab from "./components/DongTienTab";
import TaiKhoanTab from "./components/TaiKhoanTab";
import BCQuyTheoNgayTab from "./components/BCQuyTheoNgayTab";
import BCQuyTheoThangTab from "./components/BCQuyTheoThangTab";
import BCTungTaiKhoanTab from "./components/BCTungTaiKhoanTab";
import DuQuyTab from "./components/DuQuyTab";

type TabType = "phieu-thu" | "phieu-chi" | "so-quy" | "tai-khoan" | "du-quy" | "bc-ngay" | "bc-thang" | "bc-tai-khoan";

const TABS = [
  { id: "so-quy" as TabType, label: "Sổ quỹ", icon: BookOpen },
  { id: "tai-khoan" as TabType, label: "Tài khoản", icon: Wallet },
  { id: "du-quy" as TabType, label: "Dư quỹ", icon: Wallet },
  { id: "bc-ngay" as TabType, label: "BC theo ngày", icon: Calendar },
  { id: "bc-thang" as TabType, label: "BC theo tháng", icon: CalendarDays },
  { id: "bc-tai-khoan" as TabType, label: "BC tài khoản", icon: CreditCard },
];

export default function SoQuy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>("so-quy");

  // Filter tabs based on permissions.
  // Quyền cha "so-quy" (toggle Sổ quỹ trong phân quyền) → mở tất cả tab;
  // nếu không, lọc theo từng quyền tab con "so-quy/<tab>".
  const filteredTabs = useMemo(() => {
    if (hasAccess("so-quy")) return TABS;
    return TABS.filter((tab) => hasAccess(`so-quy/${tab.id}`));
  }, [hasAccess]);

  useEffect(() => {
    const validTabs = filteredTabs.map((t) => t.id);
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (filteredTabs.length > 0 && !validTabs.includes(activeTab)) {
      setActiveTab(filteredTabs[0].id);
    }
  }, [tabParam, filteredTabs, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/so-quy?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            Sổ quỹ
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý phiếu thu, phiếu chi và sổ quỹ
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTabs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Bạn không có quyền truy cập các tab trong mục này
            </div>
          ) : (
            <div className="flex">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "text-blue-600 border-blue-600 bg-blue-50/50"
                        : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Phiếu thu Tab */}
          {activeTab === "phieu-thu" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách phiếu thu</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <Plus size={20} />
                  Thêm phiếu thu
                </button>
              </div>
              <div className="text-center py-16">
                <ArrowUpCircle className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang phát triển</h3>
                <p className="text-gray-500">Tính năng Phiếu thu đang được xây dựng</p>
              </div>
            </div>
          )}

          {/* Phiếu chi Tab */}
          {activeTab === "phieu-chi" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách phiếu chi</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <Plus size={20} />
                  Thêm phiếu chi
                </button>
              </div>
              <div className="text-center py-16">
                <ArrowDownCircle className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang phát triển</h3>
                <p className="text-gray-500">Tính năng Phiếu chi đang được xây dựng</p>
              </div>
            </div>
          )}

          {/* Sổ quỹ Tab */}
          {activeTab === "so-quy" && <DongTienTab />}

          {/* Tài khoản Tab */}
          {activeTab === "tai-khoan" && <TaiKhoanTab />}

          {/* Dư quỹ Tab */}
          {activeTab === "du-quy" && <DuQuyTab />}

          {/* BC quỹ theo ngày Tab */}
          {activeTab === "bc-ngay" && <BCQuyTheoNgayTab />}

          {/* BC quỹ theo tháng Tab */}
          {activeTab === "bc-thang" && <BCQuyTheoThangTab />}

          {/* BC từng tài khoản Tab */}
          {activeTab === "bc-tai-khoan" && <BCTungTaiKhoanTab />}
        </div>
      </div>
    </div>
  );
}
