"use client";

import { Loader2, Search, Archive, Calendar, ChevronLeft, ChevronRight, Edit2, Check, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

// Get current month and year
const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear(),
  };
};

// Get today's date in YYYY-MM-DD format for input
const getTodayInputDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Convert YYYY-MM-DD to DD/MM/YY for sheet
const convertToSheetDate = (inputDate: string): string => {
  if (!inputDate) return "";
  const parts = inputDate.split("-");
  if (parts.length === 3) {
    const year = parts[0].slice(-2); // Get last 2 digits of year
    return `${parts[2]}/${parts[1]}/${year}`;
  }
  return inputDate;
};

export default function TonKhoHinhInTab() {
  const [tonKhoThang, setTonKhoThang] = useState<TonKhoHinhInThang[]>([]);
  const [tonKhoNgay, setTonKhoNgay] = useState<TonKhoHinhInNgay[]>([]);
  const [searchTermThang, setSearchTermThang] = useState("");
  const [searchTermNgay, setSearchTermNgay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNgay, setIsLoadingNgay] = useState(false);
  const [activeTable, setActiveTable] = useState<"thang" | "ngay">("thang");
  const [currentPageThang, setCurrentPageThang] = useState(1);
  const [currentPageNgay, setCurrentPageNgay] = useState(1);

  // Month/Year picker state for "Thang" tab
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Date picker state for "Ngay" tab
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate());

  // Edit state
  const [editingThangId, setEditingThangId] = useState<number | null>(null);
  const [editingNgayId, setEditingNgayId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch thang data when month/year changes
  useEffect(() => {
    fetchThangData();
  }, [selectedMonth, selectedYear]);

  // Fetch ngay data when date changes
  useEffect(() => {
    fetchNgayData();
  }, [selectedDate]);

  // Focus input when editing starts
  useEffect(() => {
    if ((editingThangId !== null || editingNgayId !== null) && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingThangId, editingNgayId]);

  const fetchThangData = async () => {
    try {
      setIsLoading(true);
      const monthYear = `${selectedMonth}/${selectedYear}`;
      const response = await fetch(`/api/ton-kho-hinh-in?monthYear=${encodeURIComponent(monthYear)}`);
      const result = await response.json();
      if (result.success) {
        setTonKhoThang(result.thangData);
      } else {
        toast.error("Không thể tải dữ liệu tồn kho theo tháng");
      }
    } catch (error) {
      console.error("Error fetching ton kho thang:", error);
      toast.error("Lỗi khi tải dữ liệu tồn kho theo tháng");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNgayData = async () => {
    try {
      setIsLoadingNgay(true);
      const toDate = convertToSheetDate(selectedDate);
      const response = await fetch(`/api/ton-kho-hinh-in?toDate=${encodeURIComponent(toDate)}`);
      const result = await response.json();
      if (result.success) {
        setTonKhoNgay(result.ngayData);
      } else {
        toast.error("Không thể tải dữ liệu số dư đầu kì đến ngày");
      }
    } catch (error) {
      console.error("Error fetching ton kho ngay:", error);
      toast.error("Lỗi khi tải dữ liệu số dư đầu kì đến ngày");
    } finally {
      setIsLoadingNgay(false);
    }
  };

  // Start editing
  const startEditThang = (item: TonKhoHinhInThang) => {
    setEditingThangId(item.id);
    setEditValue(item.duDauKi.toString());
  };

  const startEditNgay = (item: TonKhoHinhInNgay) => {
    setEditingNgayId(item.id);
    setEditValue(item.soLuong.toString());
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingThangId(null);
    setEditingNgayId(null);
    setEditValue("");
  };

  // Save edit
  const saveEdit = async (type: "thang" | "ngay", id: number) => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/ton-kho-hinh-in/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id,
          value: parseFloat(editValue) || 0,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật thành công");
        // Update local state
        if (type === "thang") {
          setTonKhoThang((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, duDauKi: parseFloat(editValue) || 0 } : item
            )
          );
          setEditingThangId(null);
        } else {
          setTonKhoNgay((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, soLuong: parseFloat(editValue) || 0 } : item
            )
          );
          setEditingNgayId(null);
        }
        setEditValue("");
      } else {
        toast.error(result.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle key press in edit input
  const handleKeyDown = (e: React.KeyboardEvent, type: "thang" | "ngay", id: number) => {
    if (e.key === "Enter") {
      saveEdit(type, id);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  // Calculate totals for tonKhoThang
  const totalDuDauKi = filteredThang.reduce((sum, item) => sum + item.duDauKi, 0);
  const totalNhapKho = filteredThang.reduce((sum, item) => sum + item.nhapKho, 0);
  const totalXuatKho = filteredThang.reduce((sum, item) => sum + item.xuatKho, 0);
  const totalDuCuoiKi = filteredThang.reduce((sum, item) => sum + item.duCuoiKi, 0);

  // Calculate totals for tonKhoNgay
  const totalSoLuong = filteredNgay.reduce((sum, item) => sum + item.soLuong, 0);

  // Generate year options (5 years back to 2 years forward)
  const yearOptions = [];
  for (let y = currentYear - 5; y <= currentYear + 2; y++) {
    yearOptions.push(y);
  }

  // Month names in Vietnamese
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

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
            <div className="flex items-center gap-3">
              {/* Month/Year Picker */}
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <Calendar size={18} className="text-green-600" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent border-none focus:ring-0 text-green-700 font-medium cursor-pointer"
                >
                  {monthNames.map((name, index) => (
                    <option key={index + 1} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent border-none focus:ring-0 text-green-700 font-medium cursor-pointer"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
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
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50">
                    <th className="px-3 py-3 text-left font-medium text-gray-500 w-12">STT</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500">Mã HI</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-500 w-32">Dư đầu kì</th>
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
                      <td className="px-3 py-2.5 text-right">
                        {editingThangId === item.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              ref={editInputRef}
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, "thang", item.id)}
                              className="w-24 px-2 py-1 text-right border border-green-400 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                              disabled={isSaving}
                            />
                            <button
                              onClick={() => saveEdit("thang", item.id)}
                              disabled={isSaving}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={isSaving}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-end gap-1 group cursor-pointer"
                            onClick={() => startEditThang(item)}
                          >
                            <span className="text-gray-600">
                              {item.duDauKi !== 0 ? item.duDauKi.toLocaleString("vi-VN") : "-"}
                            </span>
                            <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
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
          )}
        </>
      )}

      {/* Table 2: Số dư đầu kì đến ngày */}
      {activeTable === "ngay" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-700">
              Bảng kê số dư đầu kì hình in đến ngày ({filteredNgay.length})
            </h3>
            <div className="flex items-center gap-3">
              {/* Date Picker */}
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                <Calendar size={18} className="text-orange-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-orange-700 font-medium cursor-pointer"
                />
              </div>
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
          </div>

          {isLoadingNgay ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-orange-50">
                    <th className="px-3 py-3 text-left font-medium text-gray-500 w-16">STT</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500">Mã HI</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-500 w-40">Số lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedNgay.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-600">{startIndexNgay + index + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-blue-600">{item.maHI}</td>
                      <td className="px-3 py-2.5 text-right">
                        {editingNgayId === item.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              ref={editInputRef}
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, "ngay", item.id)}
                              className="w-24 px-2 py-1 text-right border border-orange-400 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                              disabled={isSaving}
                            />
                            <button
                              onClick={() => saveEdit("ngay", item.id)}
                              disabled={isSaving}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={isSaving}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-end gap-1 group cursor-pointer"
                            onClick={() => startEditNgay(item)}
                          >
                            <span className={`font-medium ${item.soLuong > 0 ? "text-orange-600" : "text-gray-400"}`}>
                              {item.soLuong !== 0 ? item.soLuong.toLocaleString("vi-VN") : "-"}
                            </span>
                            <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
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
          )}
        </>
      )}
    </div>
  );
}
