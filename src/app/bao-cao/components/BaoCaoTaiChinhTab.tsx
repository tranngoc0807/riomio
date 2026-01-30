"use client";

import { useState } from "react";
import {
  FileText,
  Users,
  Package,
  Factory,
} from "lucide-react";

type SubTabType = "lai-lo" | "cong-no-khach-hang" | "cong-no-ncc" | "cong-no-xuong";

const SUB_TABS = [
  { id: "lai-lo" as SubTabType, label: "Báo cáo lãi/lỗ", icon: FileText },
  { id: "cong-no-khach-hang" as SubTabType, label: "Công nợ khách hàng", icon: Users },
  { id: "cong-no-ncc" as SubTabType, label: "Công nợ phải trả NCC NPL", icon: Package },
  { id: "cong-no-xuong" as SubTabType, label: "Công nợ phải trả xưởng SX", icon: Factory },
];

export default function BaoCaoTaiChinhTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("lai-lo");

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
        {activeSubTab === "lai-lo" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo lãi/lỗ
            </h3>
            <p className="text-gray-500">Nội dung báo cáo lãi/lỗ sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "cong-no-khach-hang" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo công nợ khách hàng
            </h3>
            <p className="text-gray-500">Nội dung báo cáo công nợ khách hàng sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "cong-no-ncc" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo công nợ phải trả NCC NPL
            </h3>
            <p className="text-gray-500">Nội dung báo cáo công nợ NCC NPL sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "cong-no-xuong" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo công nợ phải trả xưởng SX
            </h3>
            <p className="text-gray-500">Nội dung báo cáo công nợ xưởng SX sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
