"use client";

import { BarChart3 } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Import components
import {
  BaoCaoTaiChinhTab,
  BaoCaoBanHangTab,
  BaoCaoKhoTab,
  BaoCaoDongTienTab,
  BaoCaoChiPhiTab,
} from "./components";

const VALID_TABS = ["tai-chinh", "ban-hang", "kho", "dong-tien", "chi-phi"];

export default function BaoCao() {
  const searchParams = useSearchParams();

  // Get active tab directly from URL (no useState needed for tab)
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "tai-chinh";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          Báo cáo & Thống kê
        </h1>
        <p className="text-gray-500 mt-1">
          Tổng hợp báo cáo tài chính, bán hàng, kho, dòng tiền và chi phí
        </p>
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
