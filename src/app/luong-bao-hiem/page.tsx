"use client";

import { Users, DollarSign, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useRolePermissions } from "@/context/RolePermissionsContext";

import EmployeesTab from "./components/EmployeesTab";
import AttendanceTab from "./components/AttendanceTab";
import SalaryTab from "./components/SalaryTab";

// Employee type - khớp với Google Sheets Employee interface
interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string;
  birthday: string;
  cccd: string;
  address: string;
}

type TabType = "employees" | "attendance" | "salary";

const TABS = [
  { id: "employees" as TabType, label: "Danh sách nhân viên", icon: Users },
  { id: "attendance" as TabType, label: "Chấm công", icon: Calendar },
  { id: "salary" as TabType, label: "Bảng lương", icon: DollarSign },
];

export default function LuongBaoHiem() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();

  const [activeTab, setActiveTab] = useState<TabType>("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter tabs based on permissions
  const filteredTabs = useMemo(() => {
    return TABS.filter((tab) => hasAccess(`luong-bao-hiem/${tab.id}`));
  }, [hasAccess]);

  // Sync activeTab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    const validTabs = filteredTabs.map((t) => t.id);
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (filteredTabs.length > 0 && !validTabs.includes(activeTab)) {
      setActiveTab(filteredTabs[0].id);
      router.replace(`/luong-bao-hiem?tab=${filteredTabs[0].id}`, { scroll: false });
    }
  }, [searchParams, filteredTabs, activeTab, router]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/luong-bao-hiem?tab=${tab}`, { scroll: false });
  };

  // Load employees from Google Sheets on mount
  useEffect(() => {
    loadEmployeesFromSheet();
  }, []);

  const loadEmployeesFromSheet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setEmployees(data.data);
      } else {
        console.log("No data in Google Sheets, using sample data");
      }
    } catch (error) {
      console.error("Error loading employees from sheet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Lương & Bảo hiểm
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý nhân viên, chấm công và bảng lương
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
            <div className="flex">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={20} />
                      {tab.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Tab: Danh sách nhân viên */}
          {activeTab === "employees" && (
            <EmployeesTab
              employees={employees}
              setEmployees={setEmployees}
              isLoading={isLoading}
              loadEmployeesFromSheet={loadEmployeesFromSheet}
            />
          )}

          {/* Tab: Chấm công */}
          {activeTab === "attendance" && <AttendanceTab />}

          {/* Tab: Bảng lương */}
          {activeTab === "salary" && <SalaryTab />}
        </div>
      </div>
    </div>
  );
}
