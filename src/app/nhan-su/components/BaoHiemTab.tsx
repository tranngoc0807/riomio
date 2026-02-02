"use client";

import { Shield, FileText, Calculator, Percent } from "lucide-react";
import { useState } from "react";

type SubTabType = "bang-ke" | "ty-le";

const SUB_TABS = [
  { id: "bang-ke" as SubTabType, label: "Bảng kê tiền bảo hiểm", icon: FileText },
  { id: "ty-le" as SubTabType, label: "Tỷ lệ % đóng bảo hiểm", icon: Percent },
];

export default function BaoHiemTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("bang-ke");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Bảo hiểm</h2>
      </div>

      {/* Sub-tabs navigation */}
      <div className="border-b border-gray-200">
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

      {/* Month/Year selector for bang-ke */}
      {activeSubTab === "bang-ke" && (
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Năm:</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
              className="px-3 py-2 border border-gray-300 rounded-lg w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              ))}
            </select>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Xem báo cáo
          </button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {activeSubTab === "bang-ke" && (
          <div className="text-center text-gray-500 py-8">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Bảng kê tiền bảo hiểm tháng {selectedMonth}/{selectedYear}</p>
            <p className="text-sm mt-2">Chưa có dữ liệu bảo hiểm</p>
          </div>
        )}

        {activeSubTab === "ty-le" && (
          <div className="space-y-4">
            <div className="text-gray-700">
              <h3 className="font-semibold mb-4">Tỷ lệ đóng bảo hiểm hiện tại</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">BHXH (Bảo hiểm xã hội)</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">25.5%</p>
                  <p className="text-xs text-gray-500 mt-1">NLĐ: 8% | NSDLĐ: 17.5%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">BHYT (Bảo hiểm y tế)</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">4.5%</p>
                  <p className="text-xs text-gray-500 mt-1">NLĐ: 1.5% | NSDLĐ: 3%</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">BHTN (Bảo hiểm thất nghiệp)</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">2%</p>
                  <p className="text-xs text-gray-500 mt-1">NLĐ: 1% | NSDLĐ: 1%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
