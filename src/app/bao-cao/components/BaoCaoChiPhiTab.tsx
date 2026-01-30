"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  FileText,
} from "lucide-react";

type SubTabType = "luong-bao-hiem" | "ban-hang" | "qldn" | "khac";

const SUB_TABS = [
  { id: "luong-bao-hiem" as SubTabType, label: "Báo cáo chi phí lương, bảo hiểm", icon: DollarSign },
  { id: "ban-hang" as SubTabType, label: "Báo cáo chi phí bán hàng", icon: TrendingUp },
  { id: "qldn" as SubTabType, label: "Báo cáo chi phí QLĐN", icon: Briefcase },
  { id: "khac" as SubTabType, label: "Báo cáo chi phí khác", icon: FileText },
];

export default function BaoCaoChiPhiTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("luong-bao-hiem");

  return (
    <div>
      {/* Sub-tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div>
        {activeSubTab === "luong-bao-hiem" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo chi phí lương, bảo hiểm
            </h3>
            <p className="text-gray-500">Nội dung báo cáo chi phí lương, bảo hiểm sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "ban-hang" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo chi phí bán hàng
            </h3>
            <p className="text-gray-500">Nội dung báo cáo chi phí bán hàng sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "qldn" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo chi phí QLĐN
            </h3>
            <p className="text-gray-500">Nội dung báo cáo chi phí quản lý doanh nghiệp sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "khac" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo chi phí khác
            </h3>
            <p className="text-gray-500">Nội dung báo cáo chi phí khác sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
