"use client";

import {
  BookOpen,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import DongTienTab from "./components/DongTienTab";
import TaiKhoanTab from "./components/TaiKhoanTab";

type TabType = "phieu-thu" | "phieu-chi" | "so-quy" | "tai-khoan";

export default function SoQuy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && ["phieu-thu", "phieu-chi", "so-quy", "tai-khoan"].includes(tabParam)
      ? tabParam
      : "so-quy"
  );

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/so-quy?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            Sổ quỹ
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý phiếu thu, phiếu chi và sổ quỹ
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {/* Hidden Phiếu thu tab */}
            {/* <button
              onClick={() => handleTabChange("phieu-thu")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "phieu-thu"
                  ? "text-green-600 border-green-600 bg-green-50/50"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ArrowUpCircle size={20} />
              Phiếu thu
            </button> */}
            {/* Hidden Phiếu chi tab */}
            {/* <button
              onClick={() => handleTabChange("phieu-chi")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "phieu-chi"
                  ? "text-red-600 border-red-600 bg-red-50/50"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ArrowDownCircle size={20} />
              Phiếu chi
            </button> */}
            <button
              onClick={() => handleTabChange("so-quy")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "so-quy"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <BookOpen size={20} />
              Sổ quỹ
            </button>
            <button
              onClick={() => handleTabChange("tai-khoan")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "tai-khoan"
                  ? "text-purple-600 border-purple-600 bg-purple-50/50"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Wallet size={20} />
              Tài khoản
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Phiếu thu Tab */}
          {activeTab === "phieu-thu" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách phiếu thu</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <Plus size={20} />
                  Thêm phiếu thu
                </button>
              </div>
              <div className="text-center py-16">
                <ArrowUpCircle className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang phát triển</h3>
                <p className="text-gray-500">Tính năng Phiếu thu đang được xây dựng</p>
              </div>
            </div>
          )}

          {/* Phiếu chi Tab */}
          {activeTab === "phieu-chi" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách phiếu chi</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <Plus size={20} />
                  Thêm phiếu chi
                </button>
              </div>
              <div className="text-center py-16">
                <ArrowDownCircle className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang phát triển</h3>
                <p className="text-gray-500">Tính năng Phiếu chi đang được xây dựng</p>
              </div>
            </div>
          )}

          {/* Sổ quỹ Tab */}
          {activeTab === "so-quy" && <DongTienTab />}

          {/* Tài khoản Tab */}
          {activeTab === "tai-khoan" && <TaiKhoanTab />}
        </div>
      </div>
    </div>
  );
}
