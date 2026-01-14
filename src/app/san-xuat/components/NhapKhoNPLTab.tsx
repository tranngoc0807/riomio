"use client";

import { Eye, Loader2, X, Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import type { NhapKhoNPL, Material, TonKhoNPLThang } from "@/lib/googleSheets";
import { useAuth } from "@/context/AuthContext";

const ITEMS_PER_PAGE = 20;

type ModalMode = "view" | "add" | "edit" | null;

export default function NhapKhoNPLTab() {
  const { profile } = useAuth();
  const [data, setData] = useState<NhapKhoNPL[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Materials list for dropdown
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tồn kho NPL data
  const [tonKhoData, setTonKhoData] = useState<TonKhoNPLThang[]>([]);
  const [tonKhoThucTe, setTonKhoThucTe] = useState<number | null>(null);

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedItem, setSelectedItem] = useState<NhapKhoNPL | null>(null);
  const [formData, setFormData] = useState<Partial<NhapKhoNPL>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<NhapKhoNPL | null>(null);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maPNKNPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maNPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ncc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nguoiNhap.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMaterialDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    fetchMaterials();
    fetchTonKhoNPL();
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoadingMaterials(true);
      const response = await fetch("/api/materials");
      const result = await response.json();
      if (result.success) {
        setMaterials(result.data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  const fetchTonKhoNPL = async () => {
    try {
      const response = await fetch("/api/ton-kho-npl");
      const result = await response.json();
      if (result.success) {
        const data = result.data.tonKhoThang || [];
        console.log("Loaded tonKhoData:", data.length, "items");
        console.log("Sample maNPL values:", data.slice(0, 5).map((t: TonKhoNPLThang) => t.maNPL));
        setTonKhoData(data);
      }
    } catch (error) {
      console.error("Error fetching ton kho NPL:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/nhap-kho-npl");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải danh sách nhập kho NPL");
      }
    } catch (error) {
      console.error("Error fetching nhap kho NPL:", error);
      toast.error("Lỗi khi tải danh sách nhập kho NPL");
    } finally {
      setIsLoading(false);
    }
  };

  const openViewModal = (item: NhapKhoNPL) => {
    setSelectedItem(item);
    setModalMode("view");
  };

  // Lấy tên người dùng từ profile hoặc localStorage
  const getCurrentUserName = (): string => {
    // Ưu tiên lấy từ profile context
    if (profile?.full_name) {
      return profile.full_name;
    }
    // Fallback: lấy từ localStorage cache
    try {
      const cached = localStorage.getItem("riomio_profile_cache");
      if (cached) {
        const { profile: cachedProfile } = JSON.parse(cached);
        if (cachedProfile?.full_name) {
          return cachedProfile.full_name;
        }
      }
    } catch (e) {
      console.warn("Error reading profile from localStorage:", e);
    }
    return "";
  };

  const openAddModal = () => {
    setFormData({
      maPNKNPL: "",
      ngayThang: new Date().toLocaleDateString("vi-VN"),
      nguoiNhap: getCurrentUserName(),
      noiDung: "",
      maNPL: "",
      ncc: "",
      dvt: "",
      soLuong: 0,
      donGiaSauThue: 0,
      ghiChu: "",
    });
    setMaterialSearch("");
    setShowMaterialDropdown(false);
    setTonKhoThucTe(null);
    setSelectedItem(null);
    setModalMode("add");
  };

  const openEditModal = (item: NhapKhoNPL) => {
    setFormData({
      maPNKNPL: item.maPNKNPL,
      ngayThang: item.ngayThang,
      nguoiNhap: item.nguoiNhap,
      noiDung: item.noiDung,
      maNPL: item.maNPL,
      ncc: item.ncc,
      dvt: item.dvt,
      soLuong: item.soLuong,
      donGiaSauThue: item.donGiaSauThue,
      ghiChu: item.ghiChu,
    });
    setMaterialSearch("");
    setShowMaterialDropdown(false);
    // Tìm tồn kho thực tế theo mã NPL của item đang sửa
    const tonKho = tonKhoData.find((t) => t.maNPL.trim() === item.maNPL.trim());
    setTonKhoThucTe(tonKho ? tonKho.tonCuoi : null);
    setSelectedItem(item);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedItem(null);
    setFormData({});
    setMaterialSearch("");
    setShowMaterialDropdown(false);
    setTonKhoThucTe(null);
  };

  const handleFormChange = (field: keyof NhapKhoNPL, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filtered materials for searchable dropdown
  const filteredMaterials = materials.filter(
    (m) =>
      m.code.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  // Handle material selection from dropdown
  const handleMaterialSelect = (material: Material) => {
    // Lưu maNPL là tên đầy đủ (material.name) để khớp với format trong sheet
    setFormData((prev) => ({
      ...prev,
      maNPL: material.name, // Dùng tên đầy đủ thay vì code
      ncc: material.supplier || "",
      dvt: material.unit || "",
      donGiaSauThue: material.priceWithTax || 0,
    }));
    setMaterialSearch("");
    setShowMaterialDropdown(false);

    // Tìm tồn kho thực tế - so sánh với tên đầy đủ
    const tonKho = tonKhoData.find((t) =>
      t.maNPL.trim() === material.name.trim()
    );
    console.log("Looking for maNPL:", material.name, "Found:", tonKho);
    setTonKhoThucTe(tonKho ? tonKho.tonCuoi : null);
  };

  // Get selected material name for display
  const getSelectedMaterialDisplay = () => {
    if (!formData.maNPL) return "";
    // maNPL giờ là tên đầy đủ, tìm material theo name
    const material = materials.find((m) => m.name === formData.maNPL);
    return material ? `${material.code} - ${material.name}` : formData.maNPL;
  };

  const handleSubmit = async () => {
    if (!formData.maPNKNPL || !formData.maNPL) {
      toast.error("Vui lòng nhập Mã PNKNPL và Mã NPL");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        const response = await fetch("/api/nhap-kho-npl/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Thêm nhập kho NPL thành công");
          fetchData();
          closeModal();
        } else {
          toast.error(result.error || "Không thể thêm nhập kho NPL");
        }
      } else if (modalMode === "edit" && selectedItem) {
        const response = await fetch("/api/nhap-kho-npl/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowIndex: selectedItem.id - 1,
            ...formData,
          }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Cập nhật nhập kho NPL thành công");
          fetchData();
          closeModal();
        } else {
          toast.error(result.error || "Không thể cập nhật nhập kho NPL");
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
      const response = await fetch(`/api/nhap-kho-npl/delete?rowIndex=${deleteConfirm.id - 1}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Xoá nhập kho NPL thành công");
        fetchData();
        setDeleteConfirm(null);
      } else {
        toast.error(result.error || "Không thể xoá nhập kho NPL");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Có lỗi xảy ra khi xoá");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const totalThanhTien = filteredList.reduce((sum, item) => sum + item.thanhTien, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-lg font-semibold">
          Danh sách nhập kho NPL ({filteredList.length})
        </h3>
        <div className="flex items-center gap-3">
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
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Thêm mới
          </button>
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
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã PNKNPL</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Ngày</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Người nhập</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã NPL</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">NCC</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">ĐVT</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">SL</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Đơn giá</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Thành tiền</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedList.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{item.maPNKNPL}</td>
                  <td className="px-3 py-2.5 text-gray-600">{item.ngayThang}</td>
                  <td className="px-3 py-2.5 text-gray-600">{item.nguoiNhap}</td>
                  <td className="px-3 py-2.5 text-gray-900">{item.maNPL}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[150px] truncate" title={item.ncc}>
                    {item.ncc}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{item.dvt}</td>
                  <td className="px-3 py-2.5 text-right text-gray-900">
                    {item.soLuong.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-900">
                    {item.donGiaSauThue > 0 ? item.donGiaSauThue.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-green-600">
                    {item.thanhTien > 0 ? item.thanhTien.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openViewModal(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                        title="Sửa"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Xoá"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={9} className="px-3 py-3 text-right">Tổng cộng:</td>
                <td className="px-3 py-3 text-right text-green-600">
                  {totalThanhTien.toLocaleString("vi-VN")}đ
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {filteredList.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu nhập kho NPL
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-wrap gap-3">
              <div className="text-sm text-gray-500">
                Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredList.length)} / {filteredList.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
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
      )}

      {/* View/Add/Edit Modal */}
      {modalMode && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={closeModal} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === "view" && "Chi tiết phiếu nhập kho"}
                  {modalMode === "add" && "Thêm nhập kho NPL mới"}
                  {modalMode === "edit" && "Sửa nhập kho NPL"}
                </h3>
                {modalMode === "view" && selectedItem && (
                  <p className="text-sm text-gray-500">{selectedItem.maPNKNPL}</p>
                )}
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {modalMode === "view" && selectedItem ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Mã PNKNPL:</span>
                      <p className="font-medium text-blue-600">{selectedItem.maPNKNPL}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Ngày tháng:</span>
                      <p className="font-medium">{selectedItem.ngayThang}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Người nhập:</span>
                      <p className="font-medium">{selectedItem.nguoiNhap || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Nội dung:</span>
                      <p className="font-medium">{selectedItem.noiDung || "-"}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Mã NPL:</span>
                        <p className="font-medium">{selectedItem.maNPL}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Nhà cung cấp:</span>
                        <p className="font-medium">{selectedItem.ncc || "-"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Đơn vị tính:</span>
                        <p className="font-medium">{selectedItem.dvt || "-"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Số lượng:</span>
                        <p className="font-medium">{selectedItem.soLuong.toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Đơn giá (sau thuế):</span>
                        <p className="font-medium">
                          {selectedItem.donGiaSauThue > 0
                            ? `${selectedItem.donGiaSauThue.toLocaleString("vi-VN")}đ`
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Thành tiền:</span>
                        <p className="font-medium text-lg text-green-600">
                          {selectedItem.thanhTien > 0
                            ? `${selectedItem.thanhTien.toLocaleString("vi-VN")}đ`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Tồn thực tế:</span>
                        <p className="font-medium">{selectedItem.tonThucTe.toLocaleString("vi-VN")}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Ghi chú:</span>
                        <p className="font-medium">{selectedItem.ghiChu || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã PNKNPL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.maPNKNPL || ""}
                        onChange={(e) => handleFormChange("maPNKNPL", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: PNK001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày tháng
                      </label>
                      <input
                        type="text"
                        value={formData.ngayThang || ""}
                        onChange={(e) => handleFormChange("ngayThang", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: 14/01/2026"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Người nhập
                      </label>
                      <input
                        type="text"
                        value={formData.nguoiNhap || ""}
                        onChange={(e) => handleFormChange("nguoiNhap", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập tên người nhập"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nội dung
                      </label>
                      <input
                        type="text"
                        value={formData.noiDung || ""}
                        onChange={(e) => handleFormChange("noiDung", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nội dung nhập kho"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mã NPL <span className="text-red-500">*</span>
                        </label>
                        <div className="relative" ref={dropdownRef}>
                          {/* Selected value display */}
                          {formData.maNPL && !showMaterialDropdown ? (
                            <div
                              onClick={() => setShowMaterialDropdown(true)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-blue-400"
                            >
                              <span className="text-gray-900">{getSelectedMaterialDisplay()}</span>
                              <X
                                size={18}
                                className="text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData((prev) => ({
                                    ...prev,
                                    maNPL: "",
                                    ncc: "",
                                    dvt: "",
                                    donGiaSauThue: 0,
                                  }));
                                  setTonKhoThucTe(null);
                                }}
                              />
                            </div>
                          ) : (
                            <>
                              {/* Search input */}
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                  type="text"
                                  value={materialSearch}
                                  onChange={(e) => {
                                    setMaterialSearch(e.target.value);
                                    setShowMaterialDropdown(true);
                                  }}
                                  onFocus={() => setShowMaterialDropdown(true)}
                                  placeholder="Tìm kiếm mã NPL hoặc tên..."
                                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <ChevronDown
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                                  size={20}
                                  onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
                                />
                              </div>

                              {/* Dropdown list */}
                              {showMaterialDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {isLoadingMaterials ? (
                                    <div className="px-4 py-3 text-gray-500 flex items-center gap-2">
                                      <Loader2 size={16} className="animate-spin" />
                                      Đang tải...
                                    </div>
                                  ) : filteredMaterials.length === 0 ? (
                                    <div className="px-4 py-3 text-gray-500">
                                      Không tìm thấy kết quả
                                    </div>
                                  ) : (
                                    filteredMaterials.map((material) => (
                                      <div
                                        key={material.id}
                                        onClick={() => handleMaterialSelect(material)}
                                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                      >
                                        <div className="font-medium text-gray-900">{material.code}</div>
                                        <div className="text-sm text-gray-500">{material.name}</div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nhà cung cấp
                        </label>
                        <input
                          type="text"
                          value={formData.ncc || ""}
                          onChange={(e) => handleFormChange("ncc", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          placeholder="Tự động điền khi chọn NPL"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Đơn vị tính
                        </label>
                        <input
                          type="text"
                          value={formData.dvt || ""}
                          onChange={(e) => handleFormChange("dvt", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          placeholder="Tự động điền khi chọn NPL"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số lượng
                        </label>
                        <input
                          type="number"
                          value={formData.soLuong || ""}
                          onChange={(e) => handleFormChange("soLuong", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Đơn giá sau thuế
                        </label>
                        <input
                          type="number"
                          value={formData.donGiaSauThue || ""}
                          onChange={(e) => handleFormChange("donGiaSauThue", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          placeholder="Tự động điền khi chọn NPL"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thành tiền
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-semibold">
                          {((formData.soLuong || 0) * (formData.donGiaSauThue || 0)).toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tồn kho thực tế
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-blue-50 text-blue-700 font-semibold">
                          {tonKhoThucTe !== null ? tonKhoThucTe.toLocaleString("vi-VN") : "Chọn NPL để xem"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ghi chú
                        </label>
                        <input
                          type="text"
                          value={formData.ghiChu || ""}
                          onChange={(e) => handleFormChange("ghiChu", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ghi chú"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              {modalMode === "view" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => selectedItem && openEditModal(selectedItem)}
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Pencil size={18} />
                    Sửa
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                    {modalMode === "add" ? "Thêm mới" : "Cập nhật"}
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                  >
                    Huỷ
                  </button>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xoá</h3>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xoá phiếu nhập kho <span className="font-semibold text-blue-600">{deleteConfirm.maPNKNPL}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                  Xoá
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
