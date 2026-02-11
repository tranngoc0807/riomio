"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Users,
  Package,
  Factory,
  Loader2,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";

type SubTabType = "lai-lo" | "cong-no-khach-hang" | "cong-no-ncc" | "cong-no-xuong";

const SUB_TABS = [
  { id: "lai-lo" as SubTabType, label: "Báo cáo lãi/lỗ", icon: FileText },
  { id: "cong-no-khach-hang" as SubTabType, label: "Công nợ khách hàng", icon: Users },
  { id: "cong-no-ncc" as SubTabType, label: "Công nợ phải trả NCC NPL", icon: Package },
  { id: "cong-no-xuong" as SubTabType, label: "Công nợ phải trả xưởng SX", icon: Factory },
];

interface BaoCaoLaiLoRow {
  stt: string;
  chiTieu: string;
  thangTruoc: number;
  thangNay: number;
  chenhLech: string;
  tyTrong: string;
}

interface BaoCaoLaiLoData {
  year: number;
  month: number;
  rows: BaoCaoLaiLoRow[];
}

interface BaoCaoCongNoKHRow {
  stt: number;
  khachHang: string;
  duDauKi: number;
  phatSinh: number;
  thanhToan: number;
  duCuoiKi: number;
}

interface BaoCaoCongNoKHData {
  year: number;
  month: number;
  rows: BaoCaoCongNoKHRow[];
}

interface BaoCaoCongNoNCCRow {
  stt: number;
  nccNPL: string;
  duDauKi: number;
  phatSinh: number;
  thanhToan: number;
  duCuoiKi: number;
}

interface BaoCaoCongNoNCCData {
  year: number;
  month: number;
  rows: BaoCaoCongNoNCCRow[];
}

interface BaoCaoCongNoXuongRow {
  stt: number;
  xuongSX: string;
  duDau: number;
  tienGiaCong: number;
  thanhToan: number;
  duCuoi: number;
}

interface BaoCaoCongNoXuongData {
  year: number;
  month: number;
  rows: BaoCaoCongNoXuongRow[];
}

export default function BaoCaoTaiChinhTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("lai-lo");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BaoCaoLaiLoData | null>(null);
  const [congNoData, setCongNoData] = useState<BaoCaoCongNoKHData | null>(null);
  const [congNoNCCData, setCongNoNCCData] = useState<BaoCaoCongNoNCCData | null>(null);
  const [congNoXuongData, setCongNoXuongData] = useState<BaoCaoCongNoXuongData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Lấy dữ liệu khi component mount hoặc khi tab thay đổi
  useEffect(() => {
    if (activeSubTab === "lai-lo") {
      fetchData();
    } else if (activeSubTab === "cong-no-khach-hang") {
      fetchCongNoData();
    } else if (activeSubTab === "cong-no-ncc") {
      fetchCongNoNCCData();
    } else if (activeSubTab === "cong-no-xuong") {
      fetchCongNoXuongData();
    }
  }, [activeSubTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/lai-lo");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setSelectedYear(result.data.year);
        setSelectedMonth(result.data.month);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchCongNoData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/cong-no-kh");
      const result = await response.json();

      if (result.success) {
        setCongNoData(result.data);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching cong no data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchCongNoNCCData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/cong-no-ncc");
      const result = await response.json();

      if (result.success) {
        setCongNoNCCData(result.data);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching cong no NCC data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchCongNoXuongData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/cong-no-xuong");
      const result = await response.json();

      if (result.success) {
        setCongNoXuongData(result.data);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching cong no xuong data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMonthYear = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/lai-lo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        toast.success("Đã cập nhật báo cáo");
      } else {
        toast.error(result.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let title = "";
    let tableHTML = "";

    if (activeSubTab === "lai-lo" && data) {
      title = `Báo cáo lãi/lỗ - Tháng ${data.month}/${data.year}`;
      const rows = data.rows.map((row) => {
        const isHeader = ["I", "II", "III", "IV"].includes(row.stt);
        return `<tr style="${isHeader ? "background:#e8f0fe;font-weight:600;" : ""}">
          <td style="padding:6px 10px;border:1px solid #ddd;">${row.stt}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;">${row.chiTieu}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${row.thangTruoc !== 0 ? formatCurrency(row.thangTruoc) : ""}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${row.thangNay !== 0 ? formatCurrency(row.thangNay) : ""}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.chenhLech}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.tyTrong}</td>
        </tr>`;
      }).join("");
      tableHTML = `<table><thead><tr>
        <th style="text-align:left;">STT</th><th style="text-align:left;">Chi tiêu</th>
        <th style="text-align:right;">Tháng trước</th><th style="text-align:right;">Tháng này</th>
        <th style="text-align:center;">Chênh lệch</th><th style="text-align:center;">Tỷ trọng</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
    } else if (activeSubTab === "cong-no-khach-hang" && congNoData) {
      title = `Báo cáo công nợ khách hàng - Tháng ${congNoData.month}/${congNoData.year}`;
      const rows = congNoData.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.stt}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;">${row.khachHang}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.duDauKi)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.phatSinh)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.thanhToan)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:600;${row.duCuoiKi > 0 ? "color:red;" : row.duCuoiKi < 0 ? "color:green;" : ""}">${formatCurrency(row.duCuoiKi)}</td>
      </tr>`).join("");
      tableHTML = `<table><thead><tr>
        <th style="text-align:center;width:50px;">STT</th><th style="text-align:left;">Khách hàng</th>
        <th style="text-align:right;">Dư đầu kì</th><th style="text-align:right;">Phát sinh</th>
        <th style="text-align:right;">Thanh toán</th><th style="text-align:right;">Dư cuối kì</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
    } else if (activeSubTab === "cong-no-ncc" && congNoNCCData) {
      title = `Báo cáo công nợ phải trả NCC NPL - Tháng ${congNoNCCData.month}/${congNoNCCData.year}`;
      const rows = congNoNCCData.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.stt}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;">${row.nccNPL}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.duDauKi)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.phatSinh)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.thanhToan)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:600;${row.duCuoiKi > 0 ? "color:red;" : row.duCuoiKi < 0 ? "color:green;" : ""}">${formatCurrency(row.duCuoiKi)}</td>
      </tr>`).join("");
      tableHTML = `<table><thead><tr>
        <th style="text-align:center;width:50px;">STT</th><th style="text-align:left;">NCC NPL</th>
        <th style="text-align:right;">Dư đầu kì</th><th style="text-align:right;">Phát sinh</th>
        <th style="text-align:right;">Thanh toán</th><th style="text-align:right;">Dư cuối kì</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
    } else if (activeSubTab === "cong-no-xuong" && congNoXuongData) {
      title = `Báo cáo công nợ phải trả xưởng SX - Tháng ${congNoXuongData.month}/${congNoXuongData.year}`;
      const rows = congNoXuongData.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.stt}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;">${row.xuongSX}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.duDau)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.tienGiaCong)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.thanhToan)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:600;${row.duCuoi > 0 ? "color:red;" : row.duCuoi < 0 ? "color:green;" : ""}">${formatCurrency(row.duCuoi)}</td>
      </tr>`).join("");
      tableHTML = `<table><thead><tr>
        <th style="text-align:center;width:50px;">STT</th><th style="text-align:left;">Xưởng SX</th>
        <th style="text-align:right;">Dư đầu</th><th style="text-align:right;">Tiền gia công</th>
        <th style="text-align:right;">Thanh toán</th><th style="text-align:right;">Dư cuối</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
    } else {
      return;
    }

    printWindow.document.write(`<html><head><title>${title}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial,sans-serif; padding:30px; color:#333; }
        h1 { font-size:20px; margin-bottom:20px; text-align:center; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { padding:8px 10px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; }
        @media print { body { padding:15px; } }
      </style></head><body>
      <h1>${title.toUpperCase()}</h1>
      ${tableHTML}
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div>
      {/* Sub-tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div>
        {activeSubTab === "lai-lo" && (
          <div className="space-y-4">
            {/* Chọn tháng và năm */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Năm:</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                    className="px-3 py-2 border border-gray-300 rounded-lg w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Tháng:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        Tháng {month}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleUpdateMonthYear}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Xem báo cáo
                </button>
                {data && (
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <FileDown size={16} />
                    Xuất PDF
                  </button>
                )}
              </div>
            </div>

            {/* Bảng báo cáo */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : data ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo lãi/lỗ - Tháng {data.month}/{data.year}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chi tiêu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tháng trước
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tháng này
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chênh lệch
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tỷ trọng
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.rows.map((row, index) => {
                        const isHeader = ["I", "II", "III", "IV"].includes(row.stt);
                        return (
                          <tr
                            key={index}
                            className={isHeader ? "bg-blue-50 font-semibold" : ""}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {row.stt}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {row.chiTieu}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {row.thangTruoc !== 0 ? formatCurrency(row.thangTruoc) : ""}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {row.thangNay !== 0 ? formatCurrency(row.thangNay) : ""}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                              {row.chenhLech}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                              {row.tyTrong}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "cong-no-khach-hang" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : congNoData ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo công nợ khách hàng - Tháng {congNoData.month}/{congNoData.year}
                  </h3>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                  >
                    <FileDown size={16} />
                    Xuất PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Khách hàng
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dư đầu kì
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phát sinh
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thanh toán
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dư cuối kì
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {congNoData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {row.stt}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.khachHang}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.duDauKi)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.phatSinh)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.thanhToan)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.duCuoiKi > 0 ? "text-red-600" : row.duCuoiKi < 0 ? "text-green-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.duCuoiKi)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "cong-no-ncc" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : congNoNCCData ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo công nợ phải trả NCC NPL - Tháng {congNoNCCData.month}/{congNoNCCData.year}
                  </h3>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                  >
                    <FileDown size={16} />
                    Xuất PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NCC NPL
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dư đầu kì
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phát sinh
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thanh toán
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dư cuối kì
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {congNoNCCData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {row.stt}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.nccNPL}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.duDauKi)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.phatSinh)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.thanhToan)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.duCuoiKi > 0 ? "text-red-600" : row.duCuoiKi < 0 ? "text-green-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.duCuoiKi)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "cong-no-xuong" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : congNoXuongData ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo công nợ phải trả xưởng SX - Tháng {congNoXuongData.month}/{congNoXuongData.year}
                  </h3>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                  >
                    <FileDown size={16} />
                    Xuất PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Xưởng SX
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dư đầu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiền gia công
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thanh toán
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dư cuối
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {congNoXuongData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {row.stt}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.xuongSX}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.duDau)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.tienGiaCong)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.thanhToan)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.duCuoi > 0 ? "text-red-600" : row.duCuoi < 0 ? "text-green-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.duCuoi)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
