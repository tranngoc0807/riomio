"use client";

import { Loader2, X, Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

interface SanPham {
  id: number;
  maSP: string;
  tenSP: string;
}

interface Workshop {
  id: number;
  name: string;
  phone: string;
  address: string;
  manager: string;
  note: string;
}

// SearchableDropdown Component
function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      (opt.value || "").toLowerCase().includes(search.toLowerCase()) ||
      (opt.label || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? `${selectedOption.value || ""} - ${selectedOption.label || ""}` : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm text-center">Không tìm thấy</div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <div
                  key={opt.value || idx}
                  onClick={() => {
                    onChange(opt.value || "");
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${
                    value === opt.value ? "bg-blue-50 text-blue-700 font-medium" : ""
                  }`}
                >
                  {opt.value || ""} - {opt.label || ""}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ITEMS_PER_PAGE = 50;

export default function DanhMucHinhInTab() {
  const [data, setData] = useState<DanhMucHinhIn[]>([]);
  const [products, setProducts] = useState<SanPham[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DanhMucHinhIn | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DanhMucHinhIn | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    maHinhIn: "",
    thongTinHinhIn: "",
    hinhAnh: "",
    donGiaChuaThue: "",
    thueSuat: "",
    donGiaCoThue: "",
    maSPSuDung: "",
    xuongIn: "",
  });

  const resetForm = () => {
    setFormData({
      maHinhIn: "",
      thongTinHinhIn: "",
      hinhAnh: "",
      donGiaChuaThue: "",
      thueSuat: "",
      donGiaCoThue: "",
      maSPSuDung: "",
      xuongIn: "",
    });
  };

  // Auto-calculate donGiaCoThue when donGiaChuaThue or thueSuat changes
  useEffect(() => {
    if (formData.donGiaChuaThue) {
      const donGiaChuaThue = parseFloat(formData.donGiaChuaThue) || 0;
      const thueSuatValue = parseFloat(formData.thueSuat) || 0;
      const donGiaCoThue = donGiaChuaThue * (1 + thueSuatValue / 100);
      setFormData((prev) => ({
        ...prev,
        donGiaCoThue: Math.round(donGiaCoThue).toString(),
      }));
    }
  }, [formData.donGiaChuaThue, formData.thueSuat]);

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
    fetchProducts();
    fetchWorkshops();
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

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/ma-sp");
      const result = await response.json();
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const response = await fetch("/api/workshops");
      const result = await response.json();
      if (result.success) {
        setWorkshops(result.data);
      }
    } catch (error) {
      console.error("Error fetching workshops:", error);
    }
  };

  const handleView = (item: DanhMucHinhIn) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleAdd = async () => {
    if (!formData.maHinhIn.trim()) {
      toast.error("Mã hình in là bắt buộc");
      return;
    }
    if (!formData.thueSuat.trim()) {
      toast.error("Thuế suất là bắt buộc");
      return;
    }

    try {
      setSaving(true);
      // Add % to thueSuat when sending to API
      const dataToSend = {
        ...formData,
        thueSuat: formData.thueSuat ? `${formData.thueSuat}%` : "",
      };
      const response = await fetch("/api/danh-muc-hinh-in/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Thêm danh mục hình in thành công");
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || "Không thể thêm danh mục hình in");
      }
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    if (!formData.maHinhIn.trim()) {
      toast.error("Mã hình in là bắt buộc");
      return;
    }
    if (!formData.thueSuat.trim()) {
      toast.error("Thuế suất là bắt buộc");
      return;
    }

    try {
      setSaving(true);
      // Add % to thueSuat when sending to API
      const dataToSend = {
        id: selectedItem.id,
        ...formData,
        thueSuat: formData.thueSuat ? `${formData.thueSuat}%` : "",
      };
      const response = await fetch("/api/danh-muc-hinh-in/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật danh mục hình in thành công");
        setShowEditModal(false);
        setSelectedItem(null);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || "Không thể cập nhật danh mục hình in");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: DanhMucHinhIn) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/danh-muc-hinh-in/delete?id=${itemToDelete.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Xóa danh mục hình in thành công");
        fetchData();
      } else {
        toast.error(result.error || "Không thể xóa danh mục hình in");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const openEditModal = (item: DanhMucHinhIn) => {
    setSelectedItem(item);
    // Parse thueSuat - remove % if present
    const thueSuatValue = item.thueSuat ? item.thueSuat.replace("%", "") : "";
    setFormData({
      maHinhIn: item.maHinhIn,
      thongTinHinhIn: item.thongTinHinhIn,
      hinhAnh: item.hinhAnh,
      donGiaChuaThue: item.donGiaChuaThue.toString(),
      thueSuat: thueSuatValue,
      donGiaCoThue: item.donGiaCoThue.toString(),
      maSPSuDung: item.maSPSuDung,
      xuongIn: item.xuongIn,
    });
    setShowEditModal(true);
  };

  // Prepare options for dropdowns (filter out invalid entries)
  const productOptions = products
    .filter((p) => p.maSP)
    .map((p) => ({ value: p.maSP, label: p.tenSP || "" }));
  // For workshops, use name as both value and label
  const workshopOptions = workshops
    .filter((w) => w.name)
    .map((w) => ({ value: w.name, label: w.name }));

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
        {/* Header with search and add button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh mục hình in ({filteredList.length})
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Thêm mới
            </button>
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
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedList.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(item)}>
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
                  <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        disabled={saving}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Sửa"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete(item)}
                        disabled={deleting}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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

      {/* Add Modal */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Thêm danh mục hình in</h2>
                <button onClick={() => setShowAddModal(false)} disabled={saving} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã hình in *</label>
                    <input
                      type="text"
                      value={formData.maHinhIn}
                      onChange={(e) => setFormData({ ...formData, maHinhIn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: HI17"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng in</label>
                    <SearchableDropdown
                      options={workshopOptions}
                      value={formData.xuongIn}
                      onChange={(value) => setFormData({ ...formData, xuongIn: value })}
                      placeholder="Chọn xưởng in"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin hình in</label>
                  <input
                    type="text"
                    value={formData.thongTinHinhIn}
                    onChange={(e) => setFormData({ ...formData, thongTinHinhIn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Thông tin chi tiết..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá chưa thuế</label>
                    <input
                      type="number"
                      value={formData.donGiaChuaThue}
                      onChange={(e) => setFormData({ ...formData, donGiaChuaThue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thuế suất (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.thueSuat}
                        onChange={(e) => setFormData({ ...formData, thueSuat: e.target.value })}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá có thuế</label>
                    <input
                      type="number"
                      value={formData.donGiaCoThue}
                      onChange={(e) => setFormData({ ...formData, donGiaCoThue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="Tự động tính"
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative z-10">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP sử dụng</label>
                    <SearchableDropdown
                      options={productOptions}
                      value={formData.maSPSuDung}
                      onChange={(value) => setFormData({ ...formData, maSPSuDung: value })}
                      placeholder="Chọn mã SP"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (URL)</label>
                    <input
                      type="text"
                      value={formData.hinhAnh}
                      onChange={(e) => setFormData({ ...formData, hinhAnh: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Link hình ảnh..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Sửa danh mục hình in</h2>
                <button onClick={() => setShowEditModal(false)} disabled={saving} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã hình in *</label>
                    <input
                      type="text"
                      value={formData.maHinhIn}
                      onChange={(e) => setFormData({ ...formData, maHinhIn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: HI17"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng in</label>
                    <SearchableDropdown
                      options={workshopOptions}
                      value={formData.xuongIn}
                      onChange={(value) => setFormData({ ...formData, xuongIn: value })}
                      placeholder="Chọn xưởng in"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin hình in</label>
                  <input
                    type="text"
                    value={formData.thongTinHinhIn}
                    onChange={(e) => setFormData({ ...formData, thongTinHinhIn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Thông tin chi tiết..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá chưa thuế</label>
                    <input
                      type="number"
                      value={formData.donGiaChuaThue}
                      onChange={(e) => setFormData({ ...formData, donGiaChuaThue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thuế suất (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.thueSuat}
                        onChange={(e) => setFormData({ ...formData, thueSuat: e.target.value })}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá có thuế</label>
                    <input
                      type="number"
                      value={formData.donGiaCoThue}
                      onChange={(e) => setFormData({ ...formData, donGiaCoThue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="Tự động tính"
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative z-10">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP sử dụng</label>
                    <SearchableDropdown
                      options={productOptions}
                      value={formData.maSPSuDung}
                      onChange={(value) => setFormData({ ...formData, maSPSuDung: value })}
                      placeholder="Chọn mã SP"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (URL)</label>
                    <input
                      type="text"
                      value={formData.hinhAnh}
                      onChange={(e) => setFormData({ ...formData, hinhAnh: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Link hình ảnh..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Xác nhận xóa</h2>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                  disabled={deleting}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600">
                  Bạn có chắc muốn xóa hình in &quot;{itemToDelete.maHinhIn}&quot;?
                </p>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
