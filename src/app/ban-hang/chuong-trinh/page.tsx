"use client";

import { TrendingUp } from "lucide-react";
import ProgramsTab from "../components/ProgramsTab";

export default function ChuongTrinhPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="text-blue-600" size={32} />
            Chương trình bán hàng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý các chương trình bán hàng và khuyến mãi
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 text-blue-600 border-blue-600 bg-blue-50/50"
            >
              <TrendingUp size={20} />
              Chương trình bán hàng
            </button>
          </div>
        </div>

        <div className="p-6">
          <ProgramsTab />
        </div>
      </div>
    </div>
  );
}
