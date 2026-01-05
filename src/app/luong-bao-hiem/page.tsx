"use client";

import {
  Users,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Download,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  CreditCard,
  Cake,
  MapPin,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast, { Toaster } from "react-hot-toast";

type AttendanceStatus = "present" | "late" | "absent" | "off" | "future";

interface AttendanceRecord {
  employeeId: number;
  employeeName: string;
  attendance: AttendanceStatus[];
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

// Employee type - khớp với Google Sheets Employee interface
interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string;
  birthday: string;
  cccd: string;
  address: string;
}

// Generate attendance data
const generateAttendanceData = (
  employees: Employee[],
  year: number,
  month: number
): AttendanceRecord[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  return employees.map((emp) => ({
    employeeId: emp.id,
    employeeName: emp.name,
    attendance: Array.from(
      { length: daysInMonth },
      (_, i): AttendanceStatus => {
        const day = i + 1;
        const date = new Date(year, month - 1, day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // Kiểm tra ngày tương lai
        const isFutureDay =
          year > currentYear ||
          (year === currentYear && month > currentMonth) ||
          (year === currentYear && month === currentMonth && day > currentDay);

        if (isFutureDay) return "future"; // Ngày tương lai - không thể chấm công
        if (isWeekend) return "off"; // Cuối tuần - nghỉ

        // Ngày hôm nay - mặc định chưa chấm (để user tự chấm)
        const isToday =
          year === currentYear && month === currentMonth && day === currentDay;
        if (isToday) return "absent"; // Chưa chấm, mặc định vắng để user tự tích

        // Ngày trong quá khứ - dữ liệu mẫu
        return Math.random() > 0.1 ? "present" : "absent";
      }
    ),
  }));
};

// Generate salary data
const generateSalaryData = (employees: Employee[]) => {
  return employees.map((emp) => {
    const baseSalary =
      emp.position === "Giám đốc"
        ? 25000000
        : emp.position === "Kế toán"
        ? 12000000
        : emp.position === "Quản lý đơn hàng"
        ? 10000000
        : emp.position.includes("Sale")
        ? 8000000
        : emp.position === "Thiết kế"
        ? 10000000
        : 7000000;
    const allowance = Math.floor(baseSalary * 0.15);
    const insurance = Math.floor(baseSalary * 0.105); // 10.5% BHXH + BHYT + BHTN
    const workDays = 22 + Math.floor(Math.random() * 4);
    const bonus = Math.floor(Math.random() * 2000000);
    const netSalary = baseSalary + allowance + bonus - insurance;

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      baseSalary,
      allowance,
      workDays,
      bonus,
      insurance,
      netSalary,
      status: Math.random() > 0.3 ? "paid" : "pending",
    };
  });
};

export default function LuongBaoHiem() {
  // Lấy ngày hiện tại
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [activeTab, setActiveTab] = useState<
    "employees" | "attendance" | "salary"
  >("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: false,
    position: false,
    phone: false,
  });

  // State để lưu dữ liệu chấm công
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Kiểm tra có phải tháng/năm hiện tại không
  const isCurrentMonth =
    selectedMonth === currentMonth && selectedYear === currentYear;

  // Load employees from Google Sheets on mount
  useEffect(() => {
    loadEmployeesFromSheet();
  }, []);

  // Khởi tạo dữ liệu chấm công khi thay đổi tháng/năm hoặc danh sách nhân viên
  useEffect(() => {
    setAttendanceData(
      generateAttendanceData(employees, selectedYear, selectedMonth)
    );
  }, [employees, selectedYear, selectedMonth]);

  const loadEmployeesFromSheet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setEmployees(data.data);
      } else {
        console.log("No data in Google Sheets, using sample data");
      }
    } catch (error) {
      console.error("Error loading employees from sheet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncToGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/employees/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employees }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã đồng bộ dữ liệu lên Google Sheets thành công!");
      } else {
        toast.error(`Lỗi: ${data.error}`);
      }
    } catch (error: any) {
      console.error("Error syncing to Google Sheets:", error);
      toast.error(`Lỗi khi đồng bộ: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Hàm toggle trạng thái chấm công
  const handleToggleAttendance = (employeeId: number, dayIndex: number) => {
    setAttendanceData((prev) =>
      prev.map((record) => {
        if (record.employeeId !== employeeId) return record;

        const newAttendance = [...record.attendance];
        const currentStatus = newAttendance[dayIndex];

        // Không cho phép thay đổi ngày tương lai
        if (currentStatus === "future") return record;

        // Cycle: present -> late -> absent -> off -> present
        if (currentStatus === "present") {
          newAttendance[dayIndex] = "late";
        } else if (currentStatus === "late") {
          newAttendance[dayIndex] = "absent";
        } else if (currentStatus === "absent") {
          newAttendance[dayIndex] = "off";
        } else {
          newAttendance[dayIndex] = "present";
        }

        return { ...record, attendance: newAttendance };
      })
    );
  };

  // Hàm chấm công tất cả nhân viên hôm nay là "có mặt"
  const handleMarkAllPresentToday = () => {
    if (!isCurrentMonth) return;
    const todayIndex = currentDay - 1;
    setAttendanceData((prev) =>
      prev.map((record) => {
        const newAttendance = [...record.attendance];
        newAttendance[todayIndex] = "present";
        return { ...record, attendance: newAttendance };
      })
    );
  };

  // Hàm chấm công tất cả nhân viên hôm nay là "vắng"
  const handleMarkAllAbsentToday = () => {
    if (!isCurrentMonth) return;
    const todayIndex = currentDay - 1;
    setAttendanceData((prev) =>
      prev.map((record) => {
        const newAttendance = [...record.attendance];
        newAttendance[todayIndex] = "absent";
        return { ...record, attendance: newAttendance };
      })
    );
  };

  const salaryData = generateSalaryData(employees);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = async () => {
    // Validate form
    const errors = {
      name: !newEmployee.name.trim(),
      position: !newEmployee.position.trim(),
      phone: false,
    };

    // Validate phone nếu có nhập
    if (newEmployee.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(newEmployee.phone)) {
        errors.phone = true;
        toast.error("Số điện thoại phải là 10 chữ số!");
      }
    }

    setFormErrors(errors);

    // Kiểm tra có lỗi không
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmp),
      });

      const data = await response.json();

      if (data.success) {
        // Reload dữ liệu từ Google Sheets để đồng bộ
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
      // Kiểm tra xem có thay đổi gì không
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
          headers: {
            "Content-Type": "application/json",
          },
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

  const totalSalary = salaryData.reduce((sum, s) => sum + s.netSalary, 0);
  const totalInsurance = salaryData.reduce((sum, s) => sum + s.insurance, 0);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Lương & Bảo hiểm
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý nhân viên, chấm công và bảng lương
          </p>
        </div>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng nhân viên</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng lương tháng</p>
              <p className="text-2xl font-bold text-green-600">
                {(totalSalary / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng bảo hiểm</p>
              <p className="text-2xl font-bold text-orange-600">
                {(totalInsurance / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Check className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã thanh toán</p>
              <p className="text-2xl font-bold text-purple-600">
                {salaryData.filter((s) => s.status === "paid").length}/
                {salaryData.length}
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "employees"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={20} />
                Danh sách nhân viên
              </div>
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "attendance"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={20} />
                Chấm công
              </div>
            </button>
            <button
              onClick={() => setActiveTab("salary")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "salary"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign size={20} />
                Bảng lương
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Danh sách nhân viên */}
          {activeTab === "employees" && (
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Họ và tên
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Công việc
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Số điện thoại
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Ngày sinh
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          CCCD
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Địa chỉ
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredEmployees.map((emp, index) => (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-medium text-gray-900">
                                {emp.name}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                              {emp.position}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {emp.phone}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {emp.birthday
                              ? new Date(emp.birthday).toLocaleDateString("vi-VN")
                              : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {emp.cccd || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {emp.address || "-"}
                          </td>
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
            </>
          )}

          {/* Tab: Chấm công */}
          {activeTab === "attendance" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (selectedMonth === 1) {
                        setSelectedMonth(12);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Tháng {i + 1}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {[2023, 2024, 2025].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedMonth === 12) {
                        setSelectedMonth(1);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Có mặt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Đi muộn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Vắng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span>Nghỉ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-dashed border-gray-300 rounded"></div>
                    <span>Chưa đến</span>
                  </div>
                </div>
              </div>

              {/* Chế độ chỉnh sửa chấm công */}
              {isEditingAttendance ? (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900 flex items-center gap-2">
                        <Edit size={18} />
                        Đang chỉnh sửa chấm công
                      </p>
                      <p className="text-sm text-green-700">
                        Click vào ô để thay đổi trạng thái: Có mặt → Đi muộn →
                        Vắng → Nghỉ
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isCurrentMonth && (
                        <>
                          <button
                            onClick={handleMarkAllPresentToday}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <Check size={16} />
                            Tất cả có mặt
                          </button>
                          <button
                            onClick={handleMarkAllAbsentToday}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <X size={16} />
                            Tất cả vắng
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setIsEditingAttendance(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Check size={16} />
                        Hoàn tất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={() => setIsEditingAttendance(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                    Chỉnh sửa chấm công
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-500 sticky left-0 bg-gray-50 min-w-[150px]">
                        Nhân viên
                      </th>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const date = new Date(
                          selectedYear,
                          selectedMonth - 1,
                          day
                        );
                        const isWeekend =
                          date.getDay() === 0 || date.getDay() === 6;
                        const isToday = isCurrentMonth && day === currentDay;
                        const isFutureDay =
                          selectedYear > currentYear ||
                          (selectedYear === currentYear &&
                            selectedMonth > currentMonth) ||
                          (selectedYear === currentYear &&
                            selectedMonth === currentMonth &&
                            day > currentDay);
                        return (
                          <th
                            key={i}
                            className={`px-1 py-2 text-center font-medium min-w-[32px] ${
                              isToday
                                ? "bg-blue-600 text-white"
                                : isFutureDay
                                ? "bg-gray-100 text-gray-300"
                                : isWeekend
                                ? "bg-gray-200 text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {day}
                          </th>
                        );
                      })}
                      <th className="px-3 py-2 text-center font-medium text-gray-500 bg-blue-50">
                        Tổng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceData.map((row) => {
                      const totalPresent = row.attendance.filter(
                        (a) => a === "present"
                      ).length;
                      const totalLate = row.attendance.filter(
                        (a) => a === "late"
                      ).length;
                      const totalWorking = totalPresent + totalLate;
                      return (
                        <tr key={row.employeeId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white">
                            {row.employeeName}
                          </td>
                          {row.attendance.map((status, i) => {
                            const day = i + 1;
                            const isToday =
                              isCurrentMonth && day === currentDay;
                            const isFuture = status === "future";
                            return (
                              <td
                                key={i}
                                className={`px-1 py-2 text-center ${
                                  isToday
                                    ? "bg-blue-100"
                                    : isFuture
                                    ? "bg-gray-50"
                                    : ""
                                }`}
                              >
                                {isFuture ? (
                                  <div
                                    className="w-6 h-6 mx-auto rounded bg-gray-100 border border-dashed border-gray-300 cursor-not-allowed"
                                    title="Ngày chưa đến - không thể chấm công"
                                  />
                                ) : (
                                  <div
                                    onClick={() =>
                                      isEditingAttendance &&
                                      handleToggleAttendance(row.employeeId, i)
                                    }
                                    className={`w-6 h-6 mx-auto rounded transition-all ${
                                      isEditingAttendance
                                        ? "cursor-pointer hover:scale-110 hover:shadow-md"
                                        : "cursor-default"
                                    } ${
                                      status === "present"
                                        ? isEditingAttendance
                                          ? "bg-green-500 hover:bg-green-600"
                                          : "bg-green-500"
                                        : status === "late"
                                        ? isEditingAttendance
                                          ? "bg-yellow-500 hover:bg-yellow-600"
                                          : "bg-yellow-500"
                                        : status === "absent"
                                        ? isEditingAttendance
                                          ? "bg-red-500 hover:bg-red-600"
                                          : "bg-red-500"
                                        : isEditingAttendance
                                        ? "bg-gray-200 hover:bg-gray-300"
                                        : "bg-gray-200"
                                    } ${
                                      isToday
                                        ? "ring-2 ring-blue-400 ring-offset-1"
                                        : ""
                                    }`}
                                    title={`${
                                      status === "present"
                                        ? "Có mặt"
                                        : status === "late"
                                        ? "Đi muộn"
                                        : status === "absent"
                                        ? "Vắng"
                                        : "Nghỉ"
                                    }${
                                      isEditingAttendance
                                        ? " - Click để thay đổi"
                                        : ""
                                    }`}
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center font-semibold bg-blue-50">
                            <span className="text-blue-600">
                              {totalWorking}
                            </span>
                            {totalLate > 0 && (
                              <span className="text-yellow-600 text-xs ml-1">
                                ({totalLate})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab: Bảng lương */}
          {activeTab === "salary" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {[2023, 2024, 2025].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                {/* <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <Check size={20} />
                  Thanh toán tất cả
                </button> */}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Nhân viên
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Chức vụ
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Lương CB
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Phụ cấp
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Ngày công
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Thưởng
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-orange-50">
                        Bảo hiểm
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-green-50">
                        Thực lãnh
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salaryData.map((row, index) => (
                      <tr key={row.employeeId} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {row.employeeName}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {row.position}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900">
                          {row.baseSalary.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-green-600">
                          +{row.allowance.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-sm text-center text-gray-600">
                          {row.workDays}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-blue-600">
                          +{row.bonus.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-orange-600 bg-orange-50">
                          -{row.insurance.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-sm text-right font-bold text-green-600 bg-green-50">
                          {row.netSalary.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              row.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {row.status === "paid" ? "Đã trả" : "Chờ trả"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={3} className="px-4 py-3 text-right">
                        Tổng cộng:
                      </td>
                      <td className="px-4 py-3 text-right">
                        {salaryData
                          .reduce((s, r) => s + r.baseSalary, 0)
                          .toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        +
                        {salaryData
                          .reduce((s, r) => s + r.allowance, 0)
                          .toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-center">-</td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        +
                        {salaryData
                          .reduce((s, r) => s + r.bonus, 0)
                          .toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600 bg-orange-100">
                        -{totalInsurance.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right text-green-700 bg-green-100">
                        {totalSalary.toLocaleString("vi-VN")}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

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
                    formErrors.name
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Nhập họ và tên"
                  disabled={isAdding}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    Họ và tên là bắt buộc
                  </p>
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
                    setNewEmployee({
                      ...newEmployee,
                      position: e.target.value,
                    });
                    setFormErrors({ ...formErrors, position: false });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.position
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Nhập công việc"
                  disabled={isAdding}
                />
                {formErrors.position && (
                  <p className="text-red-500 text-xs mt-1">
                    Công việc là bắt buộc
                  </p>
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
                    const value = e.target.value.replace(/\D/g, ""); // Chỉ cho phép số
                    if (value.length <= 10) {
                      setNewEmployee({ ...newEmployee, phone: value });
                      setFormErrors({ ...formErrors, phone: false });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.phone
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Nhập 10 chữ số"
                  maxLength={10}
                  disabled={isAdding}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    Số điện thoại phải đủ 10 chữ số
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={newEmployee.birthday}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, birthday: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isAdding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CCCD (12 số)
                </label>
                <input
                  type="text"
                  value={newEmployee.cccd}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Chỉ cho phép số
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={newEmployee.address}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, address: e.target.value })
                  }
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

      {/* Slide Panel xem thông tin nhân viên */}
      {showViewModal && selectedEmployee && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowViewModal(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Thông tin nhân viên
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Employee Avatar & Name */}
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
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedEmployee.name}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {selectedEmployee.position}
                  </span>
                </div>
              </div>

              {/* Employee Details */}
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
                        ? new Date(
                            selectedEmployee.birthday
                          ).toLocaleDateString("vi-VN")
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

              {/* Actions */}
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
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowEditModal(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Chỉnh sửa thông tin
                </h3>
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
                    onChange={(e) =>
                      setEditEmployee({ ...editEmployee, name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setEditEmployee({
                        ...editEmployee,
                        position: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setEditEmployee({
                        ...editEmployee,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={editEmployee.birthday}
                    onChange={(e) =>
                      setEditEmployee({
                        ...editEmployee,
                        birthday: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CCCD
                  </label>
                  <input
                    type="text"
                    value={editEmployee.cccd}
                    onChange={(e) =>
                      setEditEmployee({ ...editEmployee, cccd: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số CCCD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={editEmployee.address}
                    onChange={(e) =>
                      setEditEmployee({
                        ...editEmployee,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>

              {/* Actions */}
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
        </Portal>
      )}
    </div>
  );
}
