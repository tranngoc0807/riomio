"use client";

import {
  Hammer,
  Factory,
  Calculator,
  ClipboardList,
  FileText,
  Receipt,
  FileSearch,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";

// Import existing tab components from parent
import WorkshopsTab from "../components/WorkshopsTab";
import DonGiaGiaCongTab from "../components/DonGiaGiaCongTab";
import BangKeGiaCongTab from "../components/BangKeGiaCongTab";
import PhieuGiaCongTab from "../components/PhieuGiaCongTab";
import CNPTXuongGiaCongTab from "../components/CNPTXuongGiaCongTab";

type TabType =
  | "xuong-sx"
  | "don-gia"
  | "bang-ke"
  | "phieu-gc"
  | "cnpt-xuong"
  | "theo-doi-cn";

const TABS = [
  { id: "xuong-sx" as TabType, label: "Xưởng SX", icon: Factory },
  { id: "don-gia" as TabType, label: "Đơn giá gia công", icon: Calculator },
  { id: "bang-ke" as TabType, label: "Bảng kê gia công", icon: ClipboardList },
  { id: "phieu-gc" as TabType, label: "Phiếu gia công", icon: FileText },
  { id: "cnpt-xuong" as TabType, label: "CNPT xưởng gia công", icon: Receipt },
  { id: "theo-doi-cn" as TabType, label: "Theo dõi CN từng xưởng SX", icon: FileSearch },
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

export default function GiaCong() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("xuong-sx");

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const validTabs = TABS.map(t => t.id);
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
            <Hammer className="text-blue-600" size={32} />
            Gia công
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý xưởng sản xuất, gia công và công nợ xưởng
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
          {activeTab === "xuong-sx" && <WorkshopsTab />}
          {activeTab === "don-gia" && <DonGiaGiaCongTab />}
          {activeTab === "bang-ke" && <BangKeGiaCongTab />}
          {activeTab === "phieu-gc" && <PhieuGiaCongTab />}
          {activeTab === "cnpt-xuong" && <CNPTXuongGiaCongTab />}
          {activeTab === "theo-doi-cn" && <PlaceholderTab title="Theo dõi CN từng xưởng SX" icon={FileSearch} />}
        </div>
      </div>
    </div>
  );
}
