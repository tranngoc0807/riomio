"use client";

import {
  ShoppingCart,
  Users,
  TrendingUp,
  Wallet,
  FileText,
  UserCheck,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";

// Import tab components
import CustomersTab from "./components/CustomersTab";
import OrdersTab from "./components/OrdersTab";
import ProgramsTab from "./components/ProgramsTab";
import CongNoKHTab from "./components/CongNoKHTab";

type TabType = "customers" | "orders" | "programs" | "cong-no-kh" | "cnpt-kh" | "theo-doi-cong-no" | "chi-phi-ban-hang";

const TABS = [
  { id: "customers" as TabType, label: "Khách hàng", icon: Users },
  { id: "orders" as TabType, label: "Đơn hàng", icon: ShoppingCart },
  { id: "programs" as TabType, label: "Chương trình bán hàng", icon: TrendingUp },
  { id: "cong-no-kh" as TabType, label: "Công nợ KH", icon: Wallet },
  { id: "cnpt-kh" as TabType, label: "CNPT KH", icon: FileText },
  { id: "theo-doi-cong-no" as TabType, label: "Theo dõi CN từng KH", icon: UserCheck },
  { id: "chi-phi-ban-hang" as TabType, label: "Chi phí bán hàng", icon: DollarSign },
];

export default function BanHang() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("customers");

  // Read tab from URL on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && ["customers", "orders", "programs", "cong-no-kh", "cnpt-kh", "theo-doi-cong-no", "chi-phi-ban-hang"].includes(tabFromUrl)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabFromUrl as TabType);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={32} />
            Bán hàng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý khách hàng, đơn hàng và chương trình bán hàng
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-blue-600 bg-blue-50/50"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "customers" && <CustomersTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "programs" && <ProgramsTab />}
          {activeTab === "cong-no-kh" && <CongNoKHTab />}

          {/* CNPT KH Tab */}
          {activeTab === "cnpt-kh" && (
            <div className="text-center py-16">
              <FileText className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang phát triển</h3>
              <p className="text-gray-500">Tính năng CNPT KH đang được xây dựng</p>
            </div>
          )}

          {/* Theo dõi công nợ từng KH Tab */}
          {activeTab === "theo-doi-cong-no" && (
            <div className="text-center py-16">
              <UserCheck className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang phát triển</h3>
              <p className="text-gray-500">Tính năng theo dõi công nợ từng khách hàng đang được xây dựng</p>
            </div>
          )}

          {/* Chi phí bán hàng Tab */}
          {activeTab === "chi-phi-ban-hang" && (
            <div className="text-center py-16">
              <DollarSign className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang phát triển</h3>
              <p className="text-gray-500">Tính năng chi phí bán hàng đang được xây dựng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
