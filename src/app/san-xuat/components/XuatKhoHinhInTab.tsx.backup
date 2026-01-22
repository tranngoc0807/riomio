"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package, Calendar, Plus, Edit2, Trash2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Portal from "@/components/Portal";

interface XuatKhoHinhIn {
  id: number;
  ngayThang: string;
  maHinhIn: string;
  soLuong: number;
  maSPSuDung: string;
  maPhieuXuat: string;
  ghiChu: string;
}

interface DanhMucHinhIn {
  id: number;
  maHinhIn: string;
  thongTinHinhIn: string;
  maSPSuDung: string;
  donGiaChuaThue: number;
  donGiaCoThue: number;
  xuongIn: string;
}

const ITEMS_PER_PAGE = 50;

// Date conversion utilities
const convertToInputDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return dateStr;
};

const convertToDisplayDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Searchable Dropdown Component
interface SearchableDropdownProps {
  options: { value: string; label: string; maSPSuDung?: string }[];
  value: string;
  onChange: (value: string, maSPSuDung?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function SearchableDropdown({ options, value, onChange, placeholder = "Chọn...", disabled = false }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(
    (opt) =>
      opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-center">Không tìm thấy</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value, opt.maSPSuDung);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-blue-50 ${
                    opt.value === value ? "bg-blue-100 text-blue-700" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function XuatKhoHinhInTab() {
  const [data, setData] = useState<XuatKhoHinhIn[]>([]);
  const [danhMucHinhIn, setDanhMucHinhIn] = useState<DanhMucHinhIn[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<XuatKhoHinhIn | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    ngayThang: getTodayDate(),
    maHinhIn: "",
    soLuong: "",
    maSPSuDung: "",
    maPhieuXuat: "",
    ghiChu: "",
  });

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maHinhIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSPSuDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maPhieuXuat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ngayThang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalSoLuong = filteredList.reduce((sum, item) => sum + item.soLuong, 0);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    fetchDanhMucHinhIn();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/xuat-kho-hinh-in");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu xuất kho hình in");
      }
    } catch (error) {
      console.error("Error fetching xuat kho hinh in:", error);
      toast.error("Lỗi khi tải dữ liệu xuất kho hình in");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDanhMucHinhIn = async () => {
    try {
      const response = await fetch("/api/danh-muc-hinh-in");
      const result = await response.json();
      if (result.success) {
        setDanhMucHinhIn(result.data);
      }
    } catch (error) {
      console.error("Error fetching danh muc hinh in:", error);
    }
  };

  const hinhInOptions = danhMucHinhIn.map((item) => ({
    value: item.maHinhIn,
    label: `${item.maHinhIn}${item.thongTinHinhIn ? ` - ${item.thongTinHinhIn}` : ""}`,
    maSPSuDung: item.maSPSuDung,
  }));

  const handleMaHinhInChange = (value: string, maSPSuDung?: string) => {
    setFormData((prev) => ({
      ...prev,
      maHinhIn: value,
      maSPSuDung: maSPSuDung || "",
    }));
  };

  const resetForm = () => {
    setFormData({
      ngayThang: getTodayDate(),
      maHinhIn: "",
      soLuong: "",
      maSPSuDung: "",
      maPhieuXuat: "",
      ghiChu: "",
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: XuatKhoHinhIn) => {
    setSelectedItem(item);
    setFormData({
      ngayThang: convertToInputDate(item.ngayThang),
      maHinhIn: item.maHinhIn,
      soLuong: item.soLuong.toString(),
      maSPSuDung: item.maSPSuDung,
      maPhieuXuat: item.maPhieuXuat,
      ghiChu: item.ghiChu,
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (item: XuatKhoHinhIn) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const handleAdd = async () => {
    if (!formData.maHinhIn || !formData.ngayThang) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/xuat-kho-hinh-in/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngayThang: convertToDisplayDate(formData.ngayThang),
          maHinhIn: formData.maHinhIn,
          soLuong: parseFloat(formData.soLuong) || 0,
          maSPSuDung: formData.maSPSuDung,
          maPhieuXuat: formData.maPhieuXuat,
          ghiChu: formData.ghiChu,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Thêm xuất kho hình in thành công");
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || "Không thể thêm xuất kho hình in");
      }
    } catch (error) {
      console.error("Error adding xuat kho hinh in:", error);
      toast.error("Lỗi khi thêm xuất kho hình in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !formData.maHinhIn || !formData.ngayThang) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/xuat-kho-hinh-in/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          ngayThang: convertToDisplayDate(formData.ngayThang),
          maHinhIn: formData.maHinhIn,
          soLuong: parseFloat(formData.soLuong) || 0,
          maSPSuDung: formData.maSPSuDung,
          maPhieuXuat: formData.maPhieuXuat,
          ghiChu: formData.ghiChu,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật xuất kho hình in thành công");
        setShowEditModal(false);
        setSelectedItem(null);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || "Không thể cập nhật xuất kho hình in");
      }
    } catch (error) {
      console.error("Error updating xuat kho hinh in:", error);
      toast.error("Lỗi khi cập nhật xuất kho hình in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/xuat-kho-hinh-in/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Xóa xuất kho hình in thành công");
        setShowDeleteConfirm(false);
        setSelectedItem(null);
        fetchData();
      } else {
        toast.error(result.error || "Không thể xóa xuất kho hình in");
      }
    } catch (error) {
      console.error("Error deleting xuat kho hinh in:", error);
      toast.error("Lỗi khi xóa xuất kho hình in");
    } finally {
      setIsSubmitting(false);
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
        <h3 className="text-lg font-semibold text-gray-900">
          Xuất kho hình in ({filteredList.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã HI, mã SP, mã phiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-72"
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-orange-600" />
            <p className="text-sm text-orange-600">Tổng số phiếu xuất</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{filteredList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-red-600" />
            <p className="text-sm text-red-600">Tổng số lượng xuất</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{totalSoLuong.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-medium text-gray-500 w-12">STT</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Ngày tháng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Mã hình in</th>
              <th className="px-3 py-3 text-right font-medium text-gray-500">Số lượng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Mã SP sử dụng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Mã phiếu xuất</th>
              <th className="px-3 py-3 text-left font-medium text-gray-500">Ghi chú</th>
              <th className="px-3 py-3 text-center font-medium text-gray-500 w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                <td className="px-3 py-2.5 text-gray-900">{item.ngayThang || "-"}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{item.maHinhIn || "-"}</td>
                <td className="px-3 py-2.5 text-right font-medium text-red-600">
                  {item.soLuong > 0 ? item.soLuong.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-gray-600">{item.maSPSuDung || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600">{item.maPhieuXuat || "-"}</td>
                <td className="px-3 py-2.5 text-gray-500 max-w-[150px] truncate" title={item.ghiChu}>
                  {item.ghiChu || "-"}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(item)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={3} className="px-3 py-3 text-right">Tổng cộng:</td>
              <td className="px-3 py-3 text-right text-red-600">
                {totalSoLuong.toLocaleString("vi-VN")}
              </td>
              <td colSpan={4}></td>
            </tr>
          </tfoot>
        </table>

        {filteredList.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu xuất kho hình in
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

      {/* Add Modal */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Thêm xuất kho hình in</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.ngayThang}
                    onChange={(e) => setFormData({ ...formData, ngayThang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã hình in <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={hinhInOptions}
                    value={formData.maHinhIn}
                    onChange={handleMaHinhInChange}
                    placeholder="Chọn mã hình in..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    value={formData.soLuong}
                    onChange={(e) => setFormData({ ...formData, soLuong: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số lượng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP sử dụng</label>
                  <input
                    type="text"
                    value={formData.maSPSuDung}
                    onChange={(e) => setFormData({ ...formData, maSPSuDung: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="Tự động điền khi chọn mã hình in"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu xuất</label>
                  <input
                    type="text"
                    value={formData.maPhieuXuat}
                    onChange={(e) => setFormData({ ...formData, maPhieuXuat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mã phiếu xuất"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={formData.ghiChu}
                    onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập ghi chú"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Đang thêm...
                    </span>
                  ) : (
                    "Thêm mới"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Sửa xuất kho hình in</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.ngayThang}
                    onChange={(e) => setFormData({ ...formData, ngayThang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã hình in <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={hinhInOptions}
                    value={formData.maHinhIn}
                    onChange={handleMaHinhInChange}
                    placeholder="Chọn mã hình in..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    value={formData.soLuong}
                    onChange={(e) => setFormData({ ...formData, soLuong: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số lượng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP sử dụng</label>
                  <input
                    type="text"
                    value={formData.maSPSuDung}
                    onChange={(e) => setFormData({ ...formData, maSPSuDung: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="Tự động điền khi chọn mã hình in"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu xuất</label>
                  <input
                    type="text"
                    value={formData.maPhieuXuat}
                    onChange={(e) => setFormData({ ...formData, maPhieuXuat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mã phiếu xuất"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={formData.ghiChu}
                    onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập ghi chú"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </span>
                  ) : (
                    "Cập nhật"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận xóa</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa xuất kho hình in <strong>{selectedItem.maHinhIn}</strong> ngày{" "}
                <strong>{selectedItem.ngayThang}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Đang xóa...
                    </span>
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
