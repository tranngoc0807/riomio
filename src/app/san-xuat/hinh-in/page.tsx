"use client";

import {
  Image as ImageIcon,
  List,
  PackagePlus,
  PackageMinus,
  Archive,
  Building2,
  Eye,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useRolePermissions } from "@/context/RolePermissionsContext";

// Import tab components
import DanhMucHinhInTab from "../components/DanhMucHinhInTab";
import NhapKhoHinhInTab from "../components/NhapKhoHinhInTab";
import ChiPhiHinhInTab from "../components/ChiPhiHinhInTab";
import XuatKhoHinhInTab from "../components/XuatKhoHinhInTab";
import TonKhoHinhInTab from "../components/TonKhoHinhInTab";
import DSNCCHinhInTab from "../components/DSNCCHinhInTab";
import TheoDoiNCCHinhInTab from "../components/TheoDoiNCCHinhInTab";
import PhieuNhapHinhInTab from "../components/PhieuNhapHinhInTab";
import PhieuXuatHinhInTab from "../components/PhieuXuatHinhInTab";

type TabType =
  | "danh-muc"
  | "nhap-kho"
  | "phieu-nhap"
  | "chi-phi"
  | "xuat-kho"
  | "phieu-xuat"
  | "ton-kho"
  | "ncc-hi"
  | "theo-doi-ncc-hi";

const TABS = [
  { id: "danh-muc" as TabType, label: "Danh mục HI", icon: List },
  { id: "nhap-kho" as TabType, label: "Nhập kho HI", icon: PackagePlus },
  { id: "xuat-kho" as TabType, label: "Xuất kho HI", icon: PackageMinus },
  { id: "ton-kho" as TabType, label: "Tồn kho HI", icon: Archive },
  { id: "ncc-hi" as TabType, label: "NCC HI", icon: Building2 },
  {
    id: "theo-doi-ncc-hi" as TabType,
    label: "Theo dõi chi tiết NCC HI",
    icon: Eye,
  },
];

export default function HinhIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();

  const [activeTab, setActiveTab] = useState<TabType>("danh-muc");

  // Filter tabs based on permissions
  const filteredTabs = useMemo(() => {
    return TABS.filter((tab) => hasAccess(`san-xuat/hinh-in/${tab.id}`));
  }, [hasAccess]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const validTabs = filteredTabs.map((t) => t.id);
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

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ImageIcon className="text-blue-600" size={32} />
            Hình In
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý hình in, nhập xuất kho và chi phí
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
          {activeTab === "danh-muc" && <DanhMucHinhInTab />}
          {activeTab === "nhap-kho" && <NhapKhoHinhInTab />}
          {activeTab === "chi-phi" && <ChiPhiHinhInTab />}
          {activeTab === "xuat-kho" && <XuatKhoHinhInTab />}
          {activeTab === "ton-kho" && <TonKhoHinhInTab />}
          {activeTab === "phieu-nhap" && <PhieuNhapHinhInTab />}
          {activeTab === "phieu-xuat" && <PhieuXuatHinhInTab />}
          {activeTab === "ncc-hi" && <DSNCCHinhInTab />}
          {activeTab === "theo-doi-ncc-hi" && <TheoDoiNCCHinhInTab />}
        </div>
      </div>
    </div>
  );
}
