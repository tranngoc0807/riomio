"use client";

import { Users, UserCheck, DollarSign, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRolePermissions } from "@/context/RolePermissionsContext";
import CustomersTab from "../components/CustomersTab";
import CongNoTab from "../components/CongNoTab";
import CnptKhTheoThangTab from "../components/CnptKhTheoThangTab";
import CnptKhDenNgayTab from "../components/CnptKhDenNgayTab";

type TabType = "danh-sach" | "theo-doi-cong-no" | "cnpt-theo-thang" | "cnpt-den-ngay";

const TABS = [
  { id: "danh-sach" as TabType, label: "Danh sách khách hàng", icon: Users },
  { id: "theo-doi-cong-no" as TabType, label: "Theo dõi công nợ từng KH", icon: UserCheck },
  { id: "cnpt-theo-thang" as TabType, label: "CNPT KH theo tháng", icon: DollarSign },
  { id: "cnpt-den-ngay" as TabType, label: "CNPT KH đến ngày", icon: Calendar },
];

export default function KhachHangPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>("danh-sach");

  // Filter tabs based on permissions
  // Cho phép tất cả sub-tab nếu có quyền truy cập trang cha "ban-hang/khach-hang"
  const filteredTabs = useMemo(() => {
    if (hasAccess("ban-hang/khach-hang")) {
      return TABS;
    }
    return TABS.filter((tab) => hasAccess(`ban-hang/khach-hang/${tab.id}`));
  }, [hasAccess]);

  useEffect(() => {
    const validTabs = filteredTabs.map((t) => t.id);
    if (tabParam && validTabs.includes(tabParam)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabParam);
    } else if (filteredTabs.length > 0 && !validTabs.includes(activeTab)) {
      setActiveTab(filteredTabs[0].id);
    }
  }, [tabParam, filteredTabs, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/ban-hang/khach-hang?tab=${tab}`, { scroll: false });
  };

  const getTabHref = (tab: TabType) => `/ban-hang/khach-hang?tab=${tab}`;

  const handleTabClick = (e: React.MouseEvent, tab: TabType) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    handleTabChange(tab);
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
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTabs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Bạn không có quyền truy cập các tab trong mục này
            </div>
          ) : (
            <div className="flex flex-wrap">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <a
                    key={tab.id}
                    href={getTabHref(tab.id)}
                    onClick={(e) => handleTabClick(e, tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "text-blue-600 border-blue-600 bg-blue-50/50"
                        : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "danh-sach" && <CustomersTab />}
          {activeTab === "theo-doi-cong-no" && <CongNoTab />}
          {activeTab === "cnpt-theo-thang" && <CnptKhTheoThangTab />}
          {activeTab === "cnpt-den-ngay" && <CnptKhDenNgayTab />}
        </div>
      </div>
    </div>
  );
}
