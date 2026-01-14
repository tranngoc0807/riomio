"use client";

import { Eye, Loader2, X, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

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

interface SanPham {
  id: number;
  code: string;
  name: string;
}

interface Workshop {
  id: number;
  name: string;
}

// Searchable Dropdown Component
function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchInput(value);
  }, [value]);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchInput.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchInput.toLowerCase())
  );

  const displayValue = isOpen ? searchInput : value;

  return (
    <div ref={dropdownRef} className={`relative ${className || ""}`}>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setSearchInput(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearchInput(value);
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">Không tìm thấy</div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                  value === opt.value ? "bg-blue-100 text-blue-700" : ""
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setSearchInput(opt.value);
                  setIsOpen(false);
                }}
              >
                <span className="font-medium">{opt.value}</span>
                {opt.label !== opt.value && (
                  <span className="text-gray-500 text-sm ml-2">- {opt.label}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Fixed options for Mục lục SX
const MUC_LUC_SX_OPTIONS = ["XGC", "Giặt", "Hình in", "Thêu", "Khác"];

const ITEMS_PER_PAGE = 50;

export default function DonGiaGiaCongTab() {
  const { profile } = useAuth();
  const [data, setData] = useState<DonGiaGiaCong[]>([]);
  const [products, setProducts] = useState<SanPham[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DonGiaGiaCong | null>(null);
  const [selectedItem, setSelectedItem] = useState<DonGiaGiaCong | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    maSPNhapKho: "",
    maSP: "",
    mucLucSX: "",
    xuongSX: "",
    noiDungKhac: "",
    donGia: "",
    nguoiNhap: "",
    ghiChu: "",
  });

  const resetForm = () => {
    setFormData({
      maSPNhapKho: "",
      maSP: "",
      mucLucSX: "",
      xuongSX: "",
      noiDungKhac: "",
      donGia: "",
      nguoiNhap: "",
      ghiChu: "",
    });
  };

  // Auto-generate maSPNhapKho when maSP, mucLucSX or noiDungKhac changes
  useEffect(() => {
    if (formData.maSP && formData.mucLucSX) {
      setFormData((prev) => ({
        ...prev,
        maSPNhapKho: `${prev.maSP}${prev.mucLucSX}${prev.noiDungKhac}`,
      }));
    }
  }, [formData.maSP, formData.mucLucSX, formData.noiDungKhac]);

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
    fetchProducts();
    fetchWorkshops();
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

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/san-pham");
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

  // Product options for dropdown
  const productOptions = products.map((p) => ({
    value: p.code,
    label: p.name,
  }));

  // Workshop options for dropdown
  const workshopOptions = workshops.map((w) => ({
    value: w.name,
    label: w.name,
  }));

  // CRUD handlers
  const handleAdd = async () => {
    if (!formData.maSPNhapKho && !formData.maSP) {
      toast.error("Vui lòng điền Mã SP nhập kho hoặc Mã SP");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/don-gia-gia-cong/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Thêm đơn giá gia công thành công");
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || "Không thể thêm đơn giá gia công");
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

    try {
      setSaving(true);
      const response = await fetch("/api/don-gia-gia-cong/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          ...formData,
        }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật đơn giá gia công thành công");
        setShowEditModal(false);
        setSelectedItem(null);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || "Không thể cập nhật đơn giá gia công");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (item: DonGiaGiaCong) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/don-gia-gia-cong/delete?id=${itemToDelete.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Xóa đơn giá gia công thành công");
        fetchData();
      } else {
        toast.error(result.error || "Không thể xóa đơn giá gia công");
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

  const openEditModal = (item: DonGiaGiaCong) => {
    setSelectedItem(item);
    setFormData({
      maSPNhapKho: item.maSPNhapKho,
      maSP: item.maSP,
      mucLucSX: item.mucLucSX,
      xuongSX: item.xuongSX,
      noiDungKhac: item.noiDungKhac,
      donGia: item.donGia.toString(),
      nguoiNhap: item.nguoiNhap,
      ghiChu: item.ghiChu,
    });
    setShowEditModal(true);
  };

  const handleView = (item: DonGiaGiaCong) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-lg font-semibold">
          Danh sách đơn giá gia công ({filteredList.length})
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetForm();
              setFormData((prev) => ({
                ...prev,
                nguoiNhap: profile?.full_name || "",
              }));
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
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
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
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-28">Thao tác</th>
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
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleView(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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

      {/* Add Modal */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Thêm đơn giá gia công</h2>
                <button onClick={() => setShowAddModal(false)} disabled={saving} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                    <SearchableDropdown
                      options={productOptions}
                      value={formData.maSP}
                      onChange={(value) => setFormData({ ...formData, maSP: value })}
                      placeholder="Chọn hoặc tìm mã sản phẩm..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mục lục SX</label>
                    <select
                      value={formData.mucLucSX}
                      onChange={(e) => setFormData({ ...formData, mucLucSX: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn mục lục --</option>
                      {MUC_LUC_SX_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP nhập kho (Tự động)</label>
                  <input
                    type="text"
                    value={formData.maSPNhapKho}
                    onChange={(e) => setFormData({ ...formData, maSPNhapKho: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="Tự động tạo từ Mã SP + Mục lục SX"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                    <SearchableDropdown
                      options={workshopOptions}
                      value={formData.xuongSX}
                      onChange={(value) => setFormData({ ...formData, xuongSX: value })}
                      placeholder="Chọn xưởng sản xuất..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá</label>
                    <input
                      type="number"
                      value={formData.donGia}
                      onChange={(e) => setFormData({ ...formData, donGia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung khác</label>
                  <input
                    type="text"
                    value={formData.noiDungKhac}
                    onChange={(e) => setFormData({ ...formData, noiDungKhac: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nội dung khác..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Người nhập</label>
                    <input
                      type="text"
                      value={formData.nguoiNhap}
                      onChange={(e) => setFormData({ ...formData, nguoiNhap: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                    <input
                      type="text"
                      value={formData.ghiChu}
                      onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ghi chú..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
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
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Sửa đơn giá gia công</h2>
                <button onClick={() => setShowEditModal(false)} disabled={saving} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                    <SearchableDropdown
                      options={productOptions}
                      value={formData.maSP}
                      onChange={(value) => setFormData({ ...formData, maSP: value })}
                      placeholder="Chọn hoặc tìm mã sản phẩm..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mục lục SX</label>
                    <select
                      value={formData.mucLucSX}
                      onChange={(e) => setFormData({ ...formData, mucLucSX: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn mục lục --</option>
                      {MUC_LUC_SX_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP nhập kho</label>
                  <input
                    type="text"
                    value={formData.maSPNhapKho}
                    onChange={(e) => setFormData({ ...formData, maSPNhapKho: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                    <SearchableDropdown
                      options={workshopOptions}
                      value={formData.xuongSX}
                      onChange={(value) => setFormData({ ...formData, xuongSX: value })}
                      placeholder="Chọn xưởng sản xuất..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá</label>
                    <input
                      type="number"
                      value={formData.donGia}
                      onChange={(e) => setFormData({ ...formData, donGia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung khác</label>
                  <input
                    type="text"
                    value={formData.noiDungKhac}
                    onChange={(e) => setFormData({ ...formData, noiDungKhac: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Người nhập</label>
                    <input
                      type="text"
                      value={formData.nguoiNhap}
                      onChange={(e) => setFormData({ ...formData, nguoiNhap: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                    <input
                      type="text"
                      value={formData.ghiChu}
                      onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
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
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedItem);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <Edit size={16} />
                Sửa
              </button>
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
                  Bạn có chắc muốn xóa đơn giá &quot;{itemToDelete.maSPNhapKho || itemToDelete.maSP}&quot;?
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
