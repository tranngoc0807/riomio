"use client";

import {
  ClipboardList,
  FileSpreadsheet,
  ListChecks,
  FileOutput,
  Scissors,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useRolePermissions } from "@/context/RolePermissionsContext";

// Import existing tab component from parent
import KeHoachSXTab from "../components/KeHoachSXTab";
import DinhMucSXTab from "../components/DinhMucSXTab";
import BangKeYCXKTab from "../components/BangKeYCXKTab";
import SoLuongCatTab from "../components/SoLuongCatTab";

type TabType =
  | "bang-ke-lsx"
  | "dinh-muc"
  | "bang-ke-yc-xk"
  | "so-luong-cat";

const TABS = [
  { id: "bang-ke-lsx" as TabType, label: "Bảng kê LSX", icon: FileSpreadsheet },
  { id: "dinh-muc" as TabType, label: "Định mức sản xuất", icon: ListChecks },
  { id: "bang-ke-yc-xk" as TabType, label: "Bảng kê Yêu cầu xuất kho NPL", icon: FileOutput },
  { id: "so-luong-cat" as TabType, label: "Số lượng cắt", icon: Scissors },
];

export default function KeHoachSanXuat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();

  const [activeTab, setActiveTab] = useState<TabType>("bang-ke-lsx");

  // Filter tabs based on permissions
  const filteredTabs = useMemo(() => {
    if (hasAccess("san-xuat/ke-hoach")) {
      return TABS;
    }
    return TABS.filter((tab) => hasAccess(`san-xuat/ke-hoach/${tab.id}`));
  }, [hasAccess]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const validTabs = filteredTabs.map(t => t.id);
    if (tabFromUrl && validTabs.includes(tabFromUrl as TabType)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
            <ClipboardList className="text-blue-600" size={32} />
            Kế hoạch sản xuất
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý lệnh sản xuất, định mức và yêu cầu xuất kho
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
          {activeTab === "bang-ke-lsx" && <KeHoachSXTab />}
          {activeTab === "dinh-muc" && <DinhMucSXTab />}
          {activeTab === "bang-ke-yc-xk" && <BangKeYCXKTab />}
          {activeTab === "so-luong-cat" && <SoLuongCatTab />}
        </div>
      </div>
    </div>
  );
}
