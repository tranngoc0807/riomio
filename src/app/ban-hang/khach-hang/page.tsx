"use client";

import { Users, UserCheck } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomersTab from "../components/CustomersTab";
import CongNoTab from "../components/CongNoTab";

type TabType = "danh-sach" | "theo-doi-cong-no";

export default function KhachHangPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && ["danh-sach", "theo-doi-cong-no"].includes(tabParam)
      ? tabParam
      : "danh-sach"
  );

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/ban-hang/khach-hang?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Khách hàng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin khách hàng và công nợ
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => handleTabChange("danh-sach")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "danh-sach"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Users size={20} />
              Danh sách khách hàng
            </button>
            <button
              onClick={() => handleTabChange("theo-doi-cong-no")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "theo-doi-cong-no"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <UserCheck size={20} />
              Theo dõi công nợ từng KH
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "danh-sach" && <CustomersTab />}
          {activeTab === "theo-doi-cong-no" && <CongNoTab />}
        </div>
      </div>
    </div>
  );
}
