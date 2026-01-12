"use client";

import { useState } from "react";

interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string;
  birthday: string;
  cccd: string;
  address: string;
}

interface SalaryData {
  employeeId: number;
  employeeName: string;
  position: string;
  baseSalary: number;
  allowance: number;
  workDays: number;
  bonus: number;
  insurance: number;
  netSalary: number;
  status: string;
}

interface SalaryTabProps {
  employees: Employee[];
}

// Generate salary data based on employees
const generateSalaryData = (employees: Employee[]): SalaryData[] => {
  return employees.map((emp) => {
    const baseSalary =
      emp.position === "Giám đốc"
        ? 25000000
        : emp.position === "Kế toán"
        ? 12000000
        : emp.position === "Quản lý đơn hàng"
        ? 10000000
        : emp.position.includes("Sale")
        ? 8000000
        : emp.position === "Thiết kế"
        ? 10000000
        : 7000000;
    const allowance = Math.floor(baseSalary * 0.15);
    const insurance = Math.floor(baseSalary * 0.105);
    const workDays = 22 + Math.floor(Math.random() * 4);
    const bonus = Math.floor(Math.random() * 2000000);
    const netSalary = baseSalary + allowance + bonus - insurance;

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      baseSalary,
      allowance,
      workDays,
      bonus,
      insurance,
      netSalary,
      status: Math.random() > 0.3 ? "paid" : "pending",
    };
  });
};

export default function SalaryTab({ employees }: SalaryTabProps) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const salaryData = generateSalaryData(employees);

  const totalSalary = salaryData.reduce((sum, s) => sum + s.netSalary, 0);
  const totalInsurance = salaryData.reduce((sum, s) => sum + s.insurance, 0);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">STT</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nhân viên</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Chức vụ</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Lương CB</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Phụ cấp</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Ngày công</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Thưởng</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-orange-50">
                Bảo hiểm
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-green-50">
                Thực lãnh
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {salaryData.map((row, index) => (
              <tr key={row.employeeId} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-600">{index + 1}</td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-gray-900">{row.employeeName}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {row.position}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900">
                  {row.baseSalary.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right text-green-600">
                  +{row.allowance.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-center text-gray-600">{row.workDays}</td>
                <td className="px-4 py-4 text-sm text-right text-blue-600">
                  +{row.bonus.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right text-orange-600 bg-orange-50">
                  -{row.insurance.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-green-600 bg-green-50">
                  {row.netSalary.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      row.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {row.status === "paid" ? "Đã trả" : "Chờ trả"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={3} className="px-4 py-3 text-right">
                Tổng cộng:
              </td>
              <td className="px-4 py-3 text-right">
                {salaryData.reduce((s, r) => s + r.baseSalary, 0).toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-green-600">
                +{salaryData.reduce((s, r) => s + r.allowance, 0).toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-center">-</td>
              <td className="px-4 py-3 text-right text-blue-600">
                +{salaryData.reduce((s, r) => s + r.bonus, 0).toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-orange-600 bg-orange-100">
                -{totalInsurance.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-green-700 bg-green-100">
                {totalSalary.toLocaleString("vi-VN")}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
