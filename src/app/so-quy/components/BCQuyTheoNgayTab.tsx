"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import Calendar from "@/components/ui/Calendar";

interface BCQuyTable1Row {
  stt: string;
  taiKhoan: string;
  duDau: number;
  thu: number;
  chi: number;
  duCuoi: number;
}

interface BCQuyTable2Row {
  stt: string;
  taiKhoan: string;
  soTien: number;
}

interface BCQuyTheoNgayData {
  date1: string;
  date2: string;
  table1: BCQuyTable1Row[];
  table2: BCQuyTable2Row[];
}

// Helper function to convert dd/mm/yy or dd/mm/yyyy to yyyy-mm-dd
const convertToInputDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    let year = parts[2];
    // Handle 2-digit year (e.g., "26" -> "2026")
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

export default function BCQuyTheoNgayTab() {
  const [data, setData] = useState<BCQuyTheoNgayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating1, setIsUpdating1] = useState(false);
  const [isUpdating2, setIsUpdating2] = useState(false);
  const [date1, setDate1] = useState<string>("");
  const [date2, setDate2] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bc-quy-theo-ngay");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setDate1(convertToInputDate(result.data.date1));
        setDate2(convertToInputDate(result.data.date2));
      }
    } catch (err) {
      console.error("Error fetching BC Quy Theo Ngay:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDate1Change = async (newDate: string) => {
    setDate1(newDate);
    setIsUpdating1(true);
    try {
      const response = await fetch("/api/bc-quy-theo-ngay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: 1,
          date: convertToSheetDate(newDate),
        }),
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setDate1(convertToInputDate(result.data.date1));
        setDate2(convertToInputDate(result.data.date2));
      }
    } catch (err) {
      console.error("Error updating date1:", err);
    } finally {
      setIsUpdating1(false);
    }
  };

  const handleDate2Change = async (newDate: string) => {
    setDate2(newDate);
    setIsUpdating2(true);
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
        setData(result.data);
        setDate1(convertToInputDate(result.data.date1));
        setDate2(convertToInputDate(result.data.date2));
      }
    } catch (err) {
      console.error("Error updating date2:", err);
    } finally {
      setIsUpdating2(false);
    }
  };

  // Calculate totals for Table 1
  const table1Totals = data?.table1.reduce(
    (acc, row) => ({
      duDau: acc.duDau + row.duDau,
      thu: acc.thu + row.thu,
      chi: acc.chi + row.chi,
      duCuoi: acc.duCuoi + row.duCuoi,
    }),
    { duDau: 0, thu: 0, chi: 0, duCuoi: 0 }
  ) || { duDau: 0, thu: 0, chi: 0, duCuoi: 0 };

  // Calculate totals for Table 2
  const table2Total = data?.table2.reduce((acc, row) => acc + row.soTien, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon size={20} className="text-blue-600" />
          Báo cáo quỹ theo ngày
        </h3>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      {/* Two Tables Side by Side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Table 1: Báo cáo quỹ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">Báo cáo quỹ</h4>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ngày:</label>
              <div className="w-36">
                <Calendar
                  value={date1}
                  onChange={handleDate1Change}
                  disabled={isUpdating1}
                />
              </div>
              {isUpdating1 && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                    Tài khoản
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                    Dư đầu
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                    Thu
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                    Chi
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                    Dư cuối
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.table1.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500 text-sm">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data?.table1.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-600">{row.stt}</td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {row.taiKhoan}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-600">
                        {row.duDau !== 0 ? row.duDau.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-green-600 font-medium">
                        {row.thu !== 0 ? row.thu.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-red-600 font-medium">
                        {row.chi !== 0 ? row.chi.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-right font-semibold text-blue-600">
                        {row.duCuoi !== 0 ? row.duCuoi.toLocaleString("vi-VN") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data?.table1.length !== 0 && (
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-sm font-semibold text-gray-700">
                      Tổng
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-semibold text-gray-700">
                      {table1Totals.duDau.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-semibold text-green-700">
                      {table1Totals.thu.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-semibold text-red-700">
                      {table1Totals.chi.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-bold text-blue-700">
                      {table1Totals.duCuoi.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Table 2: Bảng kê số dư quỹ đầu */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">Bảng kê số dư quỹ đầu</h4>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ngày:</label>
              <div className="w-36">
                <Calendar
                  value={date2}
                  onChange={handleDate2Change}
                  disabled={isUpdating2}
                  position="right"
                />
              </div>
              {isUpdating2 && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                    Tài khoản
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                    Số tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.table2.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500 text-sm">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data?.table2.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-600">{row.stt}</td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {row.taiKhoan}
                      </td>
                      <td className="px-3 py-2 text-sm text-right font-semibold text-purple-600">
                        {row.soTien !== 0 ? row.soTien.toLocaleString("vi-VN") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data?.table2.length !== 0 && (
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-sm font-semibold text-gray-700">
                      Tổng
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-bold text-purple-700">
                      {table2Total.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
