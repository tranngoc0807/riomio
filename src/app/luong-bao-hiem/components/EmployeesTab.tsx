"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Loader2,
  Phone,
  Cake,
  CreditCard,
  MapPin,
} from "lucide-react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";

interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string;
  birthday: string;
  cccd: string;
  address: string;
}

interface EmployeesTabProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  isLoading: boolean;
  loadEmployeesFromSheet: () => Promise<void>;
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  const words = name.split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Avatar colors based on position
const getAvatarColor = (position: string) => {
  const colors: Record<string, string> = {
    "Giám đốc": "from-purple-500 to-purple-600",
    "Kế toán": "from-green-500 to-green-600",
    "Quản lý đơn hàng": "from-blue-500 to-blue-600",
    "Thiết kế": "from-pink-500 to-pink-600",
    "Thủ kho": "from-orange-500 to-orange-600",
    Partten: "from-cyan-500 to-cyan-600",
    "May mẫu": "from-teal-500 to-teal-600",
    "Sale sỉ": "from-indigo-500 to-indigo-600",
    "Sale sàn": "from-rose-500 to-rose-600",
    "Tổng hợp": "from-amber-500 to-amber-600",
    "Hình ảnh": "from-violet-500 to-violet-600",
  };
  return colors[position] || "from-gray-500 to-gray-600";
};

export default function EmployeesTab({
  employees,
  setEmployees,
  isLoading,
  loadEmployeesFromSheet,
}: EmployeesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    phone: "",
    birthday: "",
    cccd: "",
    address: "",
  });
  const [editEmployee, setEditEmployee] = useState({
    id: 0,
    name: "",
    position: "",
    phone: "",
    birthday: "",
    cccd: "",
    address: "",
  });
  const [originalEmployee, setOriginalEmployee] = useState({
    id: 0,
    name: "",
    position: "",
    phone: "",
    birthday: "",
    cccd: "",
    address: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: false,
    position: false,
    phone: false,
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = async () => {
    const errors = {
      name: !newEmployee.name.trim(),
      position: !newEmployee.position.trim(),
      phone: false,
    };

    if (newEmployee.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(newEmployee.phone)) {
        errors.phone = true;
        toast.error("Số điện thoại phải là 10 chữ số!");
      }
    }

    setFormErrors(errors);

    if (errors.name || errors.position || errors.phone) {
      if (errors.name) toast.error("Vui lòng nhập họ và tên!");
      if (errors.position) toast.error("Vui lòng nhập công việc!");
      return;
    }

    setIsAdding(true);
    try {
      const newEmp = {
        id:
          employees.length > 0
            ? Math.max(...employees.map((e) => e.id)) + 1
            : 1,
        ...newEmployee,
      };

      const response = await fetch("/api/employees/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmp),
      });

      const data = await response.json();

      if (data.success) {
        await loadEmployeesFromSheet();
        setNewEmployee({
          name: "",
          position: "",
          phone: "",
          birthday: "",
          cccd: "",
          address: "",
        });
        setFormErrors({ name: false, position: false, phone: false });
        setShowAddModal(false);
        toast.success("Đã thêm nhân viên và cập nhật Google Sheets!");
      } else {
        toast.error(`Lỗi: ${data.error}`);
      }
    } catch (error: any) {
      console.error("Error adding employee:", error);
      toast.error(`Lỗi khi thêm nhân viên: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      try {
        const response = await fetch(`/api/employees/delete?id=${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          setEmployees(employees.filter((emp) => emp.id !== id));
          toast.success("Đã xóa nhân viên và cập nhật Google Sheets!");
        } else {
          toast.error(`Lỗi: ${data.error}`);
        }
      } catch (error: any) {
        console.error("Error deleting employee:", error);
        toast.error(`Lỗi khi xóa nhân viên: ${error.message}`);
      }
    }
  };

  const handleViewEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditEmployee({ ...emp });
    setOriginalEmployee({ ...emp });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (editEmployee.name && editEmployee.position) {
      const hasChanges =
        editEmployee.name !== originalEmployee.name ||
        editEmployee.position !== originalEmployee.position ||
        editEmployee.phone !== originalEmployee.phone ||
        editEmployee.birthday !== originalEmployee.birthday ||
        editEmployee.cccd !== originalEmployee.cccd ||
        editEmployee.address !== originalEmployee.address;

      if (!hasChanges) {
        toast("Không có thay đổi nào để lưu");
        setShowEditModal(false);
        return;
      }

      setIsUpdating(true);
      try {
        const response = await fetch("/api/employees/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editEmployee),
        });

        const data = await response.json();

        if (data.success) {
          setEmployees(
            employees.map((emp) =>
              emp.id === editEmployee.id ? editEmployee : emp
            )
          );
          setShowEditModal(false);
          toast.success("Đã cập nhật thông tin nhân viên và Google Sheets!");
        } else {
          toast.error(`Lỗi: ${data.error}`);
        }
      } catch (error: any) {
        console.error("Error updating employee:", error);
        toast.error(`Lỗi khi cập nhật nhân viên: ${error.message}`);
      } finally {
        setIsUpdating(false);
      }
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
            placeholder="Tìm kiếm nhân viên..."
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
          Thêm nhân viên
        </button>
      </div>

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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">STT</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Họ và tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Công việc</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ngày sinh</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CCCD</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Địa chỉ</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((emp, index) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {emp.position}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{emp.phone}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {emp.birthday
                      ? new Date(emp.birthday).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{emp.cccd || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{emp.address || "-"}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewEmployee(emp)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
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

      {/* Modal thêm nhân viên */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thêm nhân viên mới</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({ name: false, position: false, phone: false });
                }}
                disabled={isAdding}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => {
                    setNewEmployee({ ...newEmployee, name: e.target.value });
                    setFormErrors({ ...formErrors, name: false });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Nhập họ và tên"
                  disabled={isAdding}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">Họ và tên là bắt buộc</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Công việc *
                </label>
                <input
                  type="text"
                  value={newEmployee.position}
                  onChange={(e) => {
                    setNewEmployee({ ...newEmployee, position: e.target.value });
                    setFormErrors({ ...formErrors, position: false });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.position ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Nhập công việc"
                  disabled={isAdding}
                />
                {formErrors.position && (
                  <p className="text-red-500 text-xs mt-1">Công việc là bắt buộc</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại (10 số)
                </label>
                <input
                  type="text"
                  value={newEmployee.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setNewEmployee({ ...newEmployee, phone: value });
                      setFormErrors({ ...formErrors, phone: false });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.phone ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Nhập 10 chữ số"
                  maxLength={10}
                  disabled={isAdding}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">Số điện thoại phải đủ 10 chữ số</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={newEmployee.birthday}
                  onChange={(e) => setNewEmployee({ ...newEmployee, birthday: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isAdding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CCCD (12 số)</label>
                <input
                  type="text"
                  value={newEmployee.cccd}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 12) {
                      setNewEmployee({ ...newEmployee, cccd: value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập 12 chữ số"
                  maxLength={12}
                  disabled={isAdding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={newEmployee.address}
                  onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ"
                  disabled={isAdding}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({ name: false, position: false, phone: false });
                }}
                disabled={isAdding}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={isAdding}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
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

      {/* Slide Panel xem thông tin nhân viên */}
      {showViewModal && selectedEmployee && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowViewModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Thông tin nhân viên</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(
                    selectedEmployee.position
                  )} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-white font-bold text-2xl">
                    {getInitials(selectedEmployee.name)}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {selectedEmployee.position}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Phone className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-semibold text-gray-900">
                      {selectedEmployee.phone || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Cake className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày sinh</p>
                    <p className="font-semibold text-gray-900">
                      {selectedEmployee.birthday
                        ? new Date(selectedEmployee.birthday).toLocaleDateString("vi-VN")
                        : "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <CreditCard className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số CCCD</p>
                    <p className="font-semibold text-gray-900">
                      {selectedEmployee.cccd || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="font-semibold text-gray-900">
                      {selectedEmployee.address || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenEditModal(selectedEmployee);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Slide Panel chỉnh sửa nhân viên */}
      {showEditModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowEditModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa thông tin</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={editEmployee.name}
                    onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Công việc *
                  </label>
                  <input
                    type="text"
                    value={editEmployee.position}
                    onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập công việc"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editEmployee.phone}
                    onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={editEmployee.birthday}
                    onChange={(e) => setEditEmployee({ ...editEmployee, birthday: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CCCD</label>
                  <input
                    type="text"
                    value={editEmployee.cccd}
                    onChange={(e) => setEditEmployee({ ...editEmployee, cccd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số CCCD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={editEmployee.address}
                    onChange={(e) => setEditEmployee({ ...editEmployee, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </Portal>
      )}
    </>
  );
}
