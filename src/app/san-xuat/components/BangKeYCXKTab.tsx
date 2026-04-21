"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package, Calendar, Plus, Pencil, Trash2, X, Check, Eye, Copy } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import Portal from "@/components/Portal";

interface YeuCauXuatKhoNPL {
  id: number;
  ngayThang: string;
  maPhieuYC: string;
  maNPL: string;
  dvt: string;
  dinhMuc: number;
  tyLeHaoHut: number; // 1% (0.01) cho vải (Mét), 3% (0.03) cho các loại khác
  slKHSX: number;
  slCanDung: number; // = dinhMuc * slKHSX * (1 + tyLeHaoHut)
  maSPSuDung: string;
  mauSac: string;
  xuongSX: string;
}

interface Material {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface MaSP {
  id: number;
  maSP: string;
  tenSP: string;
  xuongSX: string;
}

// Interface for grouped phieu yeu cau
interface GroupedPhieuYC {
  maPhieuYC: string;
  ngayThang: string;
  xuongSX: string;
  items: YeuCauXuatKhoNPL[];
  itemCount: number;
  totalSLKHSX: number;
  totalSlCanDung: number;
}

const ITEMS_PER_PAGE = 50;

// Date conversion utilities
const convertToInputDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    let year = parts[2];
    if (year.length === 2) {
      year = year.startsWith("0") || year.startsWith("1") || year.startsWith("2") ? `20${year}` : `19${year}`;
    }
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

const convertToSheetDate = (inputDate: string): string => {
  if (!inputDate) return "";
  const parts = inputDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return inputDate;
};

const emptyFormData = {
  ngayThang: "",
  maPhieuYC: "",
  maNPL: "",
  dvt: "",
  dinhMuc: 0,
  tyLeHaoHut: 0.03, // Always 3%
  slKHSX: 0,
  slCanDung: 0,
  maSPSuDung: "",
  mauSac: "",
  xuongSX: "",
};

// Interface for multi-item in add modal
interface NPLItem {
  id: string;
  maNPL: string;
  dvt: string;
  dinhMuc: number;
  tyLeHaoHut: number; // Always 3%
  slKHSX: number;
  slCanDung: number;
  maSPSuDung: string;
  mauSac: string;
  xuongSX: string;
}

const emptyNPLItem: Omit<NPLItem, "id"> = {
  maNPL: "",
  dvt: "",
  dinhMuc: 0,
  tyLeHaoHut: 0.03, // Always 3%
  slKHSX: 0,
  slCanDung: 0,
  maSPSuDung: "",
  mauSac: "",
  xuongSX: "",
};

export default function BangKeYCXKTab() {
  const [data, setData] = useState<YeuCauXuatKhoNPL[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewGroupedPhieu, setViewGroupedPhieu] = useState<GroupedPhieuYC | null>(null);
  const [formData, setFormData] = useState<Omit<YeuCauXuatKhoNPL, "id">>(emptyFormData);
  const [editingItem, setEditingItem] = useState<YeuCauXuatKhoNPL | null>(null);
  const [deletingItem, setDeletingItem] = useState<YeuCauXuatKhoNPL | null>(null);
  const [phieuToDelete, setPhieuToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown data
  const [materials, setMaterials] = useState<Material[]>([]);
  const [maSPList, setMaSPList] = useState<MaSP[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isLoadingMaSP, setIsLoadingMaSP] = useState(false);

  // Dropdown search states
  const [nplSearch, setNplSearch] = useState("");
  const [spSearch, setSpSearch] = useState("");
  const [showNplDropdown, setShowNplDropdown] = useState(false);
  const [showSpDropdown, setShowSpDropdown] = useState(false);
  const nplDropdownRef = useRef<HTMLDivElement>(null);
  const spDropdownRef = useRef<HTMLDivElement>(null);

  // Multi-item state for add modal
  const [addHeaderData, setAddHeaderData] = useState({ ngayThang: "", maPhieuYC: "" });
  const [nplItems, setNplItems] = useState<NPLItem[]>([]);
  const [currentNPLItem, setCurrentNPLItem] = useState<Omit<NPLItem, "id">>(emptyNPLItem);

  // Filtered data - sorted by ID descending (newest first)
  const filteredList = data
    .filter(
      (item) =>
        item.maPhieuYC.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.maNPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.maSPSuDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.xuongSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ngayThang.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.id - a.id); // Sort by ID descending (newest first)

  // Group by maPhieuYC
  const groupedPhieuYC: GroupedPhieuYC[] = useMemo(() => {
    const groups: Record<string, GroupedPhieuYC> = {};

    filteredList.forEach((item) => {
      const key = item.maPhieuYC || "Không có mã";
      if (!groups[key]) {
        groups[key] = {
          maPhieuYC: item.maPhieuYC,
          ngayThang: item.ngayThang,
          xuongSX: item.xuongSX,
          items: [],
          itemCount: 0,
          totalSLKHSX: 0,
          totalSlCanDung: 0,
        };
      }
      groups[key].items.push(item);
      groups[key].itemCount++;
      groups[key].totalSLKHSX += item.slKHSX || 0;
      groups[key].totalSlCanDung += item.slCanDung || 0;
    });

    // Sort by maPhieuYC number descending (YC23 > YC22 > YC21...)
    return Object.values(groups).sort((a, b) => {
      const numA = parseInt(a.maPhieuYC.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.maPhieuYC.replace(/\D/g, "")) || 0;
      return numB - numA;
    });
  }, [filteredList]);

  // Pagination for grouped data
  const totalPages = Math.ceil(groupedPhieuYC.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGroups = groupedPhieuYC.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalSLKHSX = filteredList.reduce((sum, item) => sum + item.slKHSX, 0);
  const totalSlCanDung = filteredList.reduce((sum, item) => sum + item.slCanDung, 0);

  // View grouped phieu
  const handleViewGrouped = (group: GroupedPhieuYC) => {
    setViewGroupedPhieu(group);
    setShowViewModal(true);
  };

  // Delete all items in a phieu
  const handleDeleteGrouped = (maPhieuYC: string) => {
    setPhieuToDelete(maPhieuYC);
    setShowDeleteModal(true);
  };

  const confirmDeleteGrouped = async () => {
    if (!phieuToDelete) return;

    try {
      setIsSubmitting(true);
      const itemsToDelete = data.filter(item => item.maPhieuYC === phieuToDelete);

      // Sort by id descending to delete from bottom up (avoid row shifting in Google Sheets)
      const sortedItems = [...itemsToDelete].sort((a, b) => b.id - a.id);

      for (const item of sortedItems) {
        const response = await fetch("/api/yeu-cau-xuat-kho-npl/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || `Lỗi khi xóa mục ${item.id}`);
        }
      }

      toast.success(`Đã xóa phiếu ${phieuToDelete} (${itemsToDelete.length} mục)`);
      fetchData();
      setShowDeleteModal(false);
      setPhieuToDelete(null);
    } catch (error: any) {
      console.error("Error deleting phieu:", error);
      toast.error(error.message || "Lỗi khi xóa phiếu");
      fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    fetchMaterials();
    fetchMaSP();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nplDropdownRef.current && !nplDropdownRef.current.contains(event.target as Node)) {
        setShowNplDropdown(false);
      }
      if (spDropdownRef.current && !spDropdownRef.current.contains(event.target as Node)) {
        setShowSpDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/yeu-cau-xuat-kho-npl");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu yêu cầu xuất kho NPL");
      }
    } catch (error) {
      console.error("Error fetching yeu cau xuat kho npl:", error);
      toast.error("Lỗi khi tải dữ liệu yêu cầu xuất kho NPL");
    } finally {
      setIsLoading(false);
    }
  };

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

  const fetchMaSP = async () => {
    try {
      setIsLoadingMaSP(true);
      const response = await fetch("/api/ma-sp");
      const result = await response.json();
      if (result.success) {
        setMaSPList(result.data);
      }
    } catch (error) {
      console.error("Error fetching ma sp:", error);
    } finally {
      setIsLoadingMaSP(false);
    }
  };

  // Handle NPL selection - auto fill DVT and recalculate slCanDung (save only name, not code)
  const handleNPLSelect = (material: Material, isAddModal: boolean = false) => {
    const nameOnly = material.name.trim();
    const tyLeHaoHut = material.unit?.toLowerCase() === "mét" ? 0.01 : 0.03;
    if (isAddModal) {
      setCurrentNPLItem((prev) => ({
        ...prev,
        maNPL: nameOnly,
        dvt: material.unit,
        slCanDung: prev.dinhMuc * prev.slKHSX * (1 + tyLeHaoHut),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        maNPL: nameOnly,
        dvt: material.unit,
        slCanDung: prev.dinhMuc * prev.slKHSX * (1 + tyLeHaoHut),
      }));
    }
    setNplSearch(nameOnly);
    setShowNplDropdown(false);
  };

  // Handle Ma SP selection - auto fill Xuong SX
  const handleMaSPSelect = (sp: MaSP, isAddModal: boolean = false) => {
    if (isAddModal) {
      setCurrentNPLItem((prev) => ({
        ...prev,
        maSPSuDung: sp.maSP,
        xuongSX: sp.xuongSX,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        maSPSuDung: sp.maSP,
        xuongSX: sp.xuongSX,
      }));
    }
    setSpSearch(sp.maSP);
    setShowSpDropdown(false);
  };

  // Generate next maPhieuYC
  const generateNextMaPhieuYC = (): string => {
    // Get all unique maPhieuYC from data
    const existingCodes = data
      .map((item) => item.maPhieuYC)
      .filter((code) => code && code.startsWith("YC"));

    if (existingCodes.length === 0) {
      return "YC01";
    }

    // Extract numbers and find max
    const numbers = existingCodes.map((code) => {
      const match = code.match(/YC(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;

    // Pad with leading zeros (2 digits minimum)
    return `YC${nextNumber.toString().padStart(2, "0")}`;
  };

  // Filter materials based on search
  const filteredMaterials = materials.filter(
    (m) =>
      m.code.toLowerCase().includes(nplSearch.toLowerCase()) ||
      m.name.toLowerCase().includes(nplSearch.toLowerCase())
  );

  // Filter Ma SP based on search
  const filteredMaSP = maSPList.filter(
    (sp) =>
      sp.maSP.toLowerCase().includes(spSearch.toLowerCase()) ||
      sp.tenSP.toLowerCase().includes(spSearch.toLowerCase())
  );

  // Open add modal
  const openAddModal = () => {
    setFormData(emptyFormData);
    // Auto generate next maPhieuYC
    const nextMaPhieu = generateNextMaPhieuYC();
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
    setAddHeaderData({ ngayThang: todayStr, maPhieuYC: nextMaPhieu });
    setNplItems([]);
    setCurrentNPLItem(emptyNPLItem);
    setNplSearch("");
    setSpSearch("");
    setIsCopyMode(false);
    setShowAddModal(true);
  };

  // Open add modal in copy mode — pre-fill header + items from source group
  const handleCopyPhieu = (group: GroupedPhieuYC) => {
    setFormData(emptyFormData);
    const nextMaPhieu = generateNextMaPhieuYC();
    setAddHeaderData({ ngayThang: group.ngayThang || "", maPhieuYC: nextMaPhieu });
    setNplItems(
      group.items.map((item, i) => ({
        id: `copy-${Date.now()}-${i}`,
        maNPL: item.maNPL,
        dvt: item.dvt,
        dinhMuc: item.dinhMuc,
        tyLeHaoHut: item.tyLeHaoHut || 0.03,
        slKHSX: item.slKHSX,
        slCanDung: item.slCanDung,
        maSPSuDung: item.maSPSuDung,
        mauSac: item.mauSac,
        xuongSX: item.xuongSX,
      })),
    );
    setCurrentNPLItem(emptyNPLItem);
    setNplSearch("");
    setSpSearch("");
    setIsCopyMode(true);
    setShowAddModal(true);
  };

  // Add item to list
  const addItemToList = () => {
    if (!currentNPLItem.maNPL) {
      toast.error("Vui lòng chọn Mã NPL");
      return;
    }
    const newItem: NPLItem = {
      ...currentNPLItem,
      id: Date.now().toString(),
    };
    setNplItems((prev) => [...prev, newItem]);
    setCurrentNPLItem(emptyNPLItem);
    setNplSearch("");
    setSpSearch("");
    toast.success("Đã thêm vào danh sách");
  };

  // Remove item from list
  const removeItemFromList = (id: string) => {
    setNplItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Open edit modal
  const openEditModal = (item: YeuCauXuatKhoNPL) => {
    setEditingItem(item);
    setFormData({
      ngayThang: item.ngayThang,
      maPhieuYC: item.maPhieuYC,
      maNPL: item.maNPL,
      dvt: item.dvt,
      dinhMuc: item.dinhMuc,
      tyLeHaoHut: item.tyLeHaoHut || 0.03,
      slKHSX: item.slKHSX,
      slCanDung: item.slCanDung,
      maSPSuDung: item.maSPSuDung,
      mauSac: item.mauSac,
      xuongSX: item.xuongSX,
    });
    setNplSearch(item.maNPL);
    setSpSearch(item.maSPSuDung);
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (item: YeuCauXuatKhoNPL) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  // Handle add (multi-item)
  const handleAdd = async () => {
    if (nplItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 mã NPL vào danh sách");
      return;
    }

    try {
      setIsSubmitting(true);

      // Submit all items with same header data
      const promises = nplItems.map((item) =>
        fetch("/api/yeu-cau-xuat-kho-npl/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ngayThang: addHeaderData.ngayThang,
            maPhieuYC: addHeaderData.maPhieuYC,
            maNPL: item.maNPL,
            dvt: item.dvt,
            dinhMuc: item.dinhMuc,
            slKHSX: item.slKHSX,
            maSPSuDung: item.maSPSuDung,
            mauSac: item.mauSac,
            xuongSX: item.xuongSX,
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r.ok);

      if (allSuccess) {
        toast.success(
          isCopyMode
            ? `Sao chép sang phiếu ${addHeaderData.maPhieuYC} thành công (${nplItems.length} mã NPL)`
            : `Thêm ${nplItems.length} mã NPL thành công`,
        );
        setShowAddModal(false);
        setIsCopyMode(false);
        fetchData();
      } else {
        toast.error("Có lỗi khi thêm một số mã NPL");
      }
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Lỗi khi thêm yêu cầu xuất kho NPL");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/yeu-cau-xuat-kho-npl/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingItem.id, ...formData }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật yêu cầu xuất kho NPL thành công");
        setShowEditModal(false);
        setEditingItem(null);
        fetchData();
      } else {
        toast.error(result.error || "Không thể cập nhật yêu cầu xuất kho NPL");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi khi cập nhật yêu cầu xuất kho NPL");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/yeu-cau-xuat-kho-npl/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingItem.id }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Xóa yêu cầu xuất kho NPL thành công");
        setShowDeleteModal(false);
        setDeletingItem(null);
        fetchData();
      } else {
        toast.error(result.error || "Không thể xóa yêu cầu xuất kho NPL");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi khi xóa yêu cầu xuất kho NPL");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form component for Add/Edit
  const renderForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Ngày tháng */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
        <input
          type="date"
          value={convertToInputDate(formData.ngayThang)}
          onChange={(e) => setFormData({ ...formData, ngayThang: convertToSheetDate(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Mã phiếu YC */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu YC</label>
        <input
          type="text"
          value={formData.maPhieuYC}
          onChange={(e) => setFormData({ ...formData, maPhieuYC: e.target.value })}
          placeholder="Nhập mã phiếu yêu cầu..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Mã NPL - Dropdown with search */}
      <div className="relative" ref={nplDropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mã NPL <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nplSearch}
          onChange={(e) => {
            setNplSearch(e.target.value);
            setFormData({ ...formData, maNPL: e.target.value });
            setShowNplDropdown(true);
          }}
          onFocus={() => setShowNplDropdown(true)}
          placeholder="Tìm hoặc chọn mã NPL..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {showNplDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoadingMaterials ? (
              <div className="px-3 py-2 text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Đang tải...
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">Không tìm thấy</div>
            ) : (
              filteredMaterials.slice(0, 100).map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleNPLSelect(m)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-blue-600">{m.code}</div>
                  <div className="text-sm text-gray-500 truncate">{m.name}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ĐVT - Auto filled */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ĐVT (tự động)</label>
        <input
          type="text"
          value={formData.dvt}
          readOnly
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>

      {/* Định mức */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Định mức</label>
        <input
          type="number"
          step="0.01"
          value={formData.dinhMuc || ""}
          onChange={(e) => {
            const dinhMuc = parseFloat(e.target.value) || 0;
            const tyLeHaoHut = formData.dvt?.toLowerCase() === "mét" ? 0.01 : 0.03;
            setFormData({
              ...formData,
              dinhMuc,
              slCanDung: dinhMuc * formData.slKHSX * (1 + tyLeHaoHut)
            });
          }}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tỷ lệ hao hụt - 1% cho vải (Mét), 3% cho các loại khác */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ lệ hao hụt</label>
        <input
          type="text"
          value={formData.dvt ? (formData.dvt.toLowerCase() === "mét" ? "1%" : "3%") : ""}
          readOnly
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>

      {/* SL KH SX */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SL KH SX</label>
        <input
          type="number"
          value={formData.slKHSX || ""}
          onChange={(e) => {
            const slKHSX = parseFloat(e.target.value) || 0;
            const tyLeHaoHut = formData.dvt?.toLowerCase() === "mét" ? 0.01 : 0.03;
            setFormData({
              ...formData,
              slKHSX,
              slCanDung: formData.dinhMuc * slKHSX * (1 + tyLeHaoHut)
            });
          }}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* SL cần dùng - Auto calculated */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SL cần dùng (tự động)</label>
        <input
          type="text"
          value={formData.slCanDung ? formData.slCanDung.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "0"}
          readOnly
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">= Định mức × SL KH SX × (1 + {formData.dvt ? (formData.dvt.toLowerCase() === "mét" ? "1%" : "3%") : "tỷ lệ hao hụt"})</p>
      </div>

      {/* Mã SP sử dụng - Dropdown with search */}
      <div className="relative" ref={spDropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP sử dụng</label>
        <input
          type="text"
          value={spSearch}
          onChange={(e) => {
            setSpSearch(e.target.value);
            setFormData({ ...formData, maSPSuDung: e.target.value });
            setShowSpDropdown(true);
          }}
          onFocus={() => setShowSpDropdown(true)}
          placeholder="Tìm hoặc chọn mã SP..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {showSpDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoadingMaSP ? (
              <div className="px-3 py-2 text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Đang tải...
              </div>
            ) : filteredMaSP.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">Không tìm thấy</div>
            ) : (
              filteredMaSP.slice(0, 100).map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => handleMaSPSelect(sp)}
                  className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-green-600">{sp.maSP}</div>
                  <div className="text-sm text-gray-500 truncate">{sp.tenSP}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Màu sắc */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
        <input
          type="text"
          value={formData.mauSac}
          onChange={(e) => setFormData({ ...formData, mauSac: e.target.value })}
          placeholder="Nhập màu sắc..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Xưởng SX - Auto filled */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX (tự động)</label>
        <input
          type="text"
          value={formData.xuongSX}
          readOnly
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>
    </div>
  );

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
        <h3 className="text-lg font-semibold text-gray-900">
          Bảng kê yêu cầu xuất kho NPL ({filteredList.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã phiếu, mã NPL, mã SP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-72"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-purple-600" />
            <p className="text-sm text-purple-600">Số phiếu YC</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{groupedPhieuYC.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-600" />
            <p className="text-sm text-blue-600">Tổng số NPL</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{filteredList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-green-600" />
            <p className="text-sm text-green-600">Tổng SL KH SX</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{totalSLKHSX.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-orange-600" />
            <p className="text-sm text-orange-600">Tổng SL cần dùng</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{totalSlCanDung.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Table - Grouped by Mã phiếu YC */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Mã phiếu YC</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày tháng</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Số NPL</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Tổng SL KH SX</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Tổng SL cần dùng</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Xưởng SX</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedGroups.map((group) => (
              <tr
                key={group.maPhieuYC}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewGrouped(group)}
              >
                <td className="px-4 py-3 font-semibold text-blue-600">{group.maPhieuYC || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{group.ngayThang || "-"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium text-xs">
                    {group.itemCount} NPL
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-green-600">
                  {group.totalSLKHSX.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right font-medium text-orange-600">
                  {group.totalSlCanDung.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[150px]">
                  <div className="truncate" title={group.xuongSX}>{group.xuongSX || "-"}</div>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleViewGrouped(group)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleCopyPhieu(group)}
                      className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Sao chép phiếu"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGrouped(group.maPhieuYC)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa phiếu"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {groupedPhieuYC.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu yêu cầu xuất kho NPL
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, groupedPhieuYC.length)} / {groupedPhieuYC.length} phiếu
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

      {/* Add Modal - Multi-item */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">
                {isCopyMode ? "Sao chép yêu cầu xuất kho NPL" : "Thêm yêu cầu xuất kho NPL"}
              </h3>
              <button onClick={() => { setShowAddModal(false); setIsCopyMode(false); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Header: Ngày tháng & Mã phiếu YC */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
                  <input
                    type="date"
                    value={convertToInputDate(addHeaderData.ngayThang)}
                    onChange={(e) => setAddHeaderData({ ...addHeaderData, ngayThang: convertToSheetDate(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu YC</label>
                  <input
                    type="text"
                    value={addHeaderData.maPhieuYC}
                    onChange={(e) => setAddHeaderData({ ...addHeaderData, maPhieuYC: e.target.value })}
                    placeholder="VD: YC03"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Form thêm mã NPL */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3">Thêm mã NPL vào phiếu</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Mã NPL */}
                  <div className="relative" ref={nplDropdownRef}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mã NPL <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={nplSearch}
                      onChange={(e) => {
                        setNplSearch(e.target.value);
                        setCurrentNPLItem({ ...currentNPLItem, maNPL: e.target.value });
                        setShowNplDropdown(true);
                      }}
                      onFocus={() => setShowNplDropdown(true)}
                      placeholder="Tìm mã NPL..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {showNplDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {isLoadingMaterials ? (
                          <div className="px-3 py-2 text-gray-500 flex items-center gap-2 text-sm">
                            <Loader2 size={14} className="animate-spin" /> Đang tải...
                          </div>
                        ) : filteredMaterials.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-sm">Không tìm thấy</div>
                        ) : (
                          filteredMaterials.slice(0, 50).map((m) => (
                            <div
                              key={m.id}
                              onClick={() => handleNPLSelect(m, true)}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium text-blue-600 text-sm">{m.code}</div>
                              <div className="text-xs text-gray-500 truncate">{m.name}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* ĐVT */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ĐVT</label>
                    <input
                      type="text"
                      value={currentNPLItem.dvt}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm"
                    />
                  </div>

                  {/* Định mức */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Định mức</label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentNPLItem.dinhMuc || ""}
                      onChange={(e) => {
                        const dinhMuc = parseFloat(e.target.value) || 0;
                        const tyLeHaoHut = currentNPLItem.dvt?.toLowerCase() === "mét" ? 0.01 : 0.03;
                        setCurrentNPLItem({
                          ...currentNPLItem,
                          dinhMuc,
                          slCanDung: dinhMuc * currentNPLItem.slKHSX * (1 + tyLeHaoHut)
                        });
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Tỷ lệ hao hụt - 1% cho vải (Mét), 3% cho các loại khác */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tỷ lệ hao hụt</label>
                    <input
                      type="text"
                      value={currentNPLItem.dvt ? (currentNPLItem.dvt.toLowerCase() === "mét" ? "1%" : "3%") : ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm"
                    />
                  </div>

                  {/* SL KH SX */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SL KH SX</label>
                    <input
                      type="number"
                      value={currentNPLItem.slKHSX || ""}
                      onChange={(e) => {
                        const slKHSX = parseFloat(e.target.value) || 0;
                        const tyLeHaoHut = currentNPLItem.dvt?.toLowerCase() === "mét" ? 0.01 : 0.03;
                        setCurrentNPLItem({
                          ...currentNPLItem,
                          slKHSX,
                          slCanDung: currentNPLItem.dinhMuc * slKHSX * (1 + tyLeHaoHut)
                        });
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* SL cần dùng */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SL cần dùng</label>
                    <input
                      type="text"
                      value={currentNPLItem.slCanDung ? currentNPLItem.slCanDung.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "0"}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm"
                    />
                  </div>

                  {/* Mã SP sử dụng */}
                  <div className="relative" ref={spDropdownRef}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mã SP sử dụng</label>
                    <input
                      type="text"
                      value={spSearch}
                      onChange={(e) => {
                        setSpSearch(e.target.value);
                        setCurrentNPLItem({ ...currentNPLItem, maSPSuDung: e.target.value });
                        setShowSpDropdown(true);
                      }}
                      onFocus={() => setShowSpDropdown(true)}
                      placeholder="Tìm mã SP..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {showSpDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {isLoadingMaSP ? (
                          <div className="px-3 py-2 text-gray-500 flex items-center gap-2 text-sm">
                            <Loader2 size={14} className="animate-spin" /> Đang tải...
                          </div>
                        ) : filteredMaSP.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-sm">Không tìm thấy</div>
                        ) : (
                          filteredMaSP.slice(0, 50).map((sp) => (
                            <div
                              key={sp.id}
                              onClick={() => handleMaSPSelect(sp, true)}
                              className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium text-green-600 text-sm">{sp.maSP}</div>
                              <div className="text-xs text-gray-500 truncate">{sp.tenSP}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Màu sắc */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Màu sắc</label>
                    <input
                      type="text"
                      value={currentNPLItem.mauSac}
                      onChange={(e) => setCurrentNPLItem({ ...currentNPLItem, mauSac: e.target.value })}
                      placeholder="Nhập màu sắc..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Xưởng SX */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Xưởng SX</label>
                    <input
                      type="text"
                      value={currentNPLItem.xuongSX}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={addItemToList}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Thêm vào danh sách
                </button>
              </div>

              {/* Danh sách mã NPL đã thêm */}
              {nplItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-blue-600 text-white font-medium text-sm">
                    Danh sách mã NPL ({nplItems.length})
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Mã NPL</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">ĐVT</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Định mức</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">Hao hụt</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">SL KH SX</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">SL cần dùng</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Mã SP</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {nplItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-blue-600 font-medium max-w-[150px] truncate" title={item.maNPL}>
                            {item.maNPL}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{item.dvt}</td>
                          <td className="px-3 py-2 text-right text-gray-600">
                            {item.dinhMuc.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600">3%</td>
                          <td className="px-3 py-2 text-right text-green-600 font-medium">
                            {item.slKHSX.toLocaleString("vi-VN")}
                          </td>
                          <td className="px-3 py-2 text-right text-orange-600 font-medium">
                            {item.slCanDung.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{item.maSPSuDung || "-"}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeItemFromList(item.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => { setShowAddModal(false); setIsCopyMode(false); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAdd}
                disabled={isSubmitting || nplItems.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {isCopyMode ? `Xác nhận sao chép (${nplItems.length} mã)` : `Tạo phiếu (${nplItems.length} mã)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Sửa yêu cầu xuất kho NPL</h3>
              <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              {renderForm()}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
              <button onClick={() => { setShowDeleteModal(false); setDeletingItem(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa yêu cầu xuất kho NPL này?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Mã NPL:</strong> {deletingItem.maNPL}</p>
                <p className="text-sm"><strong>Mã phiếu YC:</strong> {deletingItem.maPhieuYC || "-"}</p>
                <p className="text-sm"><strong>Mã SP sử dụng:</strong> {deletingItem.maSPSuDung || "-"}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletingItem(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Grouped Phieu Modal */}
      {showDeleteModal && phieuToDelete && !deletingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa phiếu</h3>
              <button onClick={() => { setShowDeleteModal(false); setPhieuToDelete(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa <strong>tất cả</strong> yêu cầu xuất kho trong phiếu này?
              </p>
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-700">Mã phiếu: {phieuToDelete}</p>
                <p className="text-sm text-red-600 mt-1">
                  Số NPL sẽ bị xóa: {data.filter(item => item.maPhieuYC === phieuToDelete).length}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => { setShowDeleteModal(false); setPhieuToDelete(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteGrouped}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewGroupedPhieu && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowViewModal(false); setViewGroupedPhieu(null); }} />
          <div className="fixed inset-4 lg:inset-8 z-50 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết phiếu yêu cầu xuất kho NPL</h3>
                <p className="text-sm text-gray-500">Mã phiếu: <strong className="text-blue-600">{viewGroupedPhieu.maPhieuYC}</strong> | Ngày: {viewGroupedPhieu.ngayThang} | Xưởng: {viewGroupedPhieu.xuongSX || "-"}</p>
              </div>
              <button
                onClick={() => { setShowViewModal(false); setViewGroupedPhieu(null); }}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 bg-gray-50 border-b flex gap-6">
              <div>
                <p className="text-sm text-gray-500">Số NPL</p>
                <p className="text-xl font-bold text-blue-600">{viewGroupedPhieu.itemCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng SL KH SX</p>
                <p className="text-xl font-bold text-green-600">{viewGroupedPhieu.totalSLKHSX.toLocaleString("vi-VN")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng SL cần dùng</p>
                <p className="text-xl font-bold text-orange-600">{viewGroupedPhieu.totalSlCanDung.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-green-50">
                    <th className="px-3 py-3 text-left font-medium text-gray-600 w-12">STT</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[250px]">Mã NPL</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">ĐVT</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-600">Định mức</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-600">Hao hụt</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-600">SL KH SX</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-600">SL cần dùng</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">Mã SP sử dụng</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">Màu sắc</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-600 w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {viewGroupedPhieu.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-600">{index + 1}</td>
                      <td className="px-3 py-2.5 text-gray-900">
                        <div className="truncate max-w-[300px]" title={item.maNPL}>{item.maNPL || "-"}</div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{item.dvt || "-"}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.dinhMuc > 0 ? item.dinhMuc.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-600">3%</td>
                      <td className="px-3 py-2.5 text-right font-medium text-green-600">
                        {item.slKHSX > 0 ? item.slKHSX.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-orange-600">
                        {item.slCanDung > 0 ? item.slCanDung.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{item.maSPSuDung || "-"}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.mauSac || "-"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setShowViewModal(false);
                              setViewGroupedPhieu(null);
                              openEditModal(item);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setShowViewModal(false);
                              setViewGroupedPhieu(null);
                              openDeleteModal(item);
                            }}
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
                    <td colSpan={5} className="px-3 py-3 text-right">Tổng cộng:</td>
                    <td className="px-3 py-3 text-right text-green-600">
                      {viewGroupedPhieu.totalSLKHSX.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-3 text-right text-orange-600">
                      {viewGroupedPhieu.totalSlCanDung.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => { setShowViewModal(false); setViewGroupedPhieu(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
