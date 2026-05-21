"use client";

import {
  Loader2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Portal from "@/components/Portal";
import ImagePickerModal from "@/components/ImagePickerModal";
import toast from "react-hot-toast";

interface DanhMucHinhIn {
  id: number;
  maHinhIn: string;
  thongTinHinhIn: string;
  hinhAnh: string;
  anhMinhHoa: string;
  maSPSuDung: string;
  tonKho: number;
}

interface SanPham {
  id: number;
  maSP: string;
  tenSP: string;
}

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      (opt.value || "").toLowerCase().includes(search.toLowerCase()) ||
      (opt.label || "").toLowerCase().includes(search.toLowerCase()),
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
          {selectedOption
            ? `${selectedOption.value || ""} - ${selectedOption.label || ""}`
            : placeholder}
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
              <div className="px-3 py-2 text-gray-500 text-sm text-center">
                Không tìm thấy
              </div>
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
                    value === opt.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : ""
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

const emptyForm = {
  maHinhIn: "",
  thongTinHinhIn: "",
  hinhAnh: "",
  anhMinhHoa: "",
  maSPSuDung: "",
  tonKho: "",
};

export default function DanhMucHinhInTab() {
  const [data, setData] = useState<DanhMucHinhIn[]>([]);
  const [products, setProducts] = useState<SanPham[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DanhMucHinhIn | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DanhMucHinhIn | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerField, setImagePickerField] = useState<
    "hinhAnh" | "anhMinhHoa"
  >("hinhAnh");
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState(emptyForm);

  const resetForm = () => setFormData(emptyForm);

  const filteredList = data.filter(
    (item) =>
      item.maHinhIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.thongTinHinhIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSPSuDung.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
    fetchProducts();
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

  const handleView = (item: DanhMucHinhIn) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleAdd = async () => {
    if (!formData.maHinhIn.trim()) {
      toast.error("Mã hình in là bắt buộc");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/danh-muc-hinh-in/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

    try {
      setSaving(true);
      const response = await fetch("/api/danh-muc-hinh-in/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id, ...formData }),
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
      const response = await fetch(
        `/api/danh-muc-hinh-in/delete?id=${itemToDelete.id}`,
        { method: "DELETE" },
      );
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
    setFormData({
      maHinhIn: item.maHinhIn,
      thongTinHinhIn: item.thongTinHinhIn,
      hinhAnh: item.hinhAnh,
      anhMinhHoa: item.anhMinhHoa,
      maSPSuDung: item.maSPSuDung,
      tonKho: item.tonKho ? item.tonKho.toString() : "",
    });
    setShowEditModal(true);
  };

  const productOptions = products
    .filter((p) => p.maSP)
    .map((p) => ({ value: p.maSP, label: p.tenSP || "" }));

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
        {/* Header */}
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
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm mã HI, thông tin, mã SP..."
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
                <th className="px-3 py-3 text-left font-medium text-gray-500 w-12">
                  STT
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">
                  Mã hình in
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">
                  Thông tin hình in
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-20">
                  Hình ảnh
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-24">
                  Ảnh minh họa
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">
                  Mã SP sử dụng
                </th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">
                  Tồn kho
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-28">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedList.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleView(item)}
                >
                  <td className="px-3 py-2.5 text-gray-600">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">
                    {item.maHinhIn || "-"}
                  </td>
                  <td
                    className="px-3 py-2.5 text-gray-900 max-w-[220px] truncate"
                    title={item.thongTinHinhIn}
                  >
                    {item.thongTinHinhIn || "-"}
                  </td>
                  <td
                    className="px-3 py-2.5 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.hinhAnh ? (
                      <img
                        src={item.hinhAnh}
                        alt={item.maHinhIn}
                        className="w-10 h-10 object-cover rounded mx-auto cursor-zoom-in hover:opacity-80"
                        onClick={() => setZoomedImageUrl(item.hinhAnh)}
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2.5 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.anhMinhHoa ? (
                      <img
                        src={item.anhMinhHoa}
                        alt={`${item.maHinhIn} minh hoạ`}
                        className="w-10 h-10 object-cover rounded mx-auto cursor-zoom-in hover:opacity-80"
                        onClick={() => setZoomedImageUrl(item.anhMinhHoa)}
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2.5 text-gray-700 max-w-[150px] truncate"
                    title={item.maSPSuDung}
                  >
                    {item.maSPSuDung || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-700 font-medium">
                    {item.tonKho ? item.tonKho.toLocaleString("vi-VN") : "0"}
                  </td>
                  <td
                    className="px-3 py-2.5 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                Hiển thị {startIndex + 1} -{" "}
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredList.length)} /{" "}
                {filteredList.length} mục
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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

      {/* Zoom overlay */}
      {zoomedImageUrl && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 cursor-zoom-out"
            onClick={() => setZoomedImageUrl(null)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImageUrl(null);
              }}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              aria-label="Đóng"
            >
              <X size={28} />
            </button>
            <img
              src={zoomedImageUrl}
              alt="Phóng to"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </Portal>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowViewModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Chi tiết hình in</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Mã hình in</label>
                  <p className="font-medium text-blue-600">
                    {selectedItem.maHinhIn || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Mã SP sử dụng</label>
                  <p className="font-medium">
                    {selectedItem.maSPSuDung || "-"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">
                  Thông tin hình in
                </label>
                <p className="font-medium whitespace-pre-line">
                  {selectedItem.thongTinHinhIn || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Tồn kho</label>
                <p className="font-medium text-green-700">
                  {selectedItem.tonKho
                    ? selectedItem.tonKho.toLocaleString("vi-VN")
                    : "0"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Hình ảnh</label>
                  {selectedItem.hinhAnh ? (
                    <img
                      src={selectedItem.hinhAnh}
                      alt={selectedItem.maHinhIn}
                      className="mt-1 w-32 h-32 object-cover rounded-lg border cursor-zoom-in"
                      onClick={() => setZoomedImageUrl(selectedItem.hinhAnh)}
                    />
                  ) : (
                    <p className="text-gray-400 italic text-sm">Không có</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Ảnh minh họa</label>
                  {selectedItem.anhMinhHoa ? (
                    <img
                      src={selectedItem.anhMinhHoa}
                      alt={`${selectedItem.maHinhIn} minh hoạ`}
                      className="mt-1 w-32 h-32 object-cover rounded-lg border cursor-zoom-in"
                      onClick={() => setZoomedImageUrl(selectedItem.anhMinhHoa)}
                    />
                  ) : (
                    <p className="text-gray-400 italic text-sm">Không có</p>
                  )}
                </div>
              </div>
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

      {/* Add / Edit shared form (rendered in both modals) */}
      {(showAddModal || showEditModal) && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {showAddModal
                    ? "Thêm danh mục hình in"
                    : "Sửa danh mục hình in"}
                </h2>
                <button
                  onClick={() => {
                    if (showAddModal) setShowAddModal(false);
                    else setShowEditModal(false);
                  }}
                  disabled={saving}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã hình in <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.maHinhIn}
                      onChange={(e) =>
                        setFormData({ ...formData, maHinhIn: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: HI17"
                    />
                  </div>
                  <div className="relative z-10">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã SP sử dụng
                    </label>
                    <SearchableDropdown
                      options={productOptions}
                      value={formData.maSPSuDung}
                      onChange={(value) =>
                        setFormData({ ...formData, maSPSuDung: value })
                      }
                      placeholder="Chọn mã SP"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thông tin hình in
                  </label>
                  <textarea
                    value={formData.thongTinHinhIn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thongTinHinhIn: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Boy 13.6*20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    value={formData.tonKho}
                    onChange={(e) =>
                      setFormData({ ...formData, tonKho: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hình ảnh
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.hinhAnh}
                        onChange={(e) =>
                          setFormData({ ...formData, hinhAnh: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Link hình ảnh..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePickerField("hinhAnh");
                          setShowImagePicker(true);
                        }}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm font-medium whitespace-nowrap"
                      >
                        <ImageIcon size={16} />
                        Chọn
                      </button>
                    </div>
                    {formData.hinhAnh && (
                      <div className="mt-2">
                        <img
                          src={formData.hinhAnh}
                          alt="Preview"
                          className="h-24 w-24 object-cover rounded-lg border cursor-zoom-in"
                          onClick={() => setZoomedImageUrl(formData.hinhAnh)}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ảnh minh họa
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.anhMinhHoa}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            anhMinhHoa: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Link ảnh minh họa..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePickerField("anhMinhHoa");
                          setShowImagePicker(true);
                        }}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm font-medium whitespace-nowrap"
                      >
                        <ImageIcon size={16} />
                        Chọn
                      </button>
                    </div>
                    {formData.anhMinhHoa && (
                      <div className="mt-2">
                        <img
                          src={formData.anhMinhHoa}
                          alt="Preview"
                          className="h-24 w-24 object-cover rounded-lg border cursor-zoom-in"
                          onClick={() => setZoomedImageUrl(formData.anhMinhHoa)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
                <button
                  onClick={() => {
                    if (showAddModal) setShowAddModal(false);
                    else setShowEditModal(false);
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={showAddModal ? handleAdd : handleEdit}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    showAddModal
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {showAddModal ? "Thêm" : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(url) => {
          setFormData({ ...formData, [imagePickerField]: url });
        }}
        currentImage={formData[imagePickerField]}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Xác nhận xóa
                </h2>
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
                  Bạn có chắc muốn xóa hình in &quot;{itemToDelete.maHinhIn}
                  &quot;?
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
