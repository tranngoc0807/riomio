/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { PackageSearch, Tag, FileText, List, Image } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useRolePermissions } from "@/context/RolePermissionsContext";

import MaSPTab from "../components/MaSPTab";
import ChiTietMaSPTab from "../components/ChiTietMaSPTab";
import PhatTrienSanPhamTab from "../components/PhatTrienSanPhamTab";
import HinhAnhSanPhamTab from "../components/HinhAnhSanPhamTab";

type TabType = "phat-trien" | "ma-san-pham" | "chi-tiet-ma-sp" | "hinh-anh";

const TABS = [
  { id: "phat-trien" as TabType, label: "Phát triển sản phẩm", icon: List },
  {
    id: "chi-tiet-ma-sp" as TabType,
    label: "Chi tiết mã sản phẩm",
    icon: FileText,
  },
];

export default function SanPhamSX() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();

  const [activeTab, setActiveTab] = useState<TabType>("phat-trien");

  // Filter tabs based on permissions
  const filteredTabs = useMemo(() => {
    return TABS.filter((tab) => hasAccess(`san-xuat/san-pham/${tab.id}`));
  }, [hasAccess]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const validTabs = filteredTabs.map((t) => t.id);
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
            <PackageSearch className="text-blue-600" size={32} />
            Sản phẩm
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý sản phẩm trong quy trình sản xuất
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
          {activeTab === "phat-trien" && <PhatTrienSanPhamTab />}
          {/* {activeTab === "ma-san-pham" && <MaSPTab />} */}
          {activeTab === "chi-tiet-ma-sp" && <ChiTietMaSPTab />}
          {activeTab === "hinh-anh" && <HinhAnhSanPhamTab />}
        </div>
      </div>
    </div>
  );
}
