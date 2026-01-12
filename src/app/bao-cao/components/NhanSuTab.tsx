"use client";

import { useState, useEffect } from "react";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { SalaryReport, formatCurrency } from "./types";

const ITEMS_PER_PAGE = 50;

// Interface cho dữ liệu lương từ API
interface LuongItem {
  id: number;
  hoTen: string;
  chucVu: string;
  luongCoBan: number;
  ngayCong: number;
  luongThucTe: number;
  phuCapAnTrua: number;
  phuCapTrachNhiem: number;
  tongLuong: number;
  bhxh: number;
  bhyt: number;
  thucNhan: number;
}

interface NhanSuTabProps {
  onViewDetail: (report: SalaryReport, type: string) => void;
}

export default function NhanSuTab({ onViewDetail }: NhanSuTabProps) {
  const [luongData, setLuongData] = useState<LuongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLuongData();
  }, []);

  const fetchLuongData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/luong");
      const result = await response.json();

      if (result.success) {
        setLuongData(result.data);
      } else {
        setError(result.error || "Không thể tải dữ liệu lương");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại sau.");
      console.error("Error fetching luong:", err);
    } finally {
      setLoading(false);
    }
  };

  // Convert LuongItem to SalaryReport for detail modal
  const handleViewDetail = (item: LuongItem) => {
    const report: SalaryReport = {
      id: item.id,
      employeeName: item.hoTen,
      department: item.chucVu,
      baseSalary: item.luongCoBan,
      allowance: item.phuCapAnTrua + item.phuCapTrachNhiem,
      bonus: 0,
      deduction: item.bhxh + item.bhyt,
      netSalary: item.thucNhan,
      month: new Date().toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" }),
    };
    onViewDetail(report, "salary");
  };

  // Pagination
  const totalPages = Math.ceil(luongData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = luongData.slice(startIndex, endIndex);

  // Calculate totals
  const totalLuongCoBan = luongData.reduce((sum, item) => sum + item.luongCoBan, 0);
  const totalLuongThucTe = luongData.reduce((sum, item) => sum + item.luongThucTe, 0);
  const totalPhuCapAnTrua = luongData.reduce((sum, item) => sum + item.phuCapAnTrua, 0);
  const totalPhuCapTrachNhiem = luongData.reduce((sum, item) => sum + item.phuCapTrachNhiem, 0);
  const totalTongLuong = luongData.reduce((sum, item) => sum + item.tongLuong, 0);
  const totalBhxh = luongData.reduce((sum, item) => sum + item.bhxh, 0);
  const totalBhyt = luongData.reduce((sum, item) => sum + item.bhyt, 0);
  const totalThucNhan = luongData.reduce((sum, item) => sum + item.thucNhan, 0);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu lương...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchLuongData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Bảng lương nhân viên ({luongData.length} nhân viên)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                STT
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Họ và tên
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Chức vụ
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Lương CB
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ngày công
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Lương TT
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                PC Ăn trưa
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                PC T.Nhiệm
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tổng lương
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                BHXH
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                BHYT
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thực nhận
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 text-gray-600 text-sm">
                  {startIndex + index + 1}
                </td>
                <td className="px-3 py-3">
                  <span className="font-medium text-gray-900 text-sm">
                    {row.hoTen}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {row.chucVu}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-gray-900 text-sm">
                  {formatCurrency(row.luongCoBan)}
                </td>
                <td className="px-3 py-3 text-right text-gray-600 text-sm">
                  {row.ngayCong}
                </td>
                <td className="px-3 py-3 text-right text-gray-900 text-sm">
                  {formatCurrency(row.luongThucTe)}
                </td>
                <td className="px-3 py-3 text-right text-green-600 text-sm">
                  {formatCurrency(row.phuCapAnTrua)}
                </td>
                <td className="px-3 py-3 text-right text-green-600 text-sm">
                  {formatCurrency(row.phuCapTrachNhiem)}
                </td>
                <td className="px-3 py-3 text-right text-gray-900 font-medium text-sm">
                  {formatCurrency(row.tongLuong)}
                </td>
                <td className="px-3 py-3 text-right text-red-600 text-sm">
                  -{formatCurrency(row.bhxh)}
                </td>
                <td className="px-3 py-3 text-right text-red-600 text-sm">
                  -{formatCurrency(row.bhyt)}
                </td>
                <td className="px-3 py-3 text-right font-bold text-blue-600 text-sm">
                  {formatCurrency(row.thucNhan)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleViewDetail(row)}
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
              <td className="px-3 py-3 text-gray-900 text-sm" colSpan={3}>
                Tổng cộng
              </td>
              <td className="px-3 py-3 text-right text-gray-900 text-sm">
                {formatCurrency(totalLuongCoBan)}
              </td>
              <td className="px-3 py-3 text-right text-gray-600 text-sm">
                -
              </td>
              <td className="px-3 py-3 text-right text-gray-900 text-sm">
                {formatCurrency(totalLuongThucTe)}
              </td>
              <td className="px-3 py-3 text-right text-green-600 text-sm">
                {formatCurrency(totalPhuCapAnTrua)}
              </td>
              <td className="px-3 py-3 text-right text-green-600 text-sm">
                {formatCurrency(totalPhuCapTrachNhiem)}
              </td>
              <td className="px-3 py-3 text-right text-gray-900 text-sm">
                {formatCurrency(totalTongLuong)}
              </td>
              <td className="px-3 py-3 text-right text-red-600 text-sm">
                -{formatCurrency(totalBhxh)}
              </td>
              <td className="px-3 py-3 text-right text-red-600 text-sm">
                -{formatCurrency(totalBhyt)}
              </td>
              <td className="px-3 py-3 text-right text-blue-600 text-sm">
                {formatCurrency(totalThucNhan)}
              </td>
              <td className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {startIndex + 1} - {Math.min(endIndex, luongData.length)} / {luongData.length} nhân viên
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 ||
                         page === totalPages ||
                         Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsisBefore && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => goToPage(page)}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export empty data for backward compatibility
export const salaryData: SalaryReport[] = [];
