"use client";

import { Users, DollarSign, Calendar, FileText } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";

import EmployeesTab from "./components/EmployeesTab";
import AttendanceTab from "./components/AttendanceTab";
import SalaryTab from "./components/SalaryTab";
import ContractsTab from "./components/ContractsTab";

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

type TabType = "employees" | "attendance" | "salary" | "contracts";

export default function LuongBaoHiem() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Lấy tab từ URL param, mặc định là "employees"
  const tabFromUrl = searchParams.get("tab") as TabType | null;
  const validTabs = useMemo<TabType[]>(() => ["employees", "attendance", "salary", "contracts"], []);
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "employees";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Set URL param on initial load if not present
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (!currentTab || !validTabs.includes(currentTab as TabType)) {
      router.replace(`/luong-bao-hiem?tab=${initialTab}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync activeTab when URL changes (back/forward button)
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, validTabs]);

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
          <div className="flex">
            <button
              onClick={() => handleTabChange("employees")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "employees"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={20} />
                Danh sách nhân viên
              </div>
            </button>
            <button
              onClick={() => handleTabChange("attendance")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "attendance"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={20} />
                Chấm công
              </div>
            </button>
            <button
              onClick={() => handleTabChange("salary")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "salary"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign size={20} />
                Bảng lương
              </div>
            </button>
            <button
              onClick={() => handleTabChange("contracts")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "contracts"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={20} />
                Hợp đồng
              </div>
            </button>
          </div>
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
          {activeTab === "salary" && <SalaryTab employees={employees} />}

          {/* Tab: Hợp đồng */}
          {activeTab === "contracts" && <ContractsTab />}
        </div>
      </div>
    </div>
  );
}
