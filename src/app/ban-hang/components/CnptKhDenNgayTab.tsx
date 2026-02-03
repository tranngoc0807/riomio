"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, FileText, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface CnptKhDenNgayItem {
  id: number;
  stt: number;
  khachHang: string;
  soTien: number;
}

interface CnptKhDenNgayData {
  data: CnptKhDenNgayItem[];
  tieuDe: string;
  currentDate: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

// Get days in selected month
const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

export default function CnptKhDenNgayTab() {
  const [tableData, setTableData] = useState<CnptKhDenNgayData>({
    data: [],
    tieuDe: "",
    currentDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Date selector state
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Calculate daysInMonth for current selection
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Parse current date from API and set selectors
  useEffect(() => {
    if (tableData.currentDate) {
      // Format: "DD/MM/YYYY" e.g., "31/12/2025"
      const parts = tableData.currentDate.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          setSelectedDay(day);
          setSelectedMonth(month);
          setSelectedYear(year);
        }
      }
    }
  }, [tableData.currentDate]);

  // Adjust day if it exceeds days in the selected month
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth, selectedDay]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cnpt-kh-den-ngay");
      const result = await response.json();

      if (result.success) {
        setTableData(result.data);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu");
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = async () => {
    const dayStr = selectedDay.toString().padStart(2, "0");
    const monthStr = selectedMonth.toString().padStart(2, "0");
    const newDate = `${dayStr}/${monthStr}/${selectedYear}`;

    if (newDate === tableData.currentDate) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/cnpt-kh-den-ngay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate }),
      });

      const result = await response.json();

      if (result.success) {
        setTableData(result.data);
        toast.success(`Đã cập nhật: ${newDate}`);
      } else {
        toast.error(result.error || "Không thể cập nhật ngày");
      }
    } catch (err: any) {
      console.error("Error updating date:", err);
      toast.error("Đã xảy ra lỗi khi cập nhật");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-purple-600 mr-2" size={24} />
        <span className="text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // Calculate total
  const totalSoTien = tableData.data.reduce((sum, item) => sum + item.soTien, 0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Date Selector */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center gap-4 flex-wrap">
          <Calendar className="text-purple-600" size={24} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Ngày:</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(parseInt(e.target.value))}
              disabled={isUpdating}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              disabled={isUpdating}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Năm:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              disabled={isUpdating}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDateChange}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
            <span>Cập nhật</span>
          </button>
          <button
            onClick={fetchData}
            disabled={isLoading || isUpdating}
            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <FileText size={18} />
            <span className="font-semibold">
              {tableData.tieuDe || `Bảng kê công nợ khách hàng đến ngày: ${selectedDay}/${selectedMonth}/${selectedYear}`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-16">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-purple-50">
                  Số tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableData.data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    Chưa có dữ liệu công nợ
                  </td>
                </tr>
              ) : (
                <>
                  {tableData.data.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.khachHang}</td>
                      <td className={`px-4 py-3 text-right font-bold bg-purple-50 ${
                        item.soTien >= 0 ? "text-purple-600" : "text-red-600"
                      }`}>
                        {formatCurrency(item.soTien)}
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-right text-gray-700">
                      Tổng cộng:
                    </td>
                    <td className={`px-4 py-3 text-right bg-purple-100 ${
                      totalSoTien >= 0 ? "text-purple-700" : "text-red-700"
                    }`}>
                      {formatCurrency(totalSoTien)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
        <div className="text-sm text-purple-600 mb-1">Tổng công nợ đến ngày</div>
        <div className={`text-2xl font-bold ${totalSoTien >= 0 ? "text-purple-700" : "text-red-700"}`}>
          {formatCurrency(totalSoTien)} đ
        </div>
      </div>
    </div>
  );
}
