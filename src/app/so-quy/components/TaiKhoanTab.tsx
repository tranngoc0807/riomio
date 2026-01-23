"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { TaiKhoan } from "@/lib/googleSheets";
import toast, { Toaster } from "react-hot-toast";

export default function TaiKhoanTab() {
  const [taiKhoanList, setTaiKhoanList] = useState<TaiKhoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TaiKhoan | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Form state
  const [formData, setFormData] = useState({
    taiKhoan: "",
  });

  useEffect(() => {
    fetchTaiKhoan();
  }, []);

  const fetchTaiKhoan = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/tai-khoan-so-quy");
      const result = await response.json();

      if (result.success) {
        setTaiKhoanList(result.data);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu tài khoản");
      }
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.taiKhoan.trim()) {
      toast.error("Vui lòng nhập tên tài khoản");
      return;
    }

    try {
      const url = "/api/tai-khoan-so-quy";
      const method = editingItem ? "PUT" : "POST";
      const body = editingItem
        ? { rowIndex: editingItem.rowIndex, taiKhoan: formData.taiKhoan }
        : { taiKhoan: formData.taiKhoan };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setTaiKhoanList(result.data);
        setShowModal(false);
        resetForm();
      } else {
        toast.error(result.error || "Đã xảy ra lỗi");
      }
    } catch (err: any) {
      console.error("Error submitting account:", err);
      toast.error("Đã xảy ra lỗi khi lưu tài khoản");
    }
  };

  const handleEdit = (item: TaiKhoan) => {
    setEditingItem(item);
    setFormData({
      taiKhoan: item.taiKhoan,
    });
    setShowModal(true);
  };

  const handleDelete = async (item: TaiKhoan) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${item.taiKhoan}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tai-khoan-so-quy?rowIndex=${item.rowIndex}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setTaiKhoanList(result.data);
      } else {
        toast.error(result.error || "Đã xảy ra lỗi khi xóa");
      }
    } catch (err: any) {
      console.error("Error deleting account:", err);
      toast.error("Đã xảy ra lỗi khi xóa tài khoản");
    }
  };

  const resetForm = () => {
    setFormData({ taiKhoan: "" });
    setEditingItem(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Pagination
  const totalPages = Math.ceil(taiKhoanList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = taiKhoanList.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Tài khoản</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: {taiKhoanList.length} tài khoản
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm tài khoản
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tài khoản
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        Chưa có tài khoản nào
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.taiKhoan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, taiKhoanList.length)} trong tổng số{" "}
                {taiKhoanList.length} tài khoản
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? "Sửa tài khoản" : "Thêm tài khoản mới"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.taiKhoan}
                  onChange={(e) => setFormData({ taiKhoan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên tài khoản (VD: TCB 22181818 - Công ty)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingItem ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
