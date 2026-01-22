"use client";

import { Eye, Loader2, X, Search, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import type { NhapKhoNPL, Material, TonKhoNPLThang } from "@/lib/googleSheets";
import { useAuth } from "@/context/AuthContext";

// Interface for selected NPL in the form
interface SelectedNPL {
  id: string;
  maNPL: string;
  dvt: string;
  soLuong: number;
  donGiaSauThue: number;
  thanhTien: number;
  ghiChu: string;
}

// Interface for grouped phieu nhap kho
interface GroupedPhieuNhap {
  maPhieu: string;
  ngayThang: string;
  nguoiNhap: string;
  noiDung: string;
  ncc: string;
  items: NhapKhoNPL[];
  totalItems: number;
  totalSoLuong: number;
  totalThanhTien: number;
}

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

export default function NhapKhoNPLTab() {
  const { profile } = useAuth();
  const [data, setData] = useState<NhapKhoNPL[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewGroupedPhieu, setViewGroupedPhieu] = useState<GroupedPhieuNhap | null>(null);
  const [phieuToDelete, setPhieuToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Materials list for dropdown
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tồn kho NPL data
  const [tonKhoData, setTonKhoData] = useState<TonKhoNPLThang[]>([]);

  // Form states
  const [formMaPhieu, setFormMaPhieu] = useState("");
  const [formNgayThang, setFormNgayThang] = useState(new Date().toISOString().split("T")[0]);
  const [formNguoiNhap, setFormNguoiNhap] = useState("");
  const [formNoiDung, setFormNoiDung] = useState("");
  const [formNCC, setFormNCC] = useState("");
  const [selectedNPLs, setSelectedNPLs] = useState<SelectedNPL[]>([]);

  // NPL search
  const [nplSearchTerm, setNplSearchTerm] = useState("");
  const [showNPLDropdown, setShowNPLDropdown] = useState(false);
  const nplDropdownRef = useRef<HTMLDivElement>(null);

  // Filter materials
  const filteredMaterials = materials.filter(
    (m) =>
      (m.code && m.code.toLowerCase().includes(nplSearchTerm.toLowerCase())) ||
      (m.name && m.name.toLowerCase().includes(nplSearchTerm.toLowerCase()))
  );

  // Group phieu nhap kho by maPNKNPL
  const groupedPhieuNhap: GroupedPhieuNhap[] = useMemo(() => {
    const groups: Record<string, GroupedPhieuNhap> = {};

    data.forEach((item) => {
      if (!groups[item.maPNKNPL]) {
        groups[item.maPNKNPL] = {
          maPhieu: item.maPNKNPL,
          ngayThang: item.ngayThang,
          nguoiNhap: item.nguoiNhap,
          noiDung: item.noiDung,
          ncc: item.ncc,
          items: [],
          totalItems: 0,
          totalSoLuong: 0,
          totalThanhTien: 0,
        };
      }
      groups[item.maPNKNPL].items.push(item);
      groups[item.maPNKNPL].totalItems = groups[item.maPNKNPL].items.length;
      groups[item.maPNKNPL].totalSoLuong += item.soLuong || 0;
      groups[item.maPNKNPL].totalThanhTien += item.thanhTien || 0;
    });

    return Object.values(groups);
  }, [data]);

  // Filtered grouped phieu
  const filteredGroupedPhieu = groupedPhieuNhap.filter(
    (g) =>
      g.maPhieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.ncc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nguoiNhap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.items.some((item) =>
        item.maNPL.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nplDropdownRef.current &&
        !nplDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNPLDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
    fetchMaterials();
    fetchTonKhoNPL();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      const result = await response.json();
      if (result.success) {
        setMaterials(result.data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
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

  const generateNextMaPhieu = (): string => {
    if (data.length === 0) {
      return "PNKNPL001";
    }

    const codeNumbers = data
      .map((item) => {
        const match = item.maPNKNPL.match(/PNKNPL(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNumber = Math.max(...codeNumbers, 0);
    return `PNKNPL${String(maxNumber + 1).padStart(3, "0")}`;
  };

  const handleOpenAddModal = () => {
    const nextCode = generateNextMaPhieu();
    setFormMaPhieu(nextCode);
    setFormNgayThang(new Date().toISOString().split("T")[0]);
    setFormNguoiNhap(profile?.full_name || profile?.email || getCachedProfileName() || "");
    setFormNoiDung("");
    setFormNCC("");
    setSelectedNPLs([]);
    setShowAddModal(true);
  };

  const handleAddNPLToList = (material: any) => {
    const donGia = material.priceWithTax || material.priceBeforeTax || 0;

    const newNPL: SelectedNPL = {
      id: `${material.code}-${Date.now()}`,
      maNPL: material.name, // Sử dụng tên đầy đủ như current implementation
      dvt: material.unit || "",
      soLuong: 1,
      donGiaSauThue: donGia,
      thanhTien: donGia * 1,
      ghiChu: "",
    };

    setSelectedNPLs([...selectedNPLs, newNPL]);
    setNplSearchTerm("");
    setShowNPLDropdown(false);

    // Auto-fill NCC from first material if not set
    if (!formNCC && material.supplier) {
      setFormNCC(material.supplier);
    }
  };

  const handleRemoveNPLFromList = (id: string) => {
    setSelectedNPLs(selectedNPLs.filter((n) => n.id !== id));
  };

  const handleUpdateNPL = (
    id: string,
    field: keyof SelectedNPL,
    value: any
  ) => {
    setSelectedNPLs(
      selectedNPLs.map((n) => {
        if (n.id !== id) return n;

        const updated = { ...n, [field]: value };

        if (field === "soLuong" || field === "donGiaSauThue") {
          updated.thanhTien = updated.soLuong * updated.donGiaSauThue;
        }

        return updated;
      })
    );
  };

  const calculateTotalThanhTien = () => {
    return selectedNPLs.reduce((sum, n) => sum + n.thanhTien, 0);
  };

  const handleAddPhieuNhap = async () => {
    if (!formMaPhieu || !formNgayThang) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (selectedNPLs.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 mã NPL");
      return;
    }

    try {
      setIsAdding(true);

      for (const npl of selectedNPLs) {
        const phieuData = {
          maPNKNPL: formMaPhieu,
          ngayThang: formNgayThang,
          nguoiNhap: formNguoiNhap,
          noiDung: formNoiDung,
          maNPL: npl.maNPL,
          ncc: formNCC,
          dvt: npl.dvt,
          soLuong: npl.soLuong,
          donGiaSauThue: npl.donGiaSauThue,
          thanhTien: npl.thanhTien,
          ghiChu: npl.ghiChu,
          tonThucTe: 0, // Will be calculated by backend
        };

        const response = await fetch("/api/nhap-kho-npl/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(phieuData),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(`Lỗi khi thêm mã NPL ${npl.maNPL}`);
        }
      }

      await fetchData();
      setShowAddModal(false);
      toast.success(
        `Thêm phiếu nhập kho ${formMaPhieu} thành công (${selectedNPLs.length} mã NPL)`
      );
    } catch (error) {
      console.error("Error adding phieu nhap:", error);
      toast.error("Lỗi khi thêm phiếu nhập kho");
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewGrouped = (group: GroupedPhieuNhap) => {
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

      const itemsToDelete = data.filter((item) => item.maPNKNPL === phieuToDelete);

      for (const item of itemsToDelete) {
        const response = await fetch(`/api/nhap-kho-npl/delete?id=${item.id}`, {
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
        `Xóa phiếu nhập kho ${phieuToDelete} thành công (${itemsToDelete.length} mã NPL)`
      );
    } catch (error) {
      console.error("Error deleting phieu nhap:", error);
      toast.error("Lỗi khi xóa phiếu nhập kho");
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

      const response = await fetch(`/api/nhap-kho-npl/delete?id=${itemToDelete}`, {
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
        toast.success("Xóa mã NPL thành công");
      } else {
        toast.error("Lỗi khi xóa mã NPL");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Lỗi khi xóa mã NPL");
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
            Danh sách phiếu nhập kho NPL ({filteredGroupedPhieu.length})
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
          Tạo phiếu nhập kho
        </button>
      </div>

      {/* Table - Grouped */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : filteredGroupedPhieu.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không có dữ liệu nhập kho NPL
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã phiếu</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Ngày</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">NCC</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Số mã NPL</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Tổng SL</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Tổng tiền</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Người nhập</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGroupedPhieu.map((group) => (
                <tr key={group.maPhieu} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-blue-600">{group.maPhieu}</td>
                  <td className="px-3 py-3 text-gray-600">{group.ngayThang}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-37.5 truncate" title={group.ncc}>
                    {group.ncc || "-"}
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
                  <td className="px-3 py-3 text-gray-600">{group.nguoiNhap || "-"}</td>
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
                <td colSpan={5} className="px-3 py-3 text-right">Tổng cộng:</td>
                <td className="px-3 py-3 text-right text-green-600">
                  {totalThanhTien.toLocaleString("vi-VN")}đ
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal thêm phiếu nhập kho */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowAddModal(false); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isAdding && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-70 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-700 font-medium">Đang tạo phiếu nhập kho...</p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Tạo phiếu nhập kho mới</h3>
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
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={formMaPhieu}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người nhập</label>
                  <input
                    type="text"
                    value={formNguoiNhap}
                    onChange={(e) => setFormNguoiNhap(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <input
                    type="text"
                    value={formNoiDung}
                    onChange={(e) => setFormNoiDung(e.target.value)}
                    placeholder="Nhập NPL..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* NCC row */}
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp (NCC)</label>
                  <input
                    type="text"
                    value={formNCC}
                    onChange={(e) => setFormNCC(e.target.value)}
                    placeholder="Nhập tên nhà cung cấp..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Add NPL Section */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                <div className="relative" ref={nplDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thêm mã NPL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nplSearchTerm}
                      onChange={(e) => {
                        setNplSearchTerm(e.target.value);
                        setShowNPLDropdown(true);
                      }}
                      onFocus={() => setShowNPLDropdown(true)}
                      placeholder="Tìm mã NPL..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  {showNPLDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMaterials.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy</div>
                      ) : (
                        filteredMaterials.slice(0, 50).map((material) => (
                          <div
                            key={material.id}
                            onClick={() => handleAddNPLToList(material)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-blue-600">{material.code}</div>
                            <div className="text-xs text-gray-600">{material.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              ĐVT: {material.unit || "-"} | Giá: {material.priceWithTax ? material.priceWithTax.toLocaleString("vi-VN") + "đ" : "-"}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected NPLs Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã NPL ({selectedNPLs.length})
                  </h4>
                </div>
                {selectedNPLs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có mã NPL nào. Tìm và thêm mã NPL ở trên.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã NPL</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">ĐVT</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">SL</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Đơn giá</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-yellow-100">Thành tiền</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedNPLs.map((npl, index) => (
                          <tr key={npl.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-3 py-2 text-sm font-medium text-blue-600">{npl.maNPL}</td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.dvt}
                                onChange={(e) => handleUpdateNPL(npl.id, "dvt", e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.soLuong || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  handleUpdateNPL(npl.id, "soLuong", parseInt(value) || 0);
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.donGiaSauThue || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  handleUpdateNPL(npl.id, "donGiaSauThue", parseInt(value) || 0);
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium bg-yellow-50">
                              {npl.thanhTien.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.ghiChu}
                                onChange={(e) => handleUpdateNPL(npl.id, "ghiChu", e.target.value)}
                                placeholder="Ghi chú"
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleRemoveNPLFromList(npl.id)}
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
                          <td colSpan={5} className="px-3 py-2 text-sm font-medium text-right">Tổng thành tiền:</td>
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
                onClick={handleAddPhieuNhap}
                disabled={isAdding || selectedNPLs.length === 0}
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
                    Tạo phiếu nhập kho ({selectedNPLs.length} mã NPL)
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
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết phiếu nhập kho</h3>
                <p className="text-sm text-gray-500">{viewGroupedPhieu.maPhieu}</p>
              </div>
              <button onClick={() => { setShowViewModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header Info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Mã phiếu:</span>
                  <p className="font-medium text-blue-600">{viewGroupedPhieu.maPhieu}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ngày tháng:</span>
                  <p className="font-medium">{viewGroupedPhieu.ngayThang}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Người nhập:</span>
                  <p className="font-medium">{viewGroupedPhieu.nguoiNhap || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Nội dung:</span>
                  <p className="font-medium">{viewGroupedPhieu.noiDung || "-"}</p>
                </div>
              </div>

              {/* NCC Info */}
              <div className="grid grid-cols-1 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Nhà cung cấp:</span>
                  <p className="font-medium">{viewGroupedPhieu.ncc || "-"}</p>
                </div>
              </div>

              {/* NPL Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-yellow-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã NPL ({viewGroupedPhieu.items.length})
                    <span className="ml-2 text-blue-600">- Tổng SL: {viewGroupedPhieu.totalSoLuong.toLocaleString("vi-VN")}</span>
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã NPL</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">ĐVT</th>
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
                          <td className="px-3 py-2 text-sm font-medium text-blue-600">{item.maNPL}</td>
                          <td className="px-3 py-2 text-sm text-center">{item.dvt || "-"}</td>
                          <td className="px-3 py-2 text-sm text-right">{item.soLuong.toLocaleString("vi-VN")}</td>
                          <td className="px-3 py-2 text-sm text-right">
                            {item.donGiaSauThue > 0 ? item.donGiaSauThue.toLocaleString("vi-VN") : "-"}
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
                  Xác nhận xóa phiếu nhập kho
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
                Bạn có chắc chắn muốn xóa phiếu nhập kho{" "}
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
                  Xác nhận xóa mã NPL
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
                Bạn có chắc chắn muốn xóa mã NPL này khỏi phiếu nhập kho?
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
