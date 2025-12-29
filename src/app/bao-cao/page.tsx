"use client";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  FileText,
  Download,
  Calendar,
  Filter,
  Eye,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useState } from "react";

// Types
interface RevenueReport {
  id: number;
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  growthRate: number;
  orderCount: number;
}

interface DebtReport {
  id: number;
  name: string;
  type: "customer" | "supplier" | "workshop";
  totalDebt: number;
  paid: number;
  remaining: number;
  dueDate: string;
  status: "normal" | "warning" | "overdue";
}

interface InventoryReport {
  id: number;
  productName: string;
  sku: string;
  category: string;
  stockIn: number;
  stockOut: number;
  currentStock: number;
  value: number;
}

interface SalaryReport {
  id: number;
  employeeName: string;
  department: string;
  baseSalary: number;
  allowance: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  month: string;
}

// Sample data
const revenueData: RevenueReport[] = [
  {
    id: 1,
    month: "12/2024",
    revenue: 850000000,
    cost: 620000000,
    profit: 230000000,
    growthRate: 15.2,
    orderCount: 156,
  },
  {
    id: 2,
    month: "11/2024",
    revenue: 780000000,
    cost: 580000000,
    profit: 200000000,
    growthRate: 8.5,
    orderCount: 142,
  },
  {
    id: 3,
    month: "10/2024",
    revenue: 720000000,
    cost: 540000000,
    profit: 180000000,
    growthRate: 12.3,
    orderCount: 128,
  },
  {
    id: 4,
    month: "09/2024",
    revenue: 680000000,
    cost: 520000000,
    profit: 160000000,
    growthRate: -3.2,
    orderCount: 115,
  },
  {
    id: 5,
    month: "08/2024",
    revenue: 700000000,
    cost: 530000000,
    profit: 170000000,
    growthRate: 5.8,
    orderCount: 121,
  },
];

const debtData: DebtReport[] = [
  {
    id: 1,
    name: "Công ty TNHH ABC Fashion",
    type: "customer",
    totalDebt: 125000000,
    paid: 75000000,
    remaining: 50000000,
    dueDate: "2024-12-30",
    status: "normal",
  },
  {
    id: 2,
    name: "Shop Thời trang XYZ",
    type: "customer",
    totalDebt: 85000000,
    paid: 45000000,
    remaining: 40000000,
    dueDate: "2024-12-25",
    status: "warning",
  },
  {
    id: 3,
    name: "NCC Vải Hoàng Minh",
    type: "supplier",
    totalDebt: 200000000,
    paid: 150000000,
    remaining: 50000000,
    dueDate: "2024-12-20",
    status: "overdue",
  },
  {
    id: 4,
    name: "Xưởng may Tân Bình",
    type: "workshop",
    totalDebt: 95000000,
    paid: 60000000,
    remaining: 35000000,
    dueDate: "2025-01-05",
    status: "normal",
  },
  {
    id: 5,
    name: "NCC Phụ liệu Kim Long",
    type: "supplier",
    totalDebt: 45000000,
    paid: 45000000,
    remaining: 0,
    dueDate: "2024-12-15",
    status: "normal",
  },
];

const inventoryData: InventoryReport[] = [
  {
    id: 1,
    productName: "Áo sơ mi trắng nam",
    sku: "ASM-001",
    category: "Áo sơ mi",
    stockIn: 500,
    stockOut: 320,
    currentStock: 180,
    value: 54000000,
  },
  {
    id: 2,
    productName: "Quần tây đen",
    sku: "QT-001",
    category: "Quần",
    stockIn: 400,
    stockOut: 280,
    currentStock: 120,
    value: 48000000,
  },
  {
    id: 3,
    productName: "Áo vest nam",
    sku: "AV-001",
    category: "Áo vest",
    stockIn: 200,
    stockOut: 150,
    currentStock: 50,
    value: 75000000,
  },
  {
    id: 4,
    productName: "Váy công sở",
    sku: "VCS-001",
    category: "Váy",
    stockIn: 300,
    stockOut: 220,
    currentStock: 80,
    value: 32000000,
  },
  {
    id: 5,
    productName: "Đầm dạ hội",
    sku: "DDH-001",
    category: "Đầm",
    stockIn: 150,
    stockOut: 95,
    currentStock: 55,
    value: 82500000,
  },
];

const salaryData: SalaryReport[] = [
  {
    id: 1,
    employeeName: "Nguyễn Văn An",
    department: "Bán hàng",
    baseSalary: 12000000,
    allowance: 2000000,
    bonus: 3000000,
    deduction: 500000,
    netSalary: 16500000,
    month: "12/2024",
  },
  {
    id: 2,
    employeeName: "Trần Thị Bình",
    department: "Kế toán",
    baseSalary: 15000000,
    allowance: 1500000,
    bonus: 2000000,
    deduction: 600000,
    netSalary: 17900000,
    month: "12/2024",
  },
  {
    id: 3,
    employeeName: "Lê Văn Cường",
    department: "Sản xuất",
    baseSalary: 10000000,
    allowance: 1000000,
    bonus: 1500000,
    deduction: 400000,
    netSalary: 12100000,
    month: "12/2024",
  },
  {
    id: 4,
    employeeName: "Phạm Thị Dung",
    department: "Marketing",
    baseSalary: 13000000,
    allowance: 1500000,
    bonus: 2500000,
    deduction: 550000,
    netSalary: 16450000,
    month: "12/2024",
  },
  {
    id: 5,
    employeeName: "Hoàng Văn Em",
    department: "Kho",
    baseSalary: 9000000,
    allowance: 800000,
    bonus: 1000000,
    deduction: 350000,
    netSalary: 10450000,
    month: "12/2024",
  },
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function BaoCao() {
  const [activeTab, setActiveTab] = useState("doanh-thu");
  const [dateRange, setDateRange] = useState("month");
  const [debtFilter, setDebtFilter] = useState<
    "all" | "customer" | "supplier" | "workshop"
  >("all");
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

  const getDebtStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Bình thường
          </span>
        );
      case "warning":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Sắp đến hạn
          </span>
        );
      case "overdue":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Quá hạn
          </span>
        );
      default:
        return null;
    }
  };

  const getDebtTypeBadge = (type: string) => {
    switch (type) {
      case "customer":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Khách hàng
          </span>
        );
      case "supplier":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            NCC NPL
          </span>
        );
      case "workshop":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            Xưởng SX
          </span>
        );
      default:
        return null;
    }
  };

  const filteredDebtData =
    debtFilter === "all"
      ? debtData
      : debtData.filter((d) => d.type === debtFilter);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
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
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
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
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Báo cáo doanh thu theo tháng
                </h3>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Printer className="w-4 h-4" />
                  In báo cáo
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tháng
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Doanh thu
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Chi phí
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Lợi nhuận
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tăng trưởng
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Đơn hàng
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {revenueData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {row.month}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-600">
                          {formatCurrency(row.cost)}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-green-600">
                          {formatCurrency(row.profit)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`flex items-center justify-end gap-1 ${
                              row.growthRate >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {row.growthRate >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {row.growthRate >= 0 ? "+" : ""}
                            {row.growthRate}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-600">
                          {row.orderCount}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleViewDetail(row, "revenue")}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-4 py-3 text-gray-900">Tổng cộng</td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatCurrency(totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(
                          revenueData.reduce((s, r) => s + r.cost, 0)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {formatCurrency(totalProfit)}
                      </td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {revenueData.reduce((s, r) => s + r.orderCount, 0)}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Công nợ */}
          {activeTab === "cong-no" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Báo cáo công nợ
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setDebtFilter("all")}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        debtFilter === "all"
                          ? "bg-white shadow text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setDebtFilter("customer")}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        debtFilter === "customer"
                          ? "bg-white shadow text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Khách hàng
                    </button>
                    <button
                      onClick={() => setDebtFilter("supplier")}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        debtFilter === "supplier"
                          ? "bg-white shadow text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      NCC NPL
                    </button>
                    <button
                      onClick={() => setDebtFilter("workshop")}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        debtFilter === "workshop"
                          ? "bg-white shadow text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Xưởng SX
                    </button>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Printer className="w-4 h-4" />
                    In báo cáo
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Đối tượng
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tổng nợ
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Đã trả
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Còn lại
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Hạn trả
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDebtData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900">
                            {row.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getDebtTypeBadge(row.type)}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(row.totalDebt)}
                        </td>
                        <td className="px-4 py-4 text-right text-green-600">
                          {formatCurrency(row.paid)}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-orange-600">
                          {formatCurrency(row.remaining)}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600">
                          {new Date(row.dueDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getDebtStatusBadge(row.status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleViewDetail(row, "debt")}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-4 py-3 text-gray-900" colSpan={2}>
                        Tổng cộng
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatCurrency(
                          filteredDebtData.reduce((s, d) => s + d.totalDebt, 0)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {formatCurrency(
                          filteredDebtData.reduce((s, d) => s + d.paid, 0)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600">
                        {formatCurrency(
                          filteredDebtData.reduce((s, d) => s + d.remaining, 0)
                        )}
                      </td>
                      <td className="px-4 py-3" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Tồn kho */}
          {activeTab === "ton-kho" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Báo cáo tồn kho
                </h3>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Printer className="w-4 h-4" />
                  In báo cáo
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Mã SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nhập kho
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Xuất kho
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Giá trị
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventoryData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900">
                            {row.productName}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{row.sku}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-green-600">
                          +{row.stockIn}
                        </td>
                        <td className="px-4 py-4 text-right text-red-600">
                          -{row.stockOut}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          {row.currentStock}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-blue-600">
                          {formatCurrency(row.value)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleViewDetail(row, "inventory")}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-4 py-3 text-gray-900" colSpan={3}>
                        Tổng cộng
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        +{inventoryData.reduce((s, i) => s + i.stockIn, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        -{inventoryData.reduce((s, i) => s + i.stockOut, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {inventoryData.reduce((s, i) => s + i.currentStock, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {formatCurrency(totalInventoryValue)}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Nhân sự & Lương */}
          {activeTab === "nhan-su" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Báo cáo lương tháng 12/2024
                </h3>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Printer className="w-4 h-4" />
                  In báo cáo
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Phòng ban
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Lương cơ bản
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Phụ cấp
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thưởng
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Khấu trừ
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thực lãnh
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salaryData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900">
                            {row.employeeName}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {row.department}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-900">
                          {formatCurrency(row.baseSalary)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-600">
                          {formatCurrency(row.allowance)}
                        </td>
                        <td className="px-4 py-4 text-right text-green-600">
                          +{formatCurrency(row.bonus)}
                        </td>
                        <td className="px-4 py-4 text-right text-red-600">
                          -{formatCurrency(row.deduction)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-blue-600">
                          {formatCurrency(row.netSalary)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleViewDetail(row, "salary")}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-4 py-3 text-gray-900" colSpan={2}>
                        Tổng cộng
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatCurrency(
                          salaryData.reduce((s, r) => s + r.baseSalary, 0)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(
                          salaryData.reduce((s, r) => s + r.allowance, 0)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        +
                        {formatCurrency(
                          salaryData.reduce((s, r) => s + r.bonus, 0)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        -
                        {formatCurrency(
                          salaryData.reduce((s, r) => s + r.deduction, 0)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {formatCurrency(
                          salaryData.reduce((s, r) => s + r.netSalary, 0)
                        )}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
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
