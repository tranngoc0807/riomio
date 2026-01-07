"use client";

import { useState, useEffect } from "react";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { InventoryReport, TonKhoItem } from "./types";

const ITEMS_PER_PAGE = 50;

interface TonKhoTabProps {
  onViewDetail: (report: InventoryReport, type: string) => void;
}

export default function TonKhoTab({ onViewDetail }: TonKhoTabProps) {
  const [tonKhoData, setTonKhoData] = useState<TonKhoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTonKhoData();
  }, []);

  const fetchTonKhoData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/ton-kho");
      const result = await response.json();

      if (result.success) {
        setTonKhoData(result.data);
      } else {
        setError(result.error || "Không thể tải dữ liệu tồn kho");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại sau.");
      console.error("Error fetching ton kho:", err);
    } finally {
      setLoading(false);
    }
  };

  // Convert TonKhoItem to InventoryReport for detail modal
  const handleViewDetail = (item: TonKhoItem) => {
    const report: InventoryReport = {
      id: item.id,
      productName: item.maSp,
      sku: item.maSp,
      category: "-",
      stockIn: item.nhap1 + item.nhap2,
      stockOut: item.xuat,
      currentStock: item.tonCuoi,
      value: 0,
    };
    onViewDetail(report, "inventory");
  };

  // Pagination
  const totalPages = Math.ceil(tonKhoData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = tonKhoData.slice(startIndex, endIndex);

  // Calculate totals (for all data, not just current page)
  const totalNhap1 = tonKhoData.reduce((sum, item) => sum + item.nhap1, 0);
  const totalNhap2 = tonKhoData.reduce((sum, item) => sum + item.nhap2, 0);
  const totalXuat = tonKhoData.reduce((sum, item) => sum + item.xuat, 0);
  const totalTonCuoi = tonKhoData.reduce((sum, item) => sum + item.tonCuoi, 0);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu tồn kho...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTonKhoData}
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
          Báo cáo tồn kho ({tonKhoData.length} sản phẩm)
        </h3>
        <button
          onClick={fetchTonKhoData}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Làm mới
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                STT
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mã SP
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Nhập (1)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Nhập (2)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Xuất
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tồn cuối
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-gray-600">{startIndex + index + 1}</td>
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-900">{row.maSp}</span>
                </td>
                <td className="px-4 py-4 text-right text-green-600">
                  {row.nhap1 > 0 ? `+${row.nhap1}` : row.nhap1}
                </td>
                <td className="px-4 py-4 text-right text-green-600">
                  {row.nhap2 > 0 ? `+${row.nhap2}` : row.nhap2}
                </td>
                <td className="px-4 py-4 text-right text-red-600">
                  {row.xuat > 0 ? `-${row.xuat}` : row.xuat}
                </td>
                <td
                  className={`px-4 py-4 text-right font-medium ${
                    row.tonCuoi < 0 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {row.tonCuoi}
                </td>
                <td className="px-4 py-4">
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
              <td className="px-4 py-3 text-gray-900" colSpan={2}>
                Tổng cộng
              </td>
              <td className="px-4 py-3 text-right text-green-600">
                +{totalNhap1}
              </td>
              <td className="px-4 py-3 text-right text-green-600">
                +{totalNhap2}
              </td>
              <td className="px-4 py-3 text-right text-red-600">
                -{totalXuat}
              </td>
              <td
                className={`px-4 py-3 text-right ${
                  totalTonCuoi < 0 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {totalTonCuoi}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {startIndex + 1} - {Math.min(endIndex, tonKhoData.length)} / {tonKhoData.length} sản phẩm
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
                  // Show first, last, current, and pages around current
                  return page === 1 ||
                         page === totalPages ||
                         Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  // Add ellipsis
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

// Export empty data for backward compatibility with stats calculation
export const inventoryData: InventoryReport[] = [];
