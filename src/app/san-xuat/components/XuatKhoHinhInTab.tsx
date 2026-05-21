"use client";

import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  Plus,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface XuatKhoHinhIn {
  id: number;
  maPhieuXuat: string;
  ngayThang: string;
  maHinhIn: string;
  hinhAnh: string;
  soLuong: number;
  tonKho: number;
  ghiChu: string;
}

interface DanhMucHinhIn {
  id: number;
  maHinhIn: string;
  thongTinHinhIn: string;
  hinhAnh: string;
  anhMinhHoa: string;
  maSPSuDung: string;
  tonKho: number;
}

const ITEMS_PER_PAGE = 100;

const emptyForm = {
  maPhieuXuat: "",
  ngayThang: new Date().toISOString().split("T")[0],
  maHinhIn: "",
  hinhAnh: "",
  soLuong: 0,
  tonKho: 0,
  ghiChu: "",
};

export default function XuatKhoHinhInTab() {
  const [data, setData] = useState<XuatKhoHinhIn[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const [danhMucHI, setDanhMucHI] = useState<DanhMucHinhIn[]>([]);
  const [hiSearchTerm, setHiSearchTerm] = useState("");
  const [showHiDropdown, setShowHiDropdown] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<XuatKhoHinhIn | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/xuat-kho-hinh-in", {
        cache: "no-store",
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu xuất kho hình in");
      }
    } catch (error) {
      console.error("Error fetching xuat kho hinh in:", error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDanhMucHI = async () => {
    try {
      const response = await fetch("/api/danh-muc-hinh-in", {
        cache: "no-store",
      });
      const result = await response.json();
      if (result.success) setDanhMucHI(result.data || []);
    } catch (error) {
      console.error("Error fetching danh muc HI:", error);
    }
  };

  const filteredDanhMucHI = danhMucHI.filter((item) =>
    item.maHinhIn.toLowerCase().includes(hiSearchTerm.toLowerCase()),
  );

  const handleSelectHI = (item: DanhMucHinhIn) => {
    setFormData((prev) => ({
      ...prev,
      maHinhIn: item.maHinhIn,
      hinhAnh: item.hinhAnh,
      tonKho: item.tonKho,
    }));
    setShowHiDropdown(false);
    setHiSearchTerm("");
  };

  const toIsoDate = (d: string) => {
    if (!d) return "";
    if (d.includes("/")) {
      const [dd, mm, yyyy] = d.split("/");
      if (dd && mm && yyyy) {
        return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      }
    }
    return d;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maHinhIn) {
      toast.error("Vui lòng chọn mã hình in");
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch("/api/xuat-kho-hinh-in/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Thêm thành công");
        setShowAddModal(false);
        setFormData(emptyForm);
        fetchData();
      } else {
        toast.error(result.error || "Không thể thêm");
      }
    } catch (error) {
      toast.error("Lỗi khi thêm dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (item: XuatKhoHinhIn) => {
    setEditingId(item.id);
    setFormData({
      maPhieuXuat: item.maPhieuXuat,
      ngayThang: toIsoDate(item.ngayThang),
      maHinhIn: item.maHinhIn,
      hinhAnh: item.hinhAnh,
      soLuong: item.soLuong,
      tonKho: item.tonKho,
      ghiChu: item.ghiChu,
    });
    setShowEditModal(true);
    fetchDanhMucHI();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!formData.maHinhIn) {
      toast.error("Vui lòng chọn mã hình in");
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch("/api/xuat-kho-hinh-in/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...formData }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật thành công");
        setShowEditModal(false);
        setEditingId(null);
        setFormData(emptyForm);
        fetchData();
      } else {
        toast.error(result.error || "Không thể cập nhật");
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/xuat-kho-hinh-in/delete?id=${itemToDelete.id}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Xóa thành công");
        setItemToDelete(null);
        fetchData();
      } else {
        toast.error(result.error || "Không thể xóa");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa dữ liệu");
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort by date descending
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const parseDate = (d: string) => {
        if (!d) return 0;
        if (d.includes("/")) {
          const [dd, mm, yyyy] = d.split("/");
          return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0;
        }
        return new Date(d).getTime() || 0;
      };
      return parseDate(b.ngayThang) - parseDate(a.ngayThang);
    });
  }, [data]);

  const filteredData = sortedData.filter((item) => {
    const s = searchTerm.toLowerCase();
    return (
      item.maPhieuXuat.toLowerCase().includes(s) ||
      item.maHinhIn.toLowerCase().includes(s) ||
      item.ngayThang.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const totalSoLuong = filteredData.reduce((sum, item) => sum + item.soLuong, 0);
  const totalTonKho = filteredData.reduce((sum, item) => sum + item.tonKho, 0);

  const fmt = (v: number) => (v ? v.toLocaleString("vi-VN") : "-");

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = filteredData
      .map(
        (item, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.maPhieuXuat}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.ngayThang}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-weight:600;color:#2563eb;">${item.maHinhIn}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(item.soLuong)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(item.tonKho)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.ghiChu}</td>
    </tr>`,
      )
      .join("");
    printWindow.document.write(`<html><head><title>Xuất kho hình in</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:20px; color:#333; } h1 { font-size:18px; margin-bottom:15px; text-align:center; } table { width:100%; border-collapse:collapse; font-size:11px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; text-align:left; } @media print { body { padding:10px; } }</style></head><body>
      <h1>XUẤT KHO HÌNH IN</h1>
      <table><thead><tr>
        <th style="width:35px;">STT</th><th>Mã phiếu xuất</th><th>Ngày tháng</th><th>Mã HI</th>
        <th style="text-align:right;">Số lượng</th><th style="text-align:right;">Tồn kho</th><th>Ghi chú</th>
      </tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;">
          <td colspan="4" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng cộng:</td>
          <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalSoLuong)}</td>
          <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalTonKho)}</td>
          <td></td>
        </tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const sheetData = filteredData.map((item, i) => ({
      STT: i + 1,
      "Mã phiếu xuất": item.maPhieuXuat,
      "Ngày tháng": item.ngayThang,
      "Mã hình in": item.maHinhIn,
      "Số lượng": item.soLuong,
      "Tồn kho": item.tonKho,
      "Ghi chú": item.ghiChu,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Xuat kho HI");
    XLSX.writeFile(wb, "Xuat_kho_hinh_in.xlsx");
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Xuất kho hình in ({filteredData.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm mã phiếu, HI, ngày..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <FileDown size={14} /> PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              fetchDanhMucHI();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} /> Tạo phiếu xuất
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <p className="text-sm text-orange-600 mb-1">Số dòng</p>
          <p className="text-2xl font-bold text-orange-700">
            {filteredData.length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-600 mb-1">Tổng số lượng xuất</p>
          <p className="text-2xl font-bold text-red-700">
            {totalSoLuong.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Tổng tồn kho</p>
          <p className="text-2xl font-bold text-green-700">
            {totalTonKho.toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left font-medium text-gray-600 w-12">
                  STT
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  Mã phiếu xuất
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  Ngày tháng
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  Mã HI
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-600 w-16">
                  Hình ảnh
                </th>
                <th className="px-3 py-3 text-right font-medium text-gray-600">
                  Số lượng
                </th>
                <th className="px-3 py-3 text-right font-medium text-gray-600">
                  Tồn kho
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  Ghi chú
                </th>
                <th className="px-3 py-3 text-center font-medium text-gray-600 w-24">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-600">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {item.maPhieuXuat || "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-900">
                      {item.ngayThang}
                    </td>
                    <td className="px-3 py-3 font-medium text-blue-600">
                      {item.maHinhIn}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {item.hinhAnh ? (
                        <img
                          src={item.hinhAnh}
                          alt={item.maHinhIn}
                          className="w-10 h-10 object-cover rounded mx-auto cursor-zoom-in hover:opacity-80"
                          onClick={() => setZoomedImageUrl(item.hinhAnh)}
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-red-600">
                      {fmt(item.soLuong)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-green-700">
                      {item.tonKho ? item.tonKho.toLocaleString("vi-VN") : "0"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {item.ghiChu || "-"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={5} className="px-3 py-3 text-right">
                  Tổng cộng:
                </td>
                <td className="px-3 py-3 text-right text-red-600">
                  {fmt(totalSoLuong)}
                </td>
                <td className="px-3 py-3 text-right text-green-700">
                  {fmt(totalTonKho)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} -{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} /{" "}
              {filteredData.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zoom overlay */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setZoomedImageUrl(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImageUrl(null);
            }}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
            aria-label="Đóng"
          >
            <X size={28} />
          </button>
          <img
            src={zoomedImageUrl}
            alt="Phóng to"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">
                {showEditModal
                  ? "Sửa phiếu xuất kho HI"
                  : "Tạo phiếu xuất kho HI"}
              </h3>
              <button
                onClick={() => {
                  if (showEditModal) {
                    setShowEditModal(false);
                    setEditingId(null);
                  } else {
                    setShowAddModal(false);
                  }
                  setFormData(emptyForm);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={showEditModal ? handleEdit : handleAdd}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã phiếu xuất
                  </label>
                  <input
                    type="text"
                    value={formData.maPhieuXuat}
                    onChange={(e) =>
                      setFormData({ ...formData, maPhieuXuat: e.target.value })
                    }
                    placeholder="VD: PXKHI01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.ngayThang}
                    onChange={(e) =>
                      setFormData({ ...formData, ngayThang: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã hình in <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={showHiDropdown ? hiSearchTerm : formData.maHinhIn}
                    onChange={(e) => {
                      setHiSearchTerm(e.target.value);
                      setShowHiDropdown(true);
                    }}
                    onFocus={() => setShowHiDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tìm mã hình in..."
                  />
                  {showHiDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowHiDropdown(false)}
                      />
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                        {filteredDanhMucHI.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Không tìm thấy
                          </div>
                        ) : (
                          filteredDanhMucHI.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectHI(item)}
                              className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 flex items-center gap-3 ${formData.maHinhIn === item.maHinhIn ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700"}`}
                            >
                              {item.hinhAnh ? (
                                <img
                                  src={item.hinhAnh}
                                  alt={item.maHinhIn}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                  -
                                </div>
                              )}
                              <span className="text-sm">{item.maHinhIn}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    (từ Danh mục HI)
                  </span>
                </label>
                <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {formData.hinhAnh ? (
                    <img
                      src={formData.hinhAnh}
                      alt={formData.maHinhIn}
                      className="w-24 h-24 object-cover rounded border cursor-zoom-in hover:opacity-90"
                      onClick={() => setZoomedImageUrl(formData.hinhAnh)}
                    />
                  ) : (
                    <span className="text-gray-400 italic text-sm">
                      Chọn Mã HI để tự động điền
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng xuất
                  </label>
                  <input
                    type="number"
                    value={formData.soLuong || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        soLuong: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    value={formData.tonKho || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tonKho: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) =>
                    setFormData({ ...formData, ghiChu: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    if (showEditModal) {
                      setShowEditModal(false);
                      setEditingId(null);
                    } else {
                      setShowAddModal(false);
                    }
                    setFormData(emptyForm);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    showEditModal
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSaving && <Loader2 className="animate-spin" size={16} />}
                  {showEditModal ? "Lưu" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Bạn có chắc muốn xóa phiếu xuất{" "}
                <span className="font-semibold text-blue-600">
                  {itemToDelete.maHinhIn}
                </span>
                {itemToDelete.maPhieuXuat ? ` (${itemToDelete.maPhieuXuat})` : ""}{" "}
                ngày{" "}
                <span className="font-medium">{itemToDelete.ngayThang}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="animate-spin" size={16} />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
