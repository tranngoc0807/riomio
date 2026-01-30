"use client";

import { useState } from "react";
import {
  Wallet,
  HandCoins,
} from "lucide-react";

type SubTabType = "quy" | "tien-vay";

const SUB_TABS = [
  { id: "quy" as SubTabType, label: "Báo cáo quỹ", icon: Wallet },
  { id: "tien-vay" as SubTabType, label: "Báo cáo tiền vay", icon: HandCoins },
];

export default function BaoCaoDongTienTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("quy");

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
        {activeSubTab === "quy" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo quỹ
            </h3>
            <p className="text-gray-500">Nội dung báo cáo quỹ sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "tien-vay" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo tiền vay
            </h3>
            <p className="text-gray-500">Nội dung báo cáo tiền vay sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
