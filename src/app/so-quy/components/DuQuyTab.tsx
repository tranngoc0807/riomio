"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import Calendar from "@/components/ui/Calendar";

interface DuQuyRow {
  stt: string;
  taiKhoan: string;
  soTien: number;
}

// Helper function to convert dd/mm/yy or dd/mm/yyyy to yyyy-mm-dd
const convertToInputDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    let year = parts[2];
    if (year.length === 2) {
      year = "20" + year;
    }
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return dateStr;
};

// Helper function to convert yyyy-mm-dd to dd/mm/yyyy
const convertToSheetDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export default function DuQuyTab() {
  const [rows, setRows] = useState<DuQuyRow[]>([]);
  const [date, setDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bc-quy-theo-ngay");
      const result = await response.json();
      if (result.success) {
        setRows(result.data.table2);
        setDate(convertToInputDate(result.data.date2));
      }
    } catch (err) {
      console.error("Error fetching Dư quỹ:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = async (newDate: string) => {
    setDate(newDate);
    setIsUpdating(true);
    try {
      const response = await fetch("/api/bc-quy-theo-ngay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: 2,
          date: convertToSheetDate(newDate),
        }),
      });
      const result = await response.json();
      if (result.success) {
        setRows(result.data.table2);
        setDate(convertToInputDate(result.data.date2));
      }
    } catch (err) {
      console.error("Error updating date:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const total = rows.reduce((acc, row) => acc + row.soTien, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Wallet size={20} className="text-purple-600" />
          Dư quỹ
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Ngày:</label>
            <div className="w-36">
              <Calendar
                value={date}
                onChange={handleDateChange}
                disabled={isUpdating}
                position="right"
              />
            </div>
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-purple-50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 w-16">
                STT
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">
                Tài khoản
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 w-44">
                Số tiền
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600">{row.stt}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    {row.taiKhoan}
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-semibold text-purple-600">
                    {row.soTien !== 0 ? row.soTien.toLocaleString("vi-VN") : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length !== 0 && (
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-sm font-semibold text-gray-700">
                  Tổng
                </td>
                <td className="px-4 py-2.5 text-sm text-right font-bold text-purple-700">
                  {total.toLocaleString("vi-VN")}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
