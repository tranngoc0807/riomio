"use client";

import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";

type CustomerType = "npp" | "shop" | "ctv" | "nhanvien" | "daily" | "khachle" | "";

interface Customer {
  id: number;
  code: string;
  name: string;
  type: CustomerType;
  cccd: string;
  phone: string;
  address: string;
  shippingInfo: string;
  birthday: string;
  notes: string;
  totalOrders: number;
  totalSpent: number;
  rowIndex: number;
}

const INITIAL_CUSTOMER = {
  name: "",
  type: "" as CustomerType,
  cccd: "",
  phone: "",
  address: "",
  shippingInfo: "",
  birthday: "",
  notes: "",
};

// Mapping giữa type code và tên hiển thị
const CATEGORY_LABELS: Record<string, string> = {
  npp: "NPP",
  shop: "Shop",
  ctv: "CTV",
  nhanvien: "Nhân viên",
  daily: "Đại lý",
  dealer: "Đại lý", // Legacy support
  khachle: "Khách lẻ",
};

// Mapping từ tên trong Google Sheet sang type code (case-insensitive handled in fetchCustomers)
const CATEGORY_FROM_SHEET: Record<string, CustomerType> = {
  "NPP": "npp",
  "Shop": "shop",
  "CTV": "ctv",
  "Nhân viên": "nhanvien",
  "Đại lý": "daily",
  "Khách lẻ": "khachle",
};

// Màu sắc cho từng loại khách hàng
const CATEGORY_COLORS: Record<string, string> = {
  npp: "bg-purple-100 text-purple-700",
  shop: "bg-green-100 text-green-700",
  ctv: "bg-orange-100 text-orange-700",
  nhanvien: "bg-cyan-100 text-cyan-700",
  daily: "bg-blue-100 text-blue-700",
  dealer: "bg-blue-100 text-blue-700", // Legacy support
  khachle: "bg-gray-100 text-gray-700",
};

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  const [newCustomer, setNewCustomer] = useState(INITIAL_CUSTOMER);
  const [editCustomer, setEditCustomer] = useState({
    id: 0,
    code: "",
    ...INITIAL_CUSTOMER,
    totalOrders: 0,
    totalSpent: 0,
    rowIndex: 0,
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Helper function để map category từ sheet
  const mapCategoryFromSheet = (category: string): CustomerType => {
    if (!category) return "";
    const trimmed = category.trim();
    // Kiểm tra exact match trước
    if (CATEGORY_FROM_SHEET[trimmed]) {
      return CATEGORY_FROM_SHEET[trimmed];
    }
    // Kiểm tra case-insensitive
    const lowerCategory = trimmed.toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_FROM_SHEET)) {
      if (key.toLowerCase() === lowerCategory) {
        return value;
      }
    }
    return "";
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/khach-hang");
      const result = await response.json();
      if (result.success) {
        const mappedCustomers = result.data.map((customer: any) => ({
          id: customer.id,
          code: `KH${String(customer.id).padStart(3, "0")}`,
          name: customer.name,
          type: mapCategoryFromSheet(customer.category || ""),
          cccd: customer.cccd || "",
          phone: customer.phone || "",
          address: customer.address || "",
          shippingInfo: customer.shippingInfo || "",
          birthday: customer.birthday || "",
          notes: customer.notes || "",
          totalOrders: 0,
          totalSpent: 0,
          rowIndex: customer.rowIndex,
        }));
        setCustomers(mappedCustomers);
      } else {
        toast.error("Không thể tải danh sách khách hàng");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Lỗi khi tải danh sách khách hàng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCustomer.name) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/khach-hang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomer.name,
          category: CATEGORY_LABELS[newCustomer.type] || "",
          cccd: newCustomer.cccd,
          phone: newCustomer.phone,
          address: newCustomer.address,
          shippingInfo: newCustomer.shippingInfo,
          birthday: newCustomer.birthday,
          notes: newCustomer.notes,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Thêm khách hàng thành công!");
        setNewCustomer(INITIAL_CUSTOMER);
        setShowAddModal(false);

        // Update customers with new data from API
        const mappedCustomers = result.data.map((customer: any) => ({
          id: customer.id,
          code: `KH${String(customer.id).padStart(3, "0")}`,
          name: customer.name,
          type: mapCategoryFromSheet(customer.category || ""),
          cccd: customer.cccd || "",
          phone: customer.phone || "",
          address: customer.address || "",
          shippingInfo: customer.shippingInfo || "",
          birthday: customer.birthday || "",
          notes: customer.notes || "",
          totalOrders: 0,
          totalSpent: 0,
          rowIndex: customer.rowIndex,
        }));
        setCustomers(mappedCustomers);
      } else {
        toast.error("Lỗi: " + result.error);
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Không thể thêm khách hàng");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditCustomer({ ...customer });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editCustomer.name) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/khach-hang", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: editCustomer.rowIndex,
          name: editCustomer.name,
          category: CATEGORY_LABELS[editCustomer.type] || "",
          cccd: editCustomer.cccd,
          phone: editCustomer.phone,
          address: editCustomer.address,
          shippingInfo: editCustomer.shippingInfo,
          birthday: editCustomer.birthday,
          notes: editCustomer.notes,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật khách hàng thành công!");
        setShowEditModal(false);

        // Update customers with new data from API
        const mappedCustomers = result.data.map((customer: any) => ({
          id: customer.id,
          code: `KH${String(customer.id).padStart(3, "0")}`,
          name: customer.name,
          type: mapCategoryFromSheet(customer.category || ""),
          cccd: customer.cccd || "",
          phone: customer.phone || "",
          address: customer.address || "",
          shippingInfo: customer.shippingInfo || "",
          birthday: customer.birthday || "",
          notes: customer.notes || "",
          totalOrders: 0,
          totalSpent: 0,
          rowIndex: customer.rowIndex,
        }));
        setCustomers(mappedCustomers);
      } else {
        toast.error("Lỗi: " + result.error);
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Không thể cập nhật khách hàng");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer.rowIndex);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete === null) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/khach-hang?rowIndex=${customerToDelete}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Đã xóa khách hàng!");
        setShowDeleteModal(false);
        setCustomerToDelete(null);

        // Update customers with new data from API
        const mappedCustomers = result.data.map((customer: any) => ({
          id: customer.id,
          code: `KH${String(customer.id).padStart(3, "0")}`,
          name: customer.name,
          type: mapCategoryFromSheet(customer.category || ""),
          cccd: customer.cccd || "",
          phone: customer.phone || "",
          address: customer.address || "",
          shippingInfo: customer.shippingInfo || "",
          birthday: customer.birthday || "",
          notes: customer.notes || "",
          totalOrders: 0,
          totalSpent: 0,
          rowIndex: customer.rowIndex,
        }));
        setCustomers(mappedCustomers);
      } else {
        toast.error("Lỗi: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Không thể xóa khách hàng");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Header with search and add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setNewCustomer(INITIAL_CUSTOMER);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Thêm khách hàng
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
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 w-12">STT</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 min-w-[180px]">Khách hàng</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 min-w-[90px]">Phân loại</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 min-w-[120px]">CCCD/MST</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 min-w-[110px]">SĐT</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 min-w-[200px]">Địa chỉ</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 min-w-[180px]">TT gửi hàng</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 min-w-[100px]">Sinh nhật</th>
                <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 min-w-[150px]">Ghi chú</th>
                <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 sticky right-0 bg-gray-50 min-w-[100px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                    Chưa có khách hàng nào
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50 group">
                    <td className="px-3 py-3 text-sm text-center text-gray-500">{index + 1}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 font-medium">{customer.name}</td>
                    <td className="px-3 py-3 text-center">
                      {customer.type ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[customer.type] || "bg-gray-100 text-gray-700"}`}
                        >
                          {CATEGORY_LABELS[customer.type] || customer.type}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{customer.cccd || "-"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{customer.phone || "-"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{customer.address || "-"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{customer.shippingInfo || "-"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{customer.birthday || "-"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{customer.notes || "-"}</td>
                    <td className="px-3 py-3 sticky right-0 bg-white group-hover:bg-gray-50">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thêm khách hàng mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
                <select
                  value={newCustomer.type}
                  onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value as CustomerType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  <option value="npp">NPP</option>
                  <option value="shop">Shop</option>
                  <option value="ctv">CTV</option>
                  <option value="nhanvien">Nhân viên</option>
                  <option value="daily">Đại lý</option>
                  <option value="khachle">Khách lẻ</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập SĐT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CCCD/MST</label>
                  <input
                    type="text"
                    value={newCustomer.cccd}
                    onChange={(e) => setNewCustomer({ ...newCustomer, cccd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập CCCD/MST"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin gửi hàng</label>
                <input
                  type="text"
                  value={newCustomer.shippingInfo}
                  onChange={(e) => setNewCustomer({ ...newCustomer, shippingInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập thông tin gửi hàng"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sinh nhật</label>
                  <input
                    type="date"
                    value={newCustomer.birthday}
                    onChange={(e) => setNewCustomer({ ...newCustomer, birthday: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <input
                    type="text"
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAdding}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  "Thêm khách hàng"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Portal>
        {showEditModal && (
          <>
            <div className="fixed inset-0 bg-black/20 z-50" onClick={() => setShowEditModal(false)} />
            <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa khách hàng</h3>
                  <p className="text-sm text-gray-500">Mã: {editCustomer.code}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên khách hàng *</label>
                    <input
                      type="text"
                      value={editCustomer.name}
                      onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phân loại</label>
                    <select
                      value={editCustomer.type}
                      onChange={(e) => setEditCustomer({ ...editCustomer, type: e.target.value as CustomerType })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-</option>
                      <option value="npp">NPP</option>
                      <option value="shop">Shop</option>
                      <option value="ctv">CTV</option>
                      <option value="nhanvien">Nhân viên</option>
                      <option value="daily">Đại lý</option>
                      <option value="khachle">Khách lẻ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                    <input
                      type="text"
                      value={editCustomer.phone}
                      onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
                    <input
                      type="text"
                      value={editCustomer.address}
                      onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Thông tin gửi hàng</label>
                    <input
                      type="text"
                      value={editCustomer.shippingInfo}
                      onChange={(e) => setEditCustomer({ ...editCustomer, shippingInfo: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Sinh nhật</label>
                      <input
                        type="date"
                        value={editCustomer.birthday}
                        onChange={(e) => setEditCustomer({ ...editCustomer, birthday: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">CCCD/MST</label>
                      <input
                        type="text"
                        value={editCustomer.cccd}
                        onChange={(e) => setEditCustomer({ ...editCustomer, cccd: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                    <textarea
                      value={editCustomer.notes}
                      onChange={(e) => setEditCustomer({ ...editCustomer, notes: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa khách hàng</h3>
              <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn xóa khách hàng này?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCustomerToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
