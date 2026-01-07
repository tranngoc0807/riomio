"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { DebtReport, formatCurrency } from "./types";

// Sample data
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

interface CongNoTabProps {
  onViewDetail: (report: DebtReport, type: string) => void;
}

export default function CongNoTab({ onViewDetail }: CongNoTabProps) {
  const [debtFilter, setDebtFilter] = useState<
    "all" | "customer" | "supplier" | "workshop"
  >("all");

  const filteredDebtData =
    debtFilter === "all"
      ? debtData
      : debtData.filter((d) => d.type === debtFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Báo cáo công nợ</h3>
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
                  <span className="font-medium text-gray-900">{row.name}</span>
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
                      onClick={() => onViewDetail(row, "debt")}
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
  );
}

// Export data and helpers for reuse
export { debtData, getDebtStatusBadge, getDebtTypeBadge };
