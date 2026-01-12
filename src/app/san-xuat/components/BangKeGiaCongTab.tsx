"use client";

import { Eye, Loader2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";

interface BangKeGiaCong {
  id: number;
  maPGC: string;
  ngayThang: string;
  maSPSX: string;
  maSP: string;
  xuongSX: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  phanLoai: string;
  doiSoat: string;
  ghiChu: string;
}

const ITEMS_PER_PAGE = 50;

export default function BangKeGiaCongTab() {
  const [data, setData] = useState<BangKeGiaCong[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BangKeGiaCong | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maPGC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSPSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.xuongSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phanLoai.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      const response = await fetch("/api/bang-ke-gia-cong");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải danh sách bảng kê gia công");
      }
    } catch (error) {
      console.error("Error fetching bang ke gia cong:", error);
      toast.error("Lỗi khi tải danh sách bảng kê gia công");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (item: BangKeGiaCong) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  // Calculate totals
  const totalThanhTien = filteredList.reduce((sum, item) => sum + item.thanhTien, 0);
  const totalSoLuong = filteredList.reduce((sum, item) => sum + item.soLuong, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Bảng kê gia công ({filteredList.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Tổng số lượng</p>
          <p className="text-2xl font-bold text-blue-700">
            {totalSoLuong.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Tổng thành tiền</p>
          <p className="text-2xl font-bold text-green-700">
            {totalThanhTien.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left font-medium text-gray-500 w-10">STT</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã PGC</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Ngày</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã SP SX</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã SP</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Xưởng SX</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">SL</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Đơn giá</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Thành tiền</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Phân loại</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Đối soát</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-16">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedList.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{item.maPGC || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{item.ngayThang || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-900">{item.maSPSX || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-900">{item.maSP || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[150px] truncate" title={item.xuongSX}>
                    {item.xuongSX || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-900">
                    {item.soLuong > 0 ? item.soLuong.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-900">
                    {item.donGia > 0 ? item.donGia.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-green-600">
                    {item.thanhTien > 0 ? item.thanhTien.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{item.phanLoai || "-"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.doiSoat.includes("Chưa")
                        ? "bg-yellow-100 text-yellow-700"
                        : item.doiSoat
                        ? "bg-green-100 text-green-700"
                        : "text-gray-400"
                    }`}>
                      {item.doiSoat || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleView(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={6} className="px-3 py-3 text-right">Tổng cộng:</td>
                <td className="px-3 py-3 text-right text-gray-900">
                  {totalSoLuong.toLocaleString("vi-VN")}
                </td>
                <td className="px-3 py-3"></td>
                <td className="px-3 py-3 text-right text-green-600">
                  {totalThanhTien.toLocaleString("vi-VN")}đ
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>

          {filteredList.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu bảng kê gia công
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
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowViewModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết phiếu gia công</h3>
                <p className="text-sm text-gray-500">{selectedItem.maPGC}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Mã PGC:</span>
                    <p className="font-medium text-blue-600">{selectedItem.maPGC || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Ngày tháng:</span>
                    <p className="font-medium">{selectedItem.ngayThang || "-"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Mã SP SX:</span>
                      <p className="font-medium">{selectedItem.maSPSX || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Mã SP:</span>
                      <p className="font-medium">{selectedItem.maSP || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div>
                    <span className="text-sm text-gray-500">Xưởng sản xuất:</span>
                    <p className="font-medium">{selectedItem.xuongSX || "-"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Số lượng:</span>
                      <p className="font-medium">{selectedItem.soLuong.toLocaleString("vi-VN")}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Đơn giá:</span>
                      <p className="font-medium">
                        {selectedItem.donGia > 0
                          ? `${selectedItem.donGia.toLocaleString("vi-VN")}đ`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Thành tiền:</span>
                      <p className="font-medium text-lg text-green-600">
                        {selectedItem.thanhTien > 0
                          ? `${selectedItem.thanhTien.toLocaleString("vi-VN")}đ`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Phân loại:</span>
                      <p className="font-medium">{selectedItem.phanLoai || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Đối soát:</span>
                      <p className={`font-medium ${
                        selectedItem.doiSoat.includes("Chưa")
                          ? "text-yellow-600"
                          : selectedItem.doiSoat
                          ? "text-green-600"
                          : ""
                      }`}>
                        {selectedItem.doiSoat || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div>
                    <span className="text-sm text-gray-500">Ghi chú:</span>
                    <p className="font-medium whitespace-pre-wrap">{selectedItem.ghiChu || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
