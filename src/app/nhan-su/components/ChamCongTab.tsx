"use client";

import { Clock, Calendar, FileText, AlertCircle, RefreshCw, Loader2, X, Edit3, Plus, Save, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface ChamCongItem {
  id: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  nhanVien: string;
  days: (number | string)[];
  congThang: number;
  phepThang: number;
  phepSuDung: number;
  phepTon: number;
  nghiLeTinhCong: number;
  tongCong: number;
  thang: number;
  nam: number;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
}

interface EmployeeAttendance {
  employeeId: number;
  hoTen: string;
  days: (number | string)[];
  phepThang: number;
  phepSuDung: number;
  phepTon: number;
  nghiLeTinhCong: number;
  expanded: boolean;
}

interface NewChamCongForm {
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  employees: EmployeeAttendance[];
}

type SubTabType = "cham-cong-thang" | "di-muon" | "them-gio" | "nghi-phep";

const SUB_TABS = [
  { id: "cham-cong-thang" as SubTabType, label: "Chấm công tháng", icon: Calendar },
  { id: "di-muon" as SubTabType, label: "Chấm công đi muộn", icon: AlertCircle },
  { id: "them-gio" as SubTabType, label: "Chấm công thêm giờ", icon: Clock },
  { id: "nghi-phep" as SubTabType, label: "Nghỉ phép", icon: FileText },
];

const ATTENDANCE_OPTIONS = [
  { value: 1, label: "1", color: "bg-green-500", desc: "Đủ công" },
  { value: 0.5, label: "0.5", color: "bg-yellow-500", desc: "Nửa ngày" },
  { value: "NP", label: "NP", color: "bg-red-500", desc: "Nghỉ phép" },
  { value: "NL", label: "NL", color: "bg-orange-500", desc: "Nghỉ làm" },
  { value: "", label: "-", color: "bg-gray-400", desc: "Trống" },
];

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

const getCellStyle = (value: number | string) => {
  if (value === 1) return "bg-green-100 text-green-800";
  if (value === 0.5) return "bg-yellow-100 text-yellow-800";
  if (value === "NP") return "bg-red-100 text-red-800";
  if (value === "NL") return "bg-orange-100 text-orange-800";
  if (value === "" || value === undefined) return "bg-gray-50 text-gray-400";
  return "bg-gray-100 text-gray-600";
};

const generatePCCCode = (month: number, year: number) => {
  const monthStr = month.toString().padStart(2, "0");
  const yearStr = year.toString().slice(-2);
  return `PCC${monthStr}/${yearStr}`;
};

const formatDateForInput = (day: number, month: number, year: number) => {
  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
};

export default function ChamCongTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("cham-cong-thang");
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [chamCongData, setChamCongData] = useState<ChamCongItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Employee list for selection
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: number; dayIndex: number } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Employee detail modal state
  const [selectedEmployee, setSelectedEmployee] = useState<ChamCongItem | null>(null);

  // Create PCC modal state
  const [showCreatePCC, setShowCreatePCC] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1); // Step 1: Select employees, Step 2: Fill attendance
  const [newForm, setNewForm] = useState<NewChamCongForm>({
    ngayBatDau: "",
    ngayKetThuc: "",
    maPhieu: "",
    employees: [],
  });

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Fetch employee list
  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      if (data.success) {
        setEmployeeList(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Initialize form when opening modal
  const initializeNewForm = () => {
    setNewForm({
      ngayBatDau: formatDateForInput(1, selectedMonth, selectedYear),
      ngayKetThuc: formatDateForInput(daysInMonth, selectedMonth, selectedYear),
      maPhieu: generatePCCCode(selectedMonth, selectedYear),
      employees: [],
    });
    setFormStep(1);
    fetchEmployees();
  };

  // Add employee to form
  const addEmployeeToForm = (emp: Employee) => {
    if (newForm.employees.some((e) => e.employeeId === emp.id)) {
      // Remove if already added
      setNewForm((prev) => ({
        ...prev,
        employees: prev.employees.filter((e) => e.employeeId !== emp.id),
      }));
    } else {
      // Add new employee with empty days
      setNewForm((prev) => ({
        ...prev,
        employees: [
          ...prev.employees,
          {
            employeeId: emp.id,
            hoTen: emp.name || "Không tên",
            days: Array(31).fill(""),
            phepThang: 1,
            phepSuDung: 0,
            phepTon: 0,
            nghiLeTinhCong: 0,
            expanded: true,
          },
        ],
      }));
    }
  };

  // Toggle employee expansion
  const toggleEmployeeExpansion = (employeeId: number) => {
    setNewForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.employeeId === employeeId ? { ...e, expanded: !e.expanded } : e
      ),
    }));
  };

  // Update employee day value
  const updateEmployeeDay = (employeeId: number, dayIndex: number, value: number | string) => {
    setNewForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => {
        if (e.employeeId === employeeId) {
          const newDays = [...e.days];
          newDays[dayIndex] = value;
          return { ...e, days: newDays };
        }
        return e;
      }),
    }));
  };

  // Fill all days for one employee
  const fillAllDaysForEmployee = (employeeId: number, value: number | string) => {
    setNewForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => {
        if (e.employeeId === employeeId) {
          return {
            ...e,
            days: Array(31).fill("").map((_, i) => (i < daysInMonth ? value : "")),
          };
        }
        return e;
      }),
    }));
  };

  // Update summary field for one employee
  const updateEmployeeSummary = (employeeId: number, field: keyof Pick<EmployeeAttendance, 'phepThang' | 'phepSuDung' | 'phepTon' | 'nghiLeTinhCong'>, value: number) => {
    setNewForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => {
        if (e.employeeId === employeeId) {
          return { ...e, [field]: value };
        }
        return e;
      }),
    }));
  };

  // Calculate congThang (sum of attendance days)
  const calculateCongThang = (days: (number | string)[]): number => {
    return days.reduce((sum: number, day) => {
      if (day === 1) return sum + 1;
      if (day === 0.5) return sum + 0.5;
      return sum;
    }, 0);
  };

  // Calculate tongCong
  const calculateTongCong = (emp: EmployeeAttendance): number => {
    const congThang = calculateCongThang(emp.days);
    return congThang + emp.nghiLeTinhCong;
  };

  // Fetch attendance data
  const fetchChamCong = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cham-cong?thang=${selectedMonth}&nam=${selectedYear}`);
      const data = await response.json();

      if (data.success) {
        setChamCongData(data.data);
        if (data.data.length === 0) {
          toast("Không có dữ liệu cho tháng " + selectedMonth + "/" + selectedYear, { icon: "ℹ️" });
        }
      } else {
        toast.error(data.error || "Không thể tải dữ liệu chấm công");
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Lỗi khi tải dữ liệu chấm công");
    } finally {
      setIsLoading(false);
    }
  };

  // Save new attendance records
  const handleSaveNewRecord = async () => {
    if (newForm.employees.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nhân viên");
      return;
    }

    setIsSaving(true);
    try {
      const records = newForm.employees.map((emp) => ({
        ngayBatDau: newForm.ngayBatDau,
        ngayKetThuc: newForm.ngayKetThuc,
        maPhieu: newForm.maPhieu,
        nhanVien: emp.hoTen,
        days: emp.days,
        congThang: calculateCongThang(emp.days),
        phepThang: emp.phepThang,
        phepSuDung: emp.phepSuDung,
        phepTon: emp.phepTon,
        nghiLeTinhCong: emp.nghiLeTinhCong,
        tongCong: calculateTongCong(emp),
        thang: selectedMonth,
        nam: selectedYear,
      }));

      const response = await fetch("/api/cham-cong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: records }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Đã tạo phiếu chấm công cho ${newForm.employees.length} nhân viên!`);
        setShowCreatePCC(false);
        fetchChamCong();
      } else {
        toast.error(data.error || "Không thể tạo phiếu chấm công");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Lỗi khi tạo phiếu chấm công");
    } finally {
      setIsSaving(false);
    }
  };

  // Update attendance cell (for existing records)
  const handleUpdateCell = async (item: ChamCongItem, dayIndex: number, newValue: number | string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/cham-cong", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowNumber: item.id,
          dayIndex: dayIndex,
          value: newValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChamCongData((prev) =>
          prev.map((row) => {
            if (row.id === item.id) {
              const newDays = [...row.days];
              newDays[dayIndex] = newValue;
              return { ...row, days: newDays };
            }
            return row;
          })
        );
        toast.success(`Đã cập nhật ngày ${dayIndex + 1}`);
      } else {
        toast.error(data.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error updating cell:", error);
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsUpdating(false);
      setEditingCell(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingCell(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchChamCong();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    setIsEditMode(false);
    setEditingCell(null);
  }, [selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Chấm công nhân viên</h2>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
          {chamCongData.length} nhân viên
        </span>
      </div>

      {/* Sub-tabs navigation */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month/Year selector and actions */}
      <div className="flex items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Năm:</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)}
              min="2020"
              max="2030"
              className="px-3 py-2 border border-gray-300 rounded-lg w-24 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchChamCong}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            Làm mới
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              initializeNewForm();
              setShowCreatePCC(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={18} />
            Tạo phiếu chấm công
          </button>

          {chamCongData.length > 0 && (
            <button
              onClick={() => {
                setIsEditMode(!isEditMode);
                setEditingCell(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isEditMode
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Edit3 size={18} />
              {isEditMode ? "Thoát chỉnh sửa" : "Chỉnh sửa"}
            </button>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
          <Edit3 size={18} className="text-orange-600" />
          <span className="text-orange-700 font-medium">Chế độ chỉnh sửa đang bật</span>
          <span className="text-orange-600 text-sm">- Click vào ô để sửa</span>
        </div>
      )}

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {activeSubTab === "cham-cong-thang" && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-500">Đang tải...</span>
              </div>
            ) : chamCongData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
                <p>Bảng chấm công tháng {selectedMonth}/{selectedYear}</p>
                <p className="text-sm mt-2">Chưa có dữ liệu</p>
                <button
                  onClick={() => {
                    initializeNewForm();
                    setShowCreatePCC(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus size={18} />
                  Tạo phiếu chấm công
                </button>
              </div>
            ) : (
              <div className="overflow-auto max-h-[70vh]">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-20 border-r min-w-[40px]">
                        STT
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-[40px] bg-gray-50 z-20 border-r min-w-[160px]">
                        Nhân viên
                      </th>
                      {Array.from({ length: daysInMonth }, (_, i) => (
                        <th key={i + 1} className="px-0 py-3 text-center text-xs font-medium text-gray-500 min-w-[36px] border-l border-gray-100">
                          {i + 1}
                        </th>
                      ))}
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-blue-600 min-w-[60px] border-l">Công tháng</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-green-600 min-w-[60px]">Phép tháng</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-orange-600 min-w-[60px]">Phép SD</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-yellow-600 min-w-[60px]">Phép tồn</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-pink-600 min-w-[60px]">Nghỉ lễ</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-purple-600 min-w-[60px]">Tổng công</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {chamCongData.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-2 py-2 text-center text-gray-600 sticky left-0 bg-white z-10 border-r">{index + 1}</td>
                        <td className="px-2 py-2 font-medium text-gray-900 sticky left-[40px] bg-white z-10 border-r">
                          <button
                            onClick={() => setSelectedEmployee(item)}
                            className="flex items-center gap-2 hover:bg-blue-50 rounded-lg p-1 -m-1 w-full text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                {item.nhanVien?.split(" ").slice(-1)[0]?.[0] || "?"}
                              </span>
                            </div>
                            <span className="truncate hover:text-blue-600">{item.nhanVien}</span>
                          </button>
                        </td>
                        {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                          const dayValue = item.days[dayIdx];
                          const isEditing = editingCell?.rowId === item.id && editingCell?.dayIndex === dayIdx;

                          return (
                            <td key={dayIdx} className="px-0 py-1 text-center relative border-l border-gray-100">
                              {isEditMode ? (
                                <button
                                  onClick={() => setEditingCell({ rowId: item.id, dayIndex: dayIdx })}
                                  disabled={isUpdating}
                                  className={`w-8 h-8 rounded text-xs font-semibold cursor-pointer hover:opacity-80 ${getCellStyle(dayValue)}`}
                                >
                                  {dayValue === 1 ? "1" : dayValue === 0.5 ? "0.5" : dayValue || "-"}
                                </button>
                              ) : (
                                <span className={`w-8 h-8 rounded text-xs font-semibold inline-flex items-center justify-center ${getCellStyle(dayValue)}`}>
                                  {dayValue === 1 ? "1" : dayValue === 0.5 ? "0.5" : dayValue || "-"}
                                </span>
                              )}

                              {isEditing && isEditMode && (
                                <div ref={dropdownRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-xl border z-50 p-2">
                                  <div className="flex gap-1">
                                    {ATTENDANCE_OPTIONS.map((opt) => (
                                      <button
                                        key={String(opt.value)}
                                        onClick={() => handleUpdateCell(item, dayIdx, opt.value)}
                                        disabled={isUpdating}
                                        className={`w-10 h-10 rounded-lg text-white font-bold text-sm ${opt.color} hover:opacity-80`}
                                        title={opt.desc}
                                      >
                                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center font-bold text-white bg-blue-600 border-l">{item.congThang}</td>
                        <td className="px-2 py-2 text-center font-bold text-white bg-green-600">{item.phepThang}</td>
                        <td className="px-2 py-2 text-center font-bold text-white bg-orange-600">{item.phepSuDung}</td>
                        <td className="px-2 py-2 text-center font-bold text-white bg-yellow-600">{item.phepTon}</td>
                        <td className="px-2 py-2 text-center font-bold text-white bg-pink-600">{item.nghiLeTinhCong}</td>
                        <td className="px-2 py-2 text-center font-bold text-white bg-purple-600">{item.tongCong}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {chamCongData.length > 0 && (
              <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-4 text-sm">
                <span className="text-gray-600 font-medium">Chú thích:</span>
                {ATTENDANCE_OPTIONS.slice(0, 4).map((opt) => (
                  <div key={String(opt.value)} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded ${opt.color.replace("-500", "-100")} ${opt.color.replace("bg-", "text-").replace("-500", "-800")} flex items-center justify-center text-xs font-bold`}>
                      {opt.label}
                    </span>
                    <span className="text-gray-600">{opt.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeSubTab !== "cham-cong-thang" && (
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Chức năng đang phát triển</p>
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedEmployee.nhanVien?.split(" ").slice(-1)[0]?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedEmployee.nhanVien}</h3>
                  <p className="text-blue-100 text-sm">Tháng {selectedMonth}/{selectedYear}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-blue-600 text-sm">Công tháng</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedEmployee.congThang}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-green-600 text-sm">Phép tháng</p>
                  <p className="text-2xl font-bold text-green-700">{selectedEmployee.phepThang}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-orange-600 text-sm">Phép sử dụng</p>
                  <p className="text-2xl font-bold text-orange-700">{selectedEmployee.phepSuDung}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-yellow-600 text-sm">Phép tồn</p>
                  <p className="text-2xl font-bold text-yellow-700">{selectedEmployee.phepTon}</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 text-center">
                  <p className="text-pink-600 text-sm">Nghỉ lễ</p>
                  <p className="text-2xl font-bold text-pink-700">{selectedEmployee.nghiLeTinhCong}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-purple-600 text-sm">Tổng công</p>
                  <p className="text-2xl font-bold text-purple-700">{selectedEmployee.tongCong}</p>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b font-semibold text-gray-700">Chi tiết theo ngày</div>
                <div className="p-4 grid grid-cols-7 gap-2">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
                  ))}
                  {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <div key={i + 1} className={`aspect-square rounded-lg flex flex-col items-center justify-center ${getCellStyle(selectedEmployee.days[i])}`}>
                      <span className="text-xs text-gray-500">{i + 1}</span>
                      <span className="font-bold text-sm">{selectedEmployee.days[i] === 1 ? "1" : selectedEmployee.days[i] === 0.5 ? "0.5" : selectedEmployee.days[i] || "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create PCC Modal */}
      {showCreatePCC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tạo phiếu chấm công mới</h3>
                  <p className="text-green-100 text-sm">
                    {formStep === 1 ? "Bước 1: Chọn nhân viên" : "Bước 2: Điền chấm công"} - Tháng {selectedMonth}/{selectedYear}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCreatePCC(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(95vh-150px)]">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="text"
                    value={newForm.ngayBatDau}
                    onChange={(e) => setNewForm({ ...newForm, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={newForm.ngayKetThuc}
                    onChange={(e) => setNewForm({ ...newForm, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={newForm.maPhieu}
                    onChange={(e) => setNewForm({ ...newForm, maPhieu: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {formStep === 1 ? (
                /* Step 1: Select employees */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      <Users size={16} className="inline mr-2" />
                      Chọn nhân viên <span className="text-green-600">({newForm.employees.length} đã chọn)</span>
                    </label>
                  </div>

                  {isLoadingEmployees ? (
                    <div className="flex items-center justify-center py-8 border rounded-lg">
                      <Loader2 className="animate-spin mr-2" size={20} />
                      <span className="text-gray-500">Đang tải...</span>
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-[400px] overflow-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0">
                        {employeeList.map((emp) => {
                          const isSelected = newForm.employees.some((e) => e.employeeId === emp.id);
                          return (
                            <label
                              key={emp.id}
                              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b md:border-r ${
                                isSelected ? "bg-green-50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => addEmployeeToForm(emp)}
                                className="w-5 h-5 text-green-600 rounded"
                              />
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                  {emp.name?.split(" ").slice(-1)[0]?.[0] || "?"}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{emp.name || "Không tên"}</p>
                                <p className="text-xs text-gray-500 truncate">{emp.position || emp.department || ""}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Step 2: Fill attendance for each employee */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <span>Chú thích:</span>
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <span key={String(opt.value)} className={`px-2 py-1 rounded text-white text-xs ${opt.color}`}>
                        {opt.label} = {opt.desc}
                      </span>
                    ))}
                  </div>

                  {newForm.employees.map((emp) => (
                    <div key={emp.employeeId} className="border rounded-lg overflow-hidden">
                      {/* Employee header */}
                      <div
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleEmployeeExpansion(emp.employeeId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {emp.hoTen?.split(" ").slice(-1)[0]?.[0] || "?"}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{emp.hoTen}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Quick fill buttons */}
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            {ATTENDANCE_OPTIONS.slice(0, 4).map((opt) => (
                              <button
                                key={String(opt.value)}
                                onClick={() => fillAllDaysForEmployee(emp.employeeId, opt.value)}
                                className={`px-2 py-1 rounded text-white text-xs ${opt.color} hover:opacity-80`}
                                title={`Điền tất cả: ${opt.desc}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {emp.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Days grid and summary fields */}
                      {emp.expanded && (
                        <div className="p-3 space-y-4">
                          {/* Days grid */}
                          <div className="grid grid-cols-8 md:grid-cols-11 lg:grid-cols-16 gap-1">
                            {Array.from({ length: daysInMonth }, (_, i) => (
                              <div key={i} className="text-center">
                                <p className="text-[10px] text-gray-500 mb-1">{i + 1}</p>
                                <select
                                  value={String(emp.days[i])}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "1") updateEmployeeDay(emp.employeeId, i, 1);
                                    else if (val === "0.5") updateEmployeeDay(emp.employeeId, i, 0.5);
                                    else if (val === "NP" || val === "NL") updateEmployeeDay(emp.employeeId, i, val);
                                    else updateEmployeeDay(emp.employeeId, i, "");
                                  }}
                                  className={`w-full px-0 py-1 text-center text-xs font-semibold rounded border ${getCellStyle(emp.days[i])} focus:ring-1 focus:ring-green-500`}
                                >
                                  <option value="">-</option>
                                  <option value="1">1</option>
                                  <option value="0.5">0.5</option>
                                  <option value="NP">NP</option>
                                  <option value="NL">NL</option>
                                </select>
                              </div>
                            ))}
                          </div>

                          {/* Summary fields */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t">
                            <div className="bg-blue-50 rounded-lg p-2">
                              <label className="block text-xs text-blue-600 mb-1">Công tháng</label>
                              <div className="text-lg font-bold text-blue-700">{calculateCongThang(emp.days)}</div>
                            </div>
                            <div>
                              <label className="block text-xs text-green-600 mb-1">Phép tháng</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={emp.phepThang}
                                onChange={(e) => updateEmployeeSummary(emp.employeeId, 'phepThang', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-center font-semibold bg-green-50 focus:ring-1 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-orange-600 mb-1">Phép sử dụng</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={emp.phepSuDung}
                                onChange={(e) => updateEmployeeSummary(emp.employeeId, 'phepSuDung', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-center font-semibold bg-orange-50 focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-yellow-600 mb-1">Phép tồn</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={emp.phepTon}
                                onChange={(e) => updateEmployeeSummary(emp.employeeId, 'phepTon', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-center font-semibold bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-pink-600 mb-1">Nghỉ lễ tính công</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={emp.nghiLeTinhCong}
                                onChange={(e) => updateEmployeeSummary(emp.employeeId, 'nghiLeTinhCong', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-center font-semibold bg-pink-50 focus:ring-1 focus:ring-pink-500"
                              />
                            </div>
                            <div className="bg-purple-50 rounded-lg p-2">
                              <label className="block text-xs text-purple-600 mb-1">Tổng công</label>
                              <div className="text-lg font-bold text-purple-700">{calculateTongCong(emp)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                {newForm.employees.length > 0 && (
                  <span className="text-green-600 font-medium">
                    {newForm.employees.length} nhân viên được chọn
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {formStep === 2 && (
                  <button
                    onClick={() => setFormStep(1)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                  >
                    Quay lại
                  </button>
                )}
                <button
                  onClick={() => setShowCreatePCC(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                {formStep === 1 ? (
                  <button
                    onClick={() => setFormStep(2)}
                    disabled={newForm.employees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Tiếp tục
                    <ChevronDown size={18} className="rotate-[-90deg]" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveNewRecord}
                    disabled={isSaving || newForm.employees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Lưu phiếu ({newForm.employees.length} NV)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
