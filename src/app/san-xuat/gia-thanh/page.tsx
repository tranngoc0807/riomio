"use client";

import {
  Calculator,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useRolePermissions } from "@/context/RolePermissionsContext";

import GiaThanhGiaBanTab from "../components/GiaThanhGiaBanTab";
import DieuChinhGiaVonTab from "../components/DieuChinhGiaVonTab";

type TabType = "gia-thanh-gia-ban" | "dieu-chinh-gia-von";

const TABS = [
  { id: "gia-thanh-gia-ban" as TabType, label: "Giá thành & giá bán", icon: DollarSign },
  { id: "dieu-chinh-gia-von" as TabType, label: "Điều chỉnh giá vốn", icon: TrendingUp },
];

export default function GiaThanh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();

  const [activeTab, setActiveTab] = useState<TabType>("gia-thanh-gia-ban");

  // Filter tabs based on permissions
  const filteredTabs = useMemo(() => {
    return TABS.filter((tab) => hasAccess(`san-xuat/gia-thanh/${tab.id}`));
  }, [hasAccess]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const validTabs = filteredTabs.map(t => t.id);
    if (tabFromUrl && validTabs.includes(tabFromUrl as TabType)) {
      setActiveTab(tabFromUrl as TabType);
    } else if (filteredTabs.length > 0 && !validTabs.includes(activeTab)) {
      setActiveTab(filteredTabs[0].id);
    }
  }, [searchParams, filteredTabs, activeTab]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calculator className="text-blue-600" size={32} />
            Giá thành
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý giá thành và giá bán sản phẩm
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-3">
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTabs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Bạn không có quyền truy cập các tab trong mục này
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "text-white bg-blue-600 shadow-sm"
                        : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6">
          {activeTab === "gia-thanh-gia-ban" && <GiaThanhGiaBanTab />}
          {activeTab === "dieu-chinh-gia-von" && <DieuChinhGiaVonTab />}
        </div>
      </div>
    </div>
  );
}
