"use client";

import { Eye, Loader2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";

interface DonGiaGiaCong {
  id: number;
  maSPNhapKho: string;
  maSP: string;
  mucLucSX: string;
  xuongSX: string;
  noiDungKhac: string;
  donGia: number;
  nguoiNhap: string;
  ghiChu: string;
}

const ITEMS_PER_PAGE = 50;

export default function DonGiaGiaCongTab() {
  const [data, setData] = useState<DonGiaGiaCong[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DonGiaGiaCong | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maSPNhapKho.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mucLucSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.xuongSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nguoiNhap.toLowerCase().includes(searchTerm.toLowerCase())
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
      const response = await fetch("/api/don-gia-gia-cong");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải danh sách đơn giá gia công");
      }
    } catch (error) {
      console.error("Error fetching don gia gia cong:", error);
      toast.error("Lỗi khi tải danh sách đơn giá gia công");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (item: DonGiaGiaCong) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Danh sách đơn giá gia công ({filteredList.length})
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
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã SP nhập kho</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã SP</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mục lục SX</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Xưởng SX</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Nội dung khác</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Đơn giá</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Người nhập</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-16">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedList.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{item.maSPNhapKho || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-900">{item.maSP || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[150px] truncate" title={item.mucLucSX}>
                    {item.mucLucSX || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[150px] truncate" title={item.xuongSX}>
                    {item.xuongSX || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[200px] truncate" title={item.noiDungKhac}>
                    {item.noiDungKhac || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-green-600">
                    {item.donGia > 0 ? item.donGia.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{item.nguoiNhap || "-"}</td>
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
          </table>

          {filteredList.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu đơn giá gia công
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
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết đơn giá gia công</h3>
                <p className="text-sm text-gray-500">{selectedItem.maSPNhapKho || selectedItem.maSP}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Mã SP nhập kho:</span>
                    <p className="font-medium text-blue-600">{selectedItem.maSPNhapKho || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Mã SP:</span>
                    <p className="font-medium">{selectedItem.maSP || "-"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Mục lục sản xuất:</span>
                      <p className="font-medium">{selectedItem.mucLucSX || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Xưởng sản xuất:</span>
                      <p className="font-medium">{selectedItem.xuongSX || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div>
                    <span className="text-sm text-gray-500">Nội dung khác:</span>
                    <p className="font-medium">{selectedItem.noiDungKhac || "-"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Đơn giá:</span>
                      <p className="font-medium text-lg text-green-600">
                        {selectedItem.donGia > 0
                          ? `${selectedItem.donGia.toLocaleString("vi-VN")}đ`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Người nhập:</span>
                      <p className="font-medium">{selectedItem.nguoiNhap || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div>
                    <span className="text-sm text-gray-500">Ghi chú:</span>
                    <p className="font-medium">{selectedItem.ghiChu || "-"}</p>
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
