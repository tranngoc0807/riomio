"use client";

import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";

interface Program {
  id: number;
  code: string;
  discount: string;
  type: "percent" | "fixed";
}

const INITIAL_PROGRAM = {
  code: "",
  discount: "",
  type: "percent" as "percent" | "fixed",
};

export default function ProgramsTab() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<{
    id: number;
    code: string;
  } | null>(null);
  const [newProgram, setNewProgram] = useState(INITIAL_PROGRAM);
  const [editProgram, setEditProgram] = useState({
    id: 0,
    ...INITIAL_PROGRAM,
  });

  const filteredPrograms = programs.filter((p) =>
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/programs");
      const result = await response.json();
      if (result.success) {
        setPrograms(result.data);
      } else {
        console.error("Failed to fetch programs:", result.error);
        toast.error("Không thể tải danh sách chương trình");
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Lỗi khi tải danh sách chương trình");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProgram = async () => {
    if (newProgram.code && newProgram.discount) {
      setIsAdding(true);
      try {
        const newId = Math.max(...programs.map((p) => p.id), 0) + 1;

        const response = await fetch("/api/programs/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: newId,
            code: newProgram.code,
            discount: newProgram.discount,
            type: newProgram.type,
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success("Thêm chương trình thành công!");
          setNewProgram(INITIAL_PROGRAM);
          setShowAddModal(false);
          fetchPrograms();
        } else {
          toast.error("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error adding program:", error);
        toast.error("Không thể thêm chương trình");
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleEditProgram = (program: Program) => {
    setEditProgram({ ...program, type: program.type as "percent" | "fixed" });
    setShowEditModal(true);
  };

  const handleSaveEditProgram = async () => {
    if (editProgram.code && editProgram.discount) {
      setIsUpdating(true);
      try {
        const response = await fetch("/api/programs/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editProgram.id,
            code: editProgram.code,
            discount: editProgram.discount,
            type: editProgram.type,
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success("Cập nhật chương trình thành công!");
          setShowEditModal(false);
          fetchPrograms();
        } else {
          toast.error("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error updating program:", error);
        toast.error("Không thể cập nhật chương trình");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDeleteProgram = (id: number) => {
    const program = programs.find((p) => p.id === id);
    if (program) {
      setProgramToDelete({ id: program.id, code: program.code });
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteProgram = async () => {
    if (!programToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/programs/delete?id=${programToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Đã xóa chương trình!");
        setShowDeleteModal(false);
        setProgramToDelete(null);
        fetchPrograms();
      } else {
        toast.error("Lỗi: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error("Không thể xóa chương trình");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Tìm kiếm chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Thêm chương trình
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-medium">Chưa có chương trình nào</p>
          <p className="text-sm mt-1">
            Nhấn &quot;Thêm chương trình&quot; để bắt đầu
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-16">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Mã chương trình
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                  Chiết khấu
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                  Loại
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPrograms.map((program, index) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-center text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-blue-600">
                    {program.code}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        program.type === "percent"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {program.type === "fixed"
                        ? `${program.discount}đ`
                        : program.discount}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        program.type === "percent"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {program.type === "percent" ? "Phần trăm" : "Cố định"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditProgram(program)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(program.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal thêm chương trình bán hàng */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Thêm chương trình bán hàng
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã chương trình *
                </label>
                <input
                  type="text"
                  value={newProgram.code}
                  onChange={(e) =>
                    setNewProgram({ ...newProgram, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: NPP-SP25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại chiết khấu *
                </label>
                <select
                  value={newProgram.type}
                  onChange={(e) =>
                    setNewProgram({
                      ...newProgram,
                      type: e.target.value as "percent" | "fixed",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Cố định (VNĐ)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiết khấu *
                </label>
                <input
                  type="text"
                  value={newProgram.discount}
                  onChange={(e) =>
                    setNewProgram({ ...newProgram, discount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    newProgram.type === "percent" ? "VD: 16%" : "VD: 25.000"
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAdding}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProgram}
                disabled={isAdding}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang thêm...
                  </>
                ) : (
                  "Thêm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Panel sửa chương trình bán hàng */}
      <Portal>
        {showEditModal && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setShowEditModal(false)}
            />
            <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sửa chương trình bán hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Mã: {editProgram.code}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-5">
                  {/* Mã chương trình */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mã chương trình *
                    </label>
                    <input
                      type="text"
                      value={editProgram.code}
                      onChange={(e) =>
                        setEditProgram({
                          ...editProgram,
                          code: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Loại chiết khấu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Loại chiết khấu *
                    </label>
                    <select
                      value={editProgram.type}
                      onChange={(e) =>
                        setEditProgram({
                          ...editProgram,
                          type: e.target.value as "percent" | "fixed",
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="percent">Phần trăm (%)</option>
                      <option value="fixed">Cố định (VNĐ)</option>
                    </select>
                  </div>

                  {/* Chiết khấu */}
                  <div
                    className={`rounded-lg p-4 ${
                      editProgram.type === "percent"
                        ? "bg-blue-50"
                        : "bg-green-50"
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Chiết khấu *
                    </label>
                    <input
                      type="text"
                      value={editProgram.discount}
                      onChange={(e) =>
                        setEditProgram({
                          ...editProgram,
                          discount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      placeholder={
                        editProgram.type === "percent"
                          ? "VD: 16%"
                          : "VD: 25.000"
                      }
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {editProgram.type === "percent"
                        ? "Nhập phần trăm chiết khấu (VD: 16%, 22%)"
                        : "Nhập số tiền chiết khấu cố định (VD: 25.000, 8.000)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEditProgram}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Đang lưu...
                      </>
                    ) : (
                      "Lưu thay đổi"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </Portal>

      {/* Modal xác nhận xóa chương trình */}
      {showDeleteModal && programToDelete && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Xác nhận xóa chương trình
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProgramToDelete(null);
                }}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-700 mb-2">
              Bạn có chắc chắn muốn xóa chương trình{" "}
              <span className="font-semibold text-blue-600">
                {programToDelete.code}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProgramToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteProgram}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
