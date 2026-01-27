"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package, Image as ImageIcon, Plus, Pencil, Trash2, X } from "lucide-react";
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

type ModalMode = "view" | "add" | "edit" | null;

const ITEMS_PER_PAGE = 50;

const emptyFormData: Omit<MaSP, "id"> = {
  maSP: "",
  tenSP: "",
  size: "",
  vaiChinh: "",
  vaiPhoi: "",
  phuLieuKhac: "",
  tinhTrangSX: "",
  lenhSX: "",
  xuongSX: "",
  hinhAnh: "",
};

export default function MaSPTab() {
  const [data, setData] = useState<MaSP[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTinhTrang, setFilterTinhTrang] = useState<string>("all");
  const [filterXuong, setFilterXuong] = useState<string>("all");

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedItem, setSelectedItem] = useState<MaSP | null>(null);
  const [formData, setFormData] = useState<Omit<MaSP, "id">>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<MaSP | null>(null);

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

  // Modal handlers
  const openViewModal = (item: MaSP) => {
    setSelectedItem(item);
    setModalMode("view");
  };

  const openAddModal = () => {
    setFormData(emptyFormData);
    setModalMode("add");
  };

  const openEditModal = (item: MaSP) => {
    setSelectedItem(item);
    setFormData({
      maSP: item.maSP,
      tenSP: item.tenSP,
      size: item.size,
      vaiChinh: item.vaiChinh,
      vaiPhoi: item.vaiPhoi,
      phuLieuKhac: item.phuLieuKhac,
      tinhTrangSX: item.tinhTrangSX,
      lenhSX: item.lenhSX,
      xuongSX: item.xuongSX,
      hinhAnh: item.hinhAnh,
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedItem(null);
    setFormData(emptyFormData);
  };

  const handleFormChange = (field: keyof Omit<MaSP, "id">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.maSP.trim()) {
      toast.error("Mã sản phẩm không được để trống");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        const response = await fetch("/api/ma-sp/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Thêm mã sản phẩm thành công");
          fetchData();
          closeModal();
        } else {
          toast.error(result.error || "Không thể thêm mã sản phẩm");
        }
      } else if (modalMode === "edit" && selectedItem) {
        const response = await fetch("/api/ma-sp/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowIndex: selectedItem.id - 1, // Convert to 0-based index
            ...formData,
          }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Cập nhật mã sản phẩm thành công");
          fetchData();
          closeModal();
        } else {
          toast.error(result.error || "Không thể cập nhật mã sản phẩm");
        }
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/ma-sp/delete?rowIndex=${deleteConfirm.id - 1}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Xoá mã sản phẩm thành công");
        fetchData();
        setDeleteConfirm(null);
      } else {
        toast.error(result.error || "Không thể xoá mã sản phẩm");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Có lỗi xảy ra khi xoá");
    } finally {
      setIsSubmitting(false);
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
          {/* Add button */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Thêm mới
          </button>
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
                <th className="px-3 py-3 text-center font-medium text-gray-600 w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openViewModal(item)}>
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
                  <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
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
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Xoá"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-wrap gap-3">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              {/* Previous page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Page numbers */}
              {(() => {
                const pages: (number | string)[] = [];

                // Always show page 1
                pages.push(1);

                if (totalPages <= 5) {
                  // Show all pages if 5 or less
                  for (let i = 2; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Show 1, 2, 3 ... lastPage pattern or adjust based on current page
                  if (currentPage <= 3) {
                    pages.push(2, 3);
                    if (totalPages > 4) pages.push("...");
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pages.push("...");
                    pages.push(totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    pages.push("...");
                    pages.push(currentPage - 1, currentPage, currentPage + 1);
                    pages.push("...");
                    pages.push(totalPages);
                  }
                }

                return pages.map((page, idx) =>
                  typeof page === "string" ? (
                    <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                );
              })()}

              {/* Next page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View/Add/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === "view" ? "Chi tiết mã sản phẩm" : modalMode === "add" ? "Thêm mã sản phẩm mới" : "Sửa mã sản phẩm"}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {modalMode === "view" && selectedItem ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Mã SP</p>
                    <p className="font-medium">{selectedItem.maSP || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Tên SP</p>
                    <p className="font-medium">{selectedItem.tenSP || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Size</p>
                    <p className="font-medium">{selectedItem.size || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Vải chính</p>
                    <p className="font-medium">{selectedItem.vaiChinh || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Vải phối</p>
                    <p className="font-medium">{selectedItem.vaiPhoi || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Phụ liệu khác</p>
                    <p className="font-medium">{selectedItem.phuLieuKhac || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Tình trạng SX</p>
                    <p className="font-medium">{selectedItem.tinhTrangSX || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Lệnh SX</p>
                    <p className="font-medium">{selectedItem.lenhSX || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Xưởng SX</p>
                    <p className="font-medium">{selectedItem.xuongSX || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Hình ảnh</p>
                    {selectedItem.hinhAnh && selectedItem.hinhAnh !== "#N/A" ? (
                      <a href={selectedItem.hinhAnh} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Xem hình ảnh
                      </a>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Mã SP <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.maSP}
                      onChange={(e) => handleFormChange("maSP", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập mã sản phẩm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Tên SP</label>
                    <input
                      type="text"
                      value={formData.tenSP}
                      onChange={(e) => handleFormChange("tenSP", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tên sản phẩm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Size</label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => handleFormChange("size", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập size"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Vải chính</label>
                    <input
                      type="text"
                      value={formData.vaiChinh}
                      onChange={(e) => handleFormChange("vaiChinh", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập vải chính"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Vải phối</label>
                    <input
                      type="text"
                      value={formData.vaiPhoi}
                      onChange={(e) => handleFormChange("vaiPhoi", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập vải phối"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Phụ liệu khác</label>
                    <input
                      type="text"
                      value={formData.phuLieuKhac}
                      onChange={(e) => handleFormChange("phuLieuKhac", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập phụ liệu khác"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Tình trạng SX</label>
                    <input
                      type="text"
                      value={formData.tinhTrangSX}
                      onChange={(e) => handleFormChange("tinhTrangSX", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tình trạng SX"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Lệnh SX</label>
                    <input
                      type="text"
                      value={formData.lenhSX}
                      onChange={(e) => handleFormChange("lenhSX", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập lệnh SX"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Xưởng SX</label>
                    <input
                      type="text"
                      value={formData.xuongSX}
                      onChange={(e) => handleFormChange("xuongSX", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập xưởng SX"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Link hình ảnh</label>
                    <input
                      type="text"
                      value={formData.hinhAnh}
                      onChange={(e) => handleFormChange("hinhAnh", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập link hình ảnh"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {modalMode === "view" ? "Đóng" : "Huỷ"}
              </button>
              {modalMode !== "view" && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {modalMode === "add" ? "Thêm" : "Cập nhật"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xoá</h3>
              <p className="text-gray-600 mb-1">
                Bạn có chắc chắn muốn xoá mã sản phẩm:
              </p>
              <p className="font-semibold text-gray-900 mb-4">
                {deleteConfirm.maSP} - {deleteConfirm.tenSP}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
