"use client";

import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Wallet,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Import components
import {
  BaoCaoTaiChinhTab,
  BaoCaoBanHangTab,
  BaoCaoKhoTab,
  BaoCaoDongTienTab,
  BaoCaoChiPhiTab,
  formatCurrency,
} from "./components";

const VALID_TABS = ["tai-chinh", "ban-hang", "kho", "dong-tien", "chi-phi"];

export default function BaoCao() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get active tab directly from URL (no useState needed for tab)
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "tai-chinh";

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    router.push(`/bao-cao?tab=${tabId}`, { scroll: false });
  };

  const tabs = [
    { id: "tai-chinh", label: "Báo cáo tài chính", icon: DollarSign },
    { id: "ban-hang", label: "Báo cáo bán hàng", icon: TrendingUp },
    { id: "kho", label: "Báo cáo kho", icon: Package },
    { id: "dong-tien", label: "Báo cáo dòng tiền", icon: Wallet },
    { id: "chi-phi", label: "Báo cáo chi phí", icon: Receipt },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Báo cáo & Thống kê
          </h1>
          <p className="text-gray-500 mt-1">
            Tổng hợp báo cáo doanh thu, công nợ, tồn kho và nhân sự
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Báo cáo tài chính */}
          {activeTab === "tai-chinh" && <BaoCaoTaiChinhTab />}

          {/* Tab: Báo cáo bán hàng */}
          {activeTab === "ban-hang" && <BaoCaoBanHangTab />}

          {/* Tab: Báo cáo kho */}
          {activeTab === "kho" && <BaoCaoKhoTab />}

          {/* Tab: Báo cáo dòng tiền */}
          {activeTab === "dong-tien" && <BaoCaoDongTienTab />}

          {/* Tab: Báo cáo chi phí */}
          {activeTab === "chi-phi" && <BaoCaoChiPhiTab />}
        </div>
      </div>
    </div>
  );
}
