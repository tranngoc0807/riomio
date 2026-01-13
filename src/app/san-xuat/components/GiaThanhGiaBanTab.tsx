"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Calculator, Package, DollarSign, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface GiaThanhGiaBan {
  id: number;
  maSP: string;
  maSPNhapKho: string;
  cpNPL: number;
  cpGiaCong: number;
  cpKhac: number;
  cpHinhIn: number;
  tongChiPhi: number;
  slKeHoach: number;
  slCat: number;
  slNhapKho: number;
  giaThanh: number;
  giaSi: number;
  giaLe: number;
}

const ITEMS_PER_PAGE = 50;

export default function GiaThanhGiaBanTab() {
  const [data, setData] = useState<GiaThanhGiaBan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSPNhapKho.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalCPNPL = filteredList.reduce((sum, item) => sum + item.cpNPL, 0);
  const totalCPGiaCong = filteredList.reduce((sum, item) => sum + item.cpGiaCong, 0);
  const totalTongChiPhi = filteredList.reduce((sum, item) => sum + item.tongChiPhi, 0);

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
      const response = await fetch("/api/gia-thanh-gia-ban");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu giá thành giá bán");
      }
    } catch (error) {
      console.error("Error fetching gia thanh gia ban:", error);
      toast.error("Lỗi khi tải dữ liệu giá thành giá bán");
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
          <Calculator size={20} className="text-blue-600" />
          Bảng tính giá thành sản phẩm ({filteredList.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm mã SP, mã SP nhập kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-80"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-blue-600" />
            <p className="text-sm text-blue-600">Tổng số sản phẩm</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{filteredList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-purple-600" />
            <p className="text-sm text-purple-600">Tổng CP NPL</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{totalCPNPL.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-green-600" />
            <p className="text-sm text-green-600">Tổng CP gia công</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{totalCPGiaCong.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={16} className="text-orange-600" />
            <p className="text-sm text-orange-600">Tổng chi phí</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{totalTongChiPhi.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-12 sticky left-0 bg-blue-50">STT</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Mã SP</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Mã SP nhập kho</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">CP NPL</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">CP gia công</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">CP khác</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">CP hình in</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Tổng chi phí</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">SL kế hoạch</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">SL cắt</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">SL nhập kho</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Giá thành</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Giá sỉ</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Giá lẻ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-600 sticky left-0 bg-white">{startIndex + index + 1}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{item.maSP || "-"}</td>
                <td className="px-3 py-2.5 text-gray-900">{item.maSPNhapKho || "-"}</td>
                <td className="px-3 py-2.5 text-right text-purple-600 font-medium">
                  {item.cpNPL > 0 ? item.cpNPL.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-green-600 font-medium">
                  {item.cpGiaCong > 0 ? item.cpGiaCong.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {item.cpKhac > 0 ? item.cpKhac.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {item.cpHinhIn > 0 ? item.cpHinhIn.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-orange-600 font-bold">
                  {item.tongChiPhi > 0 ? item.tongChiPhi.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {item.slKeHoach > 0 ? item.slKeHoach.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {item.slCat > 0 ? item.slCat.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {item.slNhapKho > 0 ? item.slNhapKho.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-blue-700 font-bold">
                  {item.giaThanh > 0 ? item.giaThanh.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-green-700 font-medium">
                  {item.giaSi > 0 ? item.giaSi.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-red-600 font-medium">
                  {item.giaLe > 0 ? item.giaLe.toLocaleString("vi-VN") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={3} className="px-3 py-3 text-right">Tổng cộng:</td>
              <td className="px-3 py-3 text-right text-purple-600">
                {totalCPNPL.toLocaleString("vi-VN")}
              </td>
              <td className="px-3 py-3 text-right text-green-600">
                {totalCPGiaCong.toLocaleString("vi-VN")}
              </td>
              <td colSpan={2}></td>
              <td className="px-3 py-3 text-right text-orange-600">
                {totalTongChiPhi.toLocaleString("vi-VN")}
              </td>
              <td colSpan={6}></td>
            </tr>
          </tfoot>
        </table>

        {filteredList.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu giá thành giá bán
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
