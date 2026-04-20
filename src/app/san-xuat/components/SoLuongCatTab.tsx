"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Scissors, Package, Calendar, Plus, Pencil, Trash2, X, Check, FileDown, ImageIcon } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import ConfirmModal from "@/components/ConfirmModal";
import PrintDownloadButton from "@/components/PrintDownloadButton";
import html2canvas from "html2canvas";

// Portal component for modals
const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

interface SoLuongCat {
  id: number;
  maPhieuCat: string;
  maSP: string;
  lenhSanXuat: string;
  xuongSanXuat: string;
  mauSac: string;
  soLuongKeHoach: number;
  ngayCat: string;
  soLuongCat: number;
  slCatTruSlKH: number;
  tiLeCacMau: string;
  nguyenNhan1: string;
  soLuongNhapKho: number;
  slNKTruSlCat: number;
  nguyenNhan2: string;
  ghiChu: string;
}

interface MaSP {
  id: number;
  maSP: string;
  tenSP: string;
  xuongSX: string;
  lenhSX: string;
}

interface GroupedPhieuCat {
  maPhieuCat: string;
  xuongSanXuat: string;
  lenhSanXuat: string;
  items: SoLuongCat[];
  itemCount: number;
  totalSLKH: number;
  totalSLCat: number;
  totalSLNK: number;
}

interface FormItem {
  maSP: string;
  xuongSanXuat: string;
  lenhSanXuat: string;
  mauSac: string;
  soLuongKeHoach: number;
  ngayCat: string;
  soLuongCat: number;
  slCatTruSlKH: number;
  tiLeCacMau: string;
  nguyenNhan1: string;
  soLuongNhapKho: number;
  slNKTruSlCat: number;
  nguyenNhan2: string;
  ghiChu: string;
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

const emptyFormData: Omit<SoLuongCat, "id"> = {
  maPhieuCat: "",
  maSP: "",
  lenhSanXuat: "",
  xuongSanXuat: "",
  mauSac: "",
  soLuongKeHoach: 0,
  ngayCat: "",
  soLuongCat: 0,
  slCatTruSlKH: 0,
  tiLeCacMau: "",
  nguyenNhan1: "",
  soLuongNhapKho: 0,
  slNKTruSlCat: 0,
  nguyenNhan2: "",
  ghiChu: "",
};

const emptyFormItem: FormItem = {
  maSP: "",
  xuongSanXuat: "",
  lenhSanXuat: "",
  mauSac: "",
  soLuongKeHoach: 0,
  ngayCat: "",
  soLuongCat: 0,
  slCatTruSlKH: 0,
  tiLeCacMau: "",
  nguyenNhan1: "",
  soLuongNhapKho: 0,
  slNKTruSlCat: 0,
  nguyenNhan2: "",
  ghiChu: "",
};

export default function SoLuongCatTab() {
  const [data, setData] = useState<SoLuongCat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState<Omit<SoLuongCat, "id">>(emptyFormData);
  const [editingItem, setEditingItem] = useState<SoLuongCat | null>(null);
  const [deletingItem, setDeletingItem] = useState<SoLuongCat | null>(null);
  const [viewingGroup, setViewingGroup] = useState<GroupedPhieuCat | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const detailTableRef = useRef<HTMLDivElement>(null);

  // Group delete confirmation state
  const [showGroupDeleteConfirm, setShowGroupDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupedPhieuCat | null>(null);

  // Multi-item form states
  const [headerForm, setHeaderForm] = useState({ maPhieuCat: "" });
  const [formItems, setFormItems] = useState<FormItem[]>([{ ...emptyFormItem }]);

  // Dropdown data
  const [maSPList, setMaSPList] = useState<MaSP[]>([]);
  const [isLoadingMaSP, setIsLoadingMaSP] = useState(false);

  // Bang ke LSX data for SL ke hoach lookup
  const [bangKeLSXMap, setBangKeLSXMap] = useState<Record<string, number>>({});

  // Gia thanh data for SL nhap kho lookup
  const [giaThanhMap, setGiaThanhMap] = useState<Record<string, number>>({});

  // Dropdown search states
  const [maSPSearch, setMaSPSearch] = useState("");
  const [showMaSPDropdown, setShowMaSPDropdown] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const maSPDropdownRef = useRef<HTMLDivElement>(null);

  // Filtered maSP - filter based on the active item's maSP value
  const getFilteredMaSP = (searchValue: string) => {
    if (!searchValue) return maSPList.slice(0, 50);
    return maSPList.filter(
      (sp) =>
        sp.maSP.toLowerCase().includes(searchValue.toLowerCase()) ||
        sp.tenSP.toLowerCase().includes(searchValue.toLowerCase())
    ).slice(0, 50);
  };

  // For edit modal
  const filteredMaSP = maSPList.filter(
    (sp) =>
      sp.maSP.toLowerCase().includes(maSPSearch.toLowerCase()) ||
      sp.tenSP.toLowerCase().includes(maSPSearch.toLowerCase())
  );

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maPhieuCat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lenhSanXuat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.xuongSanXuat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ngayCat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group data by maPhieuCat
  const groupedData = useMemo(() => {
    const groups: { [key: string]: GroupedPhieuCat } = {};
    filteredList.forEach((item) => {
      const key = item.maPhieuCat || `no-code-${item.id}`;
      if (!groups[key]) {
        groups[key] = {
          maPhieuCat: item.maPhieuCat,
          xuongSanXuat: item.xuongSanXuat,
          lenhSanXuat: item.lenhSanXuat,
          items: [],
          itemCount: 0,
          totalSLKH: 0,
          totalSLCat: 0,
          totalSLNK: 0,
        };
      }
      groups[key].items.push(item);
      groups[key].itemCount++;
      groups[key].totalSLKH += item.soLuongKeHoach || 0;
      groups[key].totalSLCat += item.soLuongCat || 0;
      groups[key].totalSLNK += item.soLuongNhapKho || 0;
    });
    return Object.values(groups).sort((a, b) => {
      const numA = parseInt(a.maPhieuCat.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.maPhieuCat.replace(/\D/g, "")) || 0;
      return numB - numA;
    });
  }, [filteredList]);

  // Pagination for grouped data
  const totalPages = Math.ceil(groupedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGroups = groupedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalSLKH = filteredList.reduce((sum, item) => sum + item.soLuongKeHoach, 0);
  const totalSLCat = filteredList.reduce((sum, item) => sum + item.soLuongCat, 0);
  const totalSLNK = filteredList.reduce((sum, item) => sum + item.soLuongNhapKho, 0);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (maSPDropdownRef.current && !maSPDropdownRef.current.contains(event.target as Node)) {
        setShowMaSPDropdown(false);
        setActiveDropdownIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/so-luong-cat");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu số lượng cắt");
      }
    } catch (error) {
      console.error("Error fetching so luong cat:", error);
      toast.error("Lỗi khi tải dữ liệu số lượng cắt");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaSPList = async () => {
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

  // Fetch Bang Ke LSX data for SL Ke Hoach lookup
  const fetchBangKeLSX = async () => {
    try {
      const response = await fetch("/api/bang-ke-lsx");
      const result = await response.json();
      if (result.success) {
        // Create a map of maSP -> tongSL for quick lookup
        const map: Record<string, number> = {};
        result.data.forEach((item: { maSP: string; tongSL: number }) => {
          map[item.maSP] = item.tongSL;
        });
        setBangKeLSXMap(map);
      }
    } catch (error) {
      console.error("Error fetching bang ke LSX:", error);
    }
  };

  // Fetch Gia Thanh data for SL Nhap Kho lookup
  const fetchGiaThanhMap = async () => {
    try {
      const response = await fetch("/api/gia-thanh");
      const result = await response.json();
      if (result.success) {
        // Create a map of maSP -> slNhapKho for quick lookup
        const map: Record<string, number> = {};
        result.data.forEach((item: { maSP: string; slNhapKho: number }) => {
          map[item.maSP] = item.slNhapKho;
        });
        setGiaThanhMap(map);
      }
    } catch (error) {
      console.error("Error fetching gia thanh:", error);
    }
  };

  // Handle MaSP selection
  const handleMaSPSelect = (sp: MaSP) => {
    setFormData((prev) => ({
      ...prev,
      maSP: sp.maSP,
      xuongSanXuat: sp.xuongSX || "",
      lenhSanXuat: sp.lenhSX || "",
    }));
    setMaSPSearch(sp.maSP);
    setShowMaSPDropdown(false);
  };

  // Generate next Mã phiếu cắt
  const generateNextMaPhieuCat = (): string => {
    // Extract all existing maPhieuCat codes
    const existingCodes = data.map((item) => item.maPhieuCat).filter((code) => code);

    if (existingCodes.length === 0) {
      return "PC001";
    }

    // Find codes that match pattern like "PC001", "PC002", etc.
    const codePattern = /^([A-Za-z]+)(\d+)$/;
    let maxNumber = 0;
    let prefix = "PC";

    existingCodes.forEach((code) => {
      const match = code.match(codePattern);
      if (match) {
        const codePrefix = match[1];
        const number = parseInt(match[2], 10);
        if (number > maxNumber) {
          maxNumber = number;
          prefix = codePrefix;
        }
      }
    });

    // If no matching pattern found, try to find any numeric suffix
    if (maxNumber === 0) {
      existingCodes.forEach((code) => {
        const numMatch = code.match(/(\d+)$/);
        if (numMatch) {
          const number = parseInt(numMatch[1], 10);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      });
    }

    // Generate next code
    const nextNumber = maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, "0");
    return `${prefix}${paddedNumber}`;
  };

  // Open add modal
  const openAddModal = () => {
    setFormData(emptyFormData);
    const nextMaPhieuCat = generateNextMaPhieuCat();
    setHeaderForm({ maPhieuCat: nextMaPhieuCat });
    setFormItems([{ ...emptyFormItem }]);
    setMaSPSearch("");
    setActiveDropdownIndex(null);
    fetchMaSPList();
    fetchBangKeLSX();
    fetchGiaThanhMap();
    setShowAddModal(true);
  };

  // Open details modal
  const openDetailsModal = (group: GroupedPhieuCat) => {
    setViewingGroup(group);
    setShowDetailsModal(true);
  };

  // Open edit modal
  const openEditModal = (item: SoLuongCat) => {
    setEditingItem(item);
    setFormData({
      maPhieuCat: item.maPhieuCat,
      maSP: item.maSP,
      lenhSanXuat: item.lenhSanXuat,
      xuongSanXuat: item.xuongSanXuat,
      mauSac: item.mauSac,
      soLuongKeHoach: item.soLuongKeHoach,
      ngayCat: item.ngayCat,
      soLuongCat: item.soLuongCat,
      slCatTruSlKH: item.slCatTruSlKH,
      tiLeCacMau: item.tiLeCacMau,
      nguyenNhan1: item.nguyenNhan1,
      soLuongNhapKho: item.soLuongNhapKho,
      slNKTruSlCat: item.slNKTruSlCat,
      nguyenNhan2: item.nguyenNhan2,
      ghiChu: item.ghiChu,
    });
    setMaSPSearch(item.maSP);
    fetchMaSPList();
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (item: SoLuongCat) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  // Add new form item
  const addFormItem = () => {
    setFormItems([...formItems, { ...emptyFormItem }]);
  };

  // Remove form item
  const removeFormItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  // Update form item
  const updateFormItem = (index: number, updates: Partial<FormItem>) => {
    setFormItems(formItems.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  // Handle add multiple items
  const handleAdd = async () => {
    if (!headerForm.maPhieuCat) {
      toast.error("Vui lòng nhập mã phiếu cắt");
      return;
    }

    const validItems = formItems.filter((item) => item.maSP);
    if (validItems.length === 0) {
      toast.error("Vui lòng nhập ít nhất 1 mã SP");
      return;
    }

    try {
      setIsSubmitting(true);
      let successCount = 0;

      for (const item of validItems) {
        const response = await fetch("/api/so-luong-cat/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maPhieuCat: headerForm.maPhieuCat,
            xuongSanXuat: item.xuongSanXuat,
            lenhSanXuat: item.lenhSanXuat,
            maSP: item.maSP,
            mauSac: item.mauSac,
            soLuongKeHoach: item.soLuongKeHoach,
            ngayCat: convertToSheetDate(item.ngayCat),
            soLuongCat: item.soLuongCat,
            slCatTruSlKH: item.slCatTruSlKH,
            tiLeCacMau: item.tiLeCacMau,
            nguyenNhan1: item.nguyenNhan1,
            soLuongNhapKho: item.soLuongNhapKho,
            slNKTruSlCat: item.slNKTruSlCat,
            nguyenNhan2: item.nguyenNhan2,
            ghiChu: item.ghiChu,
          }),
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Thêm thành công ${successCount} mục`);
        fetchData();
        setShowAddModal(false);
      } else {
        toast.error("Lỗi khi thêm số lượng cắt");
      }
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Lỗi khi thêm số lượng cắt");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/so-luong-cat/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          ...formData,
          ngayCat: convertToSheetDate(formData.ngayCat),
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật thành công");
        fetchData();
        setShowEditModal(false);
        setEditingItem(null);
      } else {
        toast.error(result.error || "Lỗi khi cập nhật");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/so-luong-cat/delete?id=${deletingItem.id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Xóa thành công");
        fetchData();
        setShowDeleteModal(false);
        setDeletingItem(null);
      } else {
        toast.error(result.error || "Lỗi khi xóa");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi khi xóa");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete group - open confirmation modal
  const handleDeleteGroup = (group: GroupedPhieuCat) => {
    setGroupToDelete(group);
    setShowGroupDeleteConfirm(true);
  };

  // Confirm delete group
  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      setIsSubmitting(true);
      let successCount = 0;

      const sortedItems = [...groupToDelete.items].sort((a, b) => b.id - a.id);
      for (const item of sortedItems) {
        const response = await fetch(`/api/so-luong-cat/delete?id=${item.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Đã xóa ${successCount} mục`);
        fetchData();
        setShowDetailsModal(false);
        setViewingGroup(null);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Lỗi khi xóa");
    } finally {
      setIsSubmitting(false);
      setShowGroupDeleteConfirm(false);
      setGroupToDelete(null);
    }
  };

  // Render form
  const renderForm = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {/* Mã phiếu cắt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu cắt</label>
        <input
          type="text"
          value={formData.maPhieuCat}
          onChange={(e) => setFormData({ ...formData, maPhieuCat: e.target.value })}
          placeholder="Nhập mã phiếu cắt"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Mã SP - Dropdown */}
      <div className="relative" ref={maSPDropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
        <input
          type="text"
          value={maSPSearch}
          onChange={(e) => {
            setMaSPSearch(e.target.value);
            setFormData({ ...formData, maSP: e.target.value });
            setShowMaSPDropdown(true);
          }}
          onFocus={() => setShowMaSPDropdown(true)}
          placeholder="Tìm mã SP..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {showMaSPDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {isLoadingMaSP ? (
              <div className="px-3 py-2 text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Đang tải...
              </div>
            ) : filteredMaSP.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">Không tìm thấy</div>
            ) : (
              filteredMaSP.slice(0, 50).map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => handleMaSPSelect(sp)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-blue-600">{sp.maSP}</div>
                  <div className="text-sm text-gray-500 truncate">{sp.tenSP}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lệnh SX */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lệnh SX</label>
        <input
          type="text"
          value={formData.lenhSanXuat}
          onChange={(e) => setFormData({ ...formData, lenhSanXuat: e.target.value })}
          placeholder="Lệnh sản xuất"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Xưởng SX */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
        <input
          type="text"
          value={formData.xuongSanXuat}
          onChange={(e) => setFormData({ ...formData, xuongSanXuat: e.target.value })}
          placeholder="Xưởng sản xuất"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Màu sắc */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
        <input
          type="text"
          value={formData.mauSac}
          onChange={(e) => setFormData({ ...formData, mauSac: e.target.value })}
          placeholder="Màu sắc"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Ngày cắt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày cắt</label>
        <input
          type="date"
          value={convertToInputDate(formData.ngayCat)}
          onChange={(e) => setFormData({ ...formData, ngayCat: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* SL kế hoạch */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SL kế hoạch</label>
        <input
          type="number"
          value={formData.soLuongKeHoach || ""}
          onChange={(e) => {
            const soLuongKeHoach = parseFloat(e.target.value) || 0;
            setFormData({
              ...formData,
              soLuongKeHoach,
              slCatTruSlKH: soLuongKeHoach - formData.soLuongCat,
            });
          }}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* SL cắt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SL cắt</label>
        <input
          type="number"
          value={formData.soLuongCat || ""}
          onChange={(e) => {
            const soLuongCat = parseFloat(e.target.value) || 0;
            setFormData({
              ...formData,
              soLuongCat,
              slCatTruSlKH: formData.soLuongKeHoach - soLuongCat,
              slNKTruSlCat: soLuongCat - formData.soLuongNhapKho,
            });
          }}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* SL cắt - SL KH (auto) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SL cắt - SL KH</label>
        <input
          type="text"
          value={formData.slCatTruSlKH || 0}
          readOnly
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>

      {/* Tỉ lệ các màu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tỉ lệ các màu</label>
        <input
          type="text"
          value={formData.tiLeCacMau}
          onChange={(e) => setFormData({ ...formData, tiLeCacMau: e.target.value })}
          placeholder="Tỉ lệ các màu"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Nguyên nhân 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nguyên nhân (cắt)</label>
        <input
          type="text"
          value={formData.nguyenNhan1}
          onChange={(e) => setFormData({ ...formData, nguyenNhan1: e.target.value })}
          placeholder="Nguyên nhân"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* SL nhập kho */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SL nhập kho</label>
        <input
          type="number"
          value={formData.soLuongNhapKho || ""}
          onChange={(e) => {
            const soLuongNhapKho = parseFloat(e.target.value) || 0;
            setFormData({
              ...formData,
              soLuongNhapKho,
              slNKTruSlCat: formData.soLuongCat - soLuongNhapKho,
            });
          }}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* SL NK - SL cắt (auto) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SL NK - SL cắt</label>
        <input
          type="text"
          value={formData.slNKTruSlCat || 0}
          readOnly
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>

      {/* Nguyên nhân 2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nguyên nhân (NK)</label>
        <input
          type="text"
          value={formData.nguyenNhan2}
          onChange={(e) => setFormData({ ...formData, nguyenNhan2: e.target.value })}
          placeholder="Nguyên nhân"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Ghi chú */}
      <div className="col-span-2 md:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
        <textarea
          value={formData.ghiChu}
          onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
          placeholder="Ghi chú"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Export danh sách PDF
  const handleExportListPDF = () => {
    if (groupedData.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = groupedData.map((g, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-weight:600;color:#2563eb;">${g.maPhieuCat}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${g.xuongSanXuat || "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${g.lenhSanXuat || "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${g.itemCount}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(g.totalSLKH)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(g.totalSLCat)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(g.totalSLNK)}</td>
    </tr>`).join("");
    printWindow.document.write(`<html><head><title>Số lượng cắt</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:20px; text-align:center; } table { width:100%; border-collapse:collapse; font-size:12px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>SỐ LƯỢNG CẮT</h1>
      <table><thead><tr><th style="width:30px;">STT</th><th>Mã phiếu</th><th>Xưởng SX</th><th>Lệnh SX</th><th>Số SP</th><th style="text-align:right;">SL KH</th><th style="text-align:right;">SL cắt</th><th style="text-align:right;">SL NK</th></tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;"><td colspan="5" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng:</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalSLKH)}</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalSLCat)}</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalSLNK)}</td></tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  // Download danh sách ảnh JPG
  const handleExportListImage = async () => {
    const tableEl = document.querySelector("[data-export-table]");
    if (!tableEl) return;
    try {
      const canvas = await html2canvas(tableEl as HTMLElement, { backgroundColor: "#ffffff", scale: 2 });
      const link = document.createElement("a");
      link.download = "So_luong_cat.jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      toast.success("Đã tải ảnh");
    } catch (err) {
      console.error("Error exporting image:", err);
      toast.error("Lỗi khi xuất ảnh");
    }
  };

  // Export chi tiết phiếu PDF
  const handleExportDetailPDF = (group: GroupedPhieuCat | null) => {
    if (!group) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = group.items.map((item, i) => `<tr>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;">${item.maSP || "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;">${item.mauSac || "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;">${item.ngayCat || "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${item.soLuongKeHoach > 0 ? fmt(item.soLuongKeHoach) : "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${item.soLuongCat > 0 ? fmt(item.soLuongCat) : "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;${item.slCatTruSlKH < 0 ? "color:red;" : ""}">${item.slCatTruSlKH !== 0 ? fmt(item.slCatTruSlKH) : "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;">${item.tiLeCacMau || "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${item.soLuongNhapKho > 0 ? fmt(item.soLuongNhapKho) : "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;${item.slNKTruSlCat < 0 ? "color:red;" : ""}">${item.slNKTruSlCat !== 0 ? fmt(item.slNKTruSlCat) : "-"}</td>
      <td style="padding:4px 6px;border:1px solid #ddd;">${item.ghiChu || "-"}</td>
    </tr>`).join("");
    const title = `Phiếu cắt - ${group.maPhieuCat}`;
    printWindow.document.write(`<html><head><title>${title}</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:5px; text-align:center; } .info { text-align:center; color:#666; margin-bottom:15px; font-size:13px; } table { width:100%; border-collapse:collapse; font-size:11px; } th { padding:5px 6px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>${title.toUpperCase()}</h1>
      <p class="info">Xưởng: ${group.xuongSanXuat || "-"} | Lệnh SX: ${group.lenhSanXuat || "-"}</p>
      <table><thead><tr><th style="width:25px;">STT</th><th>Mã SP</th><th>Màu sắc</th><th>Ngày cắt</th><th style="text-align:right;">SL KH</th><th style="text-align:right;">SL cắt</th><th style="text-align:right;">Cắt-KH</th><th>Tỉ lệ màu</th><th style="text-align:right;">SL NK</th><th style="text-align:right;">NK-Cắt</th><th>Ghi chú</th></tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;"><td colspan="4" style="padding:4px 6px;border:1px solid #ddd;text-align:right;">Tổng:</td><td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${fmt(group.totalSLKH)}</td><td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${fmt(group.totalSLCat)}</td><td colspan="2"></td><td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${fmt(group.totalSLNK)}</td><td colspan="2"></td></tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
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
          <Scissors size={20} className="text-blue-600" />
          Số lượng cắt ({filteredList.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã phiếu, mã SP, LSX, xưởng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-72"
            />
          </div>
          <button onClick={handleExportListPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"><FileDown size={14} /> PDF</button>
          <button onClick={handleExportListImage} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"><ImageIcon size={14} /> JPG</button>
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
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-600" />
            <p className="text-sm text-blue-600">Tổng số dòng</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{filteredList.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-purple-600" />
            <p className="text-sm text-purple-600">Tổng SL kế hoạch</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{totalSLKH.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <Scissors size={16} className="text-green-600" />
            <p className="text-sm text-green-600">Tổng SL cắt</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{totalSLCat.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-orange-600" />
            <p className="text-sm text-orange-600">Tổng SL nhập kho</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{totalSLNK.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table - Grouped View */}
      <div data-export-table className="overflow-auto max-h-[70vh] border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-green-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-12">STT</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Mã phiếu cắt</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Lệnh SX</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[180px]">Xưởng SX</th>
              <th className="px-3 py-3 text-center font-medium text-gray-600">Số mục</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Tổng SL KH</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Tổng SL cắt</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Tổng SL NK</th>
              <th className="px-3 py-3 text-center font-medium text-gray-600 w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedGroups.map((group, index) => (
              <tr
                key={group.maPhieuCat || index}
                className="hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => openDetailsModal(group)}
              >
                <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{group.maPhieuCat || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600">{group.lenhSanXuat || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[200px]">
                  <div className="truncate" title={group.xuongSanXuat}>{group.xuongSanXuat || "-"}</div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {group.itemCount} mục
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-purple-600 font-medium">
                  {group.totalSLKH > 0 ? group.totalSLKH.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-green-600 font-medium">
                  {group.totalSLCat > 0 ? group.totalSLCat.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right text-orange-600 font-medium">
                  {group.totalSLNK > 0 ? group.totalSLNK.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      disabled={isSubmitting}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Xóa tất cả"
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
              <td colSpan={4} className="px-3 py-3 text-right">Tổng cộng ({groupedData.length} phiếu):</td>
              <td className="px-3 py-3 text-center text-blue-600">{filteredList.length} mục</td>
              <td className="px-3 py-3 text-right text-purple-600">
                {totalSLKH.toLocaleString("vi-VN")}
              </td>
              <td className="px-3 py-3 text-right text-green-600">
                {totalSLCat.toLocaleString("vi-VN")}
              </td>
              <td className="px-3 py-3 text-right text-orange-600">
                {totalSLNK.toLocaleString("vi-VN")}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {groupedData.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu số lượng cắt
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, groupedData.length)} / {groupedData.length} phiếu
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
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold">Thêm số lượng cắt</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                {/* Header - Common fields */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-3">Thông tin chung</h4>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu cắt *</label>
                    <input
                      type="text"
                      value={headerForm.maPhieuCat}
                      onChange={(e) => setHeaderForm({ ...headerForm, maPhieuCat: e.target.value })}
                      placeholder="Nhập mã phiếu cắt"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Form Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Danh sách mã SP ({formItems.length})</h4>
                    <button
                      onClick={addFormItem}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Thêm dòng
                    </button>
                  </div>

                  {formItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Mục #{index + 1}</span>
                        {formItems.length > 1 && (
                          <button
                            onClick={() => removeFormItem(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Mã SP */}
                        <div className="relative" ref={activeDropdownIndex === index ? maSPDropdownRef : null}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Mã SP *</label>
                          <input
                            type="text"
                            value={item.maSP}
                            onChange={(e) => {
                              updateFormItem(index, { maSP: e.target.value });
                              setActiveDropdownIndex(index);
                            }}
                            onFocus={() => setActiveDropdownIndex(index)}
                            placeholder="Tìm mã SP..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          {activeDropdownIndex === index && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {isLoadingMaSP ? (
                                <div className="px-3 py-2 text-gray-500 flex items-center gap-2">
                                  <Loader2 size={14} className="animate-spin" /> Đang tải...
                                </div>
                              ) : getFilteredMaSP(item.maSP).length === 0 ? (
                                <div className="px-3 py-2 text-gray-500 text-sm">Không tìm thấy</div>
                              ) : (
                                getFilteredMaSP(item.maSP).map((sp) => (
                                  <div
                                    key={sp.id}
                                    onClick={() => {
                                      const slKeHoach = bangKeLSXMap[sp.maSP] || 0;
                                      const slNhapKho = giaThanhMap[sp.maSP] || 0;
                                      updateFormItem(index, {
                                        maSP: sp.maSP,
                                        xuongSanXuat: sp.xuongSX || "",
                                        lenhSanXuat: sp.lenhSX || "",
                                        soLuongKeHoach: slKeHoach,
                                        slCatTruSlKH: slKeHoach - item.soLuongCat,
                                        soLuongNhapKho: slNhapKho,
                                        slNKTruSlCat: item.soLuongCat - slNhapKho,
                                      });
                                      setActiveDropdownIndex(null);
                                    }}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-blue-600">{sp.maSP}</span>
                                      <div className="flex gap-1">
                                        {bangKeLSXMap[sp.maSP] > 0 && (
                                          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                            KH: {bangKeLSXMap[sp.maSP].toLocaleString("vi-VN")}
                                          </span>
                                        )}
                                        {giaThanhMap[sp.maSP] > 0 && (
                                          <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                            NK: {giaThanhMap[sp.maSP].toLocaleString("vi-VN")}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{sp.tenSP}</div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        {/* Xưởng SX */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Xưởng SX</label>
                          <input
                            type="text"
                            value={item.xuongSanXuat}
                            onChange={(e) => updateFormItem(index, { xuongSanXuat: e.target.value })}
                            placeholder="Xưởng SX"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          />
                        </div>
                        {/* Lệnh SX */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Lệnh SX</label>
                          <input
                            type="text"
                            value={item.lenhSanXuat}
                            onChange={(e) => updateFormItem(index, { lenhSanXuat: e.target.value })}
                            placeholder="Lệnh SX"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          />
                        </div>
                        {/* Màu sắc */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Màu sắc</label>
                          <input
                            type="text"
                            value={item.mauSac}
                            onChange={(e) => updateFormItem(index, { mauSac: e.target.value })}
                            placeholder="Màu"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {/* Ngày cắt */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ngày cắt</label>
                          <input
                            type="date"
                            value={convertToInputDate(item.ngayCat)}
                            onChange={(e) => updateFormItem(index, { ngayCat: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {/* SL KH */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SL kế hoạch</label>
                          <input
                            type="number"
                            value={item.soLuongKeHoach || ""}
                            onChange={(e) => {
                              const slKH = parseFloat(e.target.value) || 0;
                              updateFormItem(index, {
                                soLuongKeHoach: slKH,
                                slCatTruSlKH: slKH - item.soLuongCat,
                              });
                            }}
                            placeholder="0"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {/* SL cắt */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SL cắt</label>
                          <input
                            type="number"
                            value={item.soLuongCat || ""}
                            onChange={(e) => {
                              const slCat = parseFloat(e.target.value) || 0;
                              updateFormItem(index, {
                                soLuongCat: slCat,
                                slCatTruSlKH: item.soLuongKeHoach - slCat,
                                slNKTruSlCat: slCat - item.soLuongNhapKho,
                              });
                            }}
                            placeholder="0"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {/* SL cắt - SL KH (auto) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SL cắt - SL KH</label>
                          <input
                            type="number"
                            value={item.slCatTruSlKH || 0}
                            readOnly
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-100 text-gray-600"
                          />
                        </div>
                        {/* Tỉ lệ các màu */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Tỉ lệ màu</label>
                          <input
                            type="text"
                            value={item.tiLeCacMau}
                            onChange={(e) => updateFormItem(index, { tiLeCacMau: e.target.value })}
                            placeholder="Tỉ lệ"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {/* Nguyên nhân (cắt) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nguyên nhân (cắt)</label>
                          <input
                            type="text"
                            value={item.nguyenNhan1}
                            onChange={(e) => updateFormItem(index, { nguyenNhan1: e.target.value })}
                            placeholder="Nguyên nhân"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {/* SL NK */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SL nhập kho</label>
                          <input
                            type="number"
                            value={item.soLuongNhapKho || ""}
                            onChange={(e) => {
                              const slNK = parseFloat(e.target.value) || 0;
                              updateFormItem(index, {
                                soLuongNhapKho: slNK,
                                slNKTruSlCat: item.soLuongCat - slNK,
                              });
                            }}
                            placeholder="0"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {/* SL NK - SL cắt (auto) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SL NK - SL cắt</label>
                          <input
                            type="number"
                            value={item.slNKTruSlCat || 0}
                            readOnly
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-100 text-gray-600"
                          />
                        </div>
                        {/* Nguyên nhân (NK) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nguyên nhân (NK)</label>
                          <input
                            type="text"
                            value={item.nguyenNhan2}
                            onChange={(e) => updateFormItem(index, { nguyenNhan2: e.target.value })}
                            placeholder="Nguyên nhân"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {/* Ghi chú */}
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                          <input
                            type="text"
                            value={item.ghiChu}
                            onChange={(e) => updateFormItem(index, { ghiChu: e.target.value })}
                            placeholder="Ghi chú"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 sticky bottom-0">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Thêm {formItems.filter((i) => i.maSP).length} mục
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Sửa số lượng cắt</h3>
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
        </Portal>
      )}

      {/* View Details Modal */}
      {showDetailsModal && viewingGroup && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden mx-4 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">Chi tiết phiếu cắt: {viewingGroup.maPhieuCat}</h3>
                  <p className="text-sm text-gray-500">
                    {viewingGroup.xuongSanXuat && `Xưởng: ${viewingGroup.xuongSanXuat}`}
                    {viewingGroup.lenhSanXuat && ` | Lệnh SX: ${viewingGroup.lenhSanXuat}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleExportDetailPDF(viewingGroup)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"><FileDown size={14} /> PDF</button>
                  <PrintDownloadButton
                    targetRef={detailTableRef}
                    fileName={viewingGroup.maPhieuCat || "PhieuCat"}
                    title={`Phiếu cắt - ${viewingGroup.maPhieuCat}`}
                  />
                  <button onClick={() => { setShowDetailsModal(false); setViewingGroup(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div ref={detailTableRef} className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-green-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-12">STT</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">Mã SP</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">Màu sắc</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">Ngày cắt</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-600">SL KH</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-600">SL cắt</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-600">SL cắt - KH</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">Tỉ lệ màu</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">Nguyên nhân</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-600">SL NK</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-600">SL NK - cắt</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">Nguyên nhân</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-600">Ghi chú</th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-600 w-20">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {viewingGroup.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                        <td className="px-3 py-2 font-medium text-blue-600">{item.maSP || "-"}</td>
                        <td className="px-3 py-2 text-gray-600">{item.mauSac || "-"}</td>
                        <td className="px-3 py-2 text-gray-600">{item.ngayCat || "-"}</td>
                        <td className="px-3 py-2 text-right text-purple-600 font-medium">
                          {item.soLuongKeHoach > 0 ? item.soLuongKeHoach.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className="px-3 py-2 text-right text-green-600 font-medium">
                          {item.soLuongCat > 0 ? item.soLuongCat.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${item.slCatTruSlKH < 0 ? "text-red-600" : item.slCatTruSlKH > 0 ? "text-green-600" : "text-gray-600"}`}>
                          {item.slCatTruSlKH !== 0 ? item.slCatTruSlKH.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-600 max-w-[80px]">
                          <div className="truncate" title={item.tiLeCacMau}>{item.tiLeCacMau || "-"}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-500 max-w-[80px]">
                          <div className="truncate" title={item.nguyenNhan1}>{item.nguyenNhan1 || "-"}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-orange-600 font-medium">
                          {item.soLuongNhapKho > 0 ? item.soLuongNhapKho.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${item.slNKTruSlCat < 0 ? "text-red-600" : item.slNKTruSlCat > 0 ? "text-green-600" : "text-gray-600"}`}>
                          {item.slNKTruSlCat !== 0 ? item.slNKTruSlCat.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-500 max-w-[80px]">
                          <div className="truncate" title={item.nguyenNhan2}>{item.nguyenNhan2 || "-"}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-500 max-w-[80px]">
                          <div className="truncate" title={item.ghiChu}>{item.ghiChu || "-"}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setShowDetailsModal(false);
                                openEditModal(item);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Sửa"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setShowDetailsModal(false);
                                openDeleteModal(item);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={4} className="px-3 py-2 text-right">Tổng cộng:</td>
                      <td className="px-3 py-2 text-right text-purple-600">{viewingGroup.totalSLKH.toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2 text-right text-green-600">{viewingGroup.totalSLCat.toLocaleString("vi-VN")}</td>
                      <td colSpan={3}></td>
                      <td className="px-3 py-2 text-right text-orange-600">{viewingGroup.totalSLNK.toLocaleString("vi-VN")}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={() => { setShowDetailsModal(false); setViewingGroup(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingItem && (
        <Portal>
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
                  Bạn có chắc chắn muốn xóa số lượng cắt này?
                </p>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Mã phiếu cắt:</strong> {deletingItem.maPhieuCat || "-"}</p>
                  <p className="text-sm"><strong>Mã SP:</strong> {deletingItem.maSP || "-"}</p>
                  <p className="text-sm"><strong>Xưởng SX:</strong> {deletingItem.xuongSanXuat || "-"}</p>
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
        </Portal>
      )}

      {/* Group Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showGroupDeleteConfirm}
        onClose={() => {
          setShowGroupDeleteConfirm(false);
          setGroupToDelete(null);
        }}
        onConfirm={confirmDeleteGroup}
        title="Xác nhận xóa phiếu cắt"
        message={`Bạn có chắc chắn muốn xóa tất cả ${groupToDelete?.itemCount || 0} mục của phiếu "${groupToDelete?.maPhieuCat || ""}"?`}
        confirmText="Xóa tất cả"
        type="danger"
      />
    </div>
  );
}
