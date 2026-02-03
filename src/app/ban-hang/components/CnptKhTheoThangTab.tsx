"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, FileText, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface CnptKhTheoThangItem {
  id: number;
  stt: number;
  khachHang: string;
  duDauKy: number;
  phatSinh: number;
  thanhToan: number;
  duCuoiKy: number;
}

interface CnptKhTheoThangData {
  data: CnptKhTheoThangItem[];
  tieuDe: string;
  currentDate: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

export default function CnptKhTheoThangTab() {
  const [tableData, setTableData] = useState<CnptKhTheoThangData>({
    data: [],
    tieuDe: "",
    currentDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Date selector state
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    fetchData();
  }, []);

  // Parse current date from API and set selectors
  useEffect(() => {
    if (tableData.currentDate) {
      // Format: "M/YYYY" e.g., "1/2026"
      const parts = tableData.currentDate.split("/");
      if (parts.length === 2) {
        const month = parseInt(parts[0]);
        const year = parseInt(parts[1]);
        if (!isNaN(month) && !isNaN(year)) {
          setSelectedMonth(month);
          setSelectedYear(year);
        }
      }
    }
  }, [tableData.currentDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cnpt-kh-theo-thang");
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
    const newDate = `${selectedMonth}/${selectedYear}`;

    if (newDate === tableData.currentDate) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/cnpt-kh-theo-thang", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate }),
      });

      const result = await response.json();

      if (result.success) {
        setTableData(result.data);
        toast.success(`Đã cập nhật: Tháng ${selectedMonth}/${selectedYear}`);
      } else {
        toast.error(result.error || "Không thể cập nhật ngày tháng");
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
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // Calculate totals
  const totalDuDauKy = tableData.data.reduce((sum, item) => sum + item.duDauKy, 0);
  const totalPhatSinh = tableData.data.reduce((sum, item) => sum + item.phatSinh, 0);
  const totalThanhToan = tableData.data.reduce((sum, item) => sum + item.thanhToan, 0);
  const totalDuCuoiKy = tableData.data.reduce((sum, item) => sum + item.duCuoiKy, 0);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Date Selector */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-4 flex-wrap">
          <Calendar className="text-blue-600" size={24} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              disabled={isUpdating}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <FileText size={18} />
            <span className="font-semibold">
              {tableData.tieuDe || `Bảng kê công nợ phải thu khách hàng: ${selectedMonth}/${selectedYear}`}
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
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Dư đầu kỳ
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Phát sinh
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Thanh toán
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-blue-50">
                  Dư cuối kỳ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableData.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Chưa có dữ liệu công nợ
                  </td>
                </tr>
              ) : (
                <>
                  {tableData.data.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.khachHang}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.duDauKy !== 0 ? formatCurrency(item.duDauKy) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">
                        {item.phatSinh !== 0 ? formatCurrency(item.phatSinh) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600 font-medium">
                        {item.thanhToan !== 0 ? formatCurrency(item.thanhToan) : "-"}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold bg-blue-50 ${
                        item.duCuoiKy >= 0 ? "text-blue-600" : "text-red-600"
                      }`}>
                        {formatCurrency(item.duCuoiKy)}
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-right text-gray-700">
                      Tổng cộng:
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatCurrency(totalDuDauKy)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700">
                      {formatCurrency(totalPhatSinh)}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-700">
                      {formatCurrency(totalThanhToan)}
                    </td>
                    <td className={`px-4 py-3 text-right bg-blue-100 ${
                      totalDuCuoiKy >= 0 ? "text-blue-700" : "text-red-700"
                    }`}>
                      {formatCurrency(totalDuCuoiKy)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-600 mb-1">Tổng công nợ cuối kỳ</div>
        <div className={`text-2xl font-bold ${totalDuCuoiKy >= 0 ? "text-blue-700" : "text-red-700"}`}>
          {formatCurrency(totalDuCuoiKy)} đ
        </div>
      </div>
    </div>
  );
}
