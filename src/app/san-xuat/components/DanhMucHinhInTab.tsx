"use client";

import { Eye, Loader2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";

interface DanhMucHinhIn {
  id: number;
  maHinhIn: string;
  thongTinHinhIn: string;
  hinhAnh: string;
  donGiaChuaThue: number;
  thueSuat: string;
  donGiaCoThue: number;
  maSPSuDung: string;
  xuongIn: string;
}

const ITEMS_PER_PAGE = 50;

export default function DanhMucHinhInTab() {
  const [data, setData] = useState<DanhMucHinhIn[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DanhMucHinhIn | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maHinhIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.thongTinHinhIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSPSuDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.xuongIn.toLowerCase().includes(searchTerm.toLowerCase())
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
      const response = await fetch("/api/danh-muc-hinh-in");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải danh mục hình in");
      }
    } catch (error) {
      console.error("Error fetching danh muc hinh in:", error);
      toast.error("Lỗi khi tải danh mục hình in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (item: DanhMucHinhIn) => {
    setSelectedItem(item);
    setShowViewModal(true);
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
    <>
      <div className="space-y-4">
        {/* Header with search */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh mục hình in ({filteredList.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã HI, thông tin, xưởng in..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-72"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left font-medium text-gray-500 w-12">STT</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã hình in</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Thông tin hình in</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Đơn giá chưa thuế</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Thuế suất</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Đơn giá có thuế</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã SP sử dụng</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Xưởng in</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-16">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedList.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{item.maHinhIn || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-900 max-w-[200px] truncate" title={item.thongTinHinhIn}>
                    {item.thongTinHinhIn || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-600">
                    {item.donGiaChuaThue > 0 ? item.donGiaChuaThue.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-600">
                    {item.thueSuat || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-green-600">
                    {item.donGiaCoThue > 0 ? item.donGiaCoThue.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[120px] truncate" title={item.maSPSuDung}>
                    {item.maSPSuDung || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[150px] truncate" title={item.xuongIn}>
                    {item.xuongIn || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleView(item)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredList.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu danh mục hình in
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

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowViewModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Chi tiết hình in</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Mã hình in</label>
                  <p className="font-medium text-blue-600">{selectedItem.maHinhIn || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Xưởng in</label>
                  <p className="font-medium">{selectedItem.xuongIn || "-"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Thông tin hình in</label>
                <p className="font-medium">{selectedItem.thongTinHinhIn || "-"}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Đơn giá chưa thuế</label>
                  <p className="font-medium">{selectedItem.donGiaChuaThue > 0 ? `${selectedItem.donGiaChuaThue.toLocaleString("vi-VN")}đ` : "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Thuế suất</label>
                  <p className="font-medium">{selectedItem.thueSuat || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Đơn giá có thuế</label>
                  <p className="font-medium text-green-600">{selectedItem.donGiaCoThue > 0 ? `${selectedItem.donGiaCoThue.toLocaleString("vi-VN")}đ` : "-"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Mã SP sử dụng</label>
                <p className="font-medium">{selectedItem.maSPSuDung || "-"}</p>
              </div>
              {selectedItem.hinhAnh && (
                <div>
                  <label className="text-sm text-gray-500">Hình ảnh</label>
                  <p className="font-medium text-blue-600 break-all">{selectedItem.hinhAnh}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
