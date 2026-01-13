"use client";

import { Loader2, Search, Archive, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface TonKhoHinhInThang {
  id: number;
  maHI: string;
  duDauKi: number;
  nhapKho: number;
  xuatKho: number;
  duCuoiKi: number;
}

interface TonKhoHinhInNgay {
  id: number;
  maHI: string;
  soLuong: number;
}

const ITEMS_PER_PAGE = 50;

export default function TonKhoHinhInTab() {
  const [tonKhoThang, setTonKhoThang] = useState<TonKhoHinhInThang[]>([]);
  const [tonKhoNgay, setTonKhoNgay] = useState<TonKhoHinhInNgay[]>([]);
  const [searchTermThang, setSearchTermThang] = useState("");
  const [searchTermNgay, setSearchTermNgay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<"thang" | "ngay">("thang");
  const [currentPageThang, setCurrentPageThang] = useState(1);
  const [currentPageNgay, setCurrentPageNgay] = useState(1);

  // Filtered data
  const filteredThang = tonKhoThang.filter((item) =>
    item.maHI.toLowerCase().includes(searchTermThang.toLowerCase())
  );

  const filteredNgay = tonKhoNgay.filter((item) =>
    item.maHI.toLowerCase().includes(searchTermNgay.toLowerCase())
  );

  // Pagination for Thang
  const totalPagesThang = Math.ceil(filteredThang.length / ITEMS_PER_PAGE);
  const startIndexThang = (currentPageThang - 1) * ITEMS_PER_PAGE;
  const paginatedThang = filteredThang.slice(startIndexThang, startIndexThang + ITEMS_PER_PAGE);

  // Pagination for Ngay
  const totalPagesNgay = Math.ceil(filteredNgay.length / ITEMS_PER_PAGE);
  const startIndexNgay = (currentPageNgay - 1) * ITEMS_PER_PAGE;
  const paginatedNgay = filteredNgay.slice(startIndexNgay, startIndexNgay + ITEMS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPageThang(1);
  }, [searchTermThang]);

  useEffect(() => {
    setCurrentPageNgay(1);
  }, [searchTermNgay]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/ton-kho-hinh-in");
      const result = await response.json();
      if (result.success) {
        setTonKhoThang(result.thangData);
        setTonKhoNgay(result.ngayData);
      } else {
        toast.error("Không thể tải dữ liệu tồn kho hình in");
      }
    } catch (error) {
      console.error("Error fetching ton kho hinh in:", error);
      toast.error("Lỗi khi tải dữ liệu tồn kho hình in");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for tonKhoThang
  const totalDuDauKi = filteredThang.reduce((sum, item) => sum + item.duDauKi, 0);
  const totalNhapKho = filteredThang.reduce((sum, item) => sum + item.nhapKho, 0);
  const totalXuatKho = filteredThang.reduce((sum, item) => sum + item.xuatKho, 0);
  const totalDuCuoiKi = filteredThang.reduce((sum, item) => sum + item.duCuoiKi, 0);

  // Calculate totals for tonKhoNgay
  const totalSoLuong = filteredNgay.reduce((sum, item) => sum + item.soLuong, 0);

  // Pagination component
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    setCurrentPage: (page: number) => void,
    startIndex: number,
    filteredLength: number
  ) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredLength)} / {filteredLength} mục
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
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
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Calendar size={18} />
          Tồn kho theo tháng
        </button>
        <button
          onClick={() => setActiveTable("ngay")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "ngay"
              ? "bg-orange-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Archive size={18} />
          Số dư đầu kì đến ngày
        </button>
      </div>

      {/* Table 1: Tồn kho theo tháng */}
      {activeTable === "thang" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-700">
              Bảng tồn kho hình in ({filteredThang.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm mã HI..."
                value={searchTermThang}
                onChange={(e) => setSearchTermThang(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50">
                  <th className="px-3 py-3 text-left font-medium text-gray-500 w-12">STT</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Mã HI</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-28">Dư đầu kì</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-28">Nhập kho</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-28">Xuất kho</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-28">Dư cuối kì</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedThang.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-600">{startIndexThang + index + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-blue-600">{item.maHI}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">
                      {item.duDauKi !== 0 ? item.duDauKi.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-green-600">
                      {item.nhapKho !== 0 ? item.nhapKho.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-red-600">
                      {item.xuatKho !== 0 ? item.xuatKho.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-medium ${item.duCuoiKi > 0 ? "text-blue-600" : "text-gray-400"}`}>
                      {item.duCuoiKi !== 0 ? item.duCuoiKi.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-3 py-3 text-right">Tổng cộng:</td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {totalDuDauKi !== 0 ? totalDuDauKi.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-3 text-right text-green-600">
                    {totalNhapKho !== 0 ? totalNhapKho.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-3 text-right text-red-600">
                    {totalXuatKho !== 0 ? totalXuatKho.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-3 text-right text-blue-600">
                    {totalDuCuoiKi !== 0 ? totalDuCuoiKi.toLocaleString("vi-VN") : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {filteredThang.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu tồn kho theo tháng
              </div>
            )}

            {renderPagination(currentPageThang, totalPagesThang, setCurrentPageThang, startIndexThang, filteredThang.length)}
          </div>
        </>
      )}

      {/* Table 2: Số dư đầu kì đến ngày */}
      {activeTable === "ngay" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-700">
              Bảng kê số dư đầu kì hình in đến ngày ({filteredNgay.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm mã HI..."
                value={searchTermNgay}
                onChange={(e) => setSearchTermNgay(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50">
                  <th className="px-3 py-3 text-left font-medium text-gray-500 w-16">STT</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Mã HI</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-32">Số lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedNgay.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-600">{startIndexNgay + index + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-blue-600">{item.maHI}</td>
                    <td className={`px-3 py-2.5 text-right font-medium ${item.soLuong > 0 ? "text-orange-600" : "text-gray-400"}`}>
                      {item.soLuong !== 0 ? item.soLuong.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-3 py-3 text-right">Tổng số lượng:</td>
                  <td className="px-3 py-3 text-right text-orange-600">
                    {totalSoLuong !== 0 ? totalSoLuong.toLocaleString("vi-VN") : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {filteredNgay.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu số dư đầu kì đến ngày
              </div>
            )}

            {renderPagination(currentPageNgay, totalPagesNgay, setCurrentPageNgay, startIndexNgay, filteredNgay.length)}
          </div>
        </>
      )}
    </div>
  );
}
