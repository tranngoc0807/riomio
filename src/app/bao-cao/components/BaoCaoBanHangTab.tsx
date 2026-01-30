"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  User,
  Package,
} from "lucide-react";

type SubTabType = "theo-thang" | "theo-khach-hang" | "theo-nhan-vien" | "theo-san-pham";

const SUB_TABS = [
  { id: "theo-thang" as SubTabType, label: "Báo cáo bán hàng theo tháng", icon: Calendar },
  { id: "theo-khach-hang" as SubTabType, label: "Báo cáo bán hàng theo khách hàng", icon: Users },
  { id: "theo-nhan-vien" as SubTabType, label: "Báo cáo bán hàng theo nhân viên", icon: User },
  { id: "theo-san-pham" as SubTabType, label: "Báo cáo bán hàng theo sản phẩm", icon: Package },
];

export default function BaoCaoBanHangTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("theo-thang");

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
        {activeSubTab === "theo-thang" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo bán hàng theo tháng
            </h3>
            <p className="text-gray-500">Nội dung báo cáo bán hàng theo tháng sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "theo-khach-hang" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo bán hàng theo khách hàng
            </h3>
            <p className="text-gray-500">Nội dung báo cáo bán hàng theo khách hàng sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "theo-nhan-vien" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo bán hàng theo nhân viên
            </h3>
            <p className="text-gray-500">Nội dung báo cáo bán hàng theo nhân viên sẽ hiển thị tại đây.</p>
          </div>
        )}

        {activeSubTab === "theo-san-pham" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Báo cáo bán hàng theo sản phẩm
            </h3>
            <p className="text-gray-500">Nội dung báo cáo bán hàng theo sản phẩm sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
