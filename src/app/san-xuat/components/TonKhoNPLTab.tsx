"use client";

import { Loader2, Search, Archive, Calendar, ChevronLeft, ChevronRight, Factory, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import DatePicker from "@/components/DatePicker";
import type { TonKhoNPLThang, TonKhoNPLNgay, TonKhoNPLXuongSX } from "@/lib/googleSheets";

export default function TonKhoNPLTab() {
  const [tonKhoThang, setTonKhoThang] = useState<TonKhoNPLThang[]>([]);
  const [tonKhoNgay, setTonKhoNgay] = useState<TonKhoNPLNgay[]>([]);
  const [tonKhoXuongSX, setTonKhoXuongSX] = useState<TonKhoNPLXuongSX[]>([]);
  const [searchTermThang, setSearchTermThang] = useState("");
  const [searchTermNgay, setSearchTermNgay] = useState("");
  const [searchTermXuongSX, setSearchTermXuongSX] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<"thang" | "ngay" | "xuongSX">("thang");

  // Date filters
  const currentDate = new Date();
  const [thangNam, setThangNam] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  );
  const [denNgay, setDenNgay] = useState<string>(
    currentDate.toISOString().split("T")[0]
  );

  // CRUD states for "Tồn kho đến ngày"
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TonKhoNPLNgay | null>(null);
  const [deletingItem, setDeletingItem] = useState<TonKhoNPLNgay | null>(null);
  const [formMaSP, setFormMaSP] = useState("");
  const [formSoLuong, setFormSoLuong] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [currentPageThang, setCurrentPageThang] = useState(1);
  const [currentPageNgay, setCurrentPageNgay] = useState(1);
  const [currentPageXuongSX, setCurrentPageXuongSX] = useState(1);
  const itemsPerPage = 100;

  // Filtered data
  const filteredThang = tonKhoThang.filter((item) =>
    item.maNPL.toLowerCase().includes(searchTermThang.toLowerCase())
  );

  const filteredNgay = tonKhoNgay.filter((item) =>
    item.maSP.toLowerCase().includes(searchTermNgay.toLowerCase())
  );

  const filteredXuongSX = tonKhoXuongSX.filter((item) =>
    item.tenNPL.toLowerCase().includes(searchTermXuongSX.toLowerCase()) ||
    item.xuongSX.toLowerCase().includes(searchTermXuongSX.toLowerCase())
  );

  // Pagination calculations
  const totalPagesThang = Math.ceil(filteredThang.length / itemsPerPage);
  const startIndexThang = (currentPageThang - 1) * itemsPerPage;
  const currentItemsThang = filteredThang.slice(startIndexThang, startIndexThang + itemsPerPage);

  const totalPagesNgay = Math.ceil(filteredNgay.length / itemsPerPage);
  const startIndexNgay = (currentPageNgay - 1) * itemsPerPage;
  const currentItemsNgay = filteredNgay.slice(startIndexNgay, startIndexNgay + itemsPerPage);

  const totalPagesXuongSX = Math.ceil(filteredXuongSX.length / itemsPerPage);
  const startIndexXuongSX = (currentPageXuongSX - 1) * itemsPerPage;
  const currentItemsXuongSX = filteredXuongSX.slice(startIndexXuongSX, startIndexXuongSX + itemsPerPage);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (updateFilters: boolean = false, tableType?: "thang" | "ngay") => {
    try {
      setIsLoading(true);

      let response;
      if (updateFilters) {
        const body: any = {};
        if (tableType === "thang") {
          body.thangNam = thangNam;
        } else if (tableType === "ngay") {
          body.denNgay = denNgay;
        }

        response = await fetch("/api/ton-kho-npl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        response = await fetch("/api/ton-kho-npl");
      }

      const result = await response.json();
      if (result.success) {
        setTonKhoThang(result.data.tonKhoThang);
        setTonKhoNgay(result.data.tonKhoNgay);
        setTonKhoXuongSX(result.data.tonKhoXuongSX || []);
        if (updateFilters) {
          toast.success("Đã cập nhật dữ liệu");
        }
      } else {
        toast.error("Không thể tải danh sách tồn kho NPL");
      }
    } catch (error) {
      console.error("Error fetching ton kho NPL:", error);
      toast.error("Lỗi khi tải danh sách tồn kho NPL");
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD handlers for "Tồn kho đến ngày"
  const handleAdd = async () => {
    if (!formMaSP.trim()) {
      toast.error("Mã SP không được để trống");
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch("/api/ton-kho-npl/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maSP: formMaSP, soLuong: Number(formSoLuong) || 0 }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Đã thêm thành công");
        setShowAddModal(false);
        setFormMaSP("");
        setFormSoLuong("");
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi thêm");
      }
    } catch {
      toast.error("Lỗi khi thêm dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !formMaSP.trim()) {
      toast.error("Mã SP không được để trống");
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch("/api/ton-kho-npl/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: editingItem.id - 1, // id = index + 1 → rowIndex = id - 1
          maSP: formMaSP,
          soLuong: Number(formSoLuong) || 0,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Đã cập nhật thành công");
        setEditingItem(null);
        setFormMaSP("");
        setFormSoLuong("");
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi cập nhật");
      }
    } catch {
      toast.error("Lỗi khi cập nhật dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsSaving(true);
      const response = await fetch(`/api/ton-kho-npl/delete?rowIndex=${deletingItem.id - 1}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Đã xóa thành công");
        setDeletingItem(null);
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi xóa");
      }
    } catch {
      toast.error("Lỗi khi xóa dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (item: TonKhoNPLNgay) => {
    setEditingItem(item);
    setFormMaSP(item.maSP);
    setFormSoLuong(String(item.soLuong));
  };

  const openAddModal = () => {
    setFormMaSP("");
    setFormSoLuong("");
    setShowAddModal(true);
  };

  // Calculate totals for tonKhoThang
  const totalGiaTriTon = filteredThang.reduce((sum, item) => sum + item.giaTriTon, 0);

  // Calculate totals for tonKhoNgay
  const totalSoLuongNgay = filteredNgay.reduce((sum, item) => sum + item.soLuong, 0);

  // Calculate totals for tonKhoXuongSX
  const totalThanhTienXuongSX = filteredXuongSX.reduce((sum, item) => sum + item.thanhTien, 0);

  // Pagination component
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 7;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (currentPage <= 3) {
          pages.push(2, 3, 4, "...", totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-center px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Trước
          </button>
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">
                  ...
                </span>
              );
            }
            const pageNum = page as number;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white border-blue-600 font-semibold"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Sau
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading && tonKhoThang.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTable("thang")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "thang"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Calendar size={18} />
          Tồn kho theo tháng
        </button>
        <button
          onClick={() => setActiveTable("ngay")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "ngay"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Archive size={18} />
          Tồn kho đến ngày
        </button>
        <button
          onClick={() => setActiveTable("xuongSX")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "xuongSX"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Factory size={18} />
          Tồn kho NPL xưởng SX
        </button>
      </div>

      {/* Table 1: Tồn kho theo tháng */}
      {activeTable === "thang" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                Tồn kho NPL kho công ty ({filteredThang.length} mục)
              </h4>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={thangNam}
                  onChange={setThangNam}
                  type="month"
                  className="bg-white/20 text-white placeholder-white/70 border-none outline-none px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer min-w-45"
                />
                <button
                  onClick={() => fetchData(true, "thang")}
                  disabled={isLoading}
                  className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  Xác nhận
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm mã NPL..."
                value={searchTermThang}
                onChange={(e) => {
                  setSearchTermThang(e.target.value);
                  setCurrentPageThang(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                    STT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[250px]">
                    Mã nguyên phụ liệu
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-24">
                    Tồn đầu
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-24">
                    Nhập kho
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-24">
                    Xuất kho
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-24">
                    Tồn cuối
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-28">
                    Đơn giá sau thuế
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-32">
                    Giá trị tồn
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItemsThang.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                      Không có dữ liệu tồn kho
                    </td>
                  </tr>
                ) : (
                  currentItemsThang.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-gray-600">{startIndexThang + index + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{item.maNPL}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.tonDau > 0 ? item.tonDau.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-green-600">
                        {item.nhapKho > 0 ? item.nhapKho.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-red-600">
                        {item.xuatKho > 0 ? item.xuatKho.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-blue-600">
                        {item.tonCuoi.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.donGiaSauThue > 0 ? item.donGiaSauThue.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-orange-600">
                        {item.giaTriTon > 0 ? item.giaTriTon.toLocaleString("vi-VN") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredThang.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                    <td colSpan={7} className="px-3 py-3 text-right">
                      Tổng giá trị tồn:
                    </td>
                    <td className="px-3 py-3 text-right text-orange-600">
                      {totalGiaTriTon.toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <PaginationControls
            currentPage={currentPageThang}
            totalPages={totalPagesThang}
            onPageChange={setCurrentPageThang}
          />
        </div>
      )}

      {/* Table 2: Tồn kho đến ngày */}
      {activeTable === "ngay" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                Tồn kho NPL đến ngày ({filteredNgay.length} mục)
              </h4>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={denNgay}
                  onChange={setDenNgay}
                  type="date"
                  className="bg-white/20 text-white placeholder-white/70 border-none outline-none px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer min-w-45"
                />
                <button
                  onClick={() => fetchData(true, "ngay")}
                  disabled={isLoading}
                  className="bg-white text-green-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  Xác nhận
                </button>
              </div>
            </div>
          </div>

          {/* Search + Add button */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm mã SP..."
                value={searchTermNgay}
                onChange={(e) => {
                  setSearchTermNgay(e.target.value);
                  setCurrentPageNgay(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap"
            >
              <Plus size={18} />
              Thêm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-16">
                    STT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[250px]">
                    Mã SP
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-32">
                    Số lượng
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-28">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItemsNgay.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                      Không có dữ liệu tồn kho
                    </td>
                  </tr>
                ) : (
                  currentItemsNgay.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-gray-600">{startIndexNgay + index + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{item.maSP}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-green-600">
                        {item.soLuong.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredNgay.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                    <td colSpan={2} className="px-3 py-3 text-right">
                      Tổng số lượng:
                    </td>
                    <td className="px-3 py-3 text-right text-green-600">
                      {totalSoLuongNgay.toLocaleString("vi-VN")}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <PaginationControls
            currentPage={currentPageNgay}
            totalPages={totalPagesNgay}
            onPageChange={setCurrentPageNgay}
          />
        </div>
      )}

      {/* Modal Thêm mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus size={20} className="text-green-600" />
                Thêm tồn kho NPL
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP *</label>
                <input
                  type="text"
                  value={formMaSP}
                  onChange={(e) => setFormMaSP(e.target.value)}
                  placeholder="VD: VUD960 Vải xước thái..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                <input
                  type="number"
                  value={formSoLuong}
                  onChange={(e) => setFormSoLuong(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingItem(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Pencil size={20} className="text-blue-600" />
                Sửa tồn kho NPL
              </h3>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP *</label>
                <input
                  type="text"
                  value={formMaSP}
                  onChange={(e) => setFormMaSP(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                <input
                  type="number"
                  value={formSoLuong}
                  onChange={(e) => setFormSoLuong(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingItem(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm m-4">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa</h3>
              <p className="text-gray-600 text-sm">
                Bạn có chắc muốn xóa <strong>{deletingItem.maSP}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table 3: Tồn kho NPL xưởng SX */}
      {activeTable === "xuongSX" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                Tồn kho NPL xưởng sản xuất ({filteredXuongSX.length} mục)
              </h4>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm tên NPL, xưởng SX..."
                value={searchTermXuongSX}
                onChange={(e) => {
                  setSearchTermXuongSX(e.target.value);
                  setCurrentPageXuongSX(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                    STT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-28">
                    Ngày tháng
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">
                    Xưởng SX thừa NPL
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[300px]">
                    Tên NPL
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-20">
                    ĐVT
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-24">
                    Số lượng
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-28">
                    Đơn giá
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-32">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItemsXuongSX.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                      Không có dữ liệu tồn kho xưởng SX
                    </td>
                  </tr>
                ) : (
                  currentItemsXuongSX.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-gray-600">{startIndexXuongSX + index + 1}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.ngayThang}</td>
                      <td className="px-3 py-2.5 text-purple-600 font-medium">{item.xuongSX}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{item.tenNPL}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{item.dvt}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">
                        {item.soLuong > 0 ? item.soLuong.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.donGia > 0 ? item.donGia.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-purple-600">
                        {item.thanhTien > 0 ? item.thanhTien.toLocaleString("vi-VN") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredXuongSX.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                    <td colSpan={7} className="px-3 py-3 text-right">
                      Tổng thành tiền:
                    </td>
                    <td className="px-3 py-3 text-right text-purple-600">
                      {totalThanhTienXuongSX.toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <PaginationControls
            currentPage={currentPageXuongSX}
            totalPages={totalPagesXuongSX}
            onPageChange={setCurrentPageXuongSX}
          />
        </div>
      )}
    </div>
  );
}
