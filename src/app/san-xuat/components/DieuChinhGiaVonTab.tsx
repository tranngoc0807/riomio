"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Calculator, Filter, Plus, Pencil, Trash2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import PrintDownloadButton from "@/components/PrintDownloadButton";
import EditHistoryButton from "@/components/EditHistoryButton";

interface DieuChinhGiaVon {
  id: number;
  maSP: string;
  dieuChinhGiaVon: number;
  ghiChu: string;
}

interface MaSPOption {
  id: number;
  maSP: string;
  tenSP: string;
}

const ITEMS_PER_PAGE = 50;

export default function DieuChinhGiaVonTab() {
  const [data, setData] = useState<DieuChinhGiaVon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyWithData, setShowOnlyWithData] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DieuChinhGiaVon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formMaSP, setFormMaSP] = useState("");
  const [formGiaVon, setFormGiaVon] = useState("");
  const [formGhiChu, setFormGhiChu] = useState("");

  // MaSP dropdown states
  const [maSPList, setMaSPList] = useState<MaSPOption[]>([]);
  const [maSPSearchTerm, setMaSPSearchTerm] = useState("");
  const [showMaSPDropdown, setShowMaSPDropdown] = useState(false);
  const maSPDropdownRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  // Filter maSPList based on search
  const filteredMaSPOptions = maSPList.filter(
    (item) =>
      item.maSP.toLowerCase().includes(maSPSearchTerm.toLowerCase()) ||
      item.tenSP?.toLowerCase().includes(maSPSearchTerm.toLowerCase())
  );

  // Filtered data
  const filteredList = data.filter((item) => {
    const matchesSearch = item.maSP.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (showOnlyWithData) {
      return item.dieuChinhGiaVon !== 0;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalDieuChinh = filteredList.reduce((sum, item) => sum + item.dieuChinhGiaVon, 0);
  const itemsWithData = filteredList.filter((item) => item.dieuChinhGiaVon !== 0).length;

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showOnlyWithData]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    fetchMaSPList();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (maSPDropdownRef.current && !maSPDropdownRef.current.contains(event.target as Node)) {
        setShowMaSPDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/dieu-chinh-gia-von");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu điều chỉnh giá vốn");
      }
    } catch (error) {
      console.error("Error fetching dieu chinh gia von:", error);
      toast.error("Lỗi khi tải dữ liệu điều chỉnh giá vốn");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaSPList = async () => {
    try {
      const response = await fetch("/api/ma-sp");
      const result = await response.json();
      if (result.success) {
        setMaSPList(result.data);
      }
    } catch (error) {
      console.error("Error fetching ma sp list:", error);
    }
  };

  const handleOpenAddModal = () => {
    setFormMaSP("");
    setFormGiaVon("");
    setFormGhiChu("");
    setMaSPSearchTerm("");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: DieuChinhGiaVon) => {
    setSelectedItem(item);
    setFormMaSP(item.maSP);
    setFormGiaVon(item.dieuChinhGiaVon.toString());
    setFormGhiChu(item.ghiChu || "");
    setShowEditModal(true);
  };

  const handleOpenDeleteModal = (item: DieuChinhGiaVon) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSelectMaSP = (maSP: string) => {
    setFormMaSP(maSP);
    setMaSPSearchTerm("");
    setShowMaSPDropdown(false);
  };

  const handleAdd = async () => {
    if (!formMaSP) {
      toast.error("Vui lòng chọn mã SP");
      return;
    }

    const giaVon = parseFloat(formGiaVon) || 0;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/dieu-chinh-gia-von/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maSP: formMaSP,
          dieuChinhGiaVon: giaVon,
          ghiChu: formGhiChu,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Thêm điều chỉnh giá vốn thành công");
        setShowAddModal(false);
        fetchData();
      } else {
        toast.error(result.error || "Không thể thêm điều chỉnh giá vốn");
      }
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Lỗi khi thêm điều chỉnh giá vốn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    const giaVon = parseFloat(formGiaVon) || 0;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/dieu-chinh-gia-von/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          maSP: formMaSP,
          dieuChinhGiaVon: giaVon,
          ghiChu: formGhiChu,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật điều chỉnh giá vốn thành công");
        setShowEditModal(false);
        setSelectedItem(null);
        fetchData();
      } else {
        toast.error(result.error || "Không thể cập nhật điều chỉnh giá vốn");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi khi cập nhật điều chỉnh giá vốn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/dieu-chinh-gia-von/delete?id=${selectedItem.id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Xóa điều chỉnh giá vốn thành công");
        setShowDeleteModal(false);
        setSelectedItem(null);
        fetchData();
      } else {
        toast.error(result.error || "Không thể xóa điều chỉnh giá vốn");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi khi xóa điều chỉnh giá vốn");
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
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calculator size={20} className="text-green-600" />
          Điều chỉnh giá vốn ({filteredList.length})
        </h3>
        <div className="flex items-center gap-3">
          <EditHistoryButton tableKey="dieu-chinh-gia-von" variant="labeled" title="Điều chỉnh giá vốn" />
          <PrintDownloadButton
            targetRef={printableRef}
            fileName="PhieuDieuChinhGiaVon"
            title="Phiếu điều chỉnh giá vốn"
          />
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus size={18} />
            Thêm mới
          </button>
          <button
            onClick={() => setShowOnlyWithData(!showOnlyWithData)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              showOnlyWithData
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Filter size={16} />
            {showOnlyWithData ? "Đang lọc có số liệu" : "Lọc có số liệu"}
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã SP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-64"
            />
          </div>
        </div>
      </div>

      <div ref={printableRef}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Tổng số sản phẩm</p>
          <p className="text-2xl font-bold text-blue-700">{filteredList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">SP có điều chỉnh</p>
          <p className="text-2xl font-bold text-green-700">{itemsWithData}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <p className="text-sm text-orange-600 mb-1">Tổng điều chỉnh</p>
          <p className="text-2xl font-bold text-orange-700">{totalDieuChinh.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">STT</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Mã SP</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-40">Điều chỉnh giá vốn</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ghi chú</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                <td className="px-4 py-2.5 font-medium text-blue-600">{item.maSP || "-"}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${
                  item.dieuChinhGiaVon > 0 ? "text-green-600" : item.dieuChinhGiaVon < 0 ? "text-red-600" : "text-gray-400"
                }`}>
                  {item.dieuChinhGiaVon !== 0 ? item.dieuChinhGiaVon.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate" title={item.ghiChu}>
                  {item.ghiChu || "-"}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(item)}
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
              <td colSpan={2} className="px-4 py-3 text-right">Tổng cộng:</td>
              <td className={`px-4 py-3 text-right ${
                totalDieuChinh > 0 ? "text-green-600" : totalDieuChinh < 0 ? "text-red-600" : "text-gray-600"
              }`}>
                {totalDieuChinh.toLocaleString("vi-VN")}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>

        {filteredList.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu điều chỉnh giá vốn
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
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
                            ? "bg-green-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Modal Thêm mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Thêm điều chỉnh giá vốn</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Mã SP dropdown with search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã sản phẩm <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={maSPDropdownRef}>
                  <input
                    type="text"
                    value={formMaSP || maSPSearchTerm}
                    onChange={(e) => {
                      setMaSPSearchTerm(e.target.value);
                      setFormMaSP("");
                      setShowMaSPDropdown(true);
                    }}
                    onFocus={() => setShowMaSPDropdown(true)}
                    placeholder="Tìm và chọn mã SP..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  {showMaSPDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMaSPOptions.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Không tìm thấy
                        </div>
                      ) : (
                        filteredMaSPOptions.slice(0, 50).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectMaSP(item.maSP)}
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-blue-600">{item.maSP}</div>
                            {item.tenSP && (
                              <div className="text-xs text-gray-500 truncate">{item.tenSP}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Giá vốn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điều chỉnh giá vốn
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formGiaVon}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d-]/g, "");
                    setFormGiaVon(value);
                  }}
                  placeholder="Nhập số tiền điều chỉnh..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Nhập số âm để giảm giá vốn</p>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={formGhiChu}
                  onChange={(e) => setFormGhiChu(e.target.value)}
                  placeholder="Nhập ghi chú..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleAdd}
                disabled={isSubmitting || !formMaSP}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sửa điều chỉnh giá vốn</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Mã SP - readonly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã sản phẩm
                </label>
                <input
                  type="text"
                  value={formMaSP}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Giá vốn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điều chỉnh giá vốn
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formGiaVon}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d-]/g, "");
                    setFormGiaVon(value);
                  }}
                  placeholder="Nhập số tiền điều chỉnh..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Nhập số âm để giảm giá vốn</p>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={formGhiChu}
                  onChange={(e) => setFormGhiChu(e.target.value)}
                  placeholder="Nhập ghi chú..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa điều chỉnh giá vốn cho mã SP{" "}
                <span className="font-semibold text-blue-600">{selectedItem.maSP}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
