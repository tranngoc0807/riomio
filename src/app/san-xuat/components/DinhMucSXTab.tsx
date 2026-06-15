"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package, Plus, Edit, Trash2, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Portal from "@/components/Portal";
import ConfirmModal from "@/components/ConfirmModal";
import EditHistoryButton from "@/components/EditHistoryButton";

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
  phuLieu3: string;
  phuLieu4: string;
  phuLieu5: string;
  phuKien1: string;
  phuKien2: string;
  phuKien3: string;
  phuKien4: string;
  phuKien5: string;
  khac: string;
}

interface MaSP {
  id: number;
  maSP: string;
  tenSP: string;
}

const INITIAL_FORM: Omit<DinhMucSX, "id"> = {
  maSP: "",
  vaiChinh: "",
  vaiPhoi1: "",
  vaiPhoi2: "",
  vaiPhoi3: "",
  vaiPhoi4: "",
  vaiPhoi5: "",
  phuLieu1: "",
  phuLieu2: "",
  phuLieu3: "",
  phuLieu4: "",
  phuLieu5: "",
  phuKien1: "",
  phuKien2: "",
  phuKien3: "",
  phuKien4: "",
  phuKien5: "",
  khac: "",
};

const ITEMS_PER_PAGE = 50;

export default function DinhMucSXTab() {
  const [data, setData] = useState<DinhMucSX[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Omit<DinhMucSX, "id">>(INITIAL_FORM);
  const [editItem, setEditItem] = useState<DinhMucSX | null>(null);

  // Loading states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DinhMucSX | null>(null);

  // Mã SP dropdown states
  const [maSPList, setMaSPList] = useState<MaSP[]>([]);
  const [maSPSearchTerm, setMaSPSearchTerm] = useState("");
  const [showMaSPDropdown, setShowMaSPDropdown] = useState(false);
  const [isSearchingMaSP, setIsSearchingMaSP] = useState(false);
  const [editMaSPSearchTerm, setEditMaSPSearchTerm] = useState("");
  const [showEditMaSPDropdown, setShowEditMaSPDropdown] = useState(false);
  const [isSearchingEditMaSP, setIsSearchingEditMaSP] = useState(false);
  const maSPDropdownRef = useRef<HTMLDivElement>(null);
  const editMaSPDropdownRef = useRef<HTMLDivElement>(null);

  // Filtered mã SP list - show all when not searching
  const filteredMaSPList = isSearchingMaSP && maSPSearchTerm
    ? maSPList.filter(
        (item) =>
          item.maSP.toLowerCase().includes(maSPSearchTerm.toLowerCase()) ||
          item.tenSP.toLowerCase().includes(maSPSearchTerm.toLowerCase())
      )
    : maSPList;

  const filteredEditMaSPList = isSearchingEditMaSP && editMaSPSearchTerm
    ? maSPList.filter(
        (item) =>
          item.maSP.toLowerCase().includes(editMaSPSearchTerm.toLowerCase()) ||
          item.tenSP.toLowerCase().includes(editMaSPSearchTerm.toLowerCase())
      )
    : maSPList;

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vaiChinh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vaiPhoi1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phuLieu1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phuKien1.toLowerCase().includes(searchTerm.toLowerCase())
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
    fetchMaSPList();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (maSPDropdownRef.current && !maSPDropdownRef.current.contains(event.target as Node)) {
        setShowMaSPDropdown(false);
        setIsSearchingMaSP(false);
      }
      if (editMaSPDropdownRef.current && !editMaSPDropdownRef.current.contains(event.target as Node)) {
        setShowEditMaSPDropdown(false);
        setIsSearchingEditMaSP(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  // Handle add
  const handleAdd = async () => {
    if (!formData.maSP.trim()) {
      toast.error("Vui lòng chọn Mã SP");
      return;
    }

    try {
      setIsAdding(true);
      const response = await fetch("/api/dinh-muc-sx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Thêm định mức sản xuất thành công");
        setShowAddModal(false);
        setFormData(INITIAL_FORM);
        setMaSPSearchTerm("");
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi thêm định mức sản xuất");
      }
    } catch (error) {
      console.error("Error adding dinh muc sx:", error);
      toast.error("Lỗi khi thêm định mức sản xuất");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!editItem) return;

    if (!editItem.maSP.trim()) {
      toast.error("Vui lòng chọn Mã SP");
      return;
    }

    try {
      setIsEditing(true);
      const response = await fetch("/api/dinh-muc-sx", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật định mức sản xuất thành công");
        setShowEditModal(false);
        setEditItem(null);
        setEditMaSPSearchTerm("");
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi cập nhật định mức sản xuất");
      }
    } catch (error) {
      console.error("Error updating dinh muc sx:", error);
      toast.error("Lỗi khi cập nhật định mức sản xuất");
    } finally {
      setIsEditing(false);
    }
  };

  // Handle delete
  const handleDelete = (item: DinhMucSX) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(itemToDelete.id);
      const response = await fetch(`/api/dinh-muc-sx?id=${itemToDelete.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Xóa định mức sản xuất thành công");
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi xóa định mức sản xuất");
      }
    } catch (error) {
      console.error("Error deleting dinh muc sx:", error);
      toast.error("Lỗi khi xóa định mức sản xuất");
    } finally {
      setIsDeleting(null);
      setItemToDelete(null);
    }
  };

  // Open edit modal
  const openEditModal = (item: DinhMucSX) => {
    setEditItem({ ...item });
    setEditMaSPSearchTerm(item.maSP);
    setShowEditModal(true);
  };

  // Select mã SP for add form
  const selectMaSP = (maSP: MaSP) => {
    setFormData({ ...formData, maSP: maSP.maSP });
    setMaSPSearchTerm(maSP.maSP);
    setShowMaSPDropdown(false);
    setIsSearchingMaSP(false);
  };

  // Select mã SP for edit form
  const selectEditMaSP = (maSP: MaSP) => {
    if (editItem) {
      setEditItem({ ...editItem, maSP: maSP.maSP });
      setEditMaSPSearchTerm(maSP.maSP);
      setShowEditMaSPDropdown(false);
      setIsSearchingEditMaSP(false);
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
    { key: "phuLieu3" as keyof DinhMucSX, label: "Phụ liệu 3" },
    { key: "phuLieu4" as keyof DinhMucSX, label: "Phụ liệu 4" },
    { key: "phuLieu5" as keyof DinhMucSX, label: "Phụ liệu 5" },
  ];

  const phuKienColumns = [
    { key: "phuKien1" as keyof DinhMucSX, label: "Phụ kiện 1" },
    { key: "phuKien2" as keyof DinhMucSX, label: "Phụ kiện 2" },
    { key: "phuKien3" as keyof DinhMucSX, label: "Phụ kiện 3" },
    { key: "phuKien4" as keyof DinhMucSX, label: "Phụ kiện 4" },
    { key: "phuKien5" as keyof DinhMucSX, label: "Phụ kiện 5" },
  ];

  // Form fields configuration (excluding maSP which has special dropdown)
  const formFields = [
    { key: "vaiChinh", label: "Vải chính" },
    { key: "vaiPhoi1", label: "Vải phối 1" },
    { key: "vaiPhoi2", label: "Vải phối 2" },
    { key: "vaiPhoi3", label: "Vải phối 3" },
    { key: "vaiPhoi4", label: "Vải phối 4" },
    { key: "vaiPhoi5", label: "Vải phối 5" },
    { key: "phuLieu1", label: "Phụ liệu 1" },
    { key: "phuLieu2", label: "Phụ liệu 2" },
    { key: "phuLieu3", label: "Phụ liệu 3" },
    { key: "phuLieu4", label: "Phụ liệu 4" },
    { key: "phuLieu5", label: "Phụ liệu 5" },
    { key: "phuKien1", label: "Phụ kiện 1" },
    { key: "phuKien2", label: "Phụ kiện 2" },
    { key: "phuKien3", label: "Phụ kiện 3" },
    { key: "phuKien4", label: "Phụ kiện 4" },
    { key: "phuKien5", label: "Phụ kiện 5" },
    { key: "khac", label: "Khác" },
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
      {/* Header with search and add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package size={20} className="text-blue-600" />
          Định mức sản xuất ({filteredList.length})
        </h3>
        <div className="flex items-center gap-3">
          <EditHistoryButton tableKey="dinh-muc-sx" variant="labeled" title="Định mức sản xuất" />
          <button
            onClick={() => {
              setFormData(INITIAL_FORM);
              setMaSPSearchTerm("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Thêm mới
          </button>
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
              {phuKienColumns.map((col) => (
                <th key={col.key} className="px-3 py-3 text-left font-medium text-gray-600 min-w-[100px]">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[100px]">Khác</th>
              <th className="px-3 py-3 text-center font-medium text-gray-600 w-24 sticky right-0 bg-blue-50">Thao tác</th>
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
                {phuKienColumns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-gray-600">
                    {item[col.key] || "-"}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-gray-600">{item.khac || "-"}</td>
                <td className="px-3 py-2.5 sticky right-0 bg-white">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting === item.id}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Xóa"
                    >
                      {isDeleting === item.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </td>
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

      {/* Add Modal */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 text-white flex items-center justify-between">
                <h2 className="text-lg font-semibold">Thêm định mức sản xuất</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Mã SP Dropdown */}
                  <div className="col-span-2" ref={maSPDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã SP <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={maSPSearchTerm}
                        onChange={(e) => {
                          setMaSPSearchTerm(e.target.value);
                          setIsSearchingMaSP(true);
                          setShowMaSPDropdown(true);
                        }}
                        onFocus={() => {
                          setShowMaSPDropdown(true);
                          setIsSearchingMaSP(false);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        placeholder="Tìm và chọn mã SP..."
                      />
                      <ChevronDown
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      {showMaSPDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredMaSPList.length > 0 ? (
                            filteredMaSPList.slice(0, 50).map((item) => (
                              <button
                                key={item.id}
                                onClick={() => selectMaSP(item)}
                                className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                              >
                                <span className="font-medium text-blue-600">{item.maSP}</span>
                                <span className="text-gray-500 text-sm truncate">- {item.tenSP}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                              Không tìm thấy mã SP
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.maSP && (
                      <div className="mt-1 text-sm text-green-600">
                        Đã chọn: <strong>{formData.maSP}</strong>
                      </div>
                    )}
                  </div>

                  {/* Other fields */}
                  {formFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={(formData as any)[field.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Nhập ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isAdding && <Loader2 size={16} className="animate-spin" />}
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-green-600 text-white flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sửa định mức sản xuất</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditItem(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Mã SP Dropdown */}
                  <div className="col-span-2" ref={editMaSPDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã SP <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editMaSPSearchTerm}
                        onChange={(e) => {
                          setEditMaSPSearchTerm(e.target.value);
                          setIsSearchingEditMaSP(true);
                          setShowEditMaSPDropdown(true);
                        }}
                        onFocus={() => {
                          setShowEditMaSPDropdown(true);
                          setIsSearchingEditMaSP(false);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                        placeholder="Tìm và chọn mã SP..."
                      />
                      <ChevronDown
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      {showEditMaSPDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredEditMaSPList.length > 0 ? (
                            filteredEditMaSPList.slice(0, 50).map((item) => (
                              <button
                                key={item.id}
                                onClick={() => selectEditMaSP(item)}
                                className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                              >
                                <span className="font-medium text-green-600">{item.maSP}</span>
                                <span className="text-gray-500 text-sm truncate">- {item.tenSP}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                              Không tìm thấy mã SP
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {editItem.maSP && (
                      <div className="mt-1 text-sm text-green-600">
                        Đã chọn: <strong>{editItem.maSP}</strong>
                      </div>
                    )}
                  </div>

                  {/* Other fields */}
                  {formFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={(editItem as any)[field.key] || ""}
                        onChange={(e) => setEditItem({ ...editItem, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder={`Nhập ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditItem(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isEditing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isEditing && <Loader2 size={16} className="animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa định mức"
        message={`Bạn có chắc muốn xóa định mức cho sản phẩm "${itemToDelete?.maSP || ""}"?`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
