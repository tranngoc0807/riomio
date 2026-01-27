"use client";

import {
  Image as ImageIcon,
  List,
  PackagePlus,
  PackageMinus,
  Archive,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";

// Import tab components
import DanhMucHinhInTab from "../components/DanhMucHinhInTab";
import NhapKhoHinhInTab from "../components/NhapKhoHinhInTab";
import ChiPhiHinhInTab from "../components/ChiPhiHinhInTab";
import XuatKhoHinhInTab from "../components/XuatKhoHinhInTab";
import TonKhoHinhInTab from "../components/TonKhoHinhInTab";

type TabType =
  | "danh-muc"
  | "nhap-kho"
  | "phieu-nhap"
  | "chi-phi"
  | "xuat-kho"
  | "phieu-xuat"
  | "ton-kho";

const TABS = [
  { id: "danh-muc" as TabType, label: "Danh mục HI", icon: List },
  { id: "nhap-kho" as TabType, label: "Nhập kho HI", icon: PackagePlus },
  { id: "xuat-kho" as TabType, label: "Xuất kho HI", icon: PackageMinus },
  { id: "ton-kho" as TabType, label: "Tồn kho HI", icon: Archive },
];

export default function HinhIn() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("danh-muc");

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const validTabs = TABS.map((t) => t.id);
    if (tabFromUrl && validTabs.includes(tabFromUrl as TabType)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabFromUrl as TabType);
    }
  }, [searchParams]);

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
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
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
        </div>

        <div className="p-6">
          {activeTab === "danh-muc" && <DanhMucHinhInTab />}
          {activeTab === "nhap-kho" && <NhapKhoHinhInTab />}
          {activeTab === "chi-phi" && <ChiPhiHinhInTab />}
          {activeTab === "xuat-kho" && <XuatKhoHinhInTab />}
          {activeTab === "ton-kho" && <TonKhoHinhInTab />}
        </div>
      </div>
    </div>
  );
}
