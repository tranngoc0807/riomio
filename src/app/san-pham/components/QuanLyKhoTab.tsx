"use client";

import { useState, useEffect } from "react";
import { Package, Loader2, AlertCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { TonKhoSP, TonDauSP } from "@/lib/googleSheets";
import DatePicker from "@/components/DatePicker";

export default function QuanLyKhoTab() {
  const [tonKhoList, setTonKhoList] = useState<TonKhoSP[]>([]);
  const [tonDauList, setTonDauList] = useState<TonDauSP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"ton-kho" | "ton-dau">("ton-kho");

  // Pagination
  const [currentPageBang1, setCurrentPageBang1] = useState(1);
  const [currentPageBang2, setCurrentPageBang2] = useState(1);
  const itemsPerPage = 100;

  // Date filters
  const currentDate = new Date();
  const [thangNam, setThangNam] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [denNgay, setDenNgay] = useState<string>(
    currentDate.toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchTonKho();
  }, []); // Load data once on mount

  const fetchTonKho = async (updateFilters: boolean = false, tabType?: "ton-kho" | "ton-dau") => {
    setIsLoading(true);
    setError(null);

    try {
      let response;

      if (updateFilters) {
        // POST request to update filters in Google Sheets
        // Only send the param for the active tab
        const body: any = {};
        if (tabType === "ton-kho") {
          body.thangNam = thangNam;
        } else if (tabType === "ton-dau") {
          body.denNgay = denNgay;
        }

        response = await fetch("/api/ton-kho-sp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      } else {
        // GET request to just fetch data
        response = await fetch("/api/ton-kho-sp");
      }

      const result = await response.json();

      console.log("Frontend - Result:", result);
      console.log("Frontend - tonKho count:", result.data?.tonKho?.length || 0);
      console.log("Frontend - tonDau count:", result.data?.tonDau?.length || 0);
      console.log("Frontend - tonDau first 5:", result.data?.tonDau?.slice(0, 5));

      if (result.success) {
        setTonKhoList(result.data.tonKho);
        setTonDauList(result.data.tonDau);
      } else {
        setError(result.error || "Không thể tải dữ liệu tồn kho");
      }
    } catch (err: any) {
      console.error("Error fetching ton kho:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination calculations for Bảng 1
  const totalPagesBang1 = Math.ceil(tonKhoList.length / itemsPerPage);
  const startIndexBang1 = (currentPageBang1 - 1) * itemsPerPage;
  const endIndexBang1 = startIndexBang1 + itemsPerPage;
  const currentItemsBang1 = tonKhoList.slice(startIndexBang1, endIndexBang1);

  // Pagination calculations for Bảng 2
  const totalPagesBang2 = Math.ceil(tonDauList.length / itemsPerPage);
  const startIndexBang2 = (currentPageBang2 - 1) * itemsPerPage;
  const endIndexBang2 = startIndexBang2 + itemsPerPage;
  const currentItemsBang2 = tonDauList.slice(startIndexBang2, endIndexBang2);

  const PaginationControls = ({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    // Generate page numbers to display
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 7; // Maximum number of page buttons to show

      if (totalPages <= maxVisible) {
        // Show all pages if total is small
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        if (currentPage <= 3) {
          // Near the beginning
          pages.push(2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          // Near the end
          pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          // In the middle
          pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }

      return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex items-center justify-center px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Trước
          </button>

          {/* Page numbers */}
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Sau
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-gray-600">Đang tải dữ liệu tồn kho...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
        <div>
          <h3 className="text-red-900 font-semibold mb-1">Lỗi</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => {
              setActiveTab("ton-kho");
              fetchTonKho(true, "ton-kho");
            }}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "ton-kho"
                ? "text-blue-600 border-blue-600 bg-blue-50/50"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Package size={18} />
            Tồn kho hàng hóa
          </button>
          <button
            onClick={() => {
              setActiveTab("ton-dau");
              fetchTonKho(true, "ton-dau");
            }}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "ton-dau"
                ? "text-green-600 border-green-600 bg-green-50/50"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Package size={18} />
            Tồn đầu đến ngày
          </button>
        </div>
      </div>

      <div>
        {/* Bảng 1: Tồn kho theo tháng */}
        {activeTab === "ton-kho" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                Tồn kho hàng hóa ({tonKhoList.length} sản phẩm)
              </h4>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={thangNam}
                  onChange={setThangNam}
                  type="month"
                  className="bg-white/20 text-white placeholder-white/70 border-none outline-none px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer min-w-45"
                />
                <button
                  onClick={() => fetchTonKho(true, "ton-kho")}
                  className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    STT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[150px]">
                    Mã SP
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Nhập
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Nhập
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Xuất
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Tồn cuối
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItemsBang1.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      Không có dữ liệu tồn kho
                    </td>
                  </tr>
                ) : (
                  currentItemsBang1.map((item, index) => {
                    const globalIndex = startIndexBang1 + index;
                    const tonCuoiColor =
                      item.tonCuoiKy < 0
                        ? "text-red-600 font-semibold"
                        : item.tonCuoiKy === 0
                        ? "text-gray-500"
                        : "text-gray-900";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-3 text-gray-600">{globalIndex + 1}</td>
                        <td className="px-3 py-3 font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-700">
                          {item.nhapDauKy.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-700">
                          {item.nhapTrongKy.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-700">
                          {item.xuatTrongKy.toLocaleString()}
                        </td>
                        <td className={`px-3 py-3 text-right ${tonCuoiColor}`}>
                          {item.tonCuoiKy.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={currentPageBang1}
            totalPages={totalPagesBang1}
            onPageChange={setCurrentPageBang1}
          />
        </div>
        )}

        {/* Bảng 2: Tồn đầu đến ngày */}
        {activeTab === "ton-dau" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                Tồn đầu đến ngày ({tonDauList.length} sản phẩm)
              </h4>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={denNgay}
                  onChange={setDenNgay}
                  type="date"
                  className="bg-white/20 text-white placeholder-white/70 border-none outline-none px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer min-w-45"
                />
                <button
                  onClick={() => fetchTonKho(true, "ton-dau")}
                  className="bg-white text-green-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    STT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[150px]">
                    Mã SP
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Tồn đầu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItemsBang2.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      Không có dữ liệu tồn đầu
                    </td>
                  </tr>
                ) : (
                  currentItemsBang2.map((item, index) => {
                    const globalIndex = startIndexBang2 + index;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-3 text-gray-600">{globalIndex + 1}</td>
                        <td className="px-3 py-3 font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-900">
                          {item.tonDau.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={currentPageBang2}
            totalPages={totalPagesBang2}
            onPageChange={setCurrentPageBang2}
          />
        </div>
        )}
      </div>
    </div>
  );
}
