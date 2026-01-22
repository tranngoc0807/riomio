"use client";

import { useState, useEffect } from "react";
import { Receipt, Loader2, AlertCircle, Plus, Edit2, Trash2, X, Calendar } from "lucide-react";
import { ChiPhiBanHang } from "@/lib/googleSheets";
import toast, { Toaster } from "react-hot-toast";

export default function ChiPhiTab() {
  const [chiPhiList, setChiPhiList] = useState<ChiPhiBanHang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChiPhiBanHang | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    ngayThang: new Date().toISOString().split('T')[0],
    noiDung: "",
    nguoiNhan: "",
    loaiChiPhi: "",
    soTien: 0,
    ghiChu: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = editingItem
        ? "/api/chi-phi-ban-hang"
        : "/api/chi-phi-ban-hang";

      const method = editingItem ? "PUT" : "POST";

      const body = editingItem
        ? { ...formData, rowIndex: editingItem.rowIndex }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setChiPhiList(result.data);
        setShowModal(false);
        resetForm();
        toast.success(editingItem ? "Cập nhật chi phí thành công" : "Thêm chi phí thành công");
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
        const response = await fetch(`/api/chi-phi-ban-hang?rowIndex=${rowIndex}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          setChiPhiList(result.data);
          return result;
        } else {
          throw new Error(result.error || "Không thể xóa chi phí");
        }
      })(),
      {
        loading: "Đang xóa chi phí...",
        success: "Xóa chi phí thành công",
        error: (err) => err.message || "Đã xảy ra lỗi khi xóa dữ liệu",
      }
    );
  };

  const handleEdit = (item: ChiPhiBanHang) => {
    setEditingItem(item);
    setFormData({
      ngayThang: item.ngayThang,
      noiDung: item.noiDung,
      nguoiNhan: item.nguoiNhan,
      loaiChiPhi: item.loaiChiPhi,
      soTien: item.soTien,
      ghiChu: item.ghiChu,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      ngayThang: new Date().toISOString().split('T')[0],
      noiDung: "",
      nguoiNhan: "",
      loaiChiPhi: "",
      soTien: 0,
      ghiChu: "",
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
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

      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Danh sách chi phí ({chiPhiList.length} mục)
          </h3>
          <p className="text-sm text-gray-600">
            Tổng chi phí: <span className="font-semibold text-blue-600">{totalChiPhi.toLocaleString()} đ</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Thêm chi phí
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ngày tháng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">
                  Nội dung
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Người nhận
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Loại chi phí
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Số tiền
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ghi chú
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chiPhiList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Chưa có chi phí nào
                  </td>
                </tr>
              ) : (
                chiPhiList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900">{item.ngayThang}</td>
                    <td className="px-4 py-3 text-gray-900">{item.noiDung}</td>
                    <td className="px-4 py-3 text-gray-700">{item.nguoiNhan}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {item.loaiChiPhi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {item.soTien.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{item.ghiChu}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.rowIndex)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? "Sửa chi phí" : "Thêm chi phí mới"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.ngayThang}
                    onChange={(e) => setFormData({ ...formData, ngayThang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tiền
                  </label>
                  <input
                    type="number"
                    value={formData.soTien}
                    onChange={(e) => setFormData({ ...formData, soTien: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.noiDung}
                  onChange={(e) => setFormData({ ...formData, noiDung: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập nội dung chi phí"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người nhận
                  </label>
                  <input
                    type="text"
                    value={formData.nguoiNhan}
                    onChange={(e) => setFormData({ ...formData, nguoiNhan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên người nhận"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại chi phí
                  </label>
                  <select
                    value={formData.loaiChiPhi}
                    onChange={(e) => setFormData({ ...formData, loaiChiPhi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn loại chi phí</option>
                    <option value="CP Bán hàng">CP Bán hàng</option>
                    <option value="CP QLDN">CP QLDN</option>
                    <option value="CP khác">CP khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
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
