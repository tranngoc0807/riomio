"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, PieChart, Plus, Edit, Trash2, Eye, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Portal from "@/components/Portal";
import { useAuth } from "@/context/AuthContext";

interface SanPham {
  id: number;
  code: string;
  name: string;
}

// Searchable Dropdown Component for Mã SP
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

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

// Fixed options for Loại chi phí
const LOAI_CHI_PHI_OPTIONS = ["CP QLDN", "CP SX"];

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
  const { profile } = useAuth();
  const [data, setData] = useState<PhanBoCPKhac[]>([]);
  const [products, setProducts] = useState<SanPham[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterLoaiCP, setFilterLoaiCP] = useState<string>("all");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PhanBoCPKhac | null>(null);
  const [selectedItem, setSelectedItem] = useState<PhanBoCPKhac | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    ngayThang: "",
    nguoiNhap: "",
    maPhieu: "",
    noiDung: "",
    maSP: "",
    soTien: "",
    loaiChiPhi: "",
  });

  const resetForm = () => {
    setFormData({
      ngayThang: "",
      nguoiNhap: "",
      maPhieu: "",
      noiDung: "",
      maSP: "",
      soTien: "",
      loaiChiPhi: "",
    });
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLoaiCP]);

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

  // Product options for dropdown
  const productOptions = products.map((p) => ({
    value: p.code,
    label: p.name,
  }));

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

  // CRUD handlers
  const handleAdd = async () => {
    if (!formData.ngayThang && !formData.maPhieu) {
      toast.error("Vui lòng điền Ngày tháng hoặc Mã phiếu");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/phan-bo-cp-khac/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Thêm phân bổ chi phí khác thành công");
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || "Không thể thêm phân bổ chi phí khác");
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
      const response = await fetch("/api/phan-bo-cp-khac/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          ...formData,
        }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật phân bổ chi phí khác thành công");
        setShowEditModal(false);
        setSelectedItem(null);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || "Không thể cập nhật phân bổ chi phí khác");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (item: PhanBoCPKhac) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/phan-bo-cp-khac/delete?id=${itemToDelete.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Xóa phân bổ chi phí khác thành công");
        fetchData();
      } else {
        toast.error(result.error || "Không thể xóa phân bổ chi phí khác");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const openEditModal = (item: PhanBoCPKhac) => {
    setSelectedItem(item);
    setFormData({
      ngayThang: item.ngayThang,
      nguoiNhap: item.nguoiNhap,
      maPhieu: item.maPhieu,
      noiDung: item.noiDung,
      maSP: item.maSP,
      soTien: item.soTien.toString(),
      loaiChiPhi: item.loaiChiPhi,
    });
    setShowEditModal(true);
  };

  const openViewModal = (item: PhanBoCPKhac) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

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
          <button
            onClick={() => {
              resetForm();
              // Auto-fill người nhập with current user's name
              setFormData((prev) => ({
                ...prev,
                nguoiNhap: profile?.full_name || "",
              }));
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Thêm mới
          </button>
          {/* Filter by Loại chi phí */}
          <select
            value={filterLoaiCP}
            onChange={(e) => setFilterLoaiCP(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả loại chi phí</option>
            {LOAI_CHI_PHI_OPTIONS.map((opt) => (
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
                <th className="px-3 py-3 text-center font-medium text-gray-600 w-28">Thao tác</th>
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
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openViewModal(item)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(item)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
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
                <td colSpan={6} className="px-3 py-3 text-right">Tổng:</td>
                <td className="px-3 py-3 text-right text-blue-600">{totalSoTien.toLocaleString("vi-VN")}</td>
                <td colSpan={2}></td>
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

      {/* Add Modal */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Thêm phân bổ chi phí khác</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
                    <input
                      type="date"
                      value={formData.ngayThang}
                      onChange={(e) => setFormData({ ...formData, ngayThang: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Người nhập</label>
                    <input
                      type="text"
                      value={formData.nguoiNhap}
                      onChange={(e) => setFormData({ ...formData, nguoiNhap: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                    <input
                      type="text"
                      value={formData.maPhieu}
                      onChange={(e) => setFormData({ ...formData, maPhieu: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                    <SearchableDropdown
                      options={productOptions}
                      value={formData.maSP}
                      onChange={(value) => setFormData({ ...formData, maSP: value })}
                      placeholder="Chọn hoặc tìm mã sản phẩm..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <textarea
                    value={formData.noiDung}
                    onChange={(e) => setFormData({ ...formData, noiDung: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Mô tả chi phí..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                    <input
                      type="number"
                      value={formData.soTien}
                      onChange={(e) => setFormData({ ...formData, soTien: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại chi phí</label>
                    <select
                      value={formData.loaiChiPhi}
                      onChange={(e) => setFormData({ ...formData, loaiChiPhi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn loại chi phí --</option>
                      {LOAI_CHI_PHI_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                <h2 className="text-xl font-semibold text-gray-900">Sửa phân bổ chi phí khác</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
                    <input
                      type="date"
                      value={formData.ngayThang}
                      onChange={(e) => setFormData({ ...formData, ngayThang: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Người nhập</label>
                    <input
                      type="text"
                      value={formData.nguoiNhap}
                      onChange={(e) => setFormData({ ...formData, nguoiNhap: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                    <input
                      type="text"
                      value={formData.maPhieu}
                      onChange={(e) => setFormData({ ...formData, maPhieu: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                    <SearchableDropdown
                      options={productOptions}
                      value={formData.maSP}
                      onChange={(value) => setFormData({ ...formData, maSP: value })}
                      placeholder="Chọn hoặc tìm mã sản phẩm..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <textarea
                    value={formData.noiDung}
                    onChange={(e) => setFormData({ ...formData, noiDung: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                    <input
                      type="number"
                      value={formData.soTien}
                      onChange={(e) => setFormData({ ...formData, soTien: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại chi phí</label>
                    <select
                      value={formData.loaiChiPhi}
                      onChange={(e) => setFormData({ ...formData, loaiChiPhi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn loại chi phí --</option>
                      {LOAI_CHI_PHI_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Chi tiết phân bổ chi phí khác</h2>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Ngày tháng</label>
                    <p className="text-gray-900 font-medium">{selectedItem.ngayThang || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Người nhập</label>
                    <p className="text-gray-900">{selectedItem.nguoiNhap || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mã phiếu</label>
                    <p className="text-gray-900 font-mono">{selectedItem.maPhieu || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mã SP</label>
                    <p className="text-gray-900 font-medium">{selectedItem.maSP || "-"}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nội dung</label>
                  <p className="text-gray-900">{selectedItem.noiDung || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Số tiền</label>
                    <p className="text-blue-600 font-bold text-lg">
                      {selectedItem.soTien > 0 ? selectedItem.soTien.toLocaleString("vi-VN") + " đ" : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Loại chi phí</label>
                    {selectedItem.loaiChiPhi ? (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {selectedItem.loaiChiPhi}
                      </span>
                    ) : <p className="text-gray-500">-</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedItem);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Edit size={16} />
                  Sửa
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
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600">
                  Bạn có chắc muốn xóa phân bổ &quot;{itemToDelete.maPhieu || itemToDelete.noiDung || itemToDelete.ngayThang}&quot;?
                </p>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
