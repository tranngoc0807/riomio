"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Calculator, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface DieuChinhGiaVon {
  id: number;
  maSP: string;
  dieuChinhGiaVon: number;
}

const ITEMS_PER_PAGE = 50;

export default function DieuChinhGiaVonTab() {
  const [data, setData] = useState<DieuChinhGiaVon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyWithData, setShowOnlyWithData] = useState(false);

  // Filtered data
  const filteredList = data.filter((item) => {
    const matchesSearch = item.maSP.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (showOnlyWithData) {
      return item.dieuChinhGiaVon !== 0;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalDieuChinh = filteredList.reduce((sum, item) => sum + item.dieuChinhGiaVon, 0);
  const itemsWithData = filteredList.filter((item) => item.dieuChinhGiaVon !== 0).length;

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showOnlyWithData]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/dieu-chinh-gia-von");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu điều chỉnh giá vốn");
      }
    } catch (error) {
      console.error("Error fetching dieu chinh gia von:", error);
      toast.error("Lỗi khi tải dữ liệu điều chỉnh giá vốn");
    } finally {
      setIsLoading(false);
    }
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
      {/* Header with search */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calculator size={20} className="text-green-600" />
          Điều chỉnh giá vốn ({filteredList.length})
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOnlyWithData(!showOnlyWithData)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              showOnlyWithData
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Filter size={16} />
            {showOnlyWithData ? "Đang lọc có số liệu" : "Lọc có số liệu"}
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã SP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Tổng số sản phẩm</p>
          <p className="text-2xl font-bold text-blue-700">{filteredList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">SP có điều chỉnh</p>
          <p className="text-2xl font-bold text-green-700">{itemsWithData}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <p className="text-sm text-orange-600 mb-1">Tổng điều chỉnh</p>
          <p className="text-2xl font-bold text-orange-700">{totalDieuChinh.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">STT</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Mã SP</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-40">Điều chỉnh giá vốn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                <td className="px-4 py-2.5 font-medium text-blue-600">{item.maSP || "-"}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${
                  item.dieuChinhGiaVon > 0 ? "text-green-600" : item.dieuChinhGiaVon < 0 ? "text-red-600" : "text-gray-400"
                }`}>
                  {item.dieuChinhGiaVon !== 0 ? item.dieuChinhGiaVon.toLocaleString("vi-VN") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={2} className="px-4 py-3 text-right">Tổng cộng:</td>
              <td className={`px-4 py-3 text-right ${
                totalDieuChinh > 0 ? "text-green-600" : totalDieuChinh < 0 ? "text-red-600" : "text-gray-600"
              }`}>
                {totalDieuChinh.toLocaleString("vi-VN")}
              </td>
            </tr>
          </tfoot>
        </table>

        {filteredList.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu điều chỉnh giá vốn
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredList.length)} / {filteredList.length} mục
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <span key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-9 h-9 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? "bg-green-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
