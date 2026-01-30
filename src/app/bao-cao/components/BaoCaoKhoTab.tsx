"use client";

import { useState } from "react";
import {
  Package,
  ShoppingCart,
} from "lucide-react";

type SubTabType = "ton-kho-npl" | "ton-kho-hang-hoa";

const SUB_TABS = [
  { id: "ton-kho-npl" as SubTabType, label: "Báo cáo tồn kho NPL", icon: Package },
  { id: "ton-kho-hang-hoa" as SubTabType, label: "Báo cáo tồn kho hàng hóa", icon: ShoppingCart },
];

export default function BaoCaoKhoTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("ton-kho-npl");

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
        {activeSubTab === "ton-kho-npl" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo tồn kho NPL
            </h3>
            <p className="text-gray-500">Nội dung báo cáo tồn kho NPL sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "ton-kho-hang-hoa" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo tồn kho hàng hóa
            </h3>
            <p className="text-gray-500">Nội dung báo cáo tồn kho hàng hóa sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
