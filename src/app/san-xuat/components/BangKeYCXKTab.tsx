"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Package, Calendar, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface YeuCauXuatKhoNPL {
  id: number;
  ngayThang: string;
  maPhieuYC: string;
  maNPL: string;
  dvt: string;
  dinhMuc: number;
  slKHSX: number;
  tongNPLSX: number;
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
  slKHSX: 0,
  tongNPLSX: 0,
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<Omit<YeuCauXuatKhoNPL, "id">>(emptyFormData);
  const [editingItem, setEditingItem] = useState<YeuCauXuatKhoNPL | null>(null);
  const [deletingItem, setDeletingItem] = useState<YeuCauXuatKhoNPL | null>(null);
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

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maPhieuYC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maNPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSPSuDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.xuongSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ngayThang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary calculations
  const totalSLKHSX = filteredList.reduce((sum, item) => sum + item.slKHSX, 0);
  const totalTongNPLSX = filteredList.reduce((sum, item) => sum + item.tongNPLSX, 0);

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

  // Handle NPL selection - auto fill DVT (save full name instead of code)
  const handleNPLSelect = (material: Material) => {
    const fullName = `${material.code} ${material.name}`.trim();
    setFormData((prev) => ({
      ...prev,
      maNPL: fullName,
      dvt: material.unit,
    }));
    setNplSearch(fullName);
    setShowNplDropdown(false);
  };

  // Handle Ma SP selection - auto fill Xuong SX
  const handleMaSPSelect = (sp: MaSP) => {
    setFormData((prev) => ({
      ...prev,
      maSPSuDung: sp.maSP,
      xuongSX: sp.xuongSX,
    }));
    setSpSearch(sp.maSP);
    setShowSpDropdown(false);
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
    setNplSearch("");
    setSpSearch("");
    setShowAddModal(true);
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
      slKHSX: item.slKHSX,
      tongNPLSX: item.tongNPLSX,
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

  // Handle add
  const handleAdd = async () => {
    if (!formData.maNPL) {
      toast.error("Vui lòng chọn Mã NPL");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/yeu-cau-xuat-kho-npl/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Thêm yêu cầu xuất kho NPL thành công");
        setShowAddModal(false);
        fetchData();
      } else {
        toast.error(result.error || "Không thể thêm yêu cầu xuất kho NPL");
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
            setFormData({
              ...formData,
              dinhMuc,
              tongNPLSX: dinhMuc * formData.slKHSX
            });
          }}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            setFormData({
              ...formData,
              slKHSX,
              tongNPLSX: formData.dinhMuc * slKHSX
            });
          }}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tổng NPL SX - Auto calculated */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tổng NPL SX (tự động)</label>
        <input
          type="text"
          value={formData.tongNPLSX ? formData.tongNPLSX.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "0"}
          readOnly
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">= Định mức × SL KH SX</p>
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
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-600" />
            <p className="text-sm text-blue-600">Tổng số dòng</p>
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
            <p className="text-sm text-orange-600">Tổng NPL SX</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{totalTongNPLSX.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-purple-600" />
            <p className="text-sm text-purple-600">Số mã phiếu YC</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {new Set(filteredList.map((item) => item.maPhieuYC).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-12 sticky left-0 bg-green-50">STT</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Ngày tháng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Mã phiếu YC</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[250px]">Mã NPL</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">ĐVT</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Định mức</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">SL KH SX</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600">Tổng NPL SX</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Mã SP sử dụng</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Màu sắc</th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Xưởng SX</th>
              <th className="px-3 py-3 text-center font-medium text-gray-600 w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedList.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-600 sticky left-0 bg-white">{startIndex + index + 1}</td>
                <td className="px-3 py-2.5 text-gray-900">{item.ngayThang || "-"}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{item.maPhieuYC || "-"}</td>
                <td className="px-3 py-2.5 text-gray-900 max-w-[300px]">
                  <div className="truncate" title={item.maNPL}>{item.maNPL || "-"}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{item.dvt || "-"}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {item.dinhMuc > 0 ? item.dinhMuc.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "-"}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-green-600">
                  {item.slKHSX > 0 ? item.slKHSX.toLocaleString("vi-VN") : "-"}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-orange-600">
                  {item.tongNPLSX > 0 ? item.tongNPLSX.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "-"}
                </td>
                <td className="px-3 py-2.5 text-gray-600">{item.maSPSuDung || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600">{item.mauSac || "-"}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[150px]">
                  <div className="truncate" title={item.xuongSX}>{item.xuongSX || "-"}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
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
              <td colSpan={6} className="px-3 py-3 text-right">Tổng cộng:</td>
              <td className="px-3 py-3 text-right text-green-600">
                {totalSLKHSX.toLocaleString("vi-VN")}
              </td>
              <td className="px-3 py-3 text-right text-orange-600">
                {totalTongNPLSX.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
              </td>
              <td colSpan={4}></td>
            </tr>
          </tfoot>
        </table>

        {filteredList.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu yêu cầu xuất kho NPL
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Thêm yêu cầu xuất kho NPL</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              {renderForm()}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
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
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
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
    </div>
  );
}
