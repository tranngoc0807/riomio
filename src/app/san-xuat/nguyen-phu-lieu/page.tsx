"use client";

import {
  Boxes,
  Warehouse,
  Tag,
  PackagePlus,
  FileInput,
  PackageMinus,
  FileOutput,
  Archive,
  Receipt,
  FileSearch,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";

// Import existing tab components from parent
import MaterialsTab from "../components/MaterialsTab";
import SuppliersTab from "../components/SuppliersTab";
import NhapKhoNPLTab from "../components/NhapKhoNPLTab";
import PhieuNhapNPLTab from "../components/PhieuNhapNPLTab";
import XuatKhoNPLTab from "../components/XuatKhoNPLTab";
import PhieuXuatNPLTab from "../components/PhieuXuatNPLTab";
import TonKhoNPLTab from "../components/TonKhoNPLTab";
import CNPTNCCNPLTab from "../components/CNPTNCCNPLTab";
import TheoDoiCNNPLTab from "../components/TheoDoiCNNPLTab";

type TabType =
  | "ncc-npl"
  | "ma-npl"
  | "nhap-kho"
  | "phieu-nhap"
  | "xuat-kho"
  | "phieu-xuat"
  | "ton-kho"
  | "cnpt-ncc"
  | "theo-doi-cn";

const TABS = [
  { id: "ncc-npl" as TabType, label: "NCC NPL", icon: Warehouse },
  { id: "ma-npl" as TabType, label: "Mã NPL", icon: Tag },
  { id: "nhap-kho" as TabType, label: "Nhập kho NPL", icon: PackagePlus },
  { id: "phieu-nhap" as TabType, label: "Phiếu nhập kho NPL, trả NPL NCC", icon: FileInput },
  { id: "xuat-kho" as TabType, label: "Xuất kho NPL", icon: PackageMinus },
  { id: "phieu-xuat" as TabType, label: "Phiếu xuất kho NPL, xưởng hoàn lại NPL", icon: FileOutput },
  { id: "ton-kho" as TabType, label: "Tồn kho NPL", icon: Archive },
  { id: "cnpt-ncc" as TabType, label: "CNPT NCC NPL", icon: Receipt },
  { id: "theo-doi-cn" as TabType, label: "Theo dõi CN từng NCC NPL", icon: FileSearch },
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

export default function NguyenPhuLieu() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("ncc-npl");

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
            <Boxes className="text-blue-600" size={32} />
            Nguyên phụ liệu
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý nguyên phụ liệu, nhập xuất kho và công nợ NCC
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-3">
          <div className="grid grid-cols-5 gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "text-white bg-blue-600 shadow-sm"
                      : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "ncc-npl" && <SuppliersTab />}
          {activeTab === "ma-npl" && <MaterialsTab />}
          {activeTab === "nhap-kho" && <NhapKhoNPLTab />}
          {activeTab === "phieu-nhap" && <PhieuNhapNPLTab />}
          {activeTab === "xuat-kho" && <XuatKhoNPLTab />}
          {activeTab === "phieu-xuat" && <PhieuXuatNPLTab />}
          {activeTab === "ton-kho" && <TonKhoNPLTab />}
          {activeTab === "cnpt-ncc" && <CNPTNCCNPLTab />}
          {activeTab === "theo-doi-cn" && <TheoDoiCNNPLTab />}
        </div>
      </div>
    </div>
  );
}
