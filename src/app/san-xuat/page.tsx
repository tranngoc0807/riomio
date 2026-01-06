"use client";

import {
  Factory,
  Package,
  Warehouse,
  Settings,
  Truck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";

// Import tab components
import KeHoachSXTab from "./components/KeHoachSXTab";
import MaterialsTab from "./components/MaterialsTab";
import WorkshopsTab from "./components/WorkshopsTab";
import SuppliersTab from "./components/SuppliersTab";
import ShippingUnitsTab from "./components/ShippingUnitsTab";

type TabType = "production" | "materials" | "workshops" | "suppliers" | "shipping";

const TABS = [
  { id: "production" as TabType, label: "Kế hoạch sản xuất", icon: Factory },
  { id: "materials" as TabType, label: "Nguyên phụ liệu", icon: Package },
  { id: "workshops" as TabType, label: "Xưởng sản xuất", icon: Settings },
  { id: "suppliers" as TabType, label: "Nhà cung cấp", icon: Warehouse },
  { id: "shipping" as TabType, label: "Đơn vị vận chuyển", icon: Truck },
];

export default function SanXuat() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("production");

  // Read tab from URL on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && ["production", "materials", "workshops", "suppliers", "shipping"].includes(tabFromUrl)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabFromUrl as TabType);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Factory className="text-blue-600" size={32} />
            Sản xuất
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý kế hoạch sản xuất, nguyên phụ liệu và xưởng
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-blue-600 bg-blue-50/50"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "production" && <KeHoachSXTab />}
          {activeTab === "materials" && <MaterialsTab />}
          {activeTab === "workshops" && <WorkshopsTab />}
          {activeTab === "suppliers" && <SuppliersTab />}
          {activeTab === "shipping" && <ShippingUnitsTab />}
        </div>
      </div>
    </div>
  );
}
