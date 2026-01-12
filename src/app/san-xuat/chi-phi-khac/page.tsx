"use client";

import {
  Receipt,
  ClipboardList,
  PieChart,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";

type TabType = "bang-ke-cp" | "phan-bo-cp";

const TABS = [
  { id: "bang-ke-cp" as TabType, label: "Bảng kê CP khác", icon: ClipboardList },
  { id: "phan-bo-cp" as TabType, label: "Phân bổ CP khác", icon: PieChart },
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

export default function ChiPhiKhac() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("bang-ke-cp");

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
          {activeTab === "bang-ke-cp" && <PlaceholderTab title="Bảng kê CP khác" icon={ClipboardList} />}
          {activeTab === "phan-bo-cp" && <PlaceholderTab title="Phân bổ CP khác" icon={PieChart} />}
        </div>
      </div>
    </div>
  );
}
