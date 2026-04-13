"use client";

import { Loader2, Search, Receipt, Calendar, Filter, RefreshCw, FileDown, FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { CNPTNCCNPLThang, CNPTNCCNPLNgay } from "@/lib/googleSheets";
import * as XLSX from "xlsx";

export default function CNPTNCCNPLTab() {
  const [cnptThang, setCnptThang] = useState<CNPTNCCNPLThang[]>([]);
  const [cnptNgay, setCnptNgay] = useState<CNPTNCCNPLNgay[]>([]);
  const [searchTermThang, setSearchTermThang] = useState("");
  const [searchTermNgay, setSearchTermNgay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<"thang" | "ngay">("thang");
  const [showOnlyWithDataThang, setShowOnlyWithDataThang] = useState(false);
  const [showOnlyWithDataNgay, setShowOnlyWithDataNgay] = useState(false);

  // Date filter states - will be loaded from sheet
  const [selectedThangNam, setSelectedThangNam] = useState("");
  const [selectedDenNgay, setSelectedDenNgay] = useState("");
  const [isUpdatingFilters, setIsUpdatingFilters] = useState(false);

  // Filtered data
  const filteredThang = cnptThang.filter((item) => {
    const matchesSearch = item.nccNPL.toLowerCase().includes(searchTermThang.toLowerCase());
    if (!matchesSearch) return false;
    if (showOnlyWithDataThang) {
      // Show only items that have at least one non-zero value
      return item.duDauKi !== 0 || item.phatSinh !== 0 || item.thanhToan !== 0 || item.duCuoiKi !== 0;
    }
    return true;
  });

  const filteredNgay = cnptNgay.filter((item) => {
    const matchesSearch = item.nccNPL.toLowerCase().includes(searchTermNgay.toLowerCase());
    if (!matchesSearch) return false;
    if (showOnlyWithDataNgay) {
      // Show only items that have non-zero soTien
      return item.soTien !== 0;
    }
    return true;
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cnpt-ncc-npl");
      const result = await response.json();
      if (result.success) {
        setCnptThang(result.data.cnptThang);
        setCnptNgay(result.data.cnptNgay);
        // Set date values from sheet
        if (result.dateCells) {
          setSelectedThangNam(result.dateCells.thangNam);
          setSelectedDenNgay(result.dateCells.denNgay);
        }
      } else {
        toast.error("Không thể tải danh sách CNPT NCC NPL");
      }
    } catch (error) {
      console.error("Error fetching CNPT NCC NPL:", error);
      toast.error("Lỗi khi tải danh sách CNPT NCC NPL");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date filter update - only send relevant date based on active table
  const handleUpdateFilters = async () => {
    try {
      setIsUpdatingFilters(true);

      // Only send the date that corresponds to the active table
      const body: { thangNam?: string; denNgay?: string } = {};
      if (activeTable === "thang") {
        body.thangNam = selectedThangNam;
      } else {
        body.denNgay = selectedDenNgay;
      }

      const response = await fetch("/api/cnpt-ncc-npl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result.success) {
        setCnptThang(result.data.cnptThang);
        setCnptNgay(result.data.cnptNgay);
        toast.success("Đã cập nhật bộ lọc thành công");
      } else {
        toast.error("Không thể cập nhật bộ lọc");
      }
    } catch (error) {
      console.error("Error updating filters:", error);
      toast.error("Lỗi khi cập nhật bộ lọc");
    } finally {
      setIsUpdatingFilters(false);
    }
  };

  // Calculate totals for cnptThang
  const totalDuDauKi = filteredThang.reduce((sum, item) => sum + item.duDauKi, 0);
  const totalPhatSinh = filteredThang.reduce((sum, item) => sum + item.phatSinh, 0);
  const totalThanhToan = filteredThang.reduce((sum, item) => sum + item.thanhToan, 0);
  const totalDuCuoiKi = filteredThang.reduce((sum, item) => sum + item.duCuoiKi, 0);

  // Calculate totals for cnptNgay
  const totalSoTien = filteredNgay.reduce((sum, item) => sum + item.soTien, 0);

  const handleExportThangPDF = () => {
    if (filteredThang.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = filteredThang.map((item, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.nccNPL}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${item.duDauKi ? fmt(item.duDauKi) : "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${item.phatSinh ? fmt(item.phatSinh) : "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${item.thanhToan ? fmt(item.thanhToan) : "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;font-weight:600;">${fmt(item.duCuoiKi)}</td>
    </tr>`).join("");
    const title = `CNPT NCC NPL theo tháng - ${selectedThangNam}`;
    printWindow.document.write(`<html><head><title>${title}</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:20px; text-align:center; } table { width:100%; border-collapse:collapse; font-size:12px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>${title.toUpperCase()}</h1>
      <table><thead><tr><th style="width:35px;">STT</th><th>NCC NPL</th><th style="text-align:right;">Dư đầu kì</th><th style="text-align:right;">Phát sinh</th><th style="text-align:right;">Thanh toán</th><th style="text-align:right;">Dư cuối kì</th></tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;"><td colspan="2" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng:</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalDuDauKi)}</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalPhatSinh)}</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalThanhToan)}</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalDuCuoiKi)}</td></tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleExportThangExcel = () => {
    if (filteredThang.length === 0) return;
    const sheetData = filteredThang.map((item, i) => ({
      "STT": i + 1, "NCC NPL": item.nccNPL, "Dư đầu kì": item.duDauKi,
      "Phát sinh": item.phatSinh, "Thanh toán": item.thanhToan, "Dư cuối kì": item.duCuoiKi,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CNPT NCC NPL");
    XLSX.writeFile(wb, `CNPT_NCC_NPL_${selectedThangNam || "all"}.xlsx`);
  };

  const handleExportNgayPDF = () => {
    if (filteredNgay.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = filteredNgay.map((item, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.nccNPL}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;font-weight:600;">${item.soTien ? fmt(item.soTien) : "-"}</td>
    </tr>`).join("");
    const title = `Số dư đầu kì CNPT NCC NPL đến ngày ${selectedDenNgay}`;
    printWindow.document.write(`<html><head><title>${title}</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:20px; text-align:center; } table { width:100%; border-collapse:collapse; font-size:12px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>${title.toUpperCase()}</h1>
      <table><thead><tr><th style="width:35px;">STT</th><th>NCC NPL</th><th style="text-align:right;">Số tiền</th></tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;"><td colspan="2" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng:</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalSoTien)}</td></tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleExportNgayExcel = () => {
    if (filteredNgay.length === 0) return;
    const sheetData = filteredNgay.map((item, i) => ({
      "STT": i + 1, "NCC NPL": item.nccNPL, "Số tiền": item.soTien,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "So du dau ki");
    XLSX.writeFile(wb, `So_du_dau_ki_CNPT_NCC_NPL_${selectedDenNgay || "all"}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTable("thang")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "thang"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Calendar size={18} />
          Công nợ theo tháng
        </button>
        <button
          onClick={() => setActiveTable("ngay")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "ngay"
              ? "bg-orange-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Receipt size={18} />
          Số dư đầu kì đến ngày
        </button>
      </div>

      {/* Table 1: Công nợ theo tháng */}
      {activeTable === "thang" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-700">
              Công nợ phải trả NCC NPL - Theo tháng ({filteredThang.length})
            </h3>
            <div className="flex items-center gap-3">
              {/* Month picker for Table 1 */}
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedThangNam}
                  onChange={(e) => setSelectedThangNam(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                <button
                  onClick={() => handleUpdateFilters()}
                  disabled={isUpdatingFilters}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isUpdatingFilters ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Cập nhật
                </button>
              </div>
              <button
                onClick={() => setShowOnlyWithDataThang(!showOnlyWithDataThang)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  showOnlyWithDataThang
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Filter size={16} />
                {showOnlyWithDataThang ? "Đang lọc có số liệu" : "Lọc có số liệu"}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm NCC NPL..."
                  value={searchTermThang}
                  onChange={(e) => setSearchTermThang(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-64"
                />
              </div>
              <button onClick={handleExportThangPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"><FileDown size={14} /> PDF</button>
              <button onClick={handleExportThangExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"><FileSpreadsheet size={14} /> Excel</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50">
                  <th className="px-2 py-3 text-left font-medium text-gray-500 w-12">STT</th>
                  <th className="px-2 py-3 text-left font-medium text-gray-500">NCC NPL</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Dư đầu kì</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Phát sinh</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Thanh toán</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Dư cuối kì</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredThang.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 text-gray-600">{item.stt}</td>
                    <td className="px-2 py-2.5 font-medium text-gray-900">{item.nccNPL}</td>
                    <td className={`px-2 py-2.5 text-right ${item.duDauKi < 0 ? "text-red-600" : "text-gray-600"}`}>
                      {item.duDauKi !== 0 ? item.duDauKi.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-blue-600">
                      {item.phatSinh !== 0 ? item.phatSinh.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-green-600">
                      {item.thanhToan !== 0 ? item.thanhToan.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className={`px-2 py-2.5 text-right font-medium ${item.duCuoiKi < 0 ? "text-green-600" : "text-red-600"}`}>
                      {item.duCuoiKi !== 0 ? item.duCuoiKi.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-2 py-3 text-right">Tổng cộng:</td>
                  <td className={`px-2 py-3 text-right ${totalDuDauKi < 0 ? "text-red-600" : "text-gray-600"}`}>
                    {totalDuDauKi !== 0 ? totalDuDauKi.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-2 py-3 text-right text-blue-600">
                    {totalPhatSinh !== 0 ? totalPhatSinh.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-2 py-3 text-right text-green-600">
                    {totalThanhToan !== 0 ? totalThanhToan.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className={`px-2 py-3 text-right ${totalDuCuoiKi < 0 ? "text-green-600" : "text-red-600"}`}>
                    {totalDuCuoiKi !== 0 ? `${totalDuCuoiKi.toLocaleString("vi-VN")}đ` : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {filteredThang.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu công nợ theo tháng
              </div>
            )}
          </div>
        </>
      )}

      {/* Table 2: Số dư đầu kì đến ngày */}
      {activeTable === "ngay" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-700">
              Bảng kê số dư đầu kì công nợ phải trả đến ngày ({filteredNgay.length})
            </h3>
            <div className="flex items-center gap-3">
              {/* Date picker for Table 2 */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDenNgay}
                  onChange={(e) => setSelectedDenNgay(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
                <button
                  onClick={() => handleUpdateFilters()}
                  disabled={isUpdatingFilters}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isUpdatingFilters ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Cập nhật
                </button>
              </div>
              <button
                onClick={() => setShowOnlyWithDataNgay(!showOnlyWithDataNgay)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  showOnlyWithDataNgay
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Filter size={16} />
                {showOnlyWithDataNgay ? "Đang lọc có số liệu" : "Lọc có số liệu"}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm NCC NPL..."
                  value={searchTermNgay}
                  onChange={(e) => setSearchTermNgay(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 w-64"
                />
              </div>
              <button onClick={handleExportNgayPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"><FileDown size={14} /> PDF</button>
              <button onClick={handleExportNgayExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"><FileSpreadsheet size={14} /> Excel</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50">
                  <th className="px-3 py-3 text-left font-medium text-gray-500 w-16">STT</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">NCC NPL</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-32">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNgay.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-600">{item.stt}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{item.nccNPL}</td>
                    <td className={`px-3 py-2.5 text-right font-medium ${item.soTien < 0 ? "text-red-600" : "text-orange-600"}`}>
                      {item.soTien !== 0 ? item.soTien.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-3 py-3 text-right">Tổng số tiền:</td>
                  <td className={`px-3 py-3 text-right ${totalSoTien < 0 ? "text-red-600" : "text-orange-600"}`}>
                    {totalSoTien !== 0 ? `${totalSoTien.toLocaleString("vi-VN")}đ` : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {filteredNgay.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu số dư đầu kì đến ngày
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
