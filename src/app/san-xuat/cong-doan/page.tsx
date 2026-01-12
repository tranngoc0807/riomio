"use client";

import {
  Cog,
  Truck,
  FileText,
  Scissors,
  CheckCircle,
  Sparkles,
  Camera,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";

// Import tab component from parent
import ShippingUnitsTab from "../components/ShippingUnitsTab";

type TabType =
  | "don-vi-vc"
  | "phieu-phat-trien-mau"
  | "phieu-may-mau"
  | "phieu-duyet-mau"
  | "phieu-hoan-thien-mau"
  | "phieu-hoan-thien-anh"
  | "phieu-tinh-trang-sx";

const TABS = [
  { id: "don-vi-vc" as TabType, label: "Đơn vị vận chuyển", icon: Truck },
  { id: "phieu-phat-trien-mau" as TabType, label: "Phiếu phát triển mẫu", icon: FileText },
  { id: "phieu-may-mau" as TabType, label: "Phiếu may mẫu", icon: Scissors },
  { id: "phieu-duyet-mau" as TabType, label: "Phiếu duyệt mẫu", icon: CheckCircle },
  { id: "phieu-hoan-thien-mau" as TabType, label: "Phiếu hoàn thiện phát triển mẫu", icon: Sparkles },
  { id: "phieu-hoan-thien-anh" as TabType, label: "Phiếu hoàn thiện bộ ảnh bán hàng", icon: Camera },
  { id: "phieu-tinh-trang-sx" as TabType, label: "Phiếu tình trạng sản xuất", icon: ClipboardList },
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

export default function CongDoanSanXuat() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("don-vi-vc");

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
            <Cog className="text-blue-600" size={32} />
            Công đoạn sản xuất
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý công đoạn sản xuất và phiếu phát triển mẫu
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
          {activeTab === "don-vi-vc" && <ShippingUnitsTab />}
          {activeTab === "phieu-phat-trien-mau" && <PlaceholderTab title="Phiếu phát triển mẫu" icon={FileText} />}
          {activeTab === "phieu-may-mau" && <PlaceholderTab title="Phiếu may mẫu" icon={Scissors} />}
          {activeTab === "phieu-duyet-mau" && <PlaceholderTab title="Phiếu duyệt mẫu" icon={CheckCircle} />}
          {activeTab === "phieu-hoan-thien-mau" && <PlaceholderTab title="Phiếu hoàn thiện phát triển mẫu" icon={Sparkles} />}
          {activeTab === "phieu-hoan-thien-anh" && <PlaceholderTab title="Phiếu hoàn thiện bộ ảnh bán hàng" icon={Camera} />}
          {activeTab === "phieu-tinh-trang-sx" && <PlaceholderTab title="Phiếu tình trạng sản xuất" icon={ClipboardList} />}
        </div>
      </div>
    </div>
  );
}
