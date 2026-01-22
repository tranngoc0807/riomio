"use client";

import {
  Image,
  List,
  PackagePlus,
  FileInput,
  DollarSign,
  PackageMinus,
  FileOutput,
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
  // {
  //   id: "phieu-nhap" as TabType,
  //   label: "Phiếu nhập kho hình in",
  //   icon: FileInput,
  // },
  { id: "chi-phi" as TabType, label: "Chi phí HI", icon: DollarSign },
  { id: "xuat-kho" as TabType, label: "Xuất kho HI", icon: PackageMinus },
  // {
  //   id: "phieu-xuat" as TabType,
  //   label: "Phiếu xuất kho hình in",
  //   icon: FileOutput,
  // },
  { id: "ton-kho" as TabType, label: "Tồn kho HI", icon: Archive },
];

// Placeholder component for tabs under development
function PlaceholderTab({
  title,
  icon: Icon,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Icon className="mx-auto mb-4 text-gray-300" size={64} />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">Tính năng đang phát triển</p>
    </div>
  );
}

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
            <Image className="text-blue-600" size={32} />
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
          {/* {activeTab === "phieu-nhap" && (
            <PlaceholderTab title="Phiếu nhập kho hình in" icon={FileInput} />
          )} */}
          {activeTab === "chi-phi" && <ChiPhiHinhInTab />}
          {activeTab === "xuat-kho" && <XuatKhoHinhInTab />}
          {/* {activeTab === "phieu-xuat" && (
            <PlaceholderTab title="Phiếu xuất kho hình in" icon={FileOutput} />
          )} */}
          {activeTab === "ton-kho" && <TonKhoHinhInTab />}
        </div>
      </div>
    </div>
  );
}
