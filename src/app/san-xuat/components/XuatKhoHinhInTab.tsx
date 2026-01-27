"use client";

import { Loader2, X, Search, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";

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
  hinhAnh: string;
  donGiaChuaThue: number;
  thueSuat: string;
  donGiaCoThue: number;
  maSPSuDung: string;
  xuongIn: string;
}

// Interface for selected hinh in in the form
interface SelectedHinhIn {
  id: string;
  maHinhIn: string;
  maSPSuDung: string;
  soLuong: number;
  ghiChu: string;
}

// Interface for grouped phieu xuat
interface GroupedPhieuXuat {
  maPhieu: string;
  ngayThang: string;
  items: XuatKhoHinhIn[];
  totalItems: number;
  totalSoLuong: number;
}

const ITEMS_PER_PAGE = 50;

export default function XuatKhoHinhInTab() {
  const [data, setData] = useState<XuatKhoHinhIn[]>([]);
  const [danhMucHinhIn, setDanhMucHinhIn] = useState<DanhMucHinhIn[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [viewGroupedPhieu, setViewGroupedPhieu] = useState<GroupedPhieuXuat | null>(null);
  const [phieuToDelete, setPhieuToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formMaPhieu, setFormMaPhieu] = useState("");
  const [formNgayThang, setFormNgayThang] = useState(new Date().toISOString().split("T")[0]);
  const [selectedHinhIns, setSelectedHinhIns] = useState<SelectedHinhIn[]>([]);

  // Hinh In search
  const [hinhInSearchTerm, setHinhInSearchTerm] = useState("");
  const [showHinhInDropdown, setShowHinhInDropdown] = useState(false);
  const hinhInDropdownRef = useRef<HTMLDivElement>(null);

  // Filter danh muc hinh in
  const filteredDanhMuc = danhMucHinhIn.filter(
    (m) =>
      (m.maHinhIn && m.maHinhIn.toLowerCase().includes(hinhInSearchTerm.toLowerCase())) ||
      (m.thongTinHinhIn && m.thongTinHinhIn.toLowerCase().includes(hinhInSearchTerm.toLowerCase()))
  );

  // Group phieu xuat kho by maPhieuXuat
  const groupedPhieuXuat: GroupedPhieuXuat[] = useMemo(() => {
    const groups: Record<string, GroupedPhieuXuat> = {};

    data.forEach((item) => {
      if (!groups[item.maPhieuXuat]) {
        groups[item.maPhieuXuat] = {
          maPhieu: item.maPhieuXuat,
          ngayThang: item.ngayThang,
          items: [],
          totalItems: 0,
          totalSoLuong: 0,
        };
      }
      groups[item.maPhieuXuat].items.push(item);
      groups[item.maPhieuXuat].totalItems = groups[item.maPhieuXuat].items.length;
      groups[item.maPhieuXuat].totalSoLuong += item.soLuong || 0;
    });

    return Object.values(groups);
  }, [data]);

  // Filtered grouped phieu
  const filteredGroupedPhieu = groupedPhieuXuat.filter(
    (g) =>
      g.maPhieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.items.some((item) =>
        item.maHinhIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.maSPSuDung.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Pagination
  const totalPages = Math.ceil(filteredGroupedPhieu.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredGroupedPhieu.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hinhInDropdownRef.current &&
        !hinhInDropdownRef.current.contains(event.target as Node)
      ) {
        setShowHinhInDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const generateNextMaPhieu = (): string => {
    if (data.length === 0) {
      return "PXKHI001";
    }

    const codeNumbers = data
      .map((item) => {
        const match = item.maPhieuXuat.match(/PXKHI(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNumber = Math.max(...codeNumbers, 0);
    return `PXKHI${String(maxNumber + 1).padStart(3, "0")}`;
  };

  const handleOpenAddModal = () => {
    const nextCode = generateNextMaPhieu();
    setFormMaPhieu(nextCode);
    setFormNgayThang(new Date().toISOString().split("T")[0]);
    setSelectedHinhIns([]);
    setShowAddModal(true);
  };

  const handleAddHinhInToList = (hinhIn: DanhMucHinhIn) => {
    const newHinhIn: SelectedHinhIn = {
      id: `${hinhIn.maHinhIn}-${Date.now()}`,
      maHinhIn: hinhIn.maHinhIn,
      maSPSuDung: hinhIn.maSPSuDung || "",
      soLuong: 1,
      ghiChu: "",
    };

    setSelectedHinhIns([...selectedHinhIns, newHinhIn]);
    setHinhInSearchTerm("");
    setShowHinhInDropdown(false);
  };

  const handleRemoveHinhInFromList = (id: string) => {
    setSelectedHinhIns(selectedHinhIns.filter((h) => h.id !== id));
  };

  const handleUpdateHinhIn = (
    id: string,
    field: keyof SelectedHinhIn,
    value: any
  ) => {
    setSelectedHinhIns(
      selectedHinhIns.map((h) => {
        if (h.id !== id) return h;
        return { ...h, [field]: value };
      })
    );
  };

  const handleAddPhieuXuat = async () => {
    if (!formMaPhieu || !formNgayThang) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (selectedHinhIns.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 mã hình in");
      return;
    }

    try {
      setIsAdding(true);

      for (const hinhIn of selectedHinhIns) {
        const phieuData = {
          maPhieuXuat: formMaPhieu,
          ngayThang: new Date(formNgayThang).toLocaleDateString("vi-VN"),
          maHinhIn: hinhIn.maHinhIn,
          maSPSuDung: hinhIn.maSPSuDung,
          soLuong: hinhIn.soLuong,
          ghiChu: hinhIn.ghiChu,
        };

        const response = await fetch("/api/xuat-kho-hinh-in/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(phieuData),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(`Lỗi khi thêm mã hình in ${hinhIn.maHinhIn}`);
        }
      }

      await fetchData();
      setShowAddModal(false);
      toast.success(
        `Thêm phiếu xuất kho ${formMaPhieu} thành công (${selectedHinhIns.length} mã hình in)`
      );
    } catch (error) {
      console.error("Error adding phieu xuat:", error);
      toast.error("Lỗi khi thêm phiếu xuất kho");
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewGrouped = (group: GroupedPhieuXuat) => {
    setViewGroupedPhieu(group);
    setShowViewModal(true);
  };

  const handleDeleteGrouped = (maPhieu: string) => {
    setPhieuToDelete(maPhieu);
    setShowDeleteModal(true);
  };

  const confirmDeleteGrouped = async () => {
    if (!phieuToDelete) return;

    try {
      setIsDeleting(true);

      const itemsToDelete = data.filter((item) => item.maPhieuXuat === phieuToDelete);

      for (const item of itemsToDelete) {
        const response = await fetch(`/api/xuat-kho-hinh-in/delete?id=${item.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (!result.success) {
          toast.error(`Lỗi khi xóa item ${item.id}`);
        }
      }

      await fetchData();
      setShowDeleteModal(false);
      setPhieuToDelete(null);
      toast.success(
        `Xóa phiếu xuất kho ${phieuToDelete} thành công (${itemsToDelete.length} mã hình in)`
      );
    } catch (error) {
      console.error("Error deleting phieu xuat:", error);
      toast.error("Lỗi khi xóa phiếu xuất kho");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteItemModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/xuat-kho-hinh-in/delete?id=${itemToDelete}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        await fetchData();

        // Update viewGroupedPhieu if it's open
        if (viewGroupedPhieu) {
          const updatedItems = viewGroupedPhieu.items.filter(item => item.id.toString() !== itemToDelete);
          if (updatedItems.length === 0) {
            // If no items left, close the modal
            setShowViewModal(false);
            setViewGroupedPhieu(null);
          } else {
            // Update the viewGroupedPhieu with remaining items
            const updatedGroup = {
              ...viewGroupedPhieu,
              items: updatedItems,
              totalItems: updatedItems.length,
              totalSoLuong: updatedItems.reduce((sum, item) => sum + (item.soLuong || 0), 0),
            };
            setViewGroupedPhieu(updatedGroup);
          }
        }

        setShowDeleteItemModal(false);
        setItemToDelete(null);
        toast.success("Xóa mã hình in thành công");
      } else {
        toast.error("Lỗi khi xóa mã hình in");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Lỗi khi xóa mã hình in");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate totals
  const totalSoLuong = filteredGroupedPhieu.reduce(
    (sum, group) => sum + group.totalSoLuong,
    0
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            Danh sách phiếu xuất kho hình in ({filteredGroupedPhieu.length})
          </h3>
          <div className="flex-1 max-w-md relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Tạo phiếu xuất kho
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <p className="text-sm text-orange-600 mb-1">Số lượng phiếu</p>
          <p className="text-2xl font-bold text-orange-700">
            {filteredGroupedPhieu.length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-600 mb-1">Tổng số lượng xuất</p>
          <p className="text-2xl font-bold text-red-700">
            {totalSoLuong.toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Table - Grouped */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : filteredGroupedPhieu.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không có dữ liệu xuất kho hình in
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã phiếu</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Ngày</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Số mã HI</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Tổng SL</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedList.map((group) => (
                <tr key={group.maPhieu} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewGrouped(group)}>
                  <td className="px-3 py-3 font-medium text-blue-600">{group.maPhieu}</td>
                  <td className="px-3 py-3 text-gray-600">{group.ngayThang}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {group.items.length}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-red-600">
                    {group.totalSoLuong > 0 ? group.totalSoLuong.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDeleteGrouped(group.maPhieu)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
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
                <td colSpan={3} className="px-3 py-3 text-right">Tổng cộng:</td>
                <td className="px-3 py-3 text-center text-red-600">
                  {totalSoLuong.toLocaleString("vi-VN")}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredGroupedPhieu.length)} / {filteredGroupedPhieu.length} mục
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

      {/* Modal thêm phiếu xuất kho */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowAddModal(false); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isAdding && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-70 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-700 font-medium">Đang tạo phiếu xuất kho...</p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Tạo phiếu xuất kho mới</h3>
                <p className="text-sm text-gray-500">Mã phiếu: {formMaPhieu}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAdding}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Form Info */}
              <div className="flex gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={formMaPhieu}
                    readOnly
                    className="w-36 px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ngày tháng</label>
                  <input
                    type="date"
                    value={formNgayThang}
                    onChange={(e) => setFormNgayThang(e.target.value)}
                    className="w-40 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Add Hinh In Section */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                <div className="relative" ref={hinhInDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thêm mã hình in</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={hinhInSearchTerm}
                      onChange={(e) => {
                        setHinhInSearchTerm(e.target.value);
                        setShowHinhInDropdown(true);
                      }}
                      onFocus={() => setShowHinhInDropdown(true)}
                      placeholder="Tìm mã hình in..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  {showHinhInDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredDanhMuc.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy</div>
                      ) : (
                        filteredDanhMuc.slice(0, 50).map((hinhIn) => (
                          <div
                            key={hinhIn.id}
                            onClick={() => handleAddHinhInToList(hinhIn)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-blue-600">{hinhIn.maHinhIn}</div>
                            <div className="text-xs text-gray-600">{hinhIn.thongTinHinhIn}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Mã SP: {hinhIn.maSPSuDung || "-"}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Hinh Ins Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã hình in ({selectedHinhIns.length})
                  </h4>
                </div>
                {selectedHinhIns.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có mã hình in nào. Tìm và thêm mã hình in ở trên.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã hình in</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP sử dụng</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">SL</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedHinhIns.map((hinhIn, index) => (
                          <tr key={hinhIn.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-3 py-2 text-sm font-medium text-blue-600">{hinhIn.maHinhIn}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{hinhIn.maSPSuDung || "-"}</td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={hinhIn.soLuong || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  handleUpdateHinhIn(hinhIn.id, "soLuong", parseInt(value) || 0);
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <textarea
                                value={hinhIn.ghiChu}
                                onChange={(e) => handleUpdateHinhIn(hinhIn.id, "ghiChu", e.target.value)}
                                placeholder="Ghi chú"
                                rows={1}
                                className="w-32 min-w-32 px-2 py-1 border border-gray-300 rounded text-sm resize"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleRemoveHinhInFromList(hinhIn.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-sm font-medium text-right">Tổng số lượng:</td>
                          <td className="px-3 py-2 text-sm text-center font-semibold text-red-600">
                            {selectedHinhIns.reduce((sum, h) => sum + h.soLuong, 0).toLocaleString("vi-VN")}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAdding}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddPhieuXuat}
                disabled={isAdding || selectedHinhIns.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Tạo phiếu xuất kho ({selectedHinhIns.length} mã HI)
                  </>
                )}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem chi tiết phiếu - Grouped */}
      {showViewModal && viewGroupedPhieu && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowViewModal(false); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết phiếu xuất kho</h3>
                <p className="text-sm text-gray-500">{viewGroupedPhieu.maPhieu}</p>
              </div>
              <button onClick={() => { setShowViewModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header Info */}
              <div className="flex gap-6 mb-6 p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500">Mã phiếu:</span>
                  <p className="font-medium text-blue-600 text-sm">{viewGroupedPhieu.maPhieu}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Ngày tháng:</span>
                  <p className="font-medium text-sm">{viewGroupedPhieu.ngayThang}</p>
                </div>
              </div>

              {/* Hinh In Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã hình in ({viewGroupedPhieu.items.length})
                    <span className="ml-2 text-red-600">- Tổng SL: {viewGroupedPhieu.totalSoLuong.toLocaleString("vi-VN")}</span>
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã hình in</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP sử dụng</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">SL</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewGroupedPhieu.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2 text-sm font-medium text-blue-600">{item.maHinhIn}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{item.maSPSuDung || "-"}</td>
                          <td className="px-3 py-2 text-sm text-right text-red-600 font-medium">{item.soLuong.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2 text-sm">{item.ghiChu || "-"}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleDeleteItem(item.id.toString())}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-sm font-medium text-right">Tổng số lượng:</td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-red-600">
                          {viewGroupedPhieu.totalSoLuong.toLocaleString("vi-VN")}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa phiếu */}
      {showDeleteModal && phieuToDelete && (
        <Portal>
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">
                  Xác nhận xóa phiếu xuất kho
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPhieuToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-700 mb-2">
                Bạn có chắc chắn muốn xóa phiếu xuất kho{" "}
                <span className="font-semibold text-blue-600">
                  {phieuToDelete}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPhieuToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteGrouped}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa item */}
      {showDeleteItemModal && itemToDelete && (
        <Portal>
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">
                  Xác nhận xóa mã hình in
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteItemModal(false);
                    setItemToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-700 mb-2">
                Bạn có chắc chắn muốn xóa mã hình in này khỏi phiếu xuất kho?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteItemModal(false);
                    setItemToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteItem}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
