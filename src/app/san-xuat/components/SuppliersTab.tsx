"use client";

import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import type { Supplier } from "@/lib/googleSheets";

const INITIAL_SUPPLIER: Omit<Supplier, "id"> = {
  name: "",
  material: "",
  address: "",
  contact: "",
  phone: "",
  note: "",
};

export default function SuppliersTab() {
  // Data states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item states
  const [selectedItem, setSelectedItem] = useState<Supplier | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Omit<Supplier, "id">>(INITIAL_SUPPLIER);
  const [editItem, setEditItem] = useState<Supplier>({ id: 0, ...INITIAL_SUPPLIER });

  // Fetch data on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/suppliers");
      const result = await response.json();
      if (result.success) {
        setSuppliers(result.data);
      } else {
        toast.error("Không thể tải danh sách nhà cung cấp");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Lỗi khi tải danh sách nhà cung cấp");
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleView = (item: Supplier) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: Supplier) => {
    setEditItem({ ...item });
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleAdd = async () => {
    if (!newItem.name?.trim()) {
      toast.error("Vui lòng điền Tên nhà cung cấp");
      return;
    }

    try {
      setIsAdding(true);
      const response = await fetch("/api/suppliers/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const result = await response.json();

      if (result.success) {
        await fetchSuppliers();
        setNewItem(INITIAL_SUPPLIER);
        setShowAddModal(false);
        toast.success("Thêm nhà cung cấp thành công");
      } else {
        toast.error(result.error || "Không thể thêm nhà cung cấp");
      }
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast.error("Lỗi khi thêm nhà cung cấp");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem.name?.trim()) {
      toast.error("Vui lòng điền Tên nhà cung cấp");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch("/api/suppliers/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });

      const result = await response.json();

      if (result.success) {
        await fetchSuppliers();
        setShowEditModal(false);
        setEditItem({ id: 0, ...INITIAL_SUPPLIER });
        toast.success("Cập nhật nhà cung cấp thành công");
      } else {
        toast.error(result.error || "Không thể cập nhật nhà cung cấp");
      }
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast.error("Lỗi khi cập nhật nhà cung cấp");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/suppliers/delete?id=${itemToDelete}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        await fetchSuppliers();
        setShowDeleteModal(false);
        setItemToDelete(null);
        toast.success("Xóa nhà cung cấp thành công");
      } else {
        toast.error(result.error || "Không thể xóa nhà cung cấp");
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Lỗi khi xóa nhà cung cấp");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Danh sách nhà cung cấp ({suppliers.length})
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Thêm NCC
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">STT</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tên NCC</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nguyên liệu</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Địa chỉ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Liên hệ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">SĐT</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(item)}>
                  <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.material || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.address || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.contact || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.phone || "-"}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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

      {/* Add Modal */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowAddModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm nhà cung cấp</h3>
                <p className="text-sm text-gray-500">Nhập thông tin nhà cung cấp mới</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên NCC *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nguyên liệu cung cấp</label>
                  <input
                    type="text"
                    value={newItem.material}
                    onChange={(e) => setNewItem({ ...newItem, material: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={newItem.address}
                      onChange={(e) => setNewItem({ ...newItem, address: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={newItem.contact}
                      onChange={(e) => setNewItem({ ...newItem, contact: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={newItem.phone}
                      onChange={(e) => setNewItem({ ...newItem, phone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={newItem.note}
                    onChange={(e) => setNewItem({ ...newItem, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={isAdding}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isAdding ? "Đang thêm..." : "Thêm NCC"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowViewModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết nhà cung cấp</h3>
                <p className="text-sm text-gray-500">{selectedItem.name}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Tên NCC:</span>
                  <p className="font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Nguyên liệu cung cấp:</span>
                  <p className="font-medium">{selectedItem.material || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Địa chỉ:</span>
                  <p className="font-medium flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-1" />
                    {selectedItem.address || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Người liên hệ:</span>
                  <p className="font-medium flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    {selectedItem.contact || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Số điện thoại:</span>
                  <p className="font-medium flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {selectedItem.phone || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ghi chú:</span>
                  <p className="font-medium">{selectedItem.note || "-"}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedItem);
                }}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowEditModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sửa nhà cung cấp</h3>
                <p className="text-sm text-gray-500">{editItem.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên NCC *</label>
                  <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nguyên liệu cung cấp</label>
                  <input
                    type="text"
                    value={editItem.material}
                    onChange={(e) => setEditItem({ ...editItem, material: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={editItem.address}
                      onChange={(e) => setEditItem({ ...editItem, address: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={editItem.contact}
                      onChange={(e) => setEditItem({ ...editItem, contact: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={editItem.phone}
                      onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={editItem.note}
                    onChange={(e) => setEditItem({ ...editItem, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa nhà cung cấp</h3>
                <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn xóa nhà cung cấp này?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setItemToDelete(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
