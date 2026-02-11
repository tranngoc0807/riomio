"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  CreditCard,
  MapPin,
  RefreshCw,
  Building2,
  FileText,
} from "lucide-react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  gender: string;
  employmentStatus: string;
  birthday: string;
  cccd: string;
  cccdDate: string;
  cccdPlace: string;
  hometown: string;
  address: string;
  contractType: string;
  bankAccount: string;
  phone: string;
  email: string;
}

const CONTRACT_TYPES = [
  { value: "1 năm", label: "1 năm" },
  { value: "Không xác định thời hạn", label: "Không xác định thời hạn" },
];

const GENDERS = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
];

const EMPLOYMENT_STATUSES = [
  { value: "Đang làm việc", label: "Đang làm việc" },
  { value: "Nghỉ việc", label: "Nghỉ việc" },
  { value: "Thử việc", label: "Thử việc" },
];

const emptyEmployee = {
  name: "",
  position: "",
  department: "",
  gender: "",
  employmentStatus: "Đang làm việc",
  birthday: "",
  cccd: "",
  cccdDate: "",
  cccdPlace: "",
  hometown: "",
  address: "",
  contractType: "1 năm",
  bankAccount: "",
  phone: "",
  email: "",
};

// Helper function to get initials from name
const getInitials = (name: string) => {
  const words = name.split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Avatar colors based on department
const getAvatarColor = (department: string) => {
  const colors: Record<string, string> = {
    "Kinh doanh": "from-blue-500 to-blue-600",
    "Kế toán": "from-green-500 to-green-600",
    "Nhân sự": "from-purple-500 to-purple-600",
    "Sản xuất": "from-orange-500 to-orange-600",
    "Kỹ thuật": "from-cyan-500 to-cyan-600",
    "Marketing": "from-pink-500 to-pink-600",
    "Hành chính": "from-amber-500 to-amber-600",
  };
  return colors[department] || "from-gray-500 to-gray-600";
};

export default function DanhSachNhanVienTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState(emptyEmployee);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Load employees from API
  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();

      if (data.success) {
        setEmployees(data.data);
      } else {
        toast.error(data.error || "Không thể tải danh sách nhân viên");
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Lỗi khi tải danh sách nhân viên");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const handleOpenAddModal = () => {
    setFormData(emptyEmployee);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setFormData({
      name: emp.name || "",
      position: emp.position || "",
      department: emp.department || "",
      gender: emp.gender || "",
      employmentStatus: emp.employmentStatus || "Đang làm việc",
      birthday: emp.birthday || "",
      cccd: emp.cccd || "",
      cccdDate: emp.cccdDate || "",
      cccdPlace: emp.cccdPlace || "",
      hometown: emp.hometown || "",
      address: emp.address || "",
      contractType: emp.contractType || "1 năm",
      bankAccount: emp.bankAccount || "",
      phone: emp.phone || "",
      email: emp.email || "",
    });
    setSelectedEmployee(emp);
    setShowEditModal(true);
    setShowViewModal(false);
  };

  const handleAddEmployee = async () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/employees/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã thêm nhân viên thành công!");
        setShowAddModal(false);
        setFormData(emptyEmployee);
        await loadEmployees();
      } else {
        toast.error(data.error || "Không thể thêm nhân viên");
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Lỗi khi thêm nhân viên");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/employees/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEmployee.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã cập nhật thông tin nhân viên!");
        setShowEditModal(false);
        await loadEmployees();
      } else {
        toast.error(data.error || "Không thể cập nhật nhân viên");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Lỗi khi cập nhật nhân viên");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = (emp: Employee) => {
    setDeletingEmployee(emp);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) return;

    try {
      const response = await fetch(`/api/employees/delete?id=${deletingEmployee.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã xóa nhân viên!");
        await loadEmployees();
      } else {
        toast.error(data.error || "Không thể xóa nhân viên");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Lỗi khi xóa nhân viên");
    } finally {
      setShowDeleteConfirm(false);
      setDeletingEmployee(null);
    }
  };

  // Form fields JSX - inline để tránh mất focus khi typing
  const formFieldsJSX = (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập họ và tên"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập vị trí"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bộ phận</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập bộ phận"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Chọn giới tính</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
          <input
            type="text"
            value={formData.birthday}
            onChange={(e) => setFormData((prev) => ({ ...prev, birthday: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số CCCD</label>
          <input
            type="text"
            value={formData.cccd}
            onChange={(e) => setFormData((prev) => ({ ...prev, cccd: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập số CCCD"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày cấp CCCD</label>
          <input
            type="text"
            value={formData.cccdDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, cccdDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nơi cấp CCCD</label>
          <input
            type="text"
            value={formData.cccdPlace}
            onChange={(e) => setFormData((prev) => ({ ...prev, cccdPlace: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập nơi cấp"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quê quán</label>
          <input
            type="text"
            value={formData.hometown}
            onChange={(e) => setFormData((prev) => ({ ...prev, hometown: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập quê quán"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ hiện tại</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập địa chỉ"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại hợp đồng</label>
          <select
            value={formData.contractType}
            onChange={(e) => setFormData((prev) => ({ ...prev, contractType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CONTRACT_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={formData.employmentStatus}
            onChange={(e) => setFormData((prev) => ({ ...prev, employmentStatus: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {EMPLOYMENT_STATUSES.map((es) => (
              <option key={es.value} value={es.value}>{es.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản ngân hàng</label>
          <input
            type="text"
            value={formData.bankAccount}
            onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập số tài khoản"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập email"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Danh sách nhân viên</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              {employees.length} nhân viên
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadEmployees}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              Làm mới
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Thêm nhân viên
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, vị trí, bộ phận..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bộ phận</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CCCD</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại HĐ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        {searchTerm ? "Không tìm thấy nhân viên phù hợp" : "Chưa có dữ liệu nhân viên"}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, index) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewEmployee(emp)}
                      >
                        <td className="px-4 py-4 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                                emp.department
                              )} flex items-center justify-center`}
                            >
                              <span className="text-white font-medium text-xs">
                                {getInitials(emp.name)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {emp.position || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{emp.department || "-"}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{emp.birthday || "-"}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{emp.cccd || "-"}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                            {emp.contractType || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 text-sm rounded-full ${
                              emp.employmentStatus === "Đang làm việc"
                                ? "bg-green-100 text-green-700"
                                : emp.employmentStatus === "Nghỉ việc"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {emp.employmentStatus || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewEmployee(emp)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem chi tiết"
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(emp)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
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
        </div>
      </div>

      {/* Modal Thêm nhân viên */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-[60]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Thêm nhân viên mới</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {formFieldsJSX}

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddEmployee}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang thêm...
                    </>
                  ) : (
                    "Thêm nhân viên"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Sửa nhân viên */}
      {showEditModal && selectedEmployee && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowEditModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-[60]">
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

              {formFieldsJSX}

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateEmployee}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
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

      {/* Slide Panel xem thông tin nhân viên */}
      {showViewModal && selectedEmployee && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowViewModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-[60] overflow-y-auto">
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

              {/* Header với avatar */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(
                    selectedEmployee.department
                  )} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-white font-bold text-2xl">
                    {getInitials(selectedEmployee.name)}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {selectedEmployee.position || "Chưa có vị trí"}
                    </span>
                    {selectedEmployee.department && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                        {selectedEmployee.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-gray-700">Thông tin cá nhân</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Giới tính</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.gender || "Chưa cập nhật"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Ngày sinh</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.birthday || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <CreditCard className="text-orange-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Số CCCD</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.cccd || "Chưa cập nhật"}</p>
                    {selectedEmployee.cccdDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ngày cấp: {selectedEmployee.cccdDate} - {selectedEmployee.cccdPlace}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <MapPin className="text-purple-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Quê quán</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.hometown || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Địa chỉ hiện tại</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.address || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-700 pt-4">Thông tin công việc</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Tình trạng</p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-sm rounded-full ${
                        selectedEmployee.employmentStatus === "Đang làm việc"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedEmployee.employmentStatus || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Loại hợp đồng</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.contractType || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Tài khoản ngân hàng</p>
                  <p className="font-semibold text-gray-900">{selectedEmployee.bankAccount || "Chưa cập nhật"}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{selectedEmployee.email || "Chưa cập nhật"}</p>
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
                  onClick={() => handleOpenEditModal(selectedEmployee)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Employee Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingEmployee(null);
        }}
        onConfirm={confirmDeleteEmployee}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa nhân viên "${deletingEmployee?.name || ""}"?`}
        confirmText="Xóa"
        type="danger"
      />
    </>
  );
}
