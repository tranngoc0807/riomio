"use client";

import { Eye } from "lucide-react";
import { SalaryReport, formatCurrency } from "./types";

// Sample data
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

interface NhanSuTabProps {
  onViewDetail: (report: SalaryReport, type: string) => void;
}

export default function NhanSuTab({ onViewDetail }: NhanSuTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Báo cáo lương tháng 12/2024
        </h3>
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
                      onClick={() => onViewDetail(row, "salary")}
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
                {formatCurrency(salaryData.reduce((s, r) => s + r.bonus, 0))}
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
  );
}

// Export data for stats calculation
export { salaryData };
