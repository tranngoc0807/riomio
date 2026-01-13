"use client";

import {
  ClipboardList,
  FileSpreadsheet,
  FileText,
  ListChecks,
  FileOutput,
  PackageOpen,
  FileInput,
  Scissors,
  ClipboardCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";

// Import existing tab component from parent
import KeHoachSXTab from "../components/KeHoachSXTab";
import LSXTab from "../components/LSXTab";
import DinhMucSXTab from "../components/DinhMucSXTab";
import BangKeYCXKTab from "../components/BangKeYCXKTab";
import PhieuYCXKNPLTab from "../components/PhieuYCXKNPLTab";
import SoLuongCatTab from "../components/SoLuongCatTab";
import PhieuBaoSLCatTab from "../components/PhieuBaoSLCatTab";

type TabType =
  | "bang-ke-lsx"
  | "lsx"
  | "dinh-muc"
  | "phieu-dinh-muc"
  | "bang-ke-yc-xk"
  | "phieu-yc-xk"
  | "so-luong-cat"
  | "phieu-cat";

const TABS = [
  { id: "bang-ke-lsx" as TabType, label: "Bảng kê LSX", icon: FileSpreadsheet },
  { id: "lsx" as TabType, label: "LSX", icon: ClipboardList },
  { id: "dinh-muc" as TabType, label: "Định mức sản xuất", icon: ListChecks },
  { id: "phieu-dinh-muc" as TabType, label: "Phiếu định mức sản xuất", icon: FileText },
  { id: "bang-ke-yc-xk" as TabType, label: "Bảng kê Yêu cầu xuất kho NPL", icon: FileOutput },
  { id: "phieu-yc-xk" as TabType, label: "Phiếu yêu cầu XK NPL", icon: PackageOpen },
  { id: "so-luong-cat" as TabType, label: "Số lượng cắt", icon: Scissors },
  { id: "phieu-cat" as TabType, label: "Phiếu báo số lượng cắt hàng", icon: ClipboardCheck },
];

// Placeholder component for tabs under development
function PlaceholderTab({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Icon className="mx-auto mb-4 text-gray-300" size={64} />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">Tính năng đang phát triển</p>
    </div>
  );
}

export default function KeHoachSanXuat() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("bang-ke-lsx");

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const validTabs = TABS.map(t => t.id);
    if (tabFromUrl && validTabs.includes(tabFromUrl as TabType)) {
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
          {activeTab === "bang-ke-lsx" && <KeHoachSXTab />}
          {activeTab === "lsx" && <LSXTab />}
          {activeTab === "dinh-muc" && <DinhMucSXTab />}
          {activeTab === "phieu-dinh-muc" && <PlaceholderTab title="Phiếu định mức sản xuất" icon={FileText} />}
          {activeTab === "bang-ke-yc-xk" && <BangKeYCXKTab />}
          {activeTab === "phieu-yc-xk" && <PhieuYCXKNPLTab />}
          {activeTab === "so-luong-cat" && <SoLuongCatTab />}
          {activeTab === "phieu-cat" && <PhieuBaoSLCatTab />}
        </div>
      </div>
    </div>
  );
}
