"use client";

import {
  Receipt,
  ClipboardList,
  PieChart,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useRolePermissions } from "@/context/RolePermissionsContext";

import BangKeCPKhacTab from "../components/BangKeCPKhacTab";
import PhanBoCPKhacTab from "../components/PhanBoCPKhacTab";

type TabType = "bang-ke-cp" | "phan-bo-cp";

const TABS = [
  { id: "bang-ke-cp" as TabType, label: "Bảng kê CP khác", icon: ClipboardList },
  { id: "phan-bo-cp" as TabType, label: "Phân bổ CP khác", icon: PieChart },
];

export default function ChiPhiKhac() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();

  const [activeTab, setActiveTab] = useState<TabType>("bang-ke-cp");

  // Filter tabs based on permissions
  const filteredTabs = useMemo(() => {
    return TABS.filter((tab) => hasAccess(`san-xuat/chi-phi-khac/${tab.id}`));
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

  const getTabHref = (tabId: TabType) => `?tab=${tabId}`;

  const handleTabClick = (e: React.MouseEvent, tabId: TabType) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    handleTabChange(tabId);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Receipt className="text-blue-600" size={32} />
            Chi phí khác
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý các chi phí khác trong sản xuất
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
                  <a
                    key={tab.id}
                    href={getTabHref(tab.id)}
                    onClick={(e) => handleTabClick(e, tab.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "text-white bg-blue-600 shadow-sm"
                        : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6">
          {activeTab === "bang-ke-cp" && <BangKeCPKhacTab />}
          {activeTab === "phan-bo-cp" && <PhanBoCPKhacTab />}
        </div>
      </div>
    </div>
  );
}
