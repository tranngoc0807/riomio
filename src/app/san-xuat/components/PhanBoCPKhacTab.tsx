"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, PieChart } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface PhanBoCPKhac {
  id: number;
  ngayThang: string;
  nguoiNhap: string;
  maPhieu: string;
  noiDung: string;
  maSP: string;
  soTien: number;
  loaiChiPhi: string;
}

const ITEMS_PER_PAGE = 50;

export default function PhanBoCPKhacTab() {
  const [data, setData] = useState<PhanBoCPKhac[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterLoaiCP, setFilterLoaiCP] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLoaiCP]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/phan-bo-cp-khac");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu phân bổ chi phí khác");
      }
    } catch (error) {
      console.error("Error fetching phan bo cp khac:", error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique loại chi phí for filter
  const loaiChiPhiOptions = Array.from(new Set(data.map((item) => item.loaiChiPhi).filter(Boolean)));

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.ngayThang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nguoiNhap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maPhieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.noiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterLoaiCP === "all" || item.loaiChiPhi === filterLoaiCP;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalSoTien = filtered.reduce((sum, item) => sum + item.soTien, 0);

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PieChart size={20} className="text-blue-600" />
          Phân bổ chi phí khác ({filtered.length})
        </h3>
        <div className="flex items-center gap-3">
          {/* Filter by Loại chi phí */}
          <select
            value={filterLoaiCP}
            onChange={(e) => setFilterLoaiCP(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả loại chi phí</option>
            {loaiChiPhiOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm ngày, người nhập, mã phiếu, nội dung, mã SP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-80"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 inline-block">
        <p className="text-sm text-blue-600">Tổng số tiền phân bổ</p>
        <p className="text-2xl font-bold text-blue-700">{totalSoTien.toLocaleString("vi-VN")}</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left font-medium text-gray-600 w-12">STT</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Ngày tháng</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Người nhập</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Mã phiếu</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[200px]">Nội dung</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Mã SP</th>
                <th className="px-3 py-3 text-right font-medium text-gray-600">Số tiền</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Loại chi phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                  <td className="px-3 py-2.5 text-gray-900">{item.ngayThang || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{item.nguoiNhap || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">{item.maPhieu || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[250px]">
                    <div className="truncate" title={item.noiDung}>{item.noiDung || "-"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-900 font-medium">{item.maSP || "-"}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-blue-600">
                    {item.soTien > 0 ? item.soTien.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.loaiChiPhi ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {item.loaiChiPhi}
                      </span>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={6} className="px-3 py-3 text-right">Tổng:</td>
                <td className="px-3 py-3 text-right text-blue-600">{totalSoTien.toLocaleString("vi-VN")}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu phân bổ chi phí khác
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
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
