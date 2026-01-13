"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface YeuCauXuatKhoNPL {
  id: number;
  ngayThang: string;
  maPhieuYC: string;
  maNPL: string;
  dvt: string;
  dinhMuc: number;
  slKHSX: number;
  tongNPLSX: number;
  maSPSuDung: string;
  mauSac: string;
  xuongSX: string;
}

const ITEMS_PER_PAGE = 50;

export default function BangKeYCXKTab() {
  const [data, setData] = useState<YeuCauXuatKhoNPL[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maPhieuYC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maNPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSPSuDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.xuongSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ngayThang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalSLKHSX = filteredList.reduce((sum, item) => sum + item.slKHSX, 0);
  const totalTongNPLSX = filteredList.reduce((sum, item) => sum + item.tongNPLSX, 0);

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
      const response = await fetch("/api/yeu-cau-xuat-kho-npl");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu yêu cầu xuất kho NPL");
      }
    } catch (error) {
      console.error("Error fetching yeu cau xuat kho npl:", error);
      toast.error("Lỗi khi tải dữ liệu yêu cầu xuất kho NPL");
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
          Bảng kê yêu cầu xuất kho NPL ({filteredList.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm mã phiếu, mã NPL, mã SP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-72"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-600" />
            <p className="text-sm text-blue-600">Tổng số dòng</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{filteredList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-green-600" />
            <p className="text-sm text-green-600">Tổng SL KH SX</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{totalSLKHSX.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-orange-600" />
            <p className="text-sm text-orange-600">Tổng NPL SX</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{totalTongNPLSX.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-purple-600" />
            <p className="text-sm text-purple-600">Số mã phiếu YC</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {new Set(filteredList.map((item) => item.maPhieuYC).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-12 sticky left-0 bg-green-50">STT</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Ngày tháng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Mã phiếu YC</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[250px]">Mã NPL</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">ĐVT</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Định mức</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">SL KH SX</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Tổng NPL SX</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Mã SP sử dụng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Màu sắc</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Xưởng SX</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-600 sticky left-0 bg-white">{startIndex + index + 1}</td>
                <td className="px-3 py-2.5 text-gray-900">{item.ngayThang || "-"}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{item.maPhieuYC || "-"}</td>
                <td className="px-3 py-2.5 text-gray-900 max-w-[300px]">
                  <div className="truncate" title={item.maNPL}>{item.maNPL || "-"}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{item.dvt || "-"}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {item.dinhMuc > 0 ? item.dinhMuc.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "-"}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-green-600">
                  {item.slKHSX > 0 ? item.slKHSX.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-orange-600">
                  {item.tongNPLSX > 0 ? item.tongNPLSX.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "-"}
                </td>
                <td className="px-3 py-2.5 text-gray-600">{item.maSPSuDung || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600">{item.mauSac || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[150px]">
                  <div className="truncate" title={item.xuongSX}>{item.xuongSX || "-"}</div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={6} className="px-3 py-3 text-right">Tổng cộng:</td>
              <td className="px-3 py-3 text-right text-green-600">
                {totalSLKHSX.toLocaleString("vi-VN")}
              </td>
              <td className="px-3 py-3 text-right text-orange-600">
                {totalTongNPLSX.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
              </td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>

        {filteredList.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu yêu cầu xuất kho NPL
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
