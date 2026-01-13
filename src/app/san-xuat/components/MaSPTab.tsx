"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface MaSP {
  id: number;
  maSP: string;
  tenSP: string;
  size: string;
  vaiChinh: string;
  vaiPhoi: string;
  phuLieuKhac: string;
  tinhTrangSX: string;
  lenhSX: string;
  xuongSX: string;
  hinhAnh: string;
}

const ITEMS_PER_PAGE = 50;

export default function MaSPTab() {
  const [data, setData] = useState<MaSP[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTinhTrang, setFilterTinhTrang] = useState<string>("all");
  const [filterXuong, setFilterXuong] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTinhTrang, filterXuong]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/ma-sp");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu mã sản phẩm");
      }
    } catch (error) {
      console.error("Error fetching ma sp:", error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique options for filters
  const tinhTrangOptions = Array.from(new Set(data.map((item) => item.tinhTrangSX).filter(Boolean)));
  const xuongOptions = Array.from(new Set(data.map((item) => item.xuongSX).filter(Boolean)));

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lenhSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTinhTrang = filterTinhTrang === "all" || item.tinhTrangSX === filterTinhTrang;
    const matchesXuong = filterXuong === "all" || item.xuongSX === filterXuong;

    return matchesSearch && matchesTinhTrang && matchesXuong;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Count by status
  const statusCounts = data.reduce((acc, item) => {
    const status = item.tinhTrangSX || "Chưa xác định";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          <Package size={20} className="text-blue-600" />
          Mã sản phẩm ({filtered.length})
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter by Tình trạng SX */}
          <select
            value={filterTinhTrang}
            onChange={(e) => setFilterTinhTrang(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả tình trạng</option>
            {tinhTrangOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {/* Filter by Xưởng */}
          <select
            value={filterXuong}
            onChange={(e) => setFilterXuong(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả xưởng</option>
            {xuongOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã SP, tên SP, lệnh SX, size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-72"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(statusCounts).slice(0, 4).map(([status, count]) => (
          <div
            key={status}
            className={`rounded-xl p-3 border cursor-pointer transition-colors ${
              filterTinhTrang === status
                ? "bg-blue-100 border-blue-300"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
            onClick={() => setFilterTinhTrang(filterTinhTrang === status ? "all" : status)}
          >
            <p className="text-xs text-gray-600 truncate">{status}</p>
            <p className="text-xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left font-medium text-gray-600 w-12">STT</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Mã SP</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[200px]">Tên SP</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Size</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Vải chính</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Vải phối</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Phụ liệu khác</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Tình trạng SX</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Lệnh SX</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Xưởng SX</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600 w-16">Ảnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                  <td className="px-3 py-2.5 text-gray-900 font-medium">{item.maSP || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[250px]">
                    <div className="truncate" title={item.tenSP}>{item.tenSP || "-"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{item.size || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{item.vaiChinh || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{item.vaiPhoi || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{item.phuLieuKhac || "-"}</td>
                  <td className="px-3 py-2.5">
                    {item.tinhTrangSX ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.tinhTrangSX.includes("Đang") ? "bg-yellow-100 text-yellow-700" :
                        item.tinhTrangSX.includes("Nhập kho") ? "bg-green-100 text-green-700" :
                        item.tinhTrangSX.includes("Lệnh") ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {item.tinhTrangSX}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">{item.lenhSX || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[150px]">
                    <div className="truncate" title={item.xuongSX}>{item.xuongSX || "-"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {item.hinhAnh && item.hinhAnh !== "#N/A" ? (
                      <a
                        href={item.hinhAnh}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Xem hình ảnh"
                      >
                        <ImageIcon size={16} />
                      </a>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu mã sản phẩm
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
