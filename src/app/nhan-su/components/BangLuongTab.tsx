"use client";

import { Banknote, FileText, Calculator, History, Send } from "lucide-react";
import { useState } from "react";

type SubTabType = "co-che-luong" | "bang-luong" | "phieu-luong-thang" | "phieu-luong-nv" | "lich-su";

const SUB_TABS = [
  { id: "co-che-luong" as SubTabType, label: "Cơ chế lương", icon: FileText },
  { id: "bang-luong" as SubTabType, label: "Bảng lương", icon: Calculator },
  { id: "phieu-luong-thang" as SubTabType, label: "Phiếu lương theo tháng", icon: FileText },
  { id: "phieu-luong-nv" as SubTabType, label: "Phiếu thông báo lương cho NV", icon: Send },
  { id: "lich-su" as SubTabType, label: "Lịch sử trả lương", icon: History },
];

export default function BangLuongTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("co-che-luong");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Banknote className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Bảng lương</h2>
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

      {/* Month/Year selector for relevant tabs */}
      {["bang-luong", "phieu-luong-thang", "phieu-luong-nv", "lich-su"].includes(activeSubTab) && (
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
            Xem
          </button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {activeSubTab === "co-che-luong" && (
          <div className="text-center text-gray-500 py-8">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Cơ chế lương</p>
            <p className="text-sm mt-2">Chưa có cơ chế lương được thiết lập</p>
          </div>
        )}

        {activeSubTab === "bang-luong" && (
          <div className="text-center text-gray-500 py-8">
            <Calculator className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Bảng lương tháng {selectedMonth}/{selectedYear}</p>
            <p className="text-sm mt-2">Chưa có dữ liệu bảng lương</p>
          </div>
        )}

        {activeSubTab === "phieu-luong-thang" && (
          <div className="text-center text-gray-500 py-8">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Phiếu lương theo tháng {selectedMonth}/{selectedYear}</p>
            <p className="text-sm mt-2">Chưa có phiếu lương</p>
          </div>
        )}

        {activeSubTab === "phieu-luong-nv" && (
          <div className="text-center text-gray-500 py-8">
            <Send className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Phiếu thông báo lương cho nhân viên</p>
            <p className="text-sm mt-2">Chưa có thông báo lương</p>
          </div>
        )}

        {activeSubTab === "lich-su" && (
          <div className="text-center text-gray-500 py-8">
            <History className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Lịch sử trả lương nhân viên</p>
            <p className="text-sm mt-2">Chưa có lịch sử</p>
          </div>
        )}
      </div>
    </div>
  );
}
