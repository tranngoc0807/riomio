"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface XuatKhoHinhIn {
  id: number;
  ngayThang: string;
  maHinhIn: string;
  soLuong: number;
  maSPSuDung: string;
  maPhieuXuat: string;
  ghiChu: string;
}

const ITEMS_PER_PAGE = 50;

export default function XuatKhoHinhInTab() {
  const [data, setData] = useState<XuatKhoHinhIn[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maHinhIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSPSuDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maPhieuXuat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ngayThang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalSoLuong = filteredList.reduce((sum, item) => sum + item.soLuong, 0);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/xuat-kho-hinh-in");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu xuất kho hình in");
      }
    } catch (error) {
      console.error("Error fetching xuat kho hinh in:", error);
      toast.error("Lỗi khi tải dữ liệu xuất kho hình in");
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
        <h3 className="text-lg font-semibold text-gray-900">
          Xuất kho hình in ({filteredList.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm mã HI, mã SP, mã phiếu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-72"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-orange-600" />
            <p className="text-sm text-orange-600">Tổng số phiếu xuất</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{filteredList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-red-600" />
            <p className="text-sm text-red-600">Tổng số lượng xuất</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{totalSoLuong.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-medium text-gray-500 w-12">STT</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Ngày tháng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Mã hình in</th>
              <th className="px-3 py-3 text-right font-medium text-gray-500">Số lượng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Mã SP sử dụng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Mã phiếu xuất</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                <td className="px-3 py-2.5 text-gray-900">{item.ngayThang || "-"}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{item.maHinhIn || "-"}</td>
                <td className="px-3 py-2.5 text-right font-medium text-red-600">
                  {item.soLuong > 0 ? item.soLuong.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-gray-600">{item.maSPSuDung || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600">{item.maPhieuXuat || "-"}</td>
                <td className="px-3 py-2.5 text-gray-500 max-w-[150px] truncate" title={item.ghiChu}>
                  {item.ghiChu || "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={3} className="px-3 py-3 text-right">Tổng cộng:</td>
              <td className="px-3 py-3 text-right text-red-600">
                {totalSoLuong.toLocaleString("vi-VN")}
              </td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>

        {filteredList.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu xuất kho hình in
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
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
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
