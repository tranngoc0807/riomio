"use client";

import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Wallet,
  Receipt,
} from "lucide-react";
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

  const reportTypes = [
    { id: "tai-chinh", label: "1. Báo cáo tài chính", icon: DollarSign },
    { id: "ban-hang", label: "2. Báo cáo bán hàng", icon: TrendingUp },
    { id: "kho", label: "3. Báo cáo kho", icon: Package },
    { id: "dong-tien", label: "4. Báo cáo dòng tiền", icon: Wallet },
    { id: "chi-phi", label: "5. Báo cáo chi phí", icon: Receipt },
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
            Tổng hợp báo cáo tài chính, bán hàng, kho, dòng tiền và chi phí
          </p>
        </div>

        {/* Dropdown chọn loại báo cáo */}
        <div className="w-80">
          <select
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {reportTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
