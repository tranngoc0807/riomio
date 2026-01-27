"use client";

import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import type { Material, Supplier } from "@/lib/googleSheets";

const INITIAL_MATERIAL: Omit<Material, "id"> = {
  code: "",
  name: "",
  supplier: "",
  info: "",
  unit: "",
  priceBeforeTax: 0,
  taxRate: 0,
  priceWithTax: 0,
  image: "",
  note: "",
};

export default function MaterialsTab() {
  // Data states
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Supplier search states (Add Modal)
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Supplier search states (Edit Modal)
  const [editSupplierSearchTerm, setEditSupplierSearchTerm] = useState("");
  const [showEditSupplierDropdown, setShowEditSupplierDropdown] = useState(false);

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
  const [selectedItem, setSelectedItem] = useState<Material | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Omit<Material, "id">>(INITIAL_MATERIAL);
  const [editItem, setEditItem] = useState<Material>({ id: 0, ...INITIAL_MATERIAL });

  // Filtered data
  const filteredList = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered suppliers for Add Modal
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );

  // Filtered suppliers for Edit Modal
  const filteredEditSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(editSupplierSearchTerm.toLowerCase())
  );

  // Fetch data on mount
  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/materials");
      const result = await response.json();
      if (result.success) {
        setMaterials(result.data);
      } else {
        toast.error("Không thể tải danh sách nguyên phụ liệu");
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("Lỗi khi tải danh sách nguyên phụ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      const result = await response.json();
      if (result.success) {
        setSuppliers(result.data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  // Handlers
  const handleView = (item: Material) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: Material) => {
    setEditItem({ ...item });
    setEditSupplierSearchTerm("");
    setShowEditSupplierDropdown(false);
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleAdd = async () => {
    if (!newItem.name?.trim()) {
      toast.error("Vui lòng điền Tên NPL");
      return;
    }

    try {
      setIsAdding(true);
      const response = await fetch("/api/materials/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const result = await response.json();

      if (result.success) {
        await fetchMaterials();
        setNewItem(INITIAL_MATERIAL);
        setShowAddModal(false);
        toast.success("Thêm nguyên phụ liệu thành công");
      } else {
        toast.error(result.error || "Không thể thêm nguyên phụ liệu");
      }
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Lỗi khi thêm nguyên phụ liệu");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem.name?.trim()) {
      toast.error("Vui lòng điền Tên NPL");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch("/api/materials/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });

      const result = await response.json();

      if (result.success) {
        await fetchMaterials();
        setShowEditModal(false);
        setEditItem({ id: 0, ...INITIAL_MATERIAL });
        toast.success("Cập nhật nguyên phụ liệu thành công");
      } else {
        toast.error(result.error || "Không thể cập nhật nguyên phụ liệu");
      }
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("Lỗi khi cập nhật nguyên phụ liệu");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;

    try {
      setIsDeleting(true);
      const response = await fetch("/api/materials/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemToDelete }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchMaterials();
        setShowDeleteModal(false);
        setItemToDelete(null);
        toast.success("Xóa nguyên phụ liệu thành công");
      } else {
        toast.error(result.error || "Không thể xóa nguyên phụ liệu");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Lỗi khi xóa nguyên phụ liệu");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate price with tax
  const calculatePriceWithTax = (priceBeforeTax: number, taxRate: number): number => {
    return priceBeforeTax * (1 + taxRate / 100);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Danh sách nguyên phụ liệu ({materials.length})
        </h3>
        <button
          onClick={() => {
            setNewItem(INITIAL_MATERIAL);
            setSupplierSearchTerm("");
            setShowSupplierDropdown(false);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Thêm NPL
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Mã NPL</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tên NPL</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nhà cung cấp</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thông tin</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">ĐVT</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Đơn giá chưa thuế</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Thuế suất</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Đơn giá (có thuế)</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredList.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(item)}>
                  <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{item.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.supplier || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.info || "-"}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{item.unit}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {item.priceBeforeTax > 0 ? `${item.priceBeforeTax.toLocaleString("vi-VN")}đ` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                    {item.taxRate > 0 ? `${item.taxRate}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {item.priceWithTax > 0 ? `${item.priceWithTax.toLocaleString("vi-VN")}đ` : "-"}
                  </td>
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
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm nguyên phụ liệu</h3>
                <p className="text-sm text-gray-500">Nhập thông tin nguyên phụ liệu mới</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã NPL</label>
                    <input
                      type="text"
                      value={newItem.code}
                      onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên NPL *</label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={supplierSearchTerm || newItem.supplier}
                    onChange={(e) => {
                      setSupplierSearchTerm(e.target.value);
                      setShowSupplierDropdown(true);
                      if (!e.target.value) setNewItem({ ...newItem, supplier: "" });
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 150)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tìm và chọn nhà cung cấp..."
                  />
                  {showSupplierDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setNewItem({ ...newItem, supplier: s.name });
                              setSupplierSearchTerm("");
                              setShowSupplierDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{s.name}</div>
                            {s.material && <div className="text-xs text-gray-500">{s.material}</div>}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy nhà cung cấp</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin</label>
                  <input
                    type="text"
                    value={newItem.info}
                    onChange={(e) => setNewItem({ ...newItem, info: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ĐVT</label>
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá chưa thuế</label>
                    <input
                      type="number"
                      value={newItem.priceBeforeTax || ""}
                      onChange={(e) => {
                        const price = Number(e.target.value) || 0;
                        setNewItem({
                          ...newItem,
                          priceBeforeTax: price,
                          priceWithTax: calculatePriceWithTax(price, newItem.taxRate),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thuế (%)</label>
                    <input
                      type="number"
                      value={newItem.taxRate || ""}
                      onChange={(e) => {
                        const tax = Number(e.target.value) || 0;
                        setNewItem({
                          ...newItem,
                          taxRate: tax,
                          priceWithTax: calculatePriceWithTax(newItem.priceBeforeTax, tax),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá có thuế</label>
                  <input
                    type="number"
                    value={newItem.priceWithTax || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh</label>
                  <input
                    type="text"
                    value={newItem.image}
                    onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
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
                  {isAdding ? "Đang thêm..." : "Thêm NPL"}
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
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết nguyên phụ liệu</h3>
                <p className="text-sm text-gray-500">{selectedItem.name}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedItem.image && (
                  <div className="mb-4">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="w-full max-h-48 object-contain rounded-lg border"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Mã NPL:</span>
                    <p className="font-medium">{selectedItem.code || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Tên NPL:</span>
                    <p className="font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Nhà cung cấp:</span>
                    <p className="font-medium">{selectedItem.supplier || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">ĐVT:</span>
                    <p className="font-medium">{selectedItem.unit || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Giá chưa thuế:</span>
                    <p className="font-medium">
                      {selectedItem.priceBeforeTax > 0
                        ? `${selectedItem.priceBeforeTax.toLocaleString("vi-VN")}đ`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Thuế (%):</span>
                    <p className="font-medium">{selectedItem.taxRate || 0}%</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-500">Giá có thuế:</span>
                    <p className="font-medium text-lg text-blue-600">
                      {selectedItem.priceWithTax > 0
                        ? `${selectedItem.priceWithTax.toLocaleString("vi-VN")}đ`
                        : "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Thông tin:</span>
                  <p className="font-medium">{selectedItem.info || "-"}</p>
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
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sửa nguyên phụ liệu</h3>
                <p className="text-sm text-gray-500">{editItem.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã NPL</label>
                    <input
                      type="text"
                      value={editItem.code}
                      onChange={(e) => setEditItem({ ...editItem, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên NPL *</label>
                    <input
                      type="text"
                      value={editItem.name}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={editSupplierSearchTerm || editItem.supplier}
                    onChange={(e) => {
                      setEditSupplierSearchTerm(e.target.value);
                      setShowEditSupplierDropdown(true);
                      if (!e.target.value) setEditItem({ ...editItem, supplier: "" });
                    }}
                    onFocus={() => setShowEditSupplierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowEditSupplierDropdown(false), 150)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Tìm và chọn nhà cung cấp..."
                  />
                  {showEditSupplierDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredEditSuppliers.length > 0 ? (
                        filteredEditSuppliers.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setEditItem({ ...editItem, supplier: s.name });
                              setEditSupplierSearchTerm("");
                              setShowEditSupplierDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-green-50 text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{s.name}</div>
                            {s.material && <div className="text-xs text-gray-500">{s.material}</div>}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy nhà cung cấp</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin</label>
                  <input
                    type="text"
                    value={editItem.info}
                    onChange={(e) => setEditItem({ ...editItem, info: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ĐVT</label>
                    <input
                      type="text"
                      value={editItem.unit}
                      onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá chưa thuế</label>
                    <input
                      type="number"
                      value={editItem.priceBeforeTax || ""}
                      onChange={(e) => {
                        const price = Number(e.target.value) || 0;
                        setEditItem({
                          ...editItem,
                          priceBeforeTax: price,
                          priceWithTax: calculatePriceWithTax(price, editItem.taxRate),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thuế (%)</label>
                    <input
                      type="number"
                      value={editItem.taxRate || ""}
                      onChange={(e) => {
                        const tax = Number(e.target.value) || 0;
                        setEditItem({
                          ...editItem,
                          taxRate: tax,
                          priceWithTax: calculatePriceWithTax(editItem.priceBeforeTax, tax),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá có thuế</label>
                  <input
                    type="number"
                    value={editItem.priceWithTax || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh</label>
                  <input
                    type="text"
                    value={editItem.image}
                    onChange={(e) => setEditItem({ ...editItem, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa nguyên phụ liệu</h3>
                <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn xóa nguyên phụ liệu này?</p>
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
