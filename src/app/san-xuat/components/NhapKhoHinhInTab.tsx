"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, Plus, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface NhapKhoHinhIn {
  id: number;
  ngayThang: string;
  maHinhIn: string;
  hinhAnh: string;
  soLuong: number;
}

interface DanhMucHinhIn {
  id: number;
  maHinhIn: string;
  hinhAnh: string;
}

const ITEMS_PER_PAGE = 100;

export default function NhapKhoHinhInTab() {
  const [data, setData] = useState<NhapKhoHinhIn[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [danhMucHI, setDanhMucHI] = useState<DanhMucHinhIn[]>([]);
  const [hiSearchTerm, setHiSearchTerm] = useState("");
  const [showHiDropdown, setShowHiDropdown] = useState(false);
  const [formData, setFormData] = useState({
    ngayThang: new Date().toISOString().split("T")[0],
    maHinhIn: "",
    hinhAnh: "",
    soLuong: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/nhap-kho-hinh-in");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu nhập kho hình in");
      }
    } catch (error) {
      console.error("Error fetching nhap kho hinh in:", error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDanhMucHI = async () => {
    try {
      const response = await fetch("/api/danh-muc-hinh-in");
      const result = await response.json();
      if (result.success) {
        setDanhMucHI(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching danh muc HI:", error);
    }
  };

  const filteredDanhMucHI = danhMucHI.filter((item) =>
    item.maHinhIn.toLowerCase().includes(hiSearchTerm.toLowerCase())
  );

  const handleSelectHI = (item: DanhMucHinhIn) => {
    setFormData({ ...formData, maHinhIn: item.maHinhIn, hinhAnh: item.hinhAnh });
    setShowHiDropdown(false);
    setHiSearchTerm("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maHinhIn) { toast.error("Vui lòng nhập mã hình in"); return; }
    try {
      setIsAdding(true);
      const response = await fetch("/api/nhap-kho-hinh-in/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Thêm thành công");
        setShowAddModal(false);
        setFormData({ ngayThang: new Date().toISOString().split("T")[0], maHinhIn: "", hinhAnh: "", soLuong: 0 });
        fetchData();
      } else {
        toast.error(result.error || "Không thể thêm");
      }
    } catch (error) {
      toast.error("Lỗi khi thêm dữ liệu");
    } finally {
      setIsAdding(false);
    }
  };

  // Sort by date descending
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const parseDate = (d: string) => {
        if (!d) return 0;
        if (d.includes('/')) {
          const [dd, mm, yyyy] = d.split('/');
          return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0;
        }
        return new Date(d).getTime() || 0;
      };
      return parseDate(b.ngayThang) - parseDate(a.ngayThang);
    });
  }, [data]);

  // Filter
  const filteredData = sortedData.filter((item) =>
    item.maHinhIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ngayThang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Totals
  const totalSoLuong = filteredData.reduce((sum, item) => sum + item.soLuong, 0);

  // Export PDF
  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = filteredData.map((item, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.ngayThang}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-weight:600;color:#2563eb;">${item.maHinhIn}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(item.soLuong)}</td>
    </tr>`).join("");
    printWindow.document.write(`<html><head><title>Nhập kho hình in</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:20px; text-align:center; } table { width:100%; border-collapse:collapse; font-size:12px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>NHẬP KHO HÌNH IN</h1>
      <table><thead><tr><th style="width:35px;">STT</th><th>Ngày tháng</th><th>Mã hình in</th><th style="text-align:right;">Số lượng</th></tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;"><td colspan="3" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng cộng:</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalSoLuong)}</td></tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  // Export Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const sheetData = filteredData.map((item, i) => ({
      "STT": i + 1, "Ngày tháng": item.ngayThang, "Mã hình in": item.maHinhIn, "Số lượng": item.soLuong,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nhap kho HI");
    XLSX.writeFile(wb, "Nhap_kho_hinh_in.xlsx");
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
          Nhập kho hình in ({filteredData.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã HI, ngày..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"><FileDown size={14} /> PDF</button>
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"><FileSpreadsheet size={14} /> Excel</button>
          <button onClick={() => { setShowAddModal(true); fetchDanhMucHI(); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus size={18} /> Tạo phiếu nhập kho
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Số dòng</p>
          <p className="text-2xl font-bold text-blue-700">{filteredData.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Tổng số lượng</p>
          <p className="text-2xl font-bold text-green-700">{totalSoLuong.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">STT</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày tháng</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Mã hình in</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">Hình ảnh</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">Số lượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-gray-900">{item.ngayThang}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{item.maHinhIn}</td>
                    <td className="px-4 py-3 text-center">
                      {item.hinhAnh ? (
                        <img src={item.hinhAnh} alt={item.maHinhIn} className="w-10 h-10 object-cover rounded mx-auto" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {item.soLuong > 0 ? item.soLuong.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={4} className="px-4 py-3 text-right">Tổng cộng:</td>
                <td className="px-4 py-3 text-right text-green-600">{totalSoLuong.toLocaleString("vi-VN")}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} / {filteredData.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Tạo phiếu nhập kho HI</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng <span className="text-red-500">*</span></label>
                <input type="date" required value={formData.ngayThang} onChange={(e) => setFormData({ ...formData, ngayThang: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã hình in <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    value={showHiDropdown ? hiSearchTerm : formData.maHinhIn}
                    onChange={(e) => { setHiSearchTerm(e.target.value); setShowHiDropdown(true); }}
                    onFocus={() => setShowHiDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tìm mã hình in..."
                  />
                  {showHiDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowHiDropdown(false)} />
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                        {filteredDanhMucHI.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy</div>
                        ) : (
                          filteredDanhMucHI.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectHI(item)}
                              className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 flex items-center gap-3 ${formData.maHinhIn === item.maHinhIn ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700"}`}
                            >
                              {item.hinhAnh ? (
                                <img src={item.hinhAnh} alt={item.maHinhIn} className="w-8 h-8 object-cover rounded" />
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">-</div>
                              )}
                              <span className="text-sm">{item.maHinhIn}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
                {formData.maHinhIn && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                    {formData.hinhAnh && <img src={formData.hinhAnh} alt={formData.maHinhIn} className="w-10 h-10 object-cover rounded border" />}
                    <span className="font-medium">Đã chọn: {formData.maHinhIn}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                <input type="number" value={formData.soLuong} onChange={(e) => setFormData({ ...formData, soLuong: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                <button type="submit" disabled={isAdding} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {isAdding && <Loader2 className="animate-spin" size={16} />}
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
