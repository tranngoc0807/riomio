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
  Camera,
  MapPin,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Portal from "@/components/Portal";
import Image from "next/image";

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
    "Partten": "from-cyan-500 to-cyan-600",
    "May mẫu": "from-teal-500 to-teal-600",
    "Sale sỉ": "from-indigo-500 to-indigo-600",
    "Sale sàn": "from-rose-500 to-rose-600",
    "Tổng hợp": "from-amber-500 to-amber-600",
    "Hình ảnh": "from-violet-500 to-violet-600",
  };
  return colors[position] || "from-gray-500 to-gray-600";
};

// Dữ liệu nhân viên mẫu
const initialEmployees = [
  { id: 1, name: "Lê Thị Thanh Thảo", position: "Partten", phone: "0901234567", birthday: "1990-05-15", cccd: "001090012345", address: "Hoàng Mai, Hà Nội", avatar: "" },
  { id: 2, name: "Trần Thị Quý", position: "May mẫu", phone: "0912345678", birthday: "1988-08-20", cccd: "001088023456", address: "Thanh Xuân, Hà Nội", avatar: "" },
  { id: 3, name: "Nguyễn Thị Thuệ", position: "Thiết kế", phone: "0923456789", birthday: "1992-03-10", cccd: "001092034567", address: "Cầu Giấy, Hà Nội", avatar: "" },
  { id: 4, name: "Dương Thị Bích", position: "Quản lý đơn hàng", phone: "0934567890", birthday: "1991-07-25", cccd: "001091045678", address: "Hà Đông, Hà Nội", avatar: "" },
  { id: 5, name: "Trịnh Thị Hồng", position: "Kế toán", phone: "0945678901", birthday: "1989-11-30", cccd: "001089056789", address: "Long Biên, Hà Nội", avatar: "" },
  { id: 6, name: "Hà Bình", position: "Tổng hợp", phone: "0956789012", birthday: "1993-01-18", cccd: "001093067890", address: "Đống Đa, Hà Nội", avatar: "" },
  { id: 7, name: "Hoàng Việt", position: "Giám đốc", phone: "0967890123", birthday: "1985-04-05", cccd: "001085078901", address: "Ba Đình, Hà Nội", avatar: "" },
  { id: 8, name: "Nguyễn Thị Thu", position: "Thủ kho", phone: "0978901234", birthday: "1994-09-12", cccd: "001094089012", address: "Gia Lâm, Hà Nội", avatar: "" },
  { id: 9, name: "Phạm Hoài Phước", position: "Sale sỉ", phone: "0989012345", birthday: "1990-12-08", cccd: "001090090123", address: "Hai Bà Trưng, Hà Nội", avatar: "" },
  { id: 10, name: "Nguyễn Văn Toàn", position: "Thủ kho", phone: "0990123456", birthday: "1991-06-22", cccd: "001091101234", address: "Nam Từ Liêm, Hà Nội", avatar: "" },
  { id: 11, name: "Đỗ Thị Hương Giang", position: "Sale sàn", phone: "0901234568", birthday: "1995-02-14", cccd: "001095112345", address: "Bắc Từ Liêm, Hà Nội", avatar: "" },
  { id: 12, name: "Văn Đức", position: "Hình ảnh", phone: "0912345679", birthday: "1992-10-28", cccd: "001092123456", address: "Tây Hồ, Hà Nội", avatar: "" },
];

// Generate attendance data
const generateAttendanceData = (employees: typeof initialEmployees, year: number, month: number): AttendanceRecord[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  return employees.map(emp => ({
    employeeId: emp.id,
    employeeName: emp.name,
    attendance: Array.from({ length: daysInMonth }, (_, i): AttendanceStatus => {
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
      const isToday = year === currentYear && month === currentMonth && day === currentDay;
      if (isToday) return "absent"; // Chưa chấm, mặc định vắng để user tự tích

      // Ngày trong quá khứ - dữ liệu mẫu
      return Math.random() > 0.1 ? "present" : "absent";
    })
  }));
};

// Generate salary data
const generateSalaryData = (employees: typeof initialEmployees) => {
  return employees.map(emp => {
    const baseSalary = emp.position === "Giám đốc" ? 25000000 :
                       emp.position === "Kế toán" ? 12000000 :
                       emp.position === "Quản lý đơn hàng" ? 10000000 :
                       emp.position.includes("Sale") ? 8000000 :
                       emp.position === "Thiết kế" ? 10000000 :
                       7000000;
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
      status: Math.random() > 0.3 ? "paid" : "pending"
    };
  });
};

export default function LuongBaoHiem() {
  // Lấy ngày hiện tại
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [activeTab, setActiveTab] = useState<"employees" | "attendance" | "salary">("employees");
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof initialEmployees[0] | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: "", position: "", phone: "", birthday: "", cccd: "", address: "", avatar: ""
  });
  const [editEmployee, setEditEmployee] = useState({
    id: 0, name: "", position: "", phone: "", birthday: "", cccd: "", address: "", avatar: ""
  });

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // State để lưu dữ liệu chấm công
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Kiểm tra có phải tháng/năm hiện tại không
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  // Khởi tạo dữ liệu chấm công khi thay đổi tháng/năm hoặc danh sách nhân viên
  useEffect(() => {
    setAttendanceData(generateAttendanceData(employees, selectedYear, selectedMonth));
  }, [employees, selectedYear, selectedMonth]);

  // Hàm toggle trạng thái chấm công
  const handleToggleAttendance = (employeeId: number, dayIndex: number) => {
    setAttendanceData(prev => prev.map(record => {
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
    }));
  };

  // Hàm chấm công tất cả nhân viên hôm nay là "có mặt"
  const handleMarkAllPresentToday = () => {
    if (!isCurrentMonth) return;
    const todayIndex = currentDay - 1;
    setAttendanceData(prev => prev.map(record => {
      const newAttendance = [...record.attendance];
      newAttendance[todayIndex] = "present";
      return { ...record, attendance: newAttendance };
    }));
  };

  // Hàm chấm công tất cả nhân viên hôm nay là "vắng"
  const handleMarkAllAbsentToday = () => {
    if (!isCurrentMonth) return;
    const todayIndex = currentDay - 1;
    setAttendanceData(prev => prev.map(record => {
      const newAttendance = [...record.attendance];
      newAttendance[todayIndex] = "absent";
      return { ...record, attendance: newAttendance };
    }));
  };

  const salaryData = generateSalaryData(employees);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = () => {
    if (newEmployee.name && newEmployee.position) {
      setEmployees([...employees, {
        id: employees.length + 1,
        ...newEmployee
      }]);
      setNewEmployee({ name: "", position: "", phone: "", birthday: "", cccd: "", address: "", avatar: "" });
      setShowAddModal(false);
    }
  };

  const handleDeleteEmployee = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const handleViewEmployee = (emp: typeof initialEmployees[0]) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const handleOpenEditModal = (emp: typeof initialEmployees[0]) => {
    setEditEmployee({ ...emp });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editEmployee.name && editEmployee.position) {
      setEmployees(employees.map(emp =>
        emp.id === editEmployee.id ? editEmployee : emp
      ));
      setShowEditModal(false);
    }
  };

  const totalSalary = salaryData.reduce((sum, s) => sum + s.netSalary, 0);
  const totalInsurance = salaryData.reduce((sum, s) => sum + s.insurance, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lương & Bảo hiểm</h1>
          <p className="text-gray-600 mt-1">Quản lý nhân viên, chấm công và bảng lương</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
          <Download size={20} />
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng nhân viên</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
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
              <p className="text-2xl font-bold text-green-600">{(totalSalary / 1000000).toFixed(1)}M</p>
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
              <p className="text-2xl font-bold text-orange-600">{(totalInsurance / 1000000).toFixed(1)}M</p>
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
                {salaryData.filter(s => s.status === "paid").length}/{salaryData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                            {/* Avatar */}
                            {emp.avatar ? (
                              <Image
                                src={emp.avatar}
                                alt={emp.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(emp.position)} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
                                {getInitials(emp.name)}
                              </div>
                            )}
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
                          {emp.birthday ? new Date(emp.birthday).toLocaleDateString("vi-VN") : "-"}
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
                        <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {[2023, 2024, 2025].map(year => (
                        <option key={year} value={year}>{year}</option>
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
                      <p className="text-sm text-green-700">Click vào ô để thay đổi trạng thái: Có mặt → Đi muộn → Vắng → Nghỉ</p>
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
                        const date = new Date(selectedYear, selectedMonth - 1, day);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const isToday = isCurrentMonth && day === currentDay;
                        const isFutureDay =
                          selectedYear > currentYear ||
                          (selectedYear === currentYear && selectedMonth > currentMonth) ||
                          (selectedYear === currentYear && selectedMonth === currentMonth && day > currentDay);
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
                      <th className="px-3 py-2 text-center font-medium text-gray-500 bg-blue-50">Tổng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceData.map((row) => {
                      const totalPresent = row.attendance.filter(a => a === "present").length;
                      const totalLate = row.attendance.filter(a => a === "late").length;
                      const totalWorking = totalPresent + totalLate;
                      return (
                        <tr key={row.employeeId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white">
                            {row.employeeName}
                          </td>
                          {row.attendance.map((status, i) => {
                            const day = i + 1;
                            const isToday = isCurrentMonth && day === currentDay;
                            const isFuture = status === "future";
                            return (
                              <td
                                key={i}
                                className={`px-1 py-2 text-center ${isToday ? "bg-blue-100" : isFuture ? "bg-gray-50" : ""}`}
                              >
                                {isFuture ? (
                                  <div
                                    className="w-6 h-6 mx-auto rounded bg-gray-100 border border-dashed border-gray-300 cursor-not-allowed"
                                    title="Ngày chưa đến - không thể chấm công"
                                  />
                                ) : (
                                  <div
                                    onClick={() => isEditingAttendance && handleToggleAttendance(row.employeeId, i)}
                                    className={`w-6 h-6 mx-auto rounded transition-all ${
                                      isEditingAttendance
                                        ? "cursor-pointer hover:scale-110 hover:shadow-md"
                                        : "cursor-default"
                                    } ${
                                      status === "present"
                                        ? isEditingAttendance ? "bg-green-500 hover:bg-green-600" : "bg-green-500"
                                        : status === "late"
                                        ? isEditingAttendance ? "bg-yellow-500 hover:bg-yellow-600" : "bg-yellow-500"
                                        : status === "absent"
                                        ? isEditingAttendance ? "bg-red-500 hover:bg-red-600" : "bg-red-500"
                                        : isEditingAttendance ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-200"
                                    } ${isToday ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                                    title={`${status === "present" ? "Có mặt" : status === "late" ? "Đi muộn" : status === "absent" ? "Vắng" : "Nghỉ"}${isEditingAttendance ? " - Click để thay đổi" : ""}`}
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center font-semibold bg-blue-50">
                            <span className="text-blue-600">{totalWorking}</span>
                            {totalLate > 0 && (
                              <span className="text-yellow-600 text-xs ml-1">({totalLate})</span>
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
                      <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {[2023, 2024, 2025].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <Check size={20} />
                  Thanh toán tất cả
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">STT</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nhân viên</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Chức vụ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Lương CB</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Phụ cấp</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Ngày công</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Thưởng</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-orange-50">Bảo hiểm</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-green-50">Thực lãnh</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salaryData.map((row, index) => (
                      <tr key={row.employeeId} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-900">{row.employeeName}</p>
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
                      <td colSpan={3} className="px-4 py-3 text-right">Tổng cộng:</td>
                      <td className="px-4 py-3 text-right">
                        {salaryData.reduce((s, r) => s + r.baseSalary, 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        +{salaryData.reduce((s, r) => s + r.allowance, 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-center">-</td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        +{salaryData.reduce((s, r) => s + r.bonus, 0).toLocaleString("vi-VN")}
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
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                <div className="relative">
                  {newEmployee.avatar ? (
                    <Image
                      src={newEmployee.avatar}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                      <Users className="text-white" size={32} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                  >
                    <Camera size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewEmployee({ ...newEmployee, avatar: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Công việc *</label>
                <input
                  type="text"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập công việc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={newEmployee.birthday}
                  onChange={(e) => setNewEmployee({ ...newEmployee, birthday: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CCCD</label>
                <input
                  type="text"
                  value={newEmployee.cccd}
                  onChange={(e) => setNewEmployee({ ...newEmployee, cccd: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số CCCD"
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
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddEmployee}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thêm
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
                <h3 className="text-xl font-bold text-gray-900">Thông tin nhân viên</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Employee Avatar & Name */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                {selectedEmployee.avatar ? (
                  <Image
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover shadow-lg"
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(selectedEmployee.position)} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-2xl">{getInitials(selectedEmployee.name)}</span>
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</p>
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
                    <p className="font-semibold text-gray-900">{selectedEmployee.phone || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Cake className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày sinh</p>
                    <p className="font-semibold text-gray-900">
                      {selectedEmployee.birthday ? new Date(selectedEmployee.birthday).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <CreditCard className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số CCCD</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.cccd || "Chưa cập nhật"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="font-semibold text-gray-900">{selectedEmployee.address || "Chưa cập nhật"}</p>
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
                <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa thông tin</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                  <div className="relative">
                    {editEmployee.avatar ? (
                      <Image
                        src={editEmployee.avatar}
                        alt="Avatar"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(editEmployee.position)} flex items-center justify-center`}>
                        <span className="text-white font-bold text-xl">{getInitials(editEmployee.name || "NV")}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                    >
                      <Camera size={14} />
                    </button>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditEmployee({ ...editEmployee, avatar: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={editEmployee.name}
                    onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Công việc *</label>
                  <input
                    type="text"
                    value={editEmployee.position}
                    onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập công việc"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
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

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
