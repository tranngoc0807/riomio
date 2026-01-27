"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { DebtReport, CongNoItem, formatCurrency } from "./types";

const ITEMS_PER_PAGE = 50;

// Badge for new data from sheet (based on duCuoiKy value)
const getDebtStatusBadgeByValue = (duCuoiKy: number) => {
  if (duCuoiKy === 0) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Đã thanh toán
      </span>
    );
  } else if (duCuoiKy < 0) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Dư thừa
      </span>
    );
  } else {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        Còn nợ
      </span>
    );
  }
};

// Badge for old data format (based on status string) - for backward compatibility
const getDebtStatusBadge = (status: string) => {
  switch (status) {
    case "normal":
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Bình thường
        </span>
      );
    case "warning":
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          Sắp đến hạn
        </span>
      );
    case "overdue":
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Quá hạn
        </span>
      );
    default:
      return null;
  }
};

const getDebtTypeBadge = (type: string) => {
  switch (type) {
    case "customer":
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Khách hàng
        </span>
      );
    case "supplier":
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          NCC NPL
        </span>
      );
    case "workshop":
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          Xưởng SX
        </span>
      );
    default:
      return null;
  }
};

interface CongNoTabProps {
  onViewDetail: (report: DebtReport, type: string) => void;
}

export default function CongNoTab({ onViewDetail }: CongNoTabProps) {
  const [congNoData, setCongNoData] = useState<CongNoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCongNoData();
  }, []);

  const fetchCongNoData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/cong-no");
      const result = await response.json();

      if (result.success) {
        setCongNoData(result.data);
      } else {
        setError(result.error || "Không thể tải dữ liệu công nợ");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại sau.");
      console.error("Error fetching cong no:", err);
    } finally {
      setLoading(false);
    }
  };

  // Convert CongNoItem to DebtReport for detail modal
  const handleViewDetail = (item: CongNoItem) => {
    const report: DebtReport = {
      id: item.id,
      name: item.khachHang,
      type: "customer",
      totalDebt: item.duDauKy + item.phatSinh,
      paid: item.thanhToan,
      remaining: item.duCuoiKy,
      dueDate: "-",
      status:
        item.duCuoiKy === 0
          ? "normal"
          : item.duCuoiKy < 0
          ? "normal"
          : "warning",
    };
    onViewDetail(report, "debt");
  };

  // Pagination
  const totalPages = Math.ceil(congNoData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = congNoData.slice(startIndex, endIndex);

  // Calculate totals (for all data)
  const totalDuDauKy = congNoData.reduce((sum, item) => sum + item.duDauKy, 0);
  const totalPhatSinh = congNoData.reduce(
    (sum, item) => sum + item.phatSinh,
    0
  );
  const totalThanhToan = congNoData.reduce(
    (sum, item) => sum + item.thanhToan,
    0
  );
  const totalDuCuoiKy = congNoData.reduce(
    (sum, item) => sum + item.duCuoiKy,
    0
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu công nợ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchCongNoData}
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
          Báo cáo công nợ phải thu khách hàng ({congNoData.length} khách hàng)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                STT
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dư đầu kì
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Phát sinh
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thanh toán
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dư cuối kì
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetail(row)}>
                <td className="px-4 py-4 text-gray-600">
                  {startIndex + index + 1}
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-900">
                    {row.khachHang}
                  </span>
                </td>
                <td
                  className={`px-4 py-4 text-right ${
                    row.duDauKy < 0 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatCurrency(row.duDauKy)}
                </td>
                <td className="px-4 py-4 text-right text-blue-600">
                  {formatCurrency(row.phatSinh)}
                </td>
                <td className="px-4 py-4 text-right text-green-600">
                  {formatCurrency(row.thanhToan)}
                </td>
                <td
                  className={`px-4 py-4 text-right font-medium ${
                    row.duCuoiKy < 0
                      ? "text-red-600"
                      : row.duCuoiKy > 0
                      ? "text-orange-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatCurrency(row.duCuoiKy)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="px-4 py-3 text-gray-900" colSpan={2}>
                Tổng cộng
              </td>
              <td
                className={`px-4 py-3 text-right ${
                  totalDuDauKy < 0 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {formatCurrency(totalDuDauKy)}
              </td>
              <td className="px-4 py-3 text-right text-blue-600">
                {formatCurrency(totalPhatSinh)}
              </td>
              <td className="px-4 py-3 text-right text-green-600">
                {formatCurrency(totalThanhToan)}
              </td>
              <td
                className={`px-4 py-3 text-right ${
                  totalDuCuoiKy < 0
                    ? "text-red-600"
                    : totalDuCuoiKy > 0
                    ? "text-orange-600"
                    : "text-gray-900"
                }`}
              >
                {formatCurrency(totalDuCuoiKy)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {startIndex + 1} - {Math.min(endIndex, congNoData.length)}{" "}
            / {congNoData.length} khách hàng
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
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
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
export const debtData: DebtReport[] = [];
export { getDebtStatusBadge, getDebtTypeBadge };
