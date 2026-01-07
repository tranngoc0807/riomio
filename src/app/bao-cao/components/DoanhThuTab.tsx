"use client";

import { Calendar, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { RevenueReport, formatCurrency } from "./types";

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

interface DoanhThuTabProps {
  onViewDetail: (report: RevenueReport, type: string) => void;
}

export default function DoanhThuTab({ onViewDetail }: DoanhThuTabProps) {
  const totalRevenue = revenueData.reduce((sum, r) => sum + r.revenue, 0);
  const totalProfit = revenueData.reduce((sum, r) => sum + r.profit, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Báo cáo doanh thu theo tháng
        </h3>
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
                      row.growthRate >= 0 ? "text-green-600" : "text-red-600"
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
                      onClick={() => onViewDetail(row, "revenue")}
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
                {formatCurrency(revenueData.reduce((s, r) => s + r.cost, 0))}
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
  );
}

// Export data for stats calculation
export { revenueData };
