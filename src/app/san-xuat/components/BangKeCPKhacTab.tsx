"use client";

import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Truck,
  Factory,
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Portal from "@/components/Portal";

interface ChiPhiKhacItem {
  id: number;
  ngay: string;
  noiDung: string;
  chiHoXuong: string;
  soChoMa: string;
  soTien: number;
  phanBo: string;
  doiTacVC: string;
}

interface DoiTacVanChuyenItem {
  id: number;
  stt: number;
  doiTacVC: string;
  tienPhatSinh: number;
  thanhToan: number;
  congNo: number;
}

interface ChiHoXuongItem {
  id: number;
  xuongSX: string;
  tienPhatSinh: number;
  thanhToan: number;
  xuongNoRiomio: number;
}

interface BangKeCPKhacData {
  chiPhiKhac: ChiPhiKhacItem[];
  doiTacVC: DoiTacVanChuyenItem[];
  chiHoXuong: ChiHoXuongItem[];
}

type SubTabType = "chi-phi-khac" | "doi-tac-vc" | "chi-ho-xuong";

const SUB_TABS = [
  { id: "chi-phi-khac" as SubTabType, label: "Chi phí khác", icon: Receipt },
  { id: "doi-tac-vc" as SubTabType, label: "Đối tác vận chuyển", icon: Truck },
  { id: "chi-ho-xuong" as SubTabType, label: "Chi hộ xưởng", icon: Factory },
];

const ITEMS_PER_PAGE = 50;

export default function BangKeCPKhacTab() {
  const [data, setData] = useState<BangKeCPKhacData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("chi-phi-khac");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeSubTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/bang-ke-cp-khac");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu bảng kê chi phí khác");
      }
    } catch (error) {
      console.error("Error fetching bang ke cp khac:", error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">Không có dữ liệu</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSubTab === tab.id
                  ? "text-white bg-green-600 shadow-sm"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content based on sub-tab */}
      {activeSubTab === "chi-phi-khac" && (
        <ChiPhiKhacView
          data={data.chiPhiKhac}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onRefresh={fetchData}
        />
      )}
      {activeSubTab === "doi-tac-vc" && (
        <DoiTacVCView
          data={data.doiTacVC}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}
      {activeSubTab === "chi-ho-xuong" && (
        <ChiHoXuongView
          data={data.chiHoXuong}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}
    </div>
  );
}

// Helper functions for date conversion
const getTodayISO = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // yyyy-mm-dd
};

const formatDateToDisplay = (isoDate: string) => {
  // Convert yyyy-mm-dd to dd/mm/yyyy
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const parseDateToISO = (displayDate: string) => {
  // Convert dd/mm/yyyy to yyyy-mm-dd
  if (!displayDate) return "";
  const parts = displayDate.split("/");
  if (parts.length !== 3) return displayDate;
  return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
    2,
    "0"
  )}`;
};

// Interface for shipping unit
interface ShippingUnitOption {
  id: number;
  name: string;
}

// Interface for workshop
interface WorkshopOption {
  id: number;
  name: string;
}

// Searchable Dropdown Component
function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className = "",
}: {
  options: { id: number; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchInput(value); // Reset to current value when closing
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Sync searchInput with value when dropdown is closed
  const displayValue = isOpen ? searchInput : value;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setSearchInput(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearchInput(value);
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {filteredOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.name);
                setSearchInput(opt.name);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left hover:bg-blue-50 ${
                value === opt.name
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700"
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
      {isOpen && filteredOptions.length === 0 && searchInput && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-gray-500 text-sm">
          Không tìm thấy
        </div>
      )}
    </div>
  );
}

// View 1: Chi phí khác with CRUD
function ChiPhiKhacView({
  data,
  searchTerm,
  setSearchTerm,
  currentPage,
  setCurrentPage,
  onRefresh,
}: {
  data: ChiPhiKhacItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  currentPage: number;
  setCurrentPage: (v: number | ((p: number) => number)) => void;
  onRefresh: () => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChiPhiKhacItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [shippingUnits, setShippingUnits] = useState<ShippingUnitOption[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);

  // Fetch shipping units and workshops on mount
  useEffect(() => {
    const fetchShippingUnits = async () => {
      try {
        const response = await fetch("/api/shipping-units");
        const result = await response.json();
        if (result.success && result.data) {
          setShippingUnits(
            result.data.map((item: { id: number; name: string }) => ({
              id: item.id,
              name: item.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching shipping units:", error);
      }
    };

    const fetchWorkshops = async () => {
      try {
        const response = await fetch("/api/workshops");
        const result = await response.json();
        if (result.success && result.data) {
          setWorkshops(
            result.data.map((item: { id: number; name: string }) => ({
              id: item.id,
              name: item.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching workshops:", error);
      }
    };

    fetchShippingUnits();
    fetchWorkshops();
  }, []);

  const [formData, setFormData] = useState({
    ngay: getTodayISO(), // Default to today
    noiDung: "",
    chiHoXuong: "",
    soChoMa: "",
    soTien: "",
    phanBo: "",
    doiTacVC: "",
  });

  const resetForm = () => {
    setFormData({
      ngay: getTodayISO(), // Default to today
      noiDung: "",
      chiHoXuong: "",
      soChoMa: "",
      soTien: "",
      phanBo: "",
      doiTacVC: "",
    });
  };

  const handleAdd = async () => {
    if (!formData.ngay && !formData.noiDung) {
      toast.error("Vui lòng điền Ngày hoặc Nội dung");
      return;
    }

    try {
      setSaving(true);
      // Convert date from ISO (yyyy-mm-dd) to display format (dd/mm/yyyy)
      const dataToSend = {
        ...formData,
        ngay: formatDateToDisplay(formData.ngay),
      };
      const response = await fetch("/api/bang-ke-cp-khac/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Thêm chi phí khác thành công");
        setShowAddModal(false);
        resetForm();
        onRefresh();
      } else {
        toast.error(result.error || "Không thể thêm chi phí khác");
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

    try {
      setSaving(true);
      // Convert date from ISO (yyyy-mm-dd) to display format (dd/mm/yyyy)
      const dataToSend = {
        id: selectedItem.id,
        ...formData,
        ngay: formatDateToDisplay(formData.ngay),
      };
      const response = await fetch("/api/bang-ke-cp-khac/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật chi phí khác thành công");
        setShowEditModal(false);
        setSelectedItem(null);
        resetForm();
        onRefresh();
      } else {
        toast.error(result.error || "Không thể cập nhật chi phí khác");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ChiPhiKhacItem) => {
    if (
      !confirm(`Bạn có chắc muốn xóa chi phí "${item.noiDung || item.ngay}"?`)
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/bang-ke-cp-khac/delete?id=${item.id}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();

      if (result.success) {
        toast.success("Xóa chi phí khác thành công");
        onRefresh();
      } else {
        toast.error(result.error || "Không thể xóa chi phí khác");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi kết nối server");
    }
  };

  const openEditModal = (item: ChiPhiKhacItem) => {
    setSelectedItem(item);
    setFormData({
      ngay: parseDateToISO(item.ngay), // Convert from dd/mm/yyyy to yyyy-mm-dd
      noiDung: item.noiDung,
      chiHoXuong: item.chiHoXuong,
      soChoMa: item.soChoMa,
      soTien: item.soTien.toString(),
      phanBo: item.phanBo,
      doiTacVC: item.doiTacVC,
    });
    setShowEditModal(true);
  };

  const openViewModal = (item: ChiPhiKhacItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const filtered = data.filter(
    (item) =>
      item.ngay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.noiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chiHoXuong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doiTacVC.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalSoTien = filtered.reduce((sum, item) => sum + item.soTien, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Receipt size={20} className="text-blue-600" />
          Bảng kê chi phí khác ({filtered.length})
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              placeholder="Tìm ngày, nội dung, xưởng, đối tác..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-80"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left font-medium text-gray-600 w-12">
                  STT
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  Ngày
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[200px]">
                  Nội dung
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[180px]">
                  Chi hộ xưởng
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  Số cho mã
                </th>
                <th className="px-3 py-3 text-right font-medium text-gray-600">
                  Số tiền
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  Phân bổ
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  Đối tác VC
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-600 w-28">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openViewModal(item)}>
                  <td className="px-3 py-2.5 text-gray-600">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-3 py-2.5 text-gray-900">
                    {item.ngay || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[250px]">
                    <div className="truncate" title={item.noiDung}>
                      {item.noiDung || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[200px]">
                    <div className="truncate" title={item.chiHoXuong}>
                      {item.chiHoXuong || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">
                    {item.soChoMa || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-blue-600">
                    {item.soTien > 0
                      ? item.soTien.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">
                    {item.phanBo || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">
                    {item.doiTacVC || "-"}
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
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
                <td colSpan={5} className="px-3 py-3 text-right">
                  Tổng:
                </td>
                <td className="px-3 py-3 text-right text-blue-600">
                  {totalSoTien.toLocaleString("vi-VN")}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} -{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} /{" "}
              {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1 text-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
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
            <div className="bg-white rounded-xl w-full max-w-3xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Thêm chi phí khác
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày
                    </label>
                    <input
                      type="date"
                      value={formData.ngay}
                      onChange={(e) =>
                        setFormData({ ...formData, ngay: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền
                    </label>
                    <input
                      type="number"
                      value={formData.soTien}
                      onChange={(e) =>
                        setFormData({ ...formData, soTien: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung
                  </label>
                  <textarea
                    value={formData.noiDung}
                    onChange={(e) =>
                      setFormData({ ...formData, noiDung: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Mô tả chi phí..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chi hộ xưởng
                    </label>
                    <SearchableDropdown
                      options={workshops}
                      value={formData.chiHoXuong}
                      onChange={(value) =>
                        setFormData({ ...formData, chiHoXuong: value })
                      }
                      placeholder="Tìm xưởng..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số cho mã
                    </label>
                    <input
                      type="text"
                      value={formData.soChoMa}
                      onChange={(e) =>
                        setFormData({ ...formData, soChoMa: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phân bổ
                    </label>
                    <input
                      type="text"
                      value={formData.phanBo}
                      onChange={(e) =>
                        setFormData({ ...formData, phanBo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đối tác vận chuyển
                    </label>
                    <select
                      value={formData.doiTacVC}
                      onChange={(e) =>
                        setFormData({ ...formData, doiTacVC: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn đối tác --</option>
                      {shippingUnits.map((unit) => (
                        <option key={unit.id} value={unit.name}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Sửa chi phí khác
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày
                    </label>
                    <input
                      type="date"
                      value={formData.ngay}
                      onChange={(e) =>
                        setFormData({ ...formData, ngay: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền
                    </label>
                    <input
                      type="number"
                      value={formData.soTien}
                      onChange={(e) =>
                        setFormData({ ...formData, soTien: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung
                  </label>
                  <textarea
                    value={formData.noiDung}
                    onChange={(e) =>
                      setFormData({ ...formData, noiDung: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chi hộ xưởng
                    </label>
                    <SearchableDropdown
                      options={workshops}
                      value={formData.chiHoXuong}
                      onChange={(value) =>
                        setFormData({ ...formData, chiHoXuong: value })
                      }
                      placeholder="Tìm xưởng..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số cho mã
                    </label>
                    <input
                      type="text"
                      value={formData.soChoMa}
                      onChange={(e) =>
                        setFormData({ ...formData, soChoMa: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phân bổ
                    </label>
                    <input
                      type="text"
                      value={formData.phanBo}
                      onChange={(e) =>
                        setFormData({ ...formData, phanBo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đối tác vận chuyển
                    </label>
                    <select
                      value={formData.doiTacVC}
                      onChange={(e) =>
                        setFormData({ ...formData, doiTacVC: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn đối tác --</option>
                      {shippingUnits.map((unit) => (
                        <option key={unit.id} value={unit.name}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Chi tiết chi phí khác
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Ngày
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedItem.ngay || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Số tiền
                    </label>
                    <p className="text-blue-600 font-bold text-lg">
                      {selectedItem.soTien > 0
                        ? selectedItem.soTien.toLocaleString("vi-VN") + " đ"
                        : "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Nội dung
                  </label>
                  <p className="text-gray-900">{selectedItem.noiDung || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Chi hộ xưởng
                    </label>
                    <p className="text-gray-900">
                      {selectedItem.chiHoXuong || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Số cho mã
                    </label>
                    <p className="text-gray-900">
                      {selectedItem.soChoMa || "-"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Phân bổ
                    </label>
                    <p className="text-gray-900">
                      {selectedItem.phanBo || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Đối tác vận chuyển
                    </label>
                    <p className="text-gray-900">
                      {selectedItem.doiTacVC || "-"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedItem);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Edit size={16} />
                  Sửa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

// View 2: Đối tác vận chuyển (readonly)
function DoiTacVCView({
  data,
  searchTerm,
  setSearchTerm,
}: {
  data: DoiTacVanChuyenItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}) {
  const filtered = data.filter((item) =>
    item.doiTacVC.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTienPS = filtered.reduce(
    (sum, item) => sum + item.tienPhatSinh,
    0
  );
  const totalThanhToan = filtered.reduce(
    (sum, item) => sum + item.thanhToan,
    0
  );
  const totalCongNo = filtered.reduce((sum, item) => sum + item.congNo, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Truck size={20} className="text-purple-600" />
          Tổng hợp đối tác vận chuyển ({filtered.length})
        </h3>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm đối tác vận chuyển..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-64"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <p className="text-sm text-purple-600">Tiền phát sinh</p>
          <p className="text-2xl font-bold text-purple-700">
            {totalTienPS.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600">Thanh toán</p>
          <p className="text-2xl font-bold text-green-700">
            {totalThanhToan.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-600">Công nợ</p>
          <p className="text-2xl font-bold text-red-700">
            {totalCongNo.toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">
                  STT
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[200px]">
                  Đối tác vận chuyển
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Tiền phát sinh
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Thanh toán
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Công nợ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {item.stt || item.id}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {item.doiTacVC}
                  </td>
                  <td className="px-4 py-3 text-right text-purple-600 font-medium">
                    {item.tienPhatSinh > 0
                      ? item.tienPhatSinh.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    {item.thanhToan > 0
                      ? item.thanhToan.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-bold">
                    {item.congNo > 0
                      ? item.congNo.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">
                  Tổng:
                </td>
                <td className="px-4 py-3 text-right text-purple-600">
                  {totalTienPS.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  {totalThanhToan.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  {totalCongNo.toLocaleString("vi-VN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu đối tác vận chuyển
          </div>
        )}
      </div>
    </div>
  );
}

// View 3: Chi hộ xưởng (readonly)
function ChiHoXuongView({
  data,
  searchTerm,
  setSearchTerm,
}: {
  data: ChiHoXuongItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}) {
  const filtered = data.filter((item) =>
    item.xuongSX.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTienPS = filtered.reduce(
    (sum, item) => sum + item.tienPhatSinh,
    0
  );
  const totalThanhToan = filtered.reduce(
    (sum, item) => sum + item.thanhToan,
    0
  );
  const totalXuongNo = filtered.reduce(
    (sum, item) => sum + item.xuongNoRiomio,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Factory size={20} className="text-green-600" />
          Tổng hợp chi hộ xưởng ({filtered.length})
        </h3>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm xưởng sản xuất..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-64"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600">Tiền phát sinh</p>
          <p className="text-2xl font-bold text-green-700">
            {totalTienPS.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600">Thanh toán</p>
          <p className="text-2xl font-bold text-blue-700">
            {totalThanhToan.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <p className="text-sm text-orange-600">Xưởng nợ Riomio</p>
          <p className="text-2xl font-bold text-orange-700">
            {totalXuongNo.toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">
                  STT
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[250px]">
                  Xưởng sản xuất
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Tiền phát sinh
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Thanh toán
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Xưởng nợ Riomio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    <div className="truncate" title={item.xuongSX}>
                      {item.xuongSX}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    {item.tienPhatSinh > 0
                      ? item.tienPhatSinh.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">
                    {item.thanhToan > 0
                      ? item.thanhToan.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600 font-bold">
                    {item.xuongNoRiomio > 0
                      ? item.xuongNoRiomio.toLocaleString("vi-VN")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">
                  Tổng:
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  {totalTienPS.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right text-blue-600">
                  {totalThanhToan.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right text-orange-600">
                  {totalXuongNo.toLocaleString("vi-VN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu chi hộ xưởng
          </div>
        )}
      </div>
    </div>
  );
}
