"use client";

import { Eye, Loader2, X, Search, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import type { Workshop, DonGiaGiaCong } from "@/lib/googleSheets";

interface BangKeGiaCong {
  id: number;
  maPGC: string;
  ngayThang: string;
  maSPSX: string;
  maSP: string;
  xuongSX: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  phanLoai: string;
  doiSoat: string;
  ghiChu: string;
}

// Interface for selected product in the form
interface SelectedProduct {
  id: string;
  maSPSX: string;
  maSP: string;
  xuongSX: string;
  phanLoai: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  doiSoat: string;
  ghiChu: string;
}

// Interface for grouped phieu gia cong
interface GroupedPhieuGiaCong {
  maPGC: string;
  ngayThang: string;
  xuongSX: string;
  phanLoai: string;
  doiSoat: string;
  items: BangKeGiaCong[];
  totalItems: number;
  totalSoLuong: number;
  totalThanhTien: number;
}

const ITEMS_PER_PAGE = 50;

// Helper function to get cached profile
const getCachedProfileName = (): string => {
  try {
    const cached = localStorage.getItem("riomio_profile_cache");
    if (cached) {
      const { profile } = JSON.parse(cached);
      return profile?.full_name || profile?.email || "";
    }
  } catch (e) {
    console.warn("Error reading cached profile:", e);
  }
  return "";
};

export default function BangKeGiaCongTab() {
  const { profile } = useAuth();
  const [data, setData] = useState<BangKeGiaCong[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [viewGroupedPhieu, setViewGroupedPhieu] = useState<GroupedPhieuGiaCong | null>(null);
  const [phieuToDelete, setPhieuToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Workshops list
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  // Don gia gia cong list for auto-fill
  const [donGiaList, setDonGiaList] = useState<DonGiaGiaCong[]>([]);

  // Form states
  const [formMaPGC, setFormMaPGC] = useState("");
  const [formNgayThang, setFormNgayThang] = useState(new Date().toISOString().split("T")[0]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Group phieu gia cong by maPGC
  const groupedPhieuGiaCong: GroupedPhieuGiaCong[] = useMemo(() => {
    const groups: Record<string, GroupedPhieuGiaCong> = {};

    data.forEach((item) => {
      if (!groups[item.maPGC]) {
        groups[item.maPGC] = {
          maPGC: item.maPGC,
          ngayThang: item.ngayThang,
          xuongSX: item.xuongSX,
          phanLoai: item.phanLoai,
          doiSoat: item.doiSoat,
          items: [],
          totalItems: 0,
          totalSoLuong: 0,
          totalThanhTien: 0,
        };
      }
      groups[item.maPGC].items.push(item);
      groups[item.maPGC].totalItems = groups[item.maPGC].items.length;
      groups[item.maPGC].totalSoLuong += item.soLuong || 0;
      groups[item.maPGC].totalThanhTien += item.thanhTien || 0;
    });

    return Object.values(groups);
  }, [data]);

  // Filtered grouped phieu
  const filteredGroupedPhieu = groupedPhieuGiaCong.filter(
    (g) =>
      g.maPGC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.xuongSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phanLoai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.items.some((item) =>
        item.maSPSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.maSP.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Pagination
  const totalPages = Math.ceil(filteredGroupedPhieu.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredGroupedPhieu.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    fetchWorkshops();
    fetchDonGiaGiaCong();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/bang-ke-gia-cong");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải danh sách bảng kê gia công");
      }
    } catch (error) {
      console.error("Error fetching bang ke gia cong:", error);
      toast.error("Lỗi khi tải danh sách bảng kê gia công");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const response = await fetch("/api/xuong-san-xuat");
      const result = await response.json();
      if (result.success) {
        setWorkshops(result.data);
      }
    } catch (error) {
      console.error("Error fetching workshops:", error);
    }
  };

  const fetchDonGiaGiaCong = async () => {
    try {
      const response = await fetch("/api/don-gia-gia-cong");
      const result = await response.json();
      if (result.success) {
        setDonGiaList(result.data);
      }
    } catch (error) {
      console.error("Error fetching don gia gia cong:", error);
    }
  };

  const generateNextMaPGC = (): string => {
    if (data.length === 0) {
      return "PGC001";
    }

    const codeNumbers = data
      .map((item) => {
        const match = item.maPGC.match(/PGC(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNumber = Math.max(...codeNumbers, 0);
    return `PGC${String(maxNumber + 1).padStart(3, "0")}`;
  };

  const handleOpenAddModal = () => {
    const nextCode = generateNextMaPGC();
    setFormMaPGC(nextCode);
    setFormNgayThang(new Date().toISOString().split("T")[0]);
    setSelectedProducts([]);
    setShowAddModal(true);
  };

  const handleAddProductToList = () => {
    const newProduct: SelectedProduct = {
      id: `${Date.now()}-${Math.random()}`,
      maSPSX: "",
      maSP: "",
      xuongSX: "",
      phanLoai: "",
      soLuong: 0,
      donGia: 0,
      thanhTien: 0,
      doiSoat: "Chưa đối soát CN",
      ghiChu: "",
    };

    setSelectedProducts([...selectedProducts, newProduct]);
  };

  const handleRemoveProductFromList = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const handleMaSPSXChange = (productId: string, maSPSX: string) => {
    // Find matching don gia gia cong
    const matchingDonGia = donGiaList.find((dg) => dg.maSPNhapKho === maSPSX);

    setSelectedProducts(
      selectedProducts.map((p) => {
        if (p.id !== productId) return p;

        const updated = { ...p, maSPSX };

        if (matchingDonGia) {
          // Auto-fill maSP, xuongSX, phanLoai, and donGia for this product
          updated.maSP = matchingDonGia.maSP;
          updated.xuongSX = matchingDonGia.xuongSX;
          updated.phanLoai = matchingDonGia.mucLucSX;
          updated.donGia = matchingDonGia.donGia;
        }

        // Recalculate thanhTien
        updated.thanhTien = updated.soLuong * updated.donGia;

        return updated;
      })
    );
  };

  const handleUpdateProduct = (
    id: string,
    field: keyof SelectedProduct,
    value: any
  ) => {
    setSelectedProducts(
      selectedProducts.map((p) => {
        if (p.id !== id) return p;

        const updated = { ...p, [field]: value };

        if (field === "soLuong" || field === "donGia") {
          updated.thanhTien = updated.soLuong * updated.donGia;
        }

        return updated;
      })
    );
  };

  const calculateTotalThanhTien = () => {
    return selectedProducts.reduce((sum, p) => sum + p.thanhTien, 0);
  };

  const handleAddPhieuGiaCong = async () => {
    if (!formMaPGC || !formNgayThang) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 mã SP SX");
      return;
    }

    // Validate that all products have maSPSX
    const hasEmptyMaSPSX = selectedProducts.some((p) => !p.maSPSX.trim());
    if (hasEmptyMaSPSX) {
      toast.error("Vui lòng nhập mã SP SX cho tất cả các dòng");
      return;
    }

    try {
      setIsAdding(true);

      for (const product of selectedProducts) {
        const phieuData = {
          maPGC: formMaPGC,
          ngayThang: formNgayThang,
          maSPSX: product.maSPSX,
          maSP: product.maSP,
          xuongSX: product.xuongSX,
          soLuong: product.soLuong,
          donGia: product.donGia,
          phanLoai: product.phanLoai,
          doiSoat: product.doiSoat,
          ghiChu: product.ghiChu,
        };

        const response = await fetch("/api/bang-ke-gia-cong/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(phieuData),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(`Lỗi khi thêm mã SP SX ${product.maSPSX}`);
        }
      }

      await fetchData();
      setShowAddModal(false);
      toast.success(
        `Thêm phiếu gia công ${formMaPGC} thành công (${selectedProducts.length} mã SP SX)`
      );
    } catch (error) {
      console.error("Error adding phieu gia cong:", error);
      toast.error("Lỗi khi thêm phiếu gia công");
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewGrouped = (group: GroupedPhieuGiaCong) => {
    setViewGroupedPhieu(group);
    setShowViewModal(true);
  };

  const handleDeleteGrouped = (maPGC: string) => {
    setPhieuToDelete(maPGC);
    setShowDeleteModal(true);
  };

  const confirmDeleteGrouped = async () => {
    if (!phieuToDelete) return;

    try {
      setIsDeleting(true);

      const itemsToDelete = data.filter((item) => item.maPGC === phieuToDelete);

      for (const item of itemsToDelete) {
        const response = await fetch(`/api/bang-ke-gia-cong/delete?id=${item.id}`, {
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
        `Xóa phiếu gia công ${phieuToDelete} thành công (${itemsToDelete.length} mã SP SX)`
      );
    } catch (error) {
      console.error("Error deleting phieu gia cong:", error);
      toast.error("Lỗi khi xóa phiếu gia công");
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

      const response = await fetch(`/api/bang-ke-gia-cong/delete?id=${itemToDelete}`, {
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
              totalThanhTien: updatedItems.reduce((sum, item) => sum + (item.thanhTien || 0), 0),
            };
            setViewGroupedPhieu(updatedGroup);
          }
        }

        setShowDeleteItemModal(false);
        setItemToDelete(null);
        toast.success("Xóa mã SP SX thành công");
      } else {
        toast.error("Lỗi khi xóa mã SP SX");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Lỗi khi xóa mã SP SX");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate totals
  const totalThanhTien = filteredGroupedPhieu.reduce(
    (sum, group) => sum + group.totalThanhTien,
    0
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            Danh sách phiếu gia công ({filteredGroupedPhieu.length})
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
          Tạo phiếu gia công
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Số lượng phiếu</p>
          <p className="text-2xl font-bold text-blue-700">
            {filteredGroupedPhieu.length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Tổng thành tiền</p>
          <p className="text-2xl font-bold text-green-700">
            {totalThanhTien.toLocaleString("vi-VN")}đ
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
          Không có dữ liệu bảng kê gia công
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã PGC</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Ngày</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Xưởng SX</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Số mã SP</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Tổng SL</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Tổng tiền</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Phân loại</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Đối soát</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedList.map((group) => (
                <tr key={group.maPGC} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-blue-600">{group.maPGC}</td>
                  <td className="px-3 py-3 text-gray-600">{group.ngayThang}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-37.5 truncate" title={group.xuongSX}>
                    {group.xuongSX || "-"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {group.items.length}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-gray-900">
                    {group.totalSoLuong > 0 ? group.totalSoLuong.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-green-600">
                    {group.totalThanhTien > 0 ? group.totalThanhTien.toLocaleString("vi-VN") + "đ" : "-"}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{group.phanLoai || "-"}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.doiSoat.includes("Chưa")
                        ? "bg-yellow-100 text-yellow-700"
                        : group.doiSoat
                        ? "bg-green-100 text-green-700"
                        : "text-gray-400"
                    }`}>
                      {group.doiSoat || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewGrouped(group)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteGrouped(group.maPGC)}
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
                <td colSpan={5} className="px-3 py-3 text-right">Tổng cộng:</td>
                <td className="px-3 py-3 text-right text-green-600">
                  {totalThanhTien.toLocaleString("vi-VN")}đ
                </td>
                <td colSpan={3}></td>
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

      {/* Modal thêm phiếu gia công */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowAddModal(false); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isAdding && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-70 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-700 font-medium">Đang tạo phiếu gia công...</p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Tạo phiếu gia công mới</h3>
                <p className="text-sm text-gray-500">Mã phiếu: {formMaPGC}</p>
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
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã PGC</label>
                  <input
                    type="text"
                    value={formMaPGC}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
                  <input
                    type="date"
                    value={formNgayThang}
                    onChange={(e) => setFormNgayThang(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Add Product Button */}
              <div className="mb-4">
                <button
                  onClick={handleAddProductToList}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus size={18} />
                  Thêm dòng mã SP SX
                </button>
              </div>

              {/* Selected Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã SP SX ({selectedProducts.length})
                  </h4>
                </div>
                {selectedProducts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có mã SP SX nào. Nhấn nút "Thêm dòng mã SP SX" ở trên.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP SX</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Xưởng SX</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phân loại</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Đối soát</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">SL</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Đơn giá</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-yellow-100">Thành tiền</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedProducts.map((product, index) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                list={`maSPSX-list-${product.id}`}
                                value={product.maSPSX}
                                onChange={(e) => handleMaSPSXChange(product.id, e.target.value)}
                                placeholder="Chọn mã SP SX"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <datalist id={`maSPSX-list-${product.id}`}>
                                {donGiaList.map((dg) => (
                                  <option key={dg.id} value={dg.maSPNhapKho}>
                                    {dg.maSPNhapKho} - {dg.maSP} - {dg.xuongSX}
                                  </option>
                                ))}
                              </datalist>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={product.maSP}
                                onChange={(e) => handleUpdateProduct(product.id, "maSP", e.target.value)}
                                placeholder="Tự động điền"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                                readOnly
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={product.xuongSX}
                                placeholder="Tự động điền"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                                readOnly
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={product.phanLoai}
                                placeholder="Tự động điền"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                                readOnly
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={product.doiSoat}
                                onChange={(e) => handleUpdateProduct(product.id, "doiSoat", e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="Chưa đối soát CN">Chưa đối soát CN</option>
                                <option value="Đã đối soát CN">Đã đối soát CN</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={product.soLuong || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  handleUpdateProduct(product.id, "soLuong", parseInt(value) || 0);
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={product.donGia > 0 ? product.donGia.toLocaleString("vi-VN") : ""}
                                placeholder="Tự động điền"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
                                readOnly
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium bg-yellow-50">
                              {product.thanhTien.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-3 py-2">
                              <textarea
                                value={product.ghiChu}
                                onChange={(e) => handleUpdateProduct(product.id, "ghiChu", e.target.value)}
                                placeholder="Ghi chú"
                                rows={1}
                                className="w-48 min-w-48 px-2 py-1 border border-gray-300 rounded text-sm resize"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleRemoveProductFromList(product.id)}
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
                          <td colSpan={8} className="px-3 py-2 text-sm font-medium text-right">Tổng thành tiền:</td>
                          <td className="px-3 py-2 text-sm text-right font-semibold text-green-600">
                            {calculateTotalThanhTien().toLocaleString("vi-VN")}đ
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
                onClick={handleAddPhieuGiaCong}
                disabled={isAdding || selectedProducts.length === 0}
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
                    Tạo phiếu gia công ({selectedProducts.length} mã SP SX)
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết phiếu gia công</h3>
                <p className="text-sm text-gray-500">{viewGroupedPhieu.maPGC}</p>
              </div>
              <button onClick={() => { setShowViewModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header Info */}
              <div className="grid grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Mã PGC:</span>
                  <p className="font-medium text-blue-600">{viewGroupedPhieu.maPGC}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ngày tháng:</span>
                  <p className="font-medium">{viewGroupedPhieu.ngayThang}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Xưởng SX:</span>
                  <p className="font-medium">{viewGroupedPhieu.xuongSX || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phân loại:</span>
                  <p className="font-medium">{viewGroupedPhieu.phanLoai || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Đối soát:</span>
                  <p className={`font-medium ${
                    viewGroupedPhieu.doiSoat.includes("Chưa")
                      ? "text-yellow-600"
                      : viewGroupedPhieu.doiSoat
                      ? "text-green-600"
                      : ""
                  }`}>
                    {viewGroupedPhieu.doiSoat || "-"}
                  </p>
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-yellow-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã SP SX ({viewGroupedPhieu.items.length})
                    <span className="ml-2 text-blue-600">- Tổng SL: {viewGroupedPhieu.totalSoLuong.toLocaleString("vi-VN")}</span>
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP SX</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">SL</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Đơn giá</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-yellow-100">Thành tiền</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewGroupedPhieu.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2 text-sm font-medium text-blue-600">{item.maSPSX}</td>
                          <td className="px-3 py-2 text-sm">{item.maSP || "-"}</td>
                          <td className="px-3 py-2 text-sm text-right">{item.soLuong.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2 text-sm text-right">
                            {item.donGia > 0 ? item.donGia.toLocaleString("vi-VN") : "-"}
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-medium bg-yellow-50">
                            {item.thanhTien > 0 ? item.thanhTien.toLocaleString("vi-VN") : "-"}
                          </td>
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
                        <td colSpan={5} className="px-3 py-2 text-sm font-medium text-right">Tổng thành tiền:</td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-green-600">
                          {viewGroupedPhieu.totalThanhTien.toLocaleString("vi-VN")}đ
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
                  Xác nhận xóa phiếu gia công
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
                Bạn có chắc chắn muốn xóa phiếu gia công{" "}
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
                  Xác nhận xóa mã SP SX
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
                Bạn có chắc chắn muốn xóa mã SP SX này khỏi phiếu gia công?
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
