"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, RefreshCw, FileDown } from "lucide-react";
import Calendar from "@/components/ui/Calendar";

interface BCQuyTable1Row {
  stt: string;
  taiKhoan: string;
  duDau: number;
  thu: number;
  chi: number;
  duCuoi: number;
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

export default function BCQuyTheoNgayTab() {
  const [table1, setTable1] = useState<BCQuyTable1Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [date1, setDate1] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bc-quy-theo-ngay");
      const result = await response.json();
      if (result.success) {
        setTable1(result.data.table1);
        setDate1(convertToInputDate(result.data.date1));
      }
    } catch (err) {
      console.error("Error fetching BC Quy Theo Ngay:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = async (newDate: string) => {
    setDate1(newDate);
    setIsUpdating(true);
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
        setTable1(result.data.table1);
        setDate1(convertToInputDate(result.data.date1));
      }
    } catch (err) {
      console.error("Error updating date:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate totals
  const totals = table1.reduce(
    (acc, row) => ({
      duDau: acc.duDau + row.duDau,
      thu: acc.thu + row.thu,
      chi: acc.chi + row.chi,
      duCuoi: acc.duCuoi + row.duCuoi,
    }),
    { duDau: 0, thu: 0, chi: 0, duCuoi: 0 }
  );

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const dateLabel = date1 ? convertToSheetDate(date1) : "";

    const rows = table1.map((row) => `
      <tr>
        <td style="padding:6px 10px; border:1px solid #ddd; text-align:center;">${row.stt}</td>
        <td style="padding:6px 10px; border:1px solid #ddd;">${row.taiKhoan}</td>
        <td style="padding:6px 10px; border:1px solid #ddd; text-align:right;">${row.duDau !== 0 ? row.duDau.toLocaleString("vi-VN") : "-"}</td>
        <td style="padding:6px 10px; border:1px solid #ddd; text-align:right; color:green;">${row.thu !== 0 ? row.thu.toLocaleString("vi-VN") : "-"}</td>
        <td style="padding:6px 10px; border:1px solid #ddd; text-align:right; color:red;">${row.chi !== 0 ? row.chi.toLocaleString("vi-VN") : "-"}</td>
        <td style="padding:6px 10px; border:1px solid #ddd; text-align:right; font-weight:600; color:#2563eb;">${row.duCuoi !== 0 ? row.duCuoi.toLocaleString("vi-VN") : "-"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Báo cáo quỹ - ${dateLabel}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
            h1 { font-size: 20px; margin-bottom: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { padding: 8px 10px; border: 1px solid #ddd; background: #f5f5f5; font-weight: 600; }
            .total-row td { background: #f0f0f0; font-weight: 700; }
            @media print { body { padding: 15px; } }
          </style>
        </head>
        <body>
          <h1>BÁO CÁO QUỸ NGÀY ${dateLabel}</h1>
          <table>
            <thead>
              <tr>
                <th style="text-align:center; width:50px;">STT</th>
                <th style="text-align:left;">Tài khoản</th>
                <th style="text-align:right; width:120px;">Dư đầu</th>
                <th style="text-align:right; width:120px;">Thu</th>
                <th style="text-align:right; width:120px;">Chi</th>
                <th style="text-align:right; width:120px;">Dư cuối</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="2" style="padding:8px 10px; border:1px solid #ddd; text-align:right;">Tổng</td>
                <td style="padding:8px 10px; border:1px solid #ddd; text-align:right;">${totals.duDau.toLocaleString("vi-VN")}</td>
                <td style="padding:8px 10px; border:1px solid #ddd; text-align:right; color:green;">${totals.thu.toLocaleString("vi-VN")}</td>
                <td style="padding:8px 10px; border:1px solid #ddd; text-align:right; color:red;">${totals.chi.toLocaleString("vi-VN")}</td>
                <td style="padding:8px 10px; border:1px solid #ddd; text-align:right; color:#2563eb;">${totals.duCuoi.toLocaleString("vi-VN")}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Ngày:</label>
            <div className="w-36">
              <Calendar
                value={date1}
                onChange={handleDateChange}
                disabled={isUpdating}
              />
            </div>
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <FileDown size={16} />
            Xuất PDF
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Full-width table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 w-16">
                STT
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">
                Tài khoản
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 w-36">
                Dư đầu
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 w-36">
                Thu
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 w-36">
                Chi
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600 w-36">
                Dư cuối
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table1.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              table1.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm text-gray-600">{row.stt}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                    {row.taiKhoan}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right text-gray-600">
                    {row.duDau !== 0 ? row.duDau.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right text-green-600 font-medium">
                    {row.thu !== 0 ? row.thu.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right text-red-600 font-medium">
                    {row.chi !== 0 ? row.chi.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-semibold text-blue-600">
                    {row.duCuoi !== 0 ? row.duCuoi.toLocaleString("vi-VN") : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {table1.length !== 0 && (
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-sm font-semibold text-gray-700">
                  Tổng
                </td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold text-gray-700">
                  {totals.duDau.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold text-green-700">
                  {totals.thu.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold text-red-700">
                  {totals.chi.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-2.5 text-sm text-right font-bold text-blue-700">
                  {totals.duCuoi.toLocaleString("vi-VN")}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
