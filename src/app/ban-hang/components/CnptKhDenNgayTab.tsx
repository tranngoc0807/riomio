"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, FileText } from "lucide-react";
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

export default function CnptKhDenNgayTab() {
  const [tableData, setTableData] = useState<CnptKhDenNgayData>({
    data: [],
    tieuDe: "",
    currentDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

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
    const today = new Date();
    const dayStr = today.getDate().toString().padStart(2, "0");
    const monthStr = (today.getMonth() + 1).toString().padStart(2, "0");
    const newDate = `${dayStr}/${monthStr}/${today.getFullYear()}`;

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

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Update Button */}
      <div className="flex items-center gap-3">
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
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <FileText size={18} />
            <span className="font-semibold">
              {"Bảng kê công nợ khách hàng đến ngày"}
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
