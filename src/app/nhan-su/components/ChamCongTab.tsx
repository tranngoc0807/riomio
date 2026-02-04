"use client";

import { Clock, Calendar, FileText, AlertCircle, RefreshCw, Loader2, X, Edit3, Plus, Save, Users, ChevronDown, ChevronUp, Check, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

// Di Muon interfaces
interface DiMuonItem {
  id: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  nhanVien: string;
  days: (number | string)[];
  diMuonPhut: number;
  diMuonNgay: number;
  thang: number;
  nam: number;
}

interface EmployeeDiMuon {
  employeeId: number;
  hoTen: string;
  days: (number | string)[];
  expanded: boolean;
}

interface NewDiMuonForm {
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  employees: EmployeeDiMuon[];
}

// Them Gio interfaces
interface ThemGioItem {
  id: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  nhanVien: string;
  days: (number | string)[];
  themGioPhut: number;
  themGioNgay: number;
  thang: number;
  nam: number;
}

interface EmployeeThemGio {
  employeeId: number;
  hoTen: string;
  days: (number | string)[];
  expanded: boolean;
}

interface NewThemGioForm {
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  employees: EmployeeThemGio[];
}

// Nghi Phep interfaces
interface NghiPhepItem {
  id: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  nhanVien: string;
  phepThang: number;
  suDung: number;
  tonPhep: number;
  thang: number;
  nam: number;
}

interface EmployeeNghiPhep {
  employeeId: number;
  hoTen: string;
  phepThang: number;
  suDung: number;
}

interface NewNghiPhepForm {
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  employees: EmployeeNghiPhep[];
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
  { value: "NL", label: "NL", color: "bg-orange-500", desc: "Nghỉ lễ" },
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

const generatePCMCode = (month: number, year: number) => {
  const monthStr = month.toString().padStart(2, "0");
  const yearStr = year.toString().slice(-2);
  return `PCM${monthStr}/${yearStr}`;
};

const generatePCTCode = (month: number, year: number) => {
  const monthStr = month.toString().padStart(2, "0");
  const yearStr = year.toString().slice(-2);
  return `PCT${monthStr}/${yearStr}`;
};

const generateNPCode = (month: number, year: number) => {
  const monthStr = month.toString().padStart(2, "0");
  const yearStr = year.toString().slice(-2);
  return `NP${monthStr}/${yearStr}`;
};

// Style for late minutes cell
const getDiMuonCellStyle = (value: number | string) => {
  if (value === "" || value === undefined || value === 0) return "bg-gray-50 text-gray-400";
  const numVal = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(numVal) || numVal === 0) return "bg-gray-50 text-gray-400";
  if (numVal <= 15) return "bg-yellow-100 text-yellow-800";
  if (numVal <= 30) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
};

// Style for overtime minutes cell
const getThemGioCellStyle = (value: number | string) => {
  if (value === "" || value === undefined || value === 0) return "bg-gray-50 text-gray-400";
  const numVal = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(numVal) || numVal === 0) return "bg-gray-50 text-gray-400";
  if (numVal <= 60) return "bg-blue-100 text-blue-800";
  if (numVal <= 120) return "bg-green-100 text-green-800";
  return "bg-purple-100 text-purple-800";
};

const formatDateForInput = (day: number, month: number, year: number) => {
  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
};

const VALID_SUB_TABS: SubTabType[] = ["cham-cong-thang", "di-muon", "them-gio", "nghi-phep"];

export default function ChamCongTab() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get sub-tab from URL
  const subTabFromUrl = searchParams.get("subtab") as SubTabType | null;
  const activeSubTab: SubTabType = subTabFromUrl && VALID_SUB_TABS.includes(subTabFromUrl) ? subTabFromUrl : "cham-cong-thang";

  // Handle sub-tab change with URL update
  const handleSubTabChange = (subTab: SubTabType) => {
    router.push(`/nhan-su?tab=cham-cong&subtab=${subTab}`, { scroll: false });
  };

  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(2026);
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

  // Di Muon state
  const [diMuonData, setDiMuonData] = useState<DiMuonItem[]>([]);
  const [isLoadingDiMuon, setIsLoadingDiMuon] = useState(false);
  const [showCreateDiMuon, setShowCreateDiMuon] = useState(false);
  const [diMuonFormStep, setDiMuonFormStep] = useState<1 | 2>(1);
  const [newDiMuonForm, setNewDiMuonForm] = useState<NewDiMuonForm>({
    ngayBatDau: "",
    ngayKetThuc: "",
    maPhieu: "",
    employees: [],
  });
  const [selectedDiMuonEmployee, setSelectedDiMuonEmployee] = useState<DiMuonItem | null>(null);

  // Them Gio state
  const [themGioData, setThemGioData] = useState<ThemGioItem[]>([]);
  const [isLoadingThemGio, setIsLoadingThemGio] = useState(false);
  const [showCreateThemGio, setShowCreateThemGio] = useState(false);
  const [themGioFormStep, setThemGioFormStep] = useState<1 | 2>(1);
  const [newThemGioForm, setNewThemGioForm] = useState<NewThemGioForm>({
    ngayBatDau: "",
    ngayKetThuc: "",
    maPhieu: "",
    employees: [],
  });
  const [selectedThemGioEmployee, setSelectedThemGioEmployee] = useState<ThemGioItem | null>(null);

  // Nghi Phep state
  const [nghiPhepData, setNghiPhepData] = useState<NghiPhepItem[]>([]);
  const [isLoadingNghiPhep, setIsLoadingNghiPhep] = useState(false);
  const [showCreateNghiPhep, setShowCreateNghiPhep] = useState(false);
  const [isEditingNghiPhep, setIsEditingNghiPhep] = useState(false);
  const [newNghiPhepForm, setNewNghiPhepForm] = useState<NewNghiPhepForm>({
    ngayBatDau: "",
    ngayKetThuc: "",
    maPhieu: "",
    employees: [],
  });

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "di-muon" | "them-gio"; item: DiMuonItem | ThemGioItem } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal state
  const [showEditDiMuon, setShowEditDiMuon] = useState(false);
  const [editingDiMuon, setEditingDiMuon] = useState<DiMuonItem | null>(null);
  const [showEditThemGio, setShowEditThemGio] = useState(false);
  const [editingThemGio, setEditingThemGio] = useState<ThemGioItem | null>(null);

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

  // =====================
  // DI MUON FUNCTIONS
  // =====================

  // Fetch late attendance data
  const fetchDiMuon = async () => {
    setIsLoadingDiMuon(true);
    try {
      const response = await fetch(`/api/di-muon?thang=${selectedMonth}&nam=${selectedYear}`);
      const data = await response.json();

      if (data.success) {
        setDiMuonData(data.data);
      } else {
        toast.error(data.error || "Không thể tải dữ liệu đi muộn");
      }
    } catch (error) {
      console.error("Error fetching late attendance:", error);
      toast.error("Lỗi khi tải dữ liệu đi muộn");
    } finally {
      setIsLoadingDiMuon(false);
    }
  };

  // Initialize DiMuon form
  const initializeNewDiMuonForm = () => {
    setNewDiMuonForm({
      ngayBatDau: formatDateForInput(1, selectedMonth, selectedYear),
      ngayKetThuc: formatDateForInput(daysInMonth, selectedMonth, selectedYear),
      maPhieu: generatePCMCode(selectedMonth, selectedYear),
      employees: [],
    });
    setDiMuonFormStep(1);
    fetchEmployees();
  };

  // Add employee to DiMuon form
  const addEmployeeToDiMuonForm = (emp: Employee) => {
    if (newDiMuonForm.employees.some((e) => e.employeeId === emp.id)) {
      setNewDiMuonForm((prev) => ({
        ...prev,
        employees: prev.employees.filter((e) => e.employeeId !== emp.id),
      }));
    } else {
      setNewDiMuonForm((prev) => ({
        ...prev,
        employees: [
          ...prev.employees,
          {
            employeeId: emp.id,
            hoTen: emp.name || "Không tên",
            days: Array(31).fill(""),
            expanded: true,
          },
        ],
      }));
    }
  };

  // Toggle DiMuon employee expansion
  const toggleDiMuonEmployeeExpansion = (employeeId: number) => {
    setNewDiMuonForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.employeeId === employeeId ? { ...e, expanded: !e.expanded } : e
      ),
    }));
  };

  // Update DiMuon employee day value
  const updateDiMuonEmployeeDay = (employeeId: number, dayIndex: number, value: number | string) => {
    setNewDiMuonForm((prev) => ({
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

  // Calculate total late minutes
  const calculateDiMuonPhut = (days: (number | string)[]): number => {
    return days.reduce((sum: number, day) => {
      const numVal = typeof day === "number" ? day : parseFloat(String(day));
      return sum + (isNaN(numVal) ? 0 : numVal);
    }, 0);
  };

  // Calculate late days (1 day = 8 hours = 480 minutes)
  const calculateDiMuonNgay = (phut: number): number => {
    return Math.round((phut / 480) * 100) / 100; // Round to 2 decimal places
  };

  // Save DiMuon records
  const handleSaveDiMuonRecord = async () => {
    if (newDiMuonForm.employees.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nhân viên");
      return;
    }

    setIsSaving(true);
    try {
      const records = newDiMuonForm.employees.map((emp) => {
        const diMuonPhut = calculateDiMuonPhut(emp.days);
        return {
          ngayBatDau: newDiMuonForm.ngayBatDau,
          ngayKetThuc: newDiMuonForm.ngayKetThuc,
          maPhieu: newDiMuonForm.maPhieu,
          nhanVien: emp.hoTen,
          days: emp.days,
          diMuonPhut,
          diMuonNgay: calculateDiMuonNgay(diMuonPhut),
          thang: selectedMonth,
          nam: selectedYear,
        };
      });

      const response = await fetch("/api/di-muon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: records }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Đã tạo phiếu đi muộn cho ${newDiMuonForm.employees.length} nhân viên!`);
        setShowCreateDiMuon(false);
        fetchDiMuon();
      } else {
        toast.error(data.error || "Không thể tạo phiếu đi muộn");
      }
    } catch (error) {
      console.error("Error saving late attendance:", error);
      toast.error("Lỗi khi tạo phiếu đi muộn");
    } finally {
      setIsSaving(false);
    }
  };

  // Update DiMuon cell (for existing records)
  const handleUpdateDiMuonCell = async (item: DiMuonItem, dayIndex: number, newValue: number | string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/di-muon", {
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
        setDiMuonData((prev) =>
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

  // =====================
  // THEM GIO FUNCTIONS
  // =====================

  // Fetch overtime attendance data
  const fetchThemGio = async () => {
    setIsLoadingThemGio(true);
    try {
      const response = await fetch(`/api/them-gio?thang=${selectedMonth}&nam=${selectedYear}`);
      const data = await response.json();

      if (data.success) {
        setThemGioData(data.data);
      } else {
        toast.error(data.error || "Không thể tải dữ liệu thêm giờ");
      }
    } catch (error) {
      console.error("Error fetching overtime attendance:", error);
      toast.error("Lỗi khi tải dữ liệu thêm giờ");
    } finally {
      setIsLoadingThemGio(false);
    }
  };

  // Initialize ThemGio form
  const initializeNewThemGioForm = () => {
    setNewThemGioForm({
      ngayBatDau: formatDateForInput(1, selectedMonth, selectedYear),
      ngayKetThuc: formatDateForInput(daysInMonth, selectedMonth, selectedYear),
      maPhieu: generatePCTCode(selectedMonth, selectedYear),
      employees: [],
    });
    setThemGioFormStep(1);
    fetchEmployees();
  };

  // Add employee to ThemGio form
  const addEmployeeToThemGioForm = (emp: Employee) => {
    if (newThemGioForm.employees.some((e) => e.employeeId === emp.id)) {
      setNewThemGioForm((prev) => ({
        ...prev,
        employees: prev.employees.filter((e) => e.employeeId !== emp.id),
      }));
    } else {
      setNewThemGioForm((prev) => ({
        ...prev,
        employees: [
          ...prev.employees,
          {
            employeeId: emp.id,
            hoTen: emp.name || "Không tên",
            days: Array(31).fill(""),
            expanded: true,
          },
        ],
      }));
    }
  };

  // Toggle ThemGio employee expansion
  const toggleThemGioEmployeeExpansion = (employeeId: number) => {
    setNewThemGioForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.employeeId === employeeId ? { ...e, expanded: !e.expanded } : e
      ),
    }));
  };

  // Update ThemGio employee day value
  const updateThemGioEmployeeDay = (employeeId: number, dayIndex: number, value: number | string) => {
    setNewThemGioForm((prev) => ({
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

  // Calculate total overtime minutes
  const calculateThemGioPhut = (days: (number | string)[]): number => {
    return days.reduce((sum: number, day) => {
      const numVal = typeof day === "number" ? day : parseFloat(String(day));
      return sum + (isNaN(numVal) ? 0 : numVal);
    }, 0);
  };

  // Calculate overtime days (1 day = 8 hours = 480 minutes)
  const calculateThemGioNgay = (phut: number): number => {
    return Math.round((phut / 480) * 100) / 100; // Round to 2 decimal places
  };

  // Save ThemGio records
  const handleSaveThemGioRecord = async () => {
    if (newThemGioForm.employees.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nhân viên");
      return;
    }

    setIsSaving(true);
    try {
      const records = newThemGioForm.employees.map((emp) => {
        const themGioPhut = calculateThemGioPhut(emp.days);
        return {
          ngayBatDau: newThemGioForm.ngayBatDau,
          ngayKetThuc: newThemGioForm.ngayKetThuc,
          maPhieu: newThemGioForm.maPhieu,
          nhanVien: emp.hoTen,
          days: emp.days,
          themGioPhut,
          themGioNgay: calculateThemGioNgay(themGioPhut),
          thang: selectedMonth,
          nam: selectedYear,
        };
      });

      const response = await fetch("/api/them-gio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: records }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Đã tạo phiếu thêm giờ cho ${newThemGioForm.employees.length} nhân viên!`);
        setShowCreateThemGio(false);
        fetchThemGio();
      } else {
        toast.error(data.error || "Không thể tạo phiếu thêm giờ");
      }
    } catch (error) {
      console.error("Error saving overtime attendance:", error);
      toast.error("Lỗi khi tạo phiếu thêm giờ");
    } finally {
      setIsSaving(false);
    }
  };

  // Update ThemGio cell (for existing records)
  const handleUpdateThemGioCell = async (item: ThemGioItem, dayIndex: number, newValue: number | string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/them-gio", {
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
        setThemGioData((prev) =>
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

  // =====================
  // DELETE & EDIT HANDLERS
  // =====================

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const endpoint = deleteTarget.type === "di-muon" ? "/api/di-muon" : "/api/them-gio";
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: deleteTarget.item.id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Đã xoá thành công!");
        // Refresh data
        if (deleteTarget.type === "di-muon") {
          fetchDiMuon();
        } else {
          fetchThemGio();
        }
      } else {
        toast.error(data.error || "Không thể xoá");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi khi xoá");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (type: "di-muon" | "them-gio", item: DiMuonItem | ThemGioItem) => {
    setDeleteTarget({ type, item });
    setShowDeleteConfirm(true);
  };

  // Open edit DiMuon modal
  const openEditDiMuon = (item: DiMuonItem) => {
    setEditingDiMuon({ ...item });
    setShowEditDiMuon(true);
  };

  // Open edit ThemGio modal
  const openEditThemGio = (item: ThemGioItem) => {
    setEditingThemGio({ ...item });
    setShowEditThemGio(true);
  };

  // Calculate total minutes for days (helper)
  const calculateTotalMinutes = (days: (number | string)[]): number => {
    return days.reduce((sum: number, val) => {
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  // Calculate days from minutes (1 day = 480 minutes)
  const calculateDays = (minutes: number): number => {
    return Math.round((minutes / 480) * 100) / 100;
  };

  // Save edited DiMuon
  const handleSaveEditDiMuon = async () => {
    if (!editingDiMuon) return;

    setIsUpdating(true);
    try {
      // Recalculate totals
      const totalMinutes = calculateTotalMinutes(editingDiMuon.days);
      const totalDays = calculateDays(totalMinutes);
      const updatedData = {
        ...editingDiMuon,
        diMuonPhut: totalMinutes,
        diMuonNgay: totalDays,
      };

      const response = await fetch("/api/di-muon", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowNumber: editingDiMuon.id,
          data: updatedData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã cập nhật thành công!");
        fetchDiMuon();
        setShowEditDiMuon(false);
        setEditingDiMuon(null);
      } else {
        toast.error(data.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsUpdating(false);
    }
  };

  // Save edited ThemGio
  const handleSaveEditThemGio = async () => {
    if (!editingThemGio) return;

    setIsUpdating(true);
    try {
      // Recalculate totals
      const totalMinutes = calculateTotalMinutes(editingThemGio.days);
      const totalDays = calculateDays(totalMinutes);
      const updatedData = {
        ...editingThemGio,
        themGioPhut: totalMinutes,
        themGioNgay: totalDays,
      };

      const response = await fetch("/api/them-gio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowNumber: editingThemGio.id,
          data: updatedData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã cập nhật thành công!");
        fetchThemGio();
        setShowEditThemGio(false);
        setEditingThemGio(null);
      } else {
        toast.error(data.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsUpdating(false);
    }
  };

  // =====================
  // NGHI PHEP FUNCTIONS
  // =====================

  // Fetch leave data
  const fetchNghiPhep = async () => {
    setIsLoadingNghiPhep(true);
    try {
      const response = await fetch(`/api/nghi-phep?thang=${selectedMonth}&nam=${selectedYear}`);
      const data = await response.json();

      if (data.success) {
        setNghiPhepData(data.data);
      } else {
        toast.error(data.error || "Không thể tải dữ liệu nghỉ phép");
      }
    } catch (error) {
      console.error("Error fetching leave data:", error);
      toast.error("Lỗi khi tải dữ liệu nghỉ phép");
    } finally {
      setIsLoadingNghiPhep(false);
    }
  };

  // Initialize NghiPhep form
  const initializeNewNghiPhepForm = () => {
    setNewNghiPhepForm({
      ngayBatDau: formatDateForInput(1, selectedMonth, selectedYear),
      ngayKetThuc: formatDateForInput(daysInMonth, selectedMonth, selectedYear),
      maPhieu: generateNPCode(selectedMonth, selectedYear),
      employees: [],
    });
    fetchEmployees();
  };

  // Add employee to NghiPhep form
  const addEmployeeToNghiPhepForm = (emp: Employee) => {
    if (newNghiPhepForm.employees.some((e) => e.employeeId === emp.id)) {
      setNewNghiPhepForm((prev) => ({
        ...prev,
        employees: prev.employees.filter((e) => e.employeeId !== emp.id),
      }));
    } else {
      setNewNghiPhepForm((prev) => ({
        ...prev,
        employees: [
          ...prev.employees,
          {
            employeeId: emp.id,
            hoTen: emp.name || "Không tên",
            phepThang: 1,
            suDung: 0,
          },
        ],
      }));
    }
  };

  // Update NghiPhep employee field
  const updateNghiPhepEmployeeField = (employeeId: number, field: 'phepThang' | 'suDung', value: number) => {
    setNewNghiPhepForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => {
        if (e.employeeId === employeeId) {
          return { ...e, [field]: value };
        }
        return e;
      }),
    }));
  };

  // Save NghiPhep records
  const handleSaveNghiPhepRecord = async () => {
    if (newNghiPhepForm.employees.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nhân viên");
      return;
    }

    setIsSaving(true);
    try {
      const records = newNghiPhepForm.employees.map((emp) => ({
        ngayBatDau: newNghiPhepForm.ngayBatDau,
        ngayKetThuc: newNghiPhepForm.ngayKetThuc,
        maPhieu: newNghiPhepForm.maPhieu,
        nhanVien: emp.hoTen,
        phepThang: emp.phepThang,
        suDung: emp.suDung,
        tonPhep: emp.phepThang - emp.suDung,
        thang: selectedMonth,
        nam: selectedYear,
      }));

      const response = await fetch("/api/nghi-phep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: records }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Đã tạo phiếu nghỉ phép cho ${newNghiPhepForm.employees.length} nhân viên!`);
        setShowCreateNghiPhep(false);
        fetchNghiPhep();
      } else {
        toast.error(data.error || "Không thể tạo phiếu nghỉ phép");
      }
    } catch (error) {
      console.error("Error saving leave data:", error);
      toast.error("Lỗi khi tạo phiếu nghỉ phép");
    } finally {
      setIsSaving(false);
    }
  };

  // Update NghiPhep row
  const handleUpdateNghiPhepRow = async (
    rowNumber: number,
    phepThang: number,
    suDung: number
  ) => {
    try {
      const response = await fetch("/api/nghi-phep", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber, phepThang, suDung }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNghiPhepData((prev) =>
          prev.map((item) =>
            item.id === rowNumber
              ? { ...item, phepThang, suDung, tonPhep: phepThang - suDung }
              : item
          )
        );
        toast.success("Đã cập nhật nghỉ phép");
      } else {
        toast.error(data.error || "Không thể cập nhật nghỉ phép");
      }
    } catch (error) {
      console.error("Error updating leave data:", error);
      toast.error("Lỗi khi cập nhật nghỉ phép");
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
    if (activeSubTab === "cham-cong-thang") {
      fetchChamCong();
    } else if (activeSubTab === "di-muon") {
      fetchDiMuon();
    } else if (activeSubTab === "them-gio") {
      fetchThemGio();
    } else if (activeSubTab === "nghi-phep") {
      fetchNghiPhep();
    }
  }, [selectedMonth, selectedYear, activeSubTab]);

  useEffect(() => {
    setIsEditMode(false);
    setEditingCell(null);
    setIsEditingNghiPhep(false);
  }, [selectedMonth, selectedYear, activeSubTab]);

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
                onClick={() => handleSubTabChange(tab.id)}
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
          <div className="relative">
            <button
              onClick={() => {
                setPickerYear(selectedYear);
                setShowMonthPicker(!showMonthPicker);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Tháng {selectedMonth}/{selectedYear}</span>
            </button>

            {showMonthPicker && (
              <>
                {/* Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMonthPicker(false)}
                />
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-72">
                  {/* Year selector */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setPickerYear(pickerYear - 1)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-lg">{pickerYear}</span>
                    <button
                      onClick={() => setPickerYear(pickerYear + 1)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Month grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setSelectedYear(pickerYear);
                          setShowMonthPicker(false);
                        }}
                        className={`py-2 px-3 text-sm rounded-lg transition-colors ${
                          month === selectedMonth && pickerYear === selectedYear
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        Th {month}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => {
              if (activeSubTab === "cham-cong-thang") fetchChamCong();
              else if (activeSubTab === "di-muon") fetchDiMuon();
              else if (activeSubTab === "them-gio") fetchThemGio();
              else if (activeSubTab === "nghi-phep") fetchNghiPhep();
            }}
            disabled={isLoading || isLoadingDiMuon || isLoadingThemGio || isLoadingNghiPhep}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {(isLoading || isLoadingDiMuon || isLoadingThemGio || isLoadingNghiPhep) ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            Làm mới
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "cham-cong-thang" && (
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
          )}

          {activeSubTab === "di-muon" && (
            <button
              onClick={() => {
                initializeNewDiMuonForm();
                setShowCreateDiMuon(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus size={18} />
              Tạo phiếu đi muộn
            </button>
          )}

          {activeSubTab === "them-gio" && (
            <button
              onClick={() => {
                initializeNewThemGioForm();
                setShowCreateThemGio(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={18} />
              Tạo phiếu thêm giờ
            </button>
          )}

          {activeSubTab === "nghi-phep" && (
            <button
              onClick={() => {
                initializeNewNghiPhepForm();
                setShowCreateNghiPhep(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={18} />
              Tạo phiếu nghỉ phép
            </button>
          )}

          {((activeSubTab === "cham-cong-thang" && chamCongData.length > 0) ||
            (activeSubTab === "di-muon" && diMuonData.length > 0) ||
            (activeSubTab === "them-gio" && themGioData.length > 0) ||
            (activeSubTab === "nghi-phep" && nghiPhepData.length > 0)) && (
            <button
              onClick={() => {
                if (activeSubTab === "nghi-phep") {
                  setIsEditingNghiPhep(!isEditingNghiPhep);
                } else {
                  setIsEditMode(!isEditMode);
                  setEditingCell(null);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                (activeSubTab === "nghi-phep" ? isEditingNghiPhep : isEditMode)
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Edit3 size={18} />
              {(activeSubTab === "nghi-phep" ? isEditingNghiPhep : isEditMode) ? "Thoát chỉnh sửa" : "Chỉnh sửa"}
            </button>
          )}
        </div>
      </div>

      {(isEditMode || isEditingNghiPhep) && (
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

        {/* Di Muon Tab */}
        {activeSubTab === "di-muon" && (
          <>
            {isLoadingDiMuon ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-500">Đang tải...</span>
              </div>
            ) : diMuonData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <AlertCircle className="mx-auto mb-4 text-gray-300" size={48} />
                <p>Bảng chấm công đi muộn tháng {selectedMonth}/{selectedYear}</p>
                <p className="text-sm mt-2">Chưa có dữ liệu</p>
                <button
                  onClick={() => {
                    initializeNewDiMuonForm();
                    setShowCreateDiMuon(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Plus size={18} />
                  Tạo phiếu đi muộn
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
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-orange-600 min-w-[70px] border-l">Đi muộn (phút)</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-red-600 min-w-[70px]">Đi muộn (ngày)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {diMuonData.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-2 py-2 text-center text-gray-600 sticky left-0 bg-white z-10 border-r">{index + 1}</td>
                        <td className="px-2 py-2 font-medium text-gray-900 sticky left-[40px] bg-white z-10 border-r">
                          <button
                            onClick={() => setSelectedDiMuonEmployee(item)}
                            className="flex items-center gap-2 hover:bg-orange-50 rounded-lg p-1 -m-1 w-full text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                {item.nhanVien?.split(" ").slice(-1)[0]?.[0] || "?"}
                              </span>
                            </div>
                            <span className="truncate hover:text-orange-600">{item.nhanVien}</span>
                          </button>
                        </td>
                        {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                          const dayValue = item.days[dayIdx];
                          const isEditing = editingCell?.rowId === item.id && editingCell?.dayIndex === dayIdx;

                          return (
                            <td key={dayIdx} className="px-0 py-1 text-center relative border-l border-gray-100">
                              {isEditMode ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={dayValue === "" ? "" : dayValue}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? "" : parseInt(e.target.value) || 0;
                                    handleUpdateDiMuonCell(item, dayIdx, val);
                                  }}
                                  className={`w-8 h-8 rounded text-xs font-semibold text-center ${getDiMuonCellStyle(dayValue)} border-0 focus:ring-1 focus:ring-orange-500`}
                                />
                              ) : (
                                <span className={`w-8 h-8 rounded text-xs font-semibold inline-flex items-center justify-center ${getDiMuonCellStyle(dayValue)}`}>
                                  {dayValue === "" || dayValue === 0 ? "-" : dayValue}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center font-bold text-white bg-orange-600 border-l">{calculateDiMuonPhut(item.days)}</td>
                        <td className="px-2 py-2 text-center font-bold text-white bg-red-600">{calculateDiMuonNgay(calculateDiMuonPhut(item.days))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {diMuonData.length > 0 && (
              <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-4 text-sm">
                <span className="text-gray-600 font-medium">Chú thích:</span>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">-</span>
                  <span className="text-gray-600">Không đi muộn</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs font-bold">15</span>
                  <span className="text-gray-600">≤15 phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-orange-100 text-orange-800 flex items-center justify-center text-xs font-bold">30</span>
                  <span className="text-gray-600">≤30 phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-red-100 text-red-800 flex items-center justify-center text-xs font-bold">60</span>
                  <span className="text-gray-600">&gt;30 phút</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Them Gio Tab */}
        {activeSubTab === "them-gio" && (
          <>
            {isLoadingThemGio ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-500">Đang tải...</span>
              </div>
            ) : themGioData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Clock className="mx-auto mb-4 text-gray-300" size={48} />
                <p>Bảng chấm công thêm giờ tháng {selectedMonth}/{selectedYear}</p>
                <p className="text-sm mt-2">Chưa có dữ liệu</p>
                <button
                  onClick={() => {
                    initializeNewThemGioForm();
                    setShowCreateThemGio(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus size={18} />
                  Tạo phiếu thêm giờ
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
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-purple-600 min-w-[70px] border-l">Thêm giờ (phút)</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-white bg-green-600 min-w-[70px]">Thêm giờ (ngày)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {themGioData.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-2 py-2 text-center text-gray-600 sticky left-0 bg-white z-10 border-r">{index + 1}</td>
                        <td className="px-2 py-2 font-medium text-gray-900 sticky left-[40px] bg-white z-10 border-r">
                          <button
                            onClick={() => setSelectedThemGioEmployee(item)}
                            className="flex items-center gap-2 hover:bg-purple-50 rounded-lg p-1 -m-1 w-full text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                {item.nhanVien?.split(" ").slice(-1)[0]?.[0] || "?"}
                              </span>
                            </div>
                            <span className="truncate hover:text-purple-600">{item.nhanVien}</span>
                          </button>
                        </td>
                        {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                          const dayValue = item.days[dayIdx];

                          return (
                            <td key={dayIdx} className="px-0 py-1 text-center relative border-l border-gray-100">
                              {isEditMode ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={dayValue === "" ? "" : dayValue}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? "" : parseInt(e.target.value) || 0;
                                    handleUpdateThemGioCell(item, dayIdx, val);
                                  }}
                                  className={`w-8 h-8 rounded text-xs font-semibold text-center ${getThemGioCellStyle(dayValue)} border-0 focus:ring-1 focus:ring-purple-500`}
                                />
                              ) : (
                                <span className={`w-8 h-8 rounded text-xs font-semibold inline-flex items-center justify-center ${getThemGioCellStyle(dayValue)}`}>
                                  {dayValue === "" || dayValue === 0 ? "-" : dayValue}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center font-bold text-white bg-purple-600 border-l">{calculateThemGioPhut(item.days)}</td>
                        <td className="px-2 py-2 text-center font-bold text-white bg-green-600">{calculateThemGioNgay(calculateThemGioPhut(item.days))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {themGioData.length > 0 && (
              <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-4 text-sm">
                <span className="text-gray-600 font-medium">Chú thích:</span>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">-</span>
                  <span className="text-gray-600">Không thêm giờ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">60</span>
                  <span className="text-gray-600">≤60 phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold">120</span>
                  <span className="text-gray-600">≤120 phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">180</span>
                  <span className="text-gray-600">&gt;120 phút</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Nghi Phep tab */}
        {activeSubTab === "nghi-phep" && (
          <>
            {isLoadingNghiPhep ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-teal-600" size={32} />
                <span className="ml-3 text-gray-600">Đang tải dữ liệu nghỉ phép...</span>
              </div>
            ) : nghiPhepData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-gray-500">Chưa có dữ liệu nghỉ phép cho tháng {selectedMonth}/{selectedYear}</p>
                <button
                  onClick={() => {
                    initializeNewNghiPhepForm();
                    setShowCreateNghiPhep(true);
                  }}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  + Tạo phiếu nghỉ phép
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                      <th className="px-4 py-3 text-left font-semibold">STT</th>
                      <th className="px-4 py-3 text-left font-semibold">Ngày bắt đầu</th>
                      <th className="px-4 py-3 text-left font-semibold">Ngày kết thúc</th>
                      <th className="px-4 py-3 text-left font-semibold">Mã phiếu</th>
                      <th className="px-4 py-3 text-left font-semibold">Nhân viên</th>
                      <th className="px-4 py-3 text-center font-semibold">Phép tháng</th>
                      <th className="px-4 py-3 text-center font-semibold">Sử dụng</th>
                      <th className="px-4 py-3 text-center font-semibold">Tồn phép</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nghiPhepData.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-teal-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-600">{item.ngayBatDau}</td>
                        <td className="px-4 py-3 text-gray-600">{item.ngayKetThuc}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-sm font-medium">
                            {item.maPhieu}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                {item.nhanVien?.split(" ").slice(-1)[0]?.[0] || "?"}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{item.nhanVien}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditingNghiPhep ? (
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.phepThang}
                              onChange={(e) => {
                                const newPhepThang = parseFloat(e.target.value) || 0;
                                setNghiPhepData((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id
                                      ? { ...i, phepThang: newPhepThang, tonPhep: newPhepThang - i.suDung }
                                      : i
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const newPhepThang = parseFloat(e.target.value) || 0;
                                handleUpdateNghiPhepRow(item.id, newPhepThang, item.suDung);
                              }}
                              className="w-16 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold"
                            />
                          ) : (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                              {item.phepThang}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditingNghiPhep ? (
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.suDung}
                              onChange={(e) => {
                                const newSuDung = parseFloat(e.target.value) || 0;
                                setNghiPhepData((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id
                                      ? { ...i, suDung: newSuDung, tonPhep: i.phepThang - newSuDung }
                                      : i
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const newSuDung = parseFloat(e.target.value) || 0;
                                handleUpdateNghiPhepRow(item.id, item.phepThang, newSuDung);
                              }}
                              className="w-16 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-teal-500 font-semibold"
                            />
                          ) : (
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                              {item.suDung}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full font-semibold ${
                            item.tonPhep > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {item.tonPhep}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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

      {/* Di Muon Employee Detail Modal */}
      {selectedDiMuonEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-600 to-orange-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedDiMuonEmployee.nhanVien?.split(" ").slice(-1)[0]?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedDiMuonEmployee.nhanVien}</h3>
                  <p className="text-orange-100 text-sm">Đi muộn tháng {selectedMonth}/{selectedYear}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDiMuonEmployee(null)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-orange-600 text-sm">Tổng đi muộn (phút)</p>
                  <p className="text-3xl font-bold text-orange-700">{calculateDiMuonPhut(selectedDiMuonEmployee.days)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-red-600 text-sm">Quy đổi (ngày)</p>
                  <p className="text-3xl font-bold text-red-700">{calculateDiMuonNgay(calculateDiMuonPhut(selectedDiMuonEmployee.days))}</p>
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
                    <div key={i + 1} className={`aspect-square rounded-lg flex flex-col items-center justify-center ${getDiMuonCellStyle(selectedDiMuonEmployee.days[i])}`}>
                      <span className="text-xs text-gray-500">{i + 1}</span>
                      <span className="font-bold text-sm">{selectedDiMuonEmployee.days[i] === "" || selectedDiMuonEmployee.days[i] === 0 ? "-" : selectedDiMuonEmployee.days[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    openEditDiMuon(selectedDiMuonEmployee);
                    setSelectedDiMuonEmployee(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 size={18} />
                  Sửa
                </button>
                <button
                  onClick={() => {
                    openDeleteConfirm("di-muon", selectedDiMuonEmployee);
                    setSelectedDiMuonEmployee(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Di Muon Modal */}
      {showCreateDiMuon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-600 to-orange-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tạo phiếu chấm công đi muộn</h3>
                  <p className="text-orange-100 text-sm">
                    {diMuonFormStep === 1 ? "Bước 1: Chọn nhân viên" : "Bước 2: Điền số phút đi muộn"} - Tháng {selectedMonth}/{selectedYear}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCreateDiMuon(false)} className="p-2 hover:bg-white/20 rounded-lg">
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
                    value={newDiMuonForm.ngayBatDau}
                    onChange={(e) => setNewDiMuonForm({ ...newDiMuonForm, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={newDiMuonForm.ngayKetThuc}
                    onChange={(e) => setNewDiMuonForm({ ...newDiMuonForm, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={newDiMuonForm.maPhieu}
                    onChange={(e) => setNewDiMuonForm({ ...newDiMuonForm, maPhieu: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {diMuonFormStep === 1 ? (
                /* Step 1: Select employees */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      <Users size={16} className="inline mr-2" />
                      Chọn nhân viên <span className="text-orange-600">({newDiMuonForm.employees.length} đã chọn)</span>
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
                          const isSelected = newDiMuonForm.employees.some((e) => e.employeeId === emp.id);
                          return (
                            <label
                              key={emp.id}
                              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b md:border-r ${
                                isSelected ? "bg-orange-50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => addEmployeeToDiMuonForm(emp)}
                                className="w-5 h-5 text-orange-600 rounded"
                              />
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
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
                /* Step 2: Fill late minutes for each employee */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <span>Nhập số phút đi muộn cho từng ngày (để trống nếu không đi muộn)</span>
                  </div>

                  {newDiMuonForm.employees.map((emp) => (
                    <div key={emp.employeeId} className="border rounded-lg overflow-hidden">
                      {/* Employee header */}
                      <div
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleDiMuonEmployeeExpansion(emp.employeeId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {emp.hoTen?.split(" ").slice(-1)[0]?.[0] || "?"}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{emp.hoTen}</span>
                          <span className="text-sm text-orange-600">
                            (Tổng: {calculateDiMuonPhut(emp.days)} phút = {calculateDiMuonNgay(calculateDiMuonPhut(emp.days))} ngày)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {emp.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Days grid */}
                      {emp.expanded && (
                        <div className="p-3">
                          <div className="grid grid-cols-8 md:grid-cols-11 lg:grid-cols-16 gap-1">
                            {Array.from({ length: daysInMonth }, (_, i) => (
                              <div key={i} className="text-center">
                                <p className="text-[10px] text-gray-500 mb-1">{i + 1}</p>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="-"
                                  value={emp.days[i] === "" ? "" : emp.days[i]}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? "" : parseInt(e.target.value) || 0;
                                    updateDiMuonEmployeeDay(emp.employeeId, i, val);
                                  }}
                                  className={`w-full px-0 py-1 text-center text-xs font-semibold rounded border ${getDiMuonCellStyle(emp.days[i])} focus:ring-1 focus:ring-orange-500`}
                                />
                              </div>
                            ))}
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
                {newDiMuonForm.employees.length > 0 && (
                  <span className="text-orange-600 font-medium">
                    {newDiMuonForm.employees.length} nhân viên được chọn
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {diMuonFormStep === 2 && (
                  <button
                    onClick={() => setDiMuonFormStep(1)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                  >
                    Quay lại
                  </button>
                )}
                <button
                  onClick={() => setShowCreateDiMuon(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                {diMuonFormStep === 1 ? (
                  <button
                    onClick={() => setDiMuonFormStep(2)}
                    disabled={newDiMuonForm.employees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Tiếp tục
                    <ChevronDown size={18} className="rotate-[-90deg]" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveDiMuonRecord}
                    disabled={isSaving || newDiMuonForm.employees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Lưu phiếu ({newDiMuonForm.employees.length} NV)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Them Gio Employee Detail Modal */}
      {selectedThemGioEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedThemGioEmployee.nhanVien?.split(" ").slice(-1)[0]?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedThemGioEmployee.nhanVien}</h3>
                  <p className="text-purple-100 text-sm">Thêm giờ tháng {selectedMonth}/{selectedYear}</p>
                </div>
              </div>
              <button onClick={() => setSelectedThemGioEmployee(null)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-purple-600 text-sm">Tổng thêm giờ (phút)</p>
                  <p className="text-3xl font-bold text-purple-700">{calculateThemGioPhut(selectedThemGioEmployee.days)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-green-600 text-sm">Quy đổi (ngày)</p>
                  <p className="text-3xl font-bold text-green-700">{calculateThemGioNgay(calculateThemGioPhut(selectedThemGioEmployee.days))}</p>
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
                    <div key={i + 1} className={`aspect-square rounded-lg flex flex-col items-center justify-center ${getThemGioCellStyle(selectedThemGioEmployee.days[i])}`}>
                      <span className="text-xs text-gray-500">{i + 1}</span>
                      <span className="font-bold text-sm">{selectedThemGioEmployee.days[i] === "" || selectedThemGioEmployee.days[i] === 0 ? "-" : selectedThemGioEmployee.days[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    openEditThemGio(selectedThemGioEmployee);
                    setSelectedThemGioEmployee(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 size={18} />
                  Sửa
                </button>
                <button
                  onClick={() => {
                    openDeleteConfirm("them-gio", selectedThemGioEmployee);
                    setSelectedThemGioEmployee(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Them Gio Modal */}
      {showCreateThemGio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tạo phiếu chấm công thêm giờ</h3>
                  <p className="text-purple-100 text-sm">
                    {themGioFormStep === 1 ? "Bước 1: Chọn nhân viên" : "Bước 2: Điền số phút thêm giờ"} - Tháng {selectedMonth}/{selectedYear}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCreateThemGio(false)} className="p-2 hover:bg-white/20 rounded-lg">
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
                    value={newThemGioForm.ngayBatDau}
                    onChange={(e) => setNewThemGioForm({ ...newThemGioForm, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={newThemGioForm.ngayKetThuc}
                    onChange={(e) => setNewThemGioForm({ ...newThemGioForm, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={newThemGioForm.maPhieu}
                    onChange={(e) => setNewThemGioForm({ ...newThemGioForm, maPhieu: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {themGioFormStep === 1 ? (
                /* Step 1: Select employees */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      <Users size={16} className="inline mr-2" />
                      Chọn nhân viên <span className="text-purple-600">({newThemGioForm.employees.length} đã chọn)</span>
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
                          const isSelected = newThemGioForm.employees.some((e) => e.employeeId === emp.id);
                          return (
                            <label
                              key={emp.id}
                              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b md:border-r ${
                                isSelected ? "bg-purple-50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => addEmployeeToThemGioForm(emp)}
                                className="w-5 h-5 text-purple-600 rounded"
                              />
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
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
                /* Step 2: Fill overtime minutes for each employee */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <span>Nhập số phút thêm giờ cho từng ngày (để trống nếu không thêm giờ)</span>
                  </div>

                  {newThemGioForm.employees.map((emp) => (
                    <div key={emp.employeeId} className="border rounded-lg overflow-hidden">
                      {/* Employee header */}
                      <div
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleThemGioEmployeeExpansion(emp.employeeId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {emp.hoTen?.split(" ").slice(-1)[0]?.[0] || "?"}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{emp.hoTen}</span>
                          <span className="text-sm text-purple-600">
                            (Tổng: {calculateThemGioPhut(emp.days)} phút = {calculateThemGioNgay(calculateThemGioPhut(emp.days))} ngày)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {emp.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Days grid */}
                      {emp.expanded && (
                        <div className="p-3">
                          <div className="grid grid-cols-8 md:grid-cols-11 lg:grid-cols-16 gap-1">
                            {Array.from({ length: daysInMonth }, (_, i) => (
                              <div key={i} className="text-center">
                                <p className="text-[10px] text-gray-500 mb-1">{i + 1}</p>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="-"
                                  value={emp.days[i] === "" ? "" : emp.days[i]}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? "" : parseInt(e.target.value) || 0;
                                    updateThemGioEmployeeDay(emp.employeeId, i, val);
                                  }}
                                  className={`w-full px-0 py-1 text-center text-xs font-semibold rounded border ${getThemGioCellStyle(emp.days[i])} focus:ring-1 focus:ring-purple-500`}
                                />
                              </div>
                            ))}
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
                {newThemGioForm.employees.length > 0 && (
                  <span className="text-purple-600 font-medium">
                    {newThemGioForm.employees.length} nhân viên được chọn
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {themGioFormStep === 2 && (
                  <button
                    onClick={() => setThemGioFormStep(1)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                  >
                    Quay lại
                  </button>
                )}
                <button
                  onClick={() => setShowCreateThemGio(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                {themGioFormStep === 1 ? (
                  <button
                    onClick={() => setThemGioFormStep(2)}
                    disabled={newThemGioForm.employees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Tiếp tục
                    <ChevronDown size={18} className="rotate-[-90deg]" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveThemGioRecord}
                    disabled={isSaving || newThemGioForm.employees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Lưu phiếu ({newThemGioForm.employees.length} NV)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Nghi Phep Modal */}
      {showCreateNghiPhep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-teal-600 to-teal-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tạo phiếu nghỉ phép</h3>
                  <p className="text-teal-100 text-sm">
                    Tháng {selectedMonth}/{selectedYear}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCreateNghiPhep(false)} className="p-2 hover:bg-white/20 rounded-lg">
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
                    value={newNghiPhepForm.ngayBatDau}
                    onChange={(e) => setNewNghiPhepForm({ ...newNghiPhepForm, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={newNghiPhepForm.ngayKetThuc}
                    onChange={(e) => setNewNghiPhepForm({ ...newNghiPhepForm, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={newNghiPhepForm.maPhieu}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              {/* Employee Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Chọn nhân viên</h4>
                {isLoadingEmployees ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-teal-600" size={24} />
                    <span className="ml-2 text-gray-600">Đang tải danh sách nhân viên...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                    {employeeList.map((emp) => {
                      const isSelected = newNghiPhepForm.employees.some((e) => e.employeeId === emp.id);
                      return (
                        <button
                          key={emp.id}
                          onClick={() => addEmployeeToNghiPhepForm(emp)}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                            isSelected
                              ? "bg-teal-100 border-teal-500 text-teal-800"
                              : "bg-white border-gray-200 hover:border-teal-300 text-gray-700"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-600"
                          }`}>
                            {emp.name?.split(" ").slice(-1)[0]?.[0] || "?"}
                          </div>
                          <span className="text-sm truncate">{emp.name}</span>
                          {isSelected && <Check size={14} className="ml-auto text-teal-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Employees - Input Summary Fields */}
              {newNghiPhepForm.employees.length > 0 && (
                <div className="border rounded-lg">
                  <div className="bg-teal-50 px-4 py-3 border-b font-semibold text-teal-700">
                    Điền thông tin phép cho {newNghiPhepForm.employees.length} nhân viên
                  </div>
                  <div className="divide-y">
                    {newNghiPhepForm.employees.map((emp) => (
                      <div key={emp.employeeId} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {emp.hoTen?.split(" ").slice(-1)[0]?.[0] || "?"}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{emp.hoTen}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Phép tháng</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={emp.phepThang}
                                onChange={(e) => updateNghiPhepEmployeeField(emp.employeeId, 'phepThang', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Sử dụng</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={emp.suDung}
                                onChange={(e) => updateNghiPhepEmployeeField(emp.employeeId, 'suDung', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Tồn phép</label>
                              <div className={`w-20 px-2 py-1 text-center rounded-lg font-semibold ${
                                (emp.phepThang - emp.suDung) >= 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {emp.phepThang - emp.suDung}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                {newNghiPhepForm.employees.length > 0 && (
                  <span className="text-teal-600 font-medium">
                    {newNghiPhepForm.employees.length} nhân viên được chọn
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateNghiPhep(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveNghiPhepRecord}
                  disabled={isSaving || newNghiPhepForm.employees.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Lưu phiếu ({newNghiPhepForm.employees.length} NV)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Xác nhận xoá</h3>
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xoá phiếu {deleteTarget.type === "di-muon" ? "đi muộn" : "thêm giờ"} của nhân viên{" "}
                    <span className="font-semibold">{deleteTarget.item.nhanVien}</span>?
                  </p>
                </div>
              </div>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                Hành động này không thể hoàn tác. Dữ liệu sẽ bị xoá vĩnh viễn.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit DiMuon Modal */}
      {showEditDiMuon && editingDiMuon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-600 to-orange-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Edit3 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Sửa phiếu đi muộn</h3>
                  <p className="text-orange-100 text-sm">
                    {editingDiMuon.nhanVien} - Tháng {editingDiMuon.thang}/{editingDiMuon.nam}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditDiMuon(false);
                  setEditingDiMuon(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(95vh-180px)]">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="text"
                    value={editingDiMuon.ngayBatDau}
                    onChange={(e) => setEditingDiMuon({ ...editingDiMuon, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={editingDiMuon.ngayKetThuc}
                    onChange={(e) => setEditingDiMuon({ ...editingDiMuon, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={editingDiMuon.maPhieu}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
                  <input
                    type="text"
                    value={editingDiMuon.nhanVien}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              {/* Days Input */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Số phút đi muộn theo ngày</h4>
                <div className="grid grid-cols-8 md:grid-cols-11 lg:grid-cols-16 gap-2">
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <div key={i} className="text-center">
                      <p className="text-xs text-gray-500 mb-1">{i + 1}</p>
                      <input
                        type="number"
                        min="0"
                        placeholder="-"
                        value={editingDiMuon.days[i] === "" ? "" : editingDiMuon.days[i]}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : parseInt(e.target.value) || 0;
                          const newDays = [...editingDiMuon.days];
                          newDays[i] = val;
                          setEditingDiMuon({ ...editingDiMuon, days: newDays });
                        }}
                        className={`w-full px-1 py-2 text-center text-xs font-semibold rounded border ${getDiMuonCellStyle(editingDiMuon.days[i])} focus:ring-1 focus:ring-orange-500`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-center gap-6 p-4 bg-orange-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Tổng phút đi muộn:</span>
                  <span className="ml-2 text-lg font-bold text-orange-600">
                    {calculateTotalMinutes(editingDiMuon.days)} phút
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Quy đổi:</span>
                  <span className="ml-2 text-lg font-bold text-red-600">
                    {calculateDays(calculateTotalMinutes(editingDiMuon.days))} ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowEditDiMuon(false);
                  setEditingDiMuon(null);
                }}
                disabled={isUpdating}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditDiMuon}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit ThemGio Modal */}
      {showEditThemGio && editingThemGio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Edit3 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Sửa phiếu thêm giờ</h3>
                  <p className="text-purple-100 text-sm">
                    {editingThemGio.nhanVien} - Tháng {editingThemGio.thang}/{editingThemGio.nam}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditThemGio(false);
                  setEditingThemGio(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(95vh-180px)]">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="text"
                    value={editingThemGio.ngayBatDau}
                    onChange={(e) => setEditingThemGio({ ...editingThemGio, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={editingThemGio.ngayKetThuc}
                    onChange={(e) => setEditingThemGio({ ...editingThemGio, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={editingThemGio.maPhieu}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
                  <input
                    type="text"
                    value={editingThemGio.nhanVien}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              {/* Days Input */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Số phút thêm giờ theo ngày</h4>
                <div className="grid grid-cols-8 md:grid-cols-11 lg:grid-cols-16 gap-2">
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <div key={i} className="text-center">
                      <p className="text-xs text-gray-500 mb-1">{i + 1}</p>
                      <input
                        type="number"
                        min="0"
                        placeholder="-"
                        value={editingThemGio.days[i] === "" ? "" : editingThemGio.days[i]}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : parseInt(e.target.value) || 0;
                          const newDays = [...editingThemGio.days];
                          newDays[i] = val;
                          setEditingThemGio({ ...editingThemGio, days: newDays });
                        }}
                        className={`w-full px-1 py-2 text-center text-xs font-semibold rounded border ${getThemGioCellStyle(editingThemGio.days[i])} focus:ring-1 focus:ring-purple-500`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-center gap-6 p-4 bg-purple-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Tổng phút thêm giờ:</span>
                  <span className="ml-2 text-lg font-bold text-purple-600">
                    {calculateTotalMinutes(editingThemGio.days)} phút
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Quy đổi:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">
                    {calculateDays(calculateTotalMinutes(editingThemGio.days))} ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowEditThemGio(false);
                  setEditingThemGio(null);
                }}
                disabled={isUpdating}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditThemGio}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
