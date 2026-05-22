"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Edit2, Trash2, X, FileDown, FileSpreadsheet, Eye } from "lucide-react";
import { ChiPhiBanHang } from "@/lib/googleSheets";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import PrintDownloadButton from "@/components/PrintDownloadButton";
import EditHistoryButton from "@/components/EditHistoryButton";

export default function ChiPhiTab() {
  const [chiPhiList, setChiPhiList] = useState<ChiPhiBanHang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChiPhiBanHang | null>(null);
  const [viewingItem, setViewingItem] = useState<ChiPhiBanHang | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const phieuRef = useRef<HTMLDivElement>(null);

  // Form state - match sheet columns
  const [formData, setFormData] = useState({
    ngayThang: new Date().toISOString().split('T')[0],
    nguoiChi: "",
    noiDung: "",
    phanLoai: "",
    soTien: 0,
  });

  useEffect(() => {
    fetchChiPhi();
  }, []);

  const fetchChiPhi = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/chi-phi-ban-hang");
      const result = await response.json();
      if (result.success) {
        setChiPhiList(result.data);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu chi phí");
      }
    } catch (err: any) {
      console.error("Error fetching chi phi:", err);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate next PCBH number
  const getNextMaPhieu = (): string => {
    const numbers = chiPhiList
      .map((item) => {
        const match = item.maPhieuChi.match(/PCBH(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `PCBH${String(maxNum + 1).padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const maPhieuChi = editingItem ? editingItem.maPhieuChi : getNextMaPhieu();
      const body = editingItem
        ? { ...formData, maPhieuChi, rowIndex: editingItem.rowIndex }
        : { ...formData, maPhieuChi };

      const response = await fetch("/api/chi-phi-ban-hang", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result.success) {
        setChiPhiList(result.data);
        setShowModal(false);
        resetForm();
        toast.success(editingItem ? "Cập nhật thành công" : "Thêm chi phí thành công");
      } else {
        toast.error(result.error || "Không thể lưu chi phí");
      }
    } catch (err: any) {
      console.error("Error saving chi phi:", err);
      toast.error("Đã xảy ra lỗi khi lưu dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    toast.promise(
      (async () => {
        const response = await fetch(`/api/chi-phi-ban-hang?rowIndex=${rowIndex}`, { method: "DELETE" });
        const result = await response.json();
        if (result.success) { setChiPhiList(result.data); return result; }
        else { throw new Error(result.error || "Không thể xóa chi phí"); }
      })(),
      { loading: "Đang xóa...", success: "Xóa thành công", error: (err) => err.message }
    );
  };

  const handleEdit = (item: ChiPhiBanHang) => {
    setEditingItem(item);
    setFormData({
      ngayThang: item.ngayThang,
      nguoiChi: item.nguoiChi,
      noiDung: item.noiDung,
      phanLoai: item.phanLoai,
      soTien: item.soTien,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      ngayThang: new Date().toISOString().split('T')[0],
      nguoiChi: "",
      noiDung: "",
      phanLoai: "",
      soTien: 0,
    });
  };

  const handleCloseModal = () => { setShowModal(false); resetForm(); };

  // Export tổng hợp PDF
  const handleExportSummaryPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = chiPhiList.map((item, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.ngayThang}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.nguoiChi}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.noiDung}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.phanLoai}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(item.soTien)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-weight:600;color:#2563eb;">${item.maPhieuChi}</td>
    </tr>`).join("");
    printWindow.document.write(`<html><head><title>Bảng kê chi phí bán hàng</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:18px; margin-bottom:5px; } h2 { font-size:14px; color:#666; margin-bottom:15px; } table { width:100%; border-collapse:collapse; font-size:12px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>CÔNG TY CỔ PHẦN RIOMIO</h1><h2>BẢNG KÊ CHI PHÍ</h2>
      <table><thead><tr><th style="width:35px;">STT</th><th>Ngày tháng</th><th>Người chi</th><th>Nội dung</th><th>Phân loại</th><th style="text-align:right;">Số tiền</th><th>Mã phiếu chi</th></tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;"><td colspan="5" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng cộng:</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(totalChiPhi)}</td><td style="padding:5px 8px;border:1px solid #ddd;"></td></tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  // Export tổng hợp Excel
  const handleExportSummaryExcel = () => {
    const sheetData = chiPhiList.map((item, i) => ({
      "STT": i + 1, "Ngày tháng": item.ngayThang, "Người chi": item.nguoiChi, "Nội dung": item.noiDung,
      "Phân loại": item.phanLoai, "Số tiền": item.soTien, "Mã phiếu chi": item.maPhieuChi,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tong hop");
    XLSX.writeFile(wb, "Bang_ke_chi_phi_ban_hang.xlsx");
  };

  // Export chi tiết PDF
  const handleExportDetailPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const phieuHTML = chiPhiList.map((item) => `
      <div style="border:1px solid #ddd;border-radius:8px;padding:20px;margin-bottom:20px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:2px solid #dc2626;padding-bottom:8px;">
          <span style="font-size:16px;font-weight:700;color:#dc2626;">${item.maPhieuChi}</span>
          <span style="font-size:13px;color:#666;">${item.ngayThang}</span>
        </div>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#666;width:120px;">Người chi:</td><td style="padding:4px 0;">${item.nguoiChi || "-"}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Nội dung:</td><td style="padding:4px 0;font-weight:500;">${item.noiDung}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Phân loại:</td><td style="padding:4px 0;">${item.phanLoai || "-"}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Số tiền:</td><td style="padding:4px 0;font-size:16px;font-weight:700;color:#dc2626;">${fmt(item.soTien)} đ</td></tr>
        </table>
      </div>`).join("");
    printWindow.document.write(`<html><head><title>Chi tiết chi phí bán hàng</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:18px; margin-bottom:5px; text-align:center; } p.sub { text-align:center;color:#666;margin-bottom:20px;font-size:13px; } @media print { body { padding:15px; } }</style></head><body>
      <h1>BẢNG KÊ CHI TIẾT CHI PHÍ BÁN HÀNG</h1>
      <p class="sub">Tổng: ${chiPhiList.length} phiếu - ${fmt(totalChiPhi)} đ</p>
      ${phieuHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  // Export chi tiết Excel
  const handleExportDetailExcel = () => {
    const sheetData = chiPhiList.map((item) => ({
      "Mã phiếu chi": item.maPhieuChi, "Ngày tháng": item.ngayThang, "Người chi": item.nguoiChi,
      "Nội dung": item.noiDung, "Phân loại": item.phanLoai, "Số tiền": item.soTien,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi tiet");
    XLSX.writeFile(wb, "Chi_tiet_chi_phi_ban_hang.xlsx");
  };

  // Export phiếu đơn lẻ PDF
  const handleExportPhieuPDF = (item: ChiPhiBanHang) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    printWindow.document.write(`<html><head><title>PHIẾU CHI - ${item.maPhieuChi}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial,sans-serif; padding:40px; color:#333; max-width:700px; margin:0 auto; }
        .header { text-align:center; margin-bottom:25px; }
        .header h1 { font-size:13px; color:#333; margin-bottom:2px; }
        .header h2 { font-size:22px; color:#dc2626; margin:10px 0 5px; }
        .header .ma { font-size:15px; color:#666; }
        .row { display:grid; grid-template-columns:130px 1fr; padding:8px 0; border-bottom:1px solid #eee; }
        .row label { font-size:13px; color:#666; } .row p { font-size:14px; color:#111; }
        .amount { padding:20px; margin:20px 0; background:#fef2f2; border-radius:8px; text-align:center; }
        .amount label { display:block; font-size:13px; color:#666; margin-bottom:5px; }
        .amount .val { font-size:24px; font-weight:700; color:#dc2626; }
        @media print { body { padding:20px; } }
      </style></head><body>
      <div class="header"><h1>CÔNG TY CỔ PHẦN RIOMIO</h1><h2>PHIẾU CHI BÁN HÀNG</h2><p class="ma">Mã: ${item.maPhieuChi}</p></div>
      <div class="row"><label>Ngày tháng</label><p>${item.ngayThang}</p></div>
      <div class="row"><label>Người chi</label><p>${item.nguoiChi || "-"}</p></div>
      <div class="row"><label>Nội dung</label><p>${item.noiDung}</p></div>
      <div class="row"><label>Phân loại</label><p>${item.phanLoai || "-"}</p></div>
      <div class="amount"><label>Số tiền</label><div class="val">${fmt(item.soTien)} đ</div></div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };


  if (isLoading && chiPhiList.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-gray-600">Đang tải dữ liệu chi phí...</span>
      </div>
    );
  }

  const totalChiPhi = chiPhiList.reduce((sum, item) => sum + item.soTien, 0);

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Danh sách chi phí ({chiPhiList.length} mục)</h3>
          <p className="text-sm text-gray-600">Tổng chi phí: <span className="font-semibold text-blue-600">{totalChiPhi.toLocaleString()} đ</span></p>
        </div>
        <div className="flex items-center gap-2">
          <EditHistoryButton tableKey="chi-phi-ban-hang" variant="labeled" title="Chi phí bán hàng" />
          <button onClick={handleExportSummaryPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"><FileDown size={14} /> PDF</button>
          <button onClick={handleExportSummaryExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"><FileSpreadsheet size={14} /> Excel</button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} /> Thêm chi phí
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày tháng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Người chi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">Nội dung</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phân loại</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Số tiền</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã phiếu chi</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chiPhiList.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chưa có chi phí nào</td></tr>
              ) : (
                chiPhiList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900">{item.ngayThang}</td>
                    <td className="px-4 py-3 text-gray-700">{item.nguoiChi}</td>
                    <td className="px-4 py-3 text-gray-900">{item.noiDung}</td>
                    <td className="px-4 py-3">
                      {item.phanLoai && <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{item.phanLoai}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{item.soTien.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">{item.maPhieuChi}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setViewingItem(item); setShowViewModal(true); }} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Xem chi tiết"><Eye size={16} /></button>
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Sửa"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.rowIndex)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Chi tiết phiếu chi bán hàng</h3>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div ref={phieuRef} className="p-6 space-y-5">
              <div className="text-center border-b-2 border-red-500 pb-4">
                <p className="text-sm text-gray-500">CÔNG TY CỔ PHẦN RIOMIO</p>
                <h2 className="text-xl font-bold text-red-600 mt-1">PHIẾU CHI BÁN HÀNG</h2>
                <p className="text-sm text-gray-500 mt-1">Mã: <span className="font-semibold text-red-600">{viewingItem.maPhieuChi}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Ngày tháng</label><p className="text-base text-gray-900">{viewingItem.ngayThang}</p></div>
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Phân loại</label><p className="text-base text-gray-900">{viewingItem.phanLoai || "-"}</p></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Người chi</label><p className="text-base text-gray-900">{viewingItem.nguoiChi || "-"}</p></div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Nội dung</label><p className="text-base text-gray-900">{viewingItem.noiDung || "-"}</p></div>
              <div className="bg-red-50 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-red-600 mb-1">Số tiền</label>
                <p className="text-3xl font-bold text-red-600">{viewingItem.soTien.toLocaleString()} đ</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200">
              <button onClick={() => handleExportPhieuPDF(viewingItem)} className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"><FileDown size={16} /> PDF</button>
              <PrintDownloadButton
                targetRef={phieuRef}
                fileName={viewingItem.maPhieuChi || "PhieuChi"}
                title={`Phiếu chi - ${viewingItem.maPhieuChi}`}
              />
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">{editingItem ? "Sửa chi phí" : "Thêm chi phí mới"}</h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.ngayThang} onChange={(e) => setFormData({ ...formData, ngayThang: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                  <input type="number" value={formData.soTien} onChange={(e) => setFormData({ ...formData, soTien: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người chi</label>
                <input type="text" value={formData.nguoiChi} onChange={(e) => setFormData({ ...formData, nguoiChi: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập tên người chi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.noiDung} onChange={(e) => setFormData({ ...formData, noiDung: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập nội dung chi phí" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
                <select value={formData.phanLoai} onChange={(e) => setFormData({ ...formData, phanLoai: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Chọn phân loại</option>
                  <option value="Chi bán hàng">Chi bán hàng</option>
                  <option value="CP QLDN">CP QLDN</option>
                  <option value="CP khác">CP khác</option>
                </select>
              </div>
              {!editingItem && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Mã phiếu chi tự động: <span className="font-semibold text-red-600">{getNextMaPhieu()}</span></p>
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Hủy</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isLoading && <Loader2 className="animate-spin" size={16} />}
                  {editingItem ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
