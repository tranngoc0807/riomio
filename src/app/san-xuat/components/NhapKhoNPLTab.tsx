"use client";

import {
  Loader2,
  X,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

// View types
type ViewType = "list" | "detail";

export default function NhapKhoNPLTab() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<NhapKhoNPL[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // View state - "list" or "detail"
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [viewGroupedPhieu, setViewGroupedPhieu] =
    useState<GroupedPhieuNhap | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [phieuToDelete, setPhieuToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] =
    useState<NhapKhoNPL | null>(null);

  // Materials list for dropdown
  const [materials, setMaterials] = useState<Material[]>([]);

  // Tồn kho NPL data
  const [tonKhoData, setTonKhoData] = useState<TonKhoNPLThang[]>([]);

  // Form states
  const [formMaPhieu, setFormMaPhieu] = useState("");
  const [formNgayThang, setFormNgayThang] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formNguoiNhap, setFormNguoiNhap] = useState("");
  const [formNoiDung, setFormNoiDung] = useState("");
  const [formNCC, setFormNCC] = useState("");
  const [selectedNPLs, setSelectedNPLs] = useState<SelectedNPL[]>([]);

  // Return form states
  const [returnFormMaPhieu, setReturnFormMaPhieu] = useState("");
  const [returnFormNgayThang, setReturnFormNgayThang] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [returnFormNguoiNhap, setReturnFormNguoiNhap] = useState("");
  const [returnFormNoiDung, setReturnFormNoiDung] = useState("");
  const [returnFormNCC, setReturnFormNCC] = useState("");
  const [returnSelectedNPLs, setReturnSelectedNPLs] = useState<SelectedNPL[]>(
    [],
  );

  // NPL search
  const [nplSearchTerm, setNplSearchTerm] = useState("");
  const [showNPLDropdown, setShowNPLDropdown] = useState(false);
  const nplDropdownRef = useRef<HTMLDivElement>(null);

  // Return NPL search
  const [returnNplSearchTerm, setReturnNplSearchTerm] = useState("");
  const [showReturnNPLDropdown, setShowReturnNPLDropdown] = useState(false);
  const returnNplDropdownRef = useRef<HTMLDivElement>(null);

  // Filter materials
  const filteredMaterials = materials.filter(
    (m) =>
      (m.code && m.code.toLowerCase().includes(nplSearchTerm.toLowerCase())) ||
      (m.name && m.name.toLowerCase().includes(nplSearchTerm.toLowerCase())),
  );

  // Filter materials for return
  const filteredReturnMaterials = materials.filter(
    (m) =>
      (m.code &&
        m.code.toLowerCase().includes(returnNplSearchTerm.toLowerCase())) ||
      (m.name &&
        m.name.toLowerCase().includes(returnNplSearchTerm.toLowerCase())),
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

  // Sync view state with URL params - URL is the single source of truth
  useEffect(() => {
    const phieuParam = searchParams.get("phieu");

    if (phieuParam && groupedPhieuNhap.length > 0) {
      // URL has phieu param - show detail view
      const foundGroup = groupedPhieuNhap.find((g) => g.maPhieu === phieuParam);
      if (foundGroup) {
        setViewGroupedPhieu(foundGroup);
        setCurrentView("detail");
      }
    } else if (!phieuParam) {
      // No phieu param - show list view
      setCurrentView("list");
      setViewGroupedPhieu(null);
      setSelectedItemDetail(null);
    }
  }, [searchParams, groupedPhieuNhap]);

  // Filtered grouped phieu
  const filteredGroupedPhieu = groupedPhieuNhap.filter(
    (g) =>
      g.maPhieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.ncc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nguoiNhap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.items.some((item) =>
        item.maNPL.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
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
      if (
        returnNplDropdownRef.current &&
        !returnNplDropdownRef.current.contains(event.target as Node)
      ) {
        setShowReturnNPLDropdown(false);
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

  const generateNextMaPhieu = (prefix: string = "PNKNPL"): string => {
    const relevantData = data.filter((item) =>
      item.maPNKNPL.startsWith(prefix),
    );
    if (relevantData.length === 0) {
      return `${prefix}001`;
    }

    const codeNumbers = relevantData
      .map((item) => {
        const regex = new RegExp(`${prefix}(\\d+)`, "i");
        const match = item.maPNKNPL.match(regex);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNumber = Math.max(...codeNumbers, 0);
    return `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
  };

  const handleOpenAddModal = () => {
    const nextCode = generateNextMaPhieu("PNKNPL");
    setFormMaPhieu(nextCode);
    setFormNgayThang(new Date().toISOString().split("T")[0]);
    setFormNguoiNhap(
      profile?.full_name || profile?.email || getCachedProfileName() || "",
    );
    setFormNoiDung("");
    setFormNCC("");
    setSelectedNPLs([]);
    setShowAddModal(true);
  };

  const handleOpenReturnModal = () => {
    const nextCode = generateNextMaPhieu("PTNPL");
    setReturnFormMaPhieu(nextCode);
    setReturnFormNgayThang(new Date().toISOString().split("T")[0]);
    setReturnFormNguoiNhap(
      profile?.full_name || profile?.email || getCachedProfileName() || "",
    );
    setReturnFormNoiDung("Trả lại NPL");
    setReturnFormNCC(viewGroupedPhieu?.ncc || "");
    setReturnSelectedNPLs([]);
    setShowReturnModal(true);
  };

  const handleAddNPLToList = (material: any) => {
    const donGia = material.priceWithTax || material.priceBeforeTax || 0;

    const newNPL: SelectedNPL = {
      id: `${material.code}-${Date.now()}`,
      maNPL: material.name,
      dvt: material.unit || "",
      soLuong: 1,
      donGiaSauThue: donGia,
      thanhTien: donGia * 1,
      ghiChu: "",
    };

    setSelectedNPLs([...selectedNPLs, newNPL]);
    setNplSearchTerm("");
    setShowNPLDropdown(false);

    if (!formNCC && material.supplier) {
      setFormNCC(material.supplier);
    }
  };

  const handleAddReturnNPLToList = (material: any) => {
    const donGia = material.priceWithTax || material.priceBeforeTax || 0;

    const newNPL: SelectedNPL = {
      id: `${material.code}-${Date.now()}`,
      maNPL: material.name,
      dvt: material.unit || "",
      soLuong: 1,
      donGiaSauThue: donGia,
      thanhTien: donGia * 1,
      ghiChu: "",
    };

    setReturnSelectedNPLs([...returnSelectedNPLs, newNPL]);
    setReturnNplSearchTerm("");
    setShowReturnNPLDropdown(false);
  };

  const handleRemoveNPLFromList = (id: string) => {
    setSelectedNPLs(selectedNPLs.filter((n) => n.id !== id));
  };

  const handleRemoveReturnNPLFromList = (id: string) => {
    setReturnSelectedNPLs(returnSelectedNPLs.filter((n) => n.id !== id));
  };

  const handleUpdateNPL = (
    id: string,
    field: keyof SelectedNPL,
    value: any,
  ) => {
    setSelectedNPLs(
      selectedNPLs.map((n) => {
        if (n.id !== id) return n;

        const updated = { ...n, [field]: value };

        if (field === "soLuong" || field === "donGiaSauThue") {
          updated.thanhTien = updated.soLuong * updated.donGiaSauThue;
        }

        return updated;
      }),
    );
  };

  const handleUpdateReturnNPL = (
    id: string,
    field: keyof SelectedNPL,
    value: any,
  ) => {
    setReturnSelectedNPLs(
      returnSelectedNPLs.map((n) => {
        if (n.id !== id) return n;

        const updated = { ...n, [field]: value };

        if (field === "soLuong" || field === "donGiaSauThue") {
          updated.thanhTien = updated.soLuong * updated.donGiaSauThue;
        }

        return updated;
      }),
    );
  };

  const calculateTotalThanhTien = () => {
    return selectedNPLs.reduce((sum, n) => sum + n.thanhTien, 0);
  };

  const calculateReturnTotalThanhTien = () => {
    return returnSelectedNPLs.reduce((sum, n) => sum + n.thanhTien, 0);
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
          tonThucTe: 0,
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
        `Thêm phiếu nhập kho ${formMaPhieu} thành công (${selectedNPLs.length} mã NPL)`,
      );
    } catch (error) {
      console.error("Error adding phieu nhap:", error);
      toast.error("Lỗi khi thêm phiếu nhập kho");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddPhieuTra = async () => {
    if (!returnFormMaPhieu || !returnFormNgayThang) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (returnSelectedNPLs.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 mã NPL");
      return;
    }

    try {
      setIsAdding(true);

      for (const npl of returnSelectedNPLs) {
        const phieuData = {
          maPNKNPL: returnFormMaPhieu,
          ngayThang: returnFormNgayThang,
          nguoiNhap: returnFormNguoiNhap,
          noiDung: returnFormNoiDung,
          maNPL: npl.maNPL,
          ncc: returnFormNCC,
          dvt: npl.dvt,
          soLuong: -Math.abs(npl.soLuong), // Số lượng âm để trừ kho
          donGiaSauThue: npl.donGiaSauThue,
          thanhTien: -Math.abs(npl.thanhTien), // Thành tiền âm
          ghiChu: npl.ghiChu,
          tonThucTe: 0,
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
      setShowReturnModal(false);
      toast.success(
        `Tạo phiếu trả lại NPL ${returnFormMaPhieu} thành công (${returnSelectedNPLs.length} mã NPL)`,
      );
    } catch (error) {
      console.error("Error adding phieu tra:", error);
      toast.error("Lỗi khi tạo phiếu trả lại NPL");
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewGrouped = (group: GroupedPhieuNhap) => {
    // Only update URL, let useEffect handle state changes
    const params = new URLSearchParams(searchParams.toString());
    params.set("phieu", group.maPhieu);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleBackToList = () => {
    // Only update URL, let useEffect handle state changes
    const params = new URLSearchParams(searchParams.toString());
    params.delete("phieu");
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  };

  const handleDeleteGrouped = (maPhieu: string) => {
    setPhieuToDelete(maPhieu);
    setShowDeleteModal(true);
  };

  const confirmDeleteGrouped = async () => {
    if (!phieuToDelete) return;

    try {
      setIsDeleting(true);

      const itemsToDelete = data.filter(
        (item) => item.maPNKNPL === phieuToDelete,
      );

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

      // If we deleted the current viewed phieu, go back to list
      if (viewGroupedPhieu?.maPhieu === phieuToDelete) {
        handleBackToList();
      }

      toast.success(
        `Xóa phiếu nhập kho ${phieuToDelete} thành công (${itemsToDelete.length} mã NPL)`,
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

      const response = await fetch(
        `/api/nhap-kho-npl/delete?id=${itemToDelete}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();

      if (result.success) {
        await fetchData();

        if (selectedItemDetail?.id.toString() === itemToDelete) {
          setSelectedItemDetail(null);
        }

        if (viewGroupedPhieu) {
          const updatedItems = viewGroupedPhieu.items.filter(
            (item) => item.id.toString() !== itemToDelete,
          );
          if (updatedItems.length === 0) {
            handleBackToList();
          } else {
            const updatedGroup = {
              ...viewGroupedPhieu,
              items: updatedItems,
              totalItems: updatedItems.length,
              totalSoLuong: updatedItems.reduce(
                (sum, item) => sum + (item.soLuong || 0),
                0,
              ),
              totalThanhTien: updatedItems.reduce(
                (sum, item) => sum + (item.thanhTien || 0),
                0,
              ),
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
    0,
  );

  // Render List View
  const renderListView = () => (
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
                <th className="px-3 py-3 text-left font-medium text-gray-500">
                  Mã phiếu
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">
                  Ngày
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">
                  NCC
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">
                  Số mã NPL
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">
                  Tổng SL
                </th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">
                  Tổng tiền
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">
                  Người nhập
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-16">
                  Xóa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGroupedPhieu.map((group) => (
                <tr
                  key={group.maPhieu}
                  className="hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleViewGrouped(group)}
                >
                  <td className="px-3 py-3 font-medium text-blue-600">
                    {group.maPhieu}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{group.ngayThang}</td>
                  <td
                    className="px-3 py-3 text-gray-600 max-w-37.5 truncate"
                    title={group.ncc}
                  >
                    {group.ncc || "-"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {group.items.length}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-gray-900">
                    {group.totalSoLuong > 0
                      ? group.totalSoLuong.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-green-600">
                    {group.totalThanhTien > 0
                      ? group.totalThanhTien.toLocaleString("vi-VN") + "đ"
                      : "-"}
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    {group.nguoiNhap || "-"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGrouped(group.maPhieu);
                        }}
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
                <td colSpan={5} className="px-3 py-3 text-right">
                  Tổng cộng:
                </td>
                <td className="px-3 py-3 text-right text-green-600">
                  {totalThanhTien.toLocaleString("vi-VN")}đ
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );

  // Render Detail View as separate page (covers content area but keeps sidebar)
  const renderDetailView = () => {
    if (!viewGroupedPhieu) return null;

    return (
      <Portal>
        <div className="fixed top-0 right-0 bottom-0 left-64 z-40 bg-gray-50 overflow-y-auto">
          {/* Page Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            {/* Back button on top */}
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 -ml-2 px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mb-3"
            >
              <ArrowLeft size={28} />
            </button>
            {/* Title and action button below */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Chi tiết phiếu nhập kho
                </h3>
                <p className="text-sm text-gray-500">
                  {viewGroupedPhieu.maPhieu}
                </p>
              </div>
              <button
                onClick={handleOpenReturnModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                <RotateCcw size={20} />
                Trả lại NPL
              </button>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-8">
            {/* Header Info */}
            <div className="grid grid-cols-4 gap-6 mb-6 p-5 bg-white rounded-xl shadow-sm">
              <div>
                <span className="text-sm text-gray-500 block mb-1">
                  Mã phiếu:
                </span>
                <p className="font-semibold text-blue-600 text-lg">
                  {viewGroupedPhieu.maPhieu}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">
                  Ngày tháng:
                </span>
                <p className="font-medium text-lg">
                  {viewGroupedPhieu.ngayThang}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">
                  Người nhập:
                </span>
                <p className="font-medium text-lg">
                  {viewGroupedPhieu.nguoiNhap || "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">
                  Nội dung:
                </span>
                <p className="font-medium text-lg">
                  {viewGroupedPhieu.noiDung || "-"}
                </p>
              </div>
            </div>

            {/* NCC Info */}
            <div className="mb-6 p-5 bg-white rounded-xl shadow-sm">
              <span className="text-sm text-gray-500 block mb-1">
                Nhà cung cấp:
              </span>
              <p className="font-medium text-lg">
                {viewGroupedPhieu.ncc || "-"}
              </p>
            </div>

            {/* NPL Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-yellow-50 px-5 py-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800 text-lg">
                  Danh sách mã NPL ({viewGroupedPhieu.items.length})
                  <span className="ml-3 text-blue-600 font-medium">
                    - Tổng SL:{" "}
                    {viewGroupedPhieu.totalSoLuong.toLocaleString("vi-VN")}
                  </span>
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-5 py-4 text-left text-sm font-medium text-gray-500 w-16">
                        STT
                      </th>
                      <th className="px-5 py-4 text-left text-sm font-medium text-gray-500">
                        Mã NPL
                      </th>
                      <th className="px-5 py-4 text-center text-sm font-medium text-gray-500 w-28">
                        ĐVT
                      </th>
                      <th className="px-5 py-4 text-right text-sm font-medium text-gray-500 w-28">
                        SL
                      </th>
                      <th className="px-5 py-4 text-right text-sm font-medium text-gray-500 w-36">
                        Đơn giá
                      </th>
                      <th className="px-5 py-4 text-right text-sm font-medium text-gray-500 bg-yellow-100 w-40">
                        Thành tiền
                      </th>
                      <th className="px-5 py-4 text-left text-sm font-medium text-gray-500">
                        Ghi chú
                      </th>
                      <th className="px-5 py-4 text-center text-sm font-medium text-gray-500 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {viewGroupedPhieu.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`cursor-pointer transition-colors ${selectedItemDetail?.id === item.id ? "bg-blue-100" : "hover:bg-gray-50"}`}
                        onClick={() =>
                          setSelectedItemDetail(
                            selectedItemDetail?.id === item.id ? null : item,
                          )
                        }
                      >
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-blue-600">
                          {item.maNPL}
                        </td>
                        <td className="px-5 py-4 text-sm text-center">
                          {item.dvt || "-"}
                        </td>
                        <td className="px-5 py-4 text-sm text-right font-medium">
                          {item.soLuong.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-5 py-4 text-sm text-right">
                          {item.donGiaSauThue > 0
                            ? item.donGiaSauThue.toLocaleString("vi-VN")
                            : "-"}
                        </td>
                        <td className="px-5 py-4 text-sm text-right font-semibold bg-yellow-50">
                          {item.thanhTien > 0
                            ? item.thanhTien.toLocaleString("vi-VN")
                            : "-"}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {item.ghiChu || "-"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id.toString());
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-4 text-sm font-semibold text-right"
                      >
                        Tổng thành tiền:
                      </td>
                      <td className="px-5 py-4 text-sm text-right font-bold text-green-600 text-lg">
                        {viewGroupedPhieu.totalThanhTien.toLocaleString(
                          "vi-VN",
                        )}
                        đ
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Chi tiết item được chọn */}
            {selectedItemDetail && (
              <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-semibold text-blue-800 text-xl">
                    Chi tiết mã NPL
                  </h4>
                  <button
                    onClick={() => setSelectedItemDetail(null)}
                    className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                  >
                    <X size={22} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">
                      Mã NPL
                    </span>
                    <p className="font-semibold text-blue-600 text-lg">
                      {selectedItemDetail.maNPL}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">
                      Đơn vị tính
                    </span>
                    <p className="font-medium text-lg">
                      {selectedItemDetail.dvt || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">
                      Số lượng
                    </span>
                    <p className="font-medium text-lg">
                      {selectedItemDetail.soLuong?.toLocaleString("vi-VN") ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">
                      Đơn giá sau thuế
                    </span>
                    <p className="font-medium text-lg">
                      {selectedItemDetail.donGiaSauThue > 0
                        ? selectedItemDetail.donGiaSauThue.toLocaleString(
                            "vi-VN",
                          ) + "đ"
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">
                      Thành tiền
                    </span>
                    <p className="font-bold text-green-600 text-lg">
                      {selectedItemDetail.thanhTien > 0
                        ? selectedItemDetail.thanhTien.toLocaleString("vi-VN") +
                          "đ"
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block mb-1">
                      Tồn thực tế
                    </span>
                    <p className="font-medium text-lg">
                      {selectedItemDetail.tonThucTe?.toLocaleString("vi-VN") ||
                        "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-500 block mb-1">
                      Ghi chú
                    </span>
                    <p className="font-medium text-lg">
                      {selectedItemDetail.ghiChu || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Portal>
    );
  };

  return (
    <>
      {/* Always render list view */}
      {renderListView()}

      {/* Render detail view as overlay when in detail mode */}
      {currentView === "detail" && renderDetailView()}

      {/* Modal thêm phiếu nhập kho */}
      {showAddModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => {
              setShowAddModal(false);
            }}
          />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isAdding && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-70 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-700 font-medium">
                  Đang tạo phiếu nhập kho...
                </p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Tạo phiếu nhập kho mới
                </h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã phiếu
                  </label>
                  <input
                    type="text"
                    value={formMaPhieu}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng
                  </label>
                  <input
                    type="date"
                    value={formNgayThang}
                    onChange={(e) => setFormNgayThang(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người nhập
                  </label>
                  <input
                    type="text"
                    value={formNguoiNhap}
                    onChange={(e) => setFormNguoiNhap(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhà cung cấp (NCC)
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thêm mã NPL
                  </label>
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
                    <Search
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                  {showNPLDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMaterials.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Không tìm thấy
                        </div>
                      ) : (
                        filteredMaterials.slice(0, 50).map((material) => (
                          <div
                            key={material.id}
                            onClick={() => handleAddNPLToList(material)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-blue-600">
                              {material.code}
                            </div>
                            <div className="text-xs text-gray-600">
                              {material.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ĐVT: {material.unit || "-"} | Giá:{" "}
                              {material.priceWithTax
                                ? material.priceWithTax.toLocaleString(
                                    "vi-VN",
                                  ) + "đ"
                                : "-"}
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
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">
                            STT
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Mã NPL
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">
                            ĐVT
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">
                            SL
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                            Đơn giá
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-yellow-100">
                            Thành tiền
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Ghi chú
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedNPLs.map((npl, index) => (
                          <tr key={npl.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-blue-600">
                              {npl.maNPL}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.dvt}
                                onChange={(e) =>
                                  handleUpdateNPL(npl.id, "dvt", e.target.value)
                                }
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.soLuong || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
                                  handleUpdateNPL(
                                    npl.id,
                                    "soLuong",
                                    parseInt(value) || 0,
                                  );
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.donGiaSauThue || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
                                  handleUpdateNPL(
                                    npl.id,
                                    "donGiaSauThue",
                                    parseInt(value) || 0,
                                  );
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
                                onChange={(e) =>
                                  handleUpdateNPL(
                                    npl.id,
                                    "ghiChu",
                                    e.target.value,
                                  )
                                }
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
                          <td
                            colSpan={5}
                            className="px-3 py-2 text-sm font-medium text-right"
                          >
                            Tổng thành tiền:
                          </td>
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

      {/* Modal trả lại NPL */}
      {showReturnModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => {
              setShowReturnModal(false);
            }}
          />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isAdding && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-70 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-orange-600 mb-4" />
                <p className="text-gray-700 font-medium">
                  Đang tạo phiếu trả lại NPL...
                </p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Tạo phiếu trả lại NPL
                </h3>
                <p className="text-sm text-gray-500">
                  Mã phiếu: {returnFormMaPhieu}
                </p>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã phiếu
                  </label>
                  <input
                    type="text"
                    value={returnFormMaPhieu}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng
                  </label>
                  <input
                    type="date"
                    value={returnFormNgayThang}
                    onChange={(e) => setReturnFormNgayThang(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người trả
                  </label>
                  <input
                    type="text"
                    value={returnFormNguoiNhap}
                    onChange={(e) => setReturnFormNguoiNhap(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung
                  </label>
                  <input
                    type="text"
                    value={returnFormNoiDung}
                    onChange={(e) => setReturnFormNoiDung(e.target.value)}
                    placeholder="Trả lại NPL..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* NCC row */}
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhà cung cấp (NCC)
                  </label>
                  <input
                    type="text"
                    value={returnFormNCC}
                    onChange={(e) => setReturnFormNCC(e.target.value)}
                    placeholder="Nhập tên nhà cung cấp..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Add NPL Section */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                <div className="relative" ref={returnNplDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thêm mã NPL cần trả
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={returnNplSearchTerm}
                      onChange={(e) => {
                        setReturnNplSearchTerm(e.target.value);
                        setShowReturnNPLDropdown(true);
                      }}
                      onFocus={() => setShowReturnNPLDropdown(true)}
                      placeholder="Tìm mã NPL..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                    <Search
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                  {showReturnNPLDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredReturnMaterials.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Không tìm thấy
                        </div>
                      ) : (
                        filteredReturnMaterials.slice(0, 50).map((material) => (
                          <div
                            key={material.id}
                            onClick={() => handleAddReturnNPLToList(material)}
                            className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-orange-600">
                              {material.code}
                            </div>
                            <div className="text-xs text-gray-600">
                              {material.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ĐVT: {material.unit || "-"} | Giá:{" "}
                              {material.priceWithTax
                                ? material.priceWithTax.toLocaleString(
                                    "vi-VN",
                                  ) + "đ"
                                : "-"}
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
                <div className="bg-orange-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã NPL cần trả ({returnSelectedNPLs.length})
                  </h4>
                </div>
                {returnSelectedNPLs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có mã NPL nào. Tìm và thêm mã NPL cần trả ở trên.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">
                            STT
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Mã NPL
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">
                            ĐVT
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">
                            SL trả
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                            Đơn giá
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-orange-100">
                            Thành tiền
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Ghi chú
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {returnSelectedNPLs.map((npl, index) => (
                          <tr key={npl.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-orange-600">
                              {npl.maNPL}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.dvt}
                                onChange={(e) =>
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "dvt",
                                    e.target.value,
                                  )
                                }
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.soLuong || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "soLuong",
                                    parseInt(value) || 0,
                                  );
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.donGiaSauThue || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "donGiaSauThue",
                                    parseInt(value) || 0,
                                  );
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium bg-orange-50">
                              {npl.thanhTien.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.ghiChu}
                                onChange={(e) =>
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "ghiChu",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ghi chú"
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() =>
                                  handleRemoveReturnNPLFromList(npl.id)
                                }
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
                          <td
                            colSpan={5}
                            className="px-3 py-2 text-sm font-medium text-right"
                          >
                            Tổng thành tiền trả:
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-semibold text-orange-600">
                            {calculateReturnTotalThanhTien().toLocaleString(
                              "vi-VN",
                            )}
                            đ
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
                onClick={() => setShowReturnModal(false)}
                disabled={isAdding}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddPhieuTra}
                disabled={isAdding || returnSelectedNPLs.length === 0}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <RotateCcw size={18} />
                    Tạo phiếu trả NPL ({returnSelectedNPLs.length} mã NPL)
                  </>
                )}
              </button>
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
