"use client";

import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useState } from "react";

// Import components
import {
  DoanhThuTab,
  CongNoTab,
  TonKhoTab,
  NhanSuTab,
  revenueData,
  debtData,
  inventoryData,
  getDebtStatusBadge,
  getDebtTypeBadge,
  formatCurrency,
  RevenueReport,
  DebtReport,
  InventoryReport,
  SalaryReport,
} from "./components";

export default function BaoCao() {
  const [activeTab, setActiveTab] = useState("doanh-thu");
  const [dateRange, setDateRange] = useState("month");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<
    RevenueReport | DebtReport | InventoryReport | SalaryReport | null
  >(null);
  const [reportType, setReportType] = useState<string>("");

  const tabs = [
    { id: "doanh-thu", label: "Doanh thu & Lợi nhuận", icon: TrendingUp },
    { id: "cong-no", label: "Công nợ", icon: DollarSign },
    { id: "ton-kho", label: "Tồn kho", icon: Package },
    { id: "nhan-su", label: "Nhân sự & Lương", icon: Users },
  ];

  // Stats calculations
  const totalRevenue = revenueData.reduce((sum, r) => sum + r.revenue, 0);
  const totalProfit = revenueData.reduce((sum, r) => sum + r.profit, 0);
  const totalDebtRemaining = debtData.reduce((sum, d) => sum + d.remaining, 0);
  const totalInventoryValue = inventoryData.reduce(
    (sum, i) => sum + i.value,
    0
  );

  const stats = [
    {
      label: "Tổng doanh thu",
      value: formatCurrency(totalRevenue),
      change: "+12.5%",
      isPositive: true,
      icon: TrendingUp,
      color: "bg-blue-500",
    },
    {
      label: "Tổng lợi nhuận",
      value: formatCurrency(totalProfit),
      change: "+8.3%",
      isPositive: true,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      label: "Công nợ còn lại",
      value: formatCurrency(totalDebtRemaining),
      change: "-5.2%",
      isPositive: true,
      icon: FileText,
      color: "bg-orange-500",
    },
    {
      label: "Giá trị tồn kho",
      value: formatCurrency(totalInventoryValue),
      change: "+3.1%",
      isPositive: true,
      icon: Package,
      color: "bg-purple-500",
    },
  ];

  const handleViewDetail = (
    report: RevenueReport | DebtReport | InventoryReport | SalaryReport,
    type: string
  ) => {
    setSelectedReport(report);
    setReportType(type);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Báo cáo & Thống kê
          </h1>
          <p className="text-gray-500 mt-1">
            Tổng hợp báo cáo doanh thu, công nợ, tồn kho và nhân sự
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm nay</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <div
                  className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change} so với kỳ trước
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Doanh thu & Lợi nhuận */}
          {activeTab === "doanh-thu" && (
            <DoanhThuTab onViewDetail={handleViewDetail} />
          )}

          {/* Tab: Công nợ */}
          {activeTab === "cong-no" && (
            <CongNoTab onViewDetail={handleViewDetail} />
          )}

          {/* Tab: Tồn kho */}
          {activeTab === "ton-kho" && (
            <TonKhoTab onViewDetail={handleViewDetail} />
          )}

          {/* Tab: Nhân sự & Lương */}
          {activeTab === "nhan-su" && (
            <NhanSuTab onViewDetail={handleViewDetail} />
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Chi tiết báo cáo
            </h3>

            {reportType === "revenue" && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Tháng:</span>
                  <span className="font-medium">
                    {(selectedReport as RevenueReport).month}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Doanh thu:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency((selectedReport as RevenueReport).revenue)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Chi phí:</span>
                  <span className="font-medium">
                    {formatCurrency((selectedReport as RevenueReport).cost)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Lợi nhuận:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency((selectedReport as RevenueReport).profit)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Tỷ lệ lợi nhuận:</span>
                  <span className="font-medium">
                    {(
                      ((selectedReport as RevenueReport).profit /
                        (selectedReport as RevenueReport).revenue) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Số đơn hàng:</span>
                  <span className="font-medium">
                    {(selectedReport as RevenueReport).orderCount}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tăng trưởng:</span>
                  <span
                    className={`font-medium ${
                      (selectedReport as RevenueReport).growthRate >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(selectedReport as RevenueReport).growthRate >= 0
                      ? "+"
                      : ""}
                    {(selectedReport as RevenueReport).growthRate}%
                  </span>
                </div>
              </div>
            )}

            {reportType === "debt" && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Đối tượng:</span>
                  <span className="font-medium">
                    {(selectedReport as DebtReport).name}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Loại:</span>
                  {getDebtTypeBadge((selectedReport as DebtReport).type)}
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Tổng nợ:</span>
                  <span className="font-medium">
                    {formatCurrency((selectedReport as DebtReport).totalDebt)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Đã trả:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency((selectedReport as DebtReport).paid)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Còn lại:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency((selectedReport as DebtReport).remaining)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Hạn trả:</span>
                  <span className="font-medium">
                    {new Date(
                      (selectedReport as DebtReport).dueDate
                    ).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Trạng thái:</span>
                  {getDebtStatusBadge((selectedReport as DebtReport).status)}
                </div>
              </div>
            )}

            {reportType === "inventory" && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Sản phẩm:</span>
                  <span className="font-medium">
                    {(selectedReport as InventoryReport).productName}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Mã SKU:</span>
                  <span className="font-medium">
                    {(selectedReport as InventoryReport).sku}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Danh mục:</span>
                  <span className="font-medium">
                    {(selectedReport as InventoryReport).category}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Nhập kho:</span>
                  <span className="font-medium text-green-600">
                    +{(selectedReport as InventoryReport).stockIn}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Xuất kho:</span>
                  <span className="font-medium text-red-600">
                    -{(selectedReport as InventoryReport).stockOut}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Tồn kho hiện tại:</span>
                  <span className="font-medium">
                    {(selectedReport as InventoryReport).currentStock}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Giá trị tồn kho:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency((selectedReport as InventoryReport).value)}
                  </span>
                </div>
              </div>
            )}

            {reportType === "salary" && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Nhân viên:</span>
                  <span className="font-medium">
                    {(selectedReport as SalaryReport).employeeName}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Phòng ban:</span>
                  <span className="font-medium">
                    {(selectedReport as SalaryReport).department}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Tháng:</span>
                  <span className="font-medium">
                    {(selectedReport as SalaryReport).month}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Lương cơ bản:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (selectedReport as SalaryReport).baseSalary
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Phụ cấp:</span>
                  <span className="font-medium">
                    {formatCurrency((selectedReport as SalaryReport).allowance)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Thưởng:</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency((selectedReport as SalaryReport).bonus)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Khấu trừ:</span>
                  <span className="font-medium text-red-600">
                    -
                    {formatCurrency((selectedReport as SalaryReport).deduction)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Thực lãnh:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency((selectedReport as SalaryReport).netSalary)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
