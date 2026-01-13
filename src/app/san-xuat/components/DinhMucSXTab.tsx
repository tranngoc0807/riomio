"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface DinhMucSX {
  id: number;
  maSP: string;
  vaiChinh: string;
  vaiPhoi1: string;
  vaiPhoi2: string;
  vaiPhoi3: string;
  vaiPhoi4: string;
  vaiPhoi5: string;
  phuLieu1: string;
  phuLieu2: string;
  phuKien: string;
  khac: string;
}

const ITEMS_PER_PAGE = 50;

export default function DinhMucSXTab() {
  const [data, setData] = useState<DinhMucSX[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vaiChinh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vaiPhoi1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phuLieu1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phuKien.toLowerCase().includes(searchTerm.toLowerCase())
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
      const response = await fetch("/api/dinh-muc-sx");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu định mức sản xuất");
      }
    } catch (error) {
      console.error("Error fetching dinh muc sx:", error);
      toast.error("Lỗi khi tải dữ liệu định mức sản xuất");
    } finally {
      setIsLoading(false);
    }
  };

  // All columns - show all regardless of data
  const vaiPhoiColumns = [
    { key: "vaiPhoi1" as keyof DinhMucSX, label: "Vải phối 1" },
    { key: "vaiPhoi2" as keyof DinhMucSX, label: "Vải phối 2" },
    { key: "vaiPhoi3" as keyof DinhMucSX, label: "Vải phối 3" },
    { key: "vaiPhoi4" as keyof DinhMucSX, label: "Vải phối 4" },
    { key: "vaiPhoi5" as keyof DinhMucSX, label: "Vải phối 5" },
  ];

  const phuLieuColumns = [
    { key: "phuLieu1" as keyof DinhMucSX, label: "Phụ liệu 1" },
    { key: "phuLieu2" as keyof DinhMucSX, label: "Phụ liệu 2" },
  ];

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
          <Package size={20} className="text-blue-600" />
          Định mức sản xuất ({filteredList.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm mã SP, vải, phụ liệu..."
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
            <tr className="bg-blue-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-12 sticky left-0 bg-blue-50">STT</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[120px]">Mã SP</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[120px]">Vải chính</th>
              {vaiPhoiColumns.map((col) => (
                <th key={col.key} className="px-3 py-3 text-left font-medium text-gray-600 min-w-[100px]">
                  {col.label}
                </th>
              ))}
              {phuLieuColumns.map((col) => (
                <th key={col.key} className="px-3 py-3 text-left font-medium text-gray-600 min-w-[100px]">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[100px]">Phụ kiện</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[100px]">Khác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-600 sticky left-0 bg-white">{startIndex + index + 1}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{item.maSP || "-"}</td>
                <td className="px-3 py-2.5 text-gray-900">{item.vaiChinh || "-"}</td>
                {vaiPhoiColumns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-gray-600">
                    {item[col.key] || "-"}
                  </td>
                ))}
                {phuLieuColumns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-gray-600">
                    {item[col.key] || "-"}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-gray-600">{item.phuKien || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600">{item.khac || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredList.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu định mức sản xuất
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
