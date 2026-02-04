"use client";

import { Shield, FileText, Percent, RefreshCw, Loader2, X, Plus, Save, Users, ChevronDown, Check, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface BaoHiemTyLe {
  id: number;
  batDau: string;
  ketThuc: string;
  loaiBH: string;
  bhxhDN: number;
  bhxhNV: number;
  bhytDN: number;
  bhytNV: number;
  bhtnDN: number;
  bhtnNV: number;
}

interface BaoHiemNhanVien {
  id: number;
  maPhieu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  hoTen: string;
  chucVu: string;
  boPhan: string;
  mucLuongCoBan: number;
  bhxhDN: number;
  bhxhNV: number;
  bhytDN: number;
  bhytNV: number;
  bhtnDN: number;
  bhtnNV: number;
  tongDN: number;
  tongNV: number;
  ghiChu: string;
  // Tỷ lệ % áp dụng
  loaiBH: string;
  tyLeBhxhDN: number;
  tyLeBhxhNV: number;
  tyLeBhytDN: number;
  tyLeBhytNV: number;
  tyLeBhtnDN: number;
  tyLeBhtnNV: number;
  tyLeTongDN: number;
  tyLeTongNV: number;
  thang: number;
  nam: number;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
}

interface EmployeeBaoHiem {
  employeeId: number;
  hoTen: string;
  chucVu: string;
  boPhan: string;
  mucLuongCoBan: number;
  ghiChu?: string;
}

interface NewBaoHiemForm {
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string;
  employees: EmployeeBaoHiem[];
}

type SubTabType = "bang-ke" | "ty-le";

const SUB_TABS = [
  { id: "bang-ke" as SubTabType, label: "Bảng kê tiền bảo hiểm", icon: FileText },
  { id: "ty-le" as SubTabType, label: "Tỷ lệ % đóng bảo hiểm", icon: Percent },
];

const formatDateForInput = (day: number, month: number, year: number) => {
  return `${day}/${month}/${year}`;
};

const generateBHCode = (month: number, year: number) => {
  const monthStr = month.toString().padStart(2, "0");
  const yearStr = year.toString().slice(-2);
  return `BH${monthStr}/${yearStr}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

const VALID_SUB_TABS: SubTabType[] = ["bang-ke", "ty-le"];

export default function BaoHiemTab() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get sub-tab from URL
  const subTabFromUrl = searchParams.get("subtab") as SubTabType | null;
  const activeSubTab: SubTabType = subTabFromUrl && VALID_SUB_TABS.includes(subTabFromUrl) ? subTabFromUrl : "bang-ke";

  // Handle sub-tab change with URL update
  const handleSubTabChange = (subTab: SubTabType) => {
    router.push(`/nhan-su?tab=bao-hiem&subtab=${subTab}`, { scroll: false });
  };

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  // Ty Le state
  const [tyLeData, setTyLeData] = useState<BaoHiemTyLe[]>([]);
  const [isLoadingTyLe, setIsLoadingTyLe] = useState(false);
  const [showCreateTyLe, setShowCreateTyLe] = useState(false);
  const [newTyLe, setNewTyLe] = useState({
    batDau: "",
    ketThuc: "",
    loaiBH: "Tỷ lệ",
    bhxhDN: 17.5,
    bhxhNV: 8,
    bhytDN: 3,
    bhytNV: 1.5,
    bhtnDN: 1,
    bhtnNV: 1,
  });

  // Bao Hiem state
  const [baoHiemData, setBaoHiemData] = useState<BaoHiemNhanVien[]>([]);
  const [isLoadingBaoHiem, setIsLoadingBaoHiem] = useState(false);
  const [showCreateBaoHiem, setShowCreateBaoHiem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);

  // Employee list
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Current rates
  const [currentRates, setCurrentRates] = useState<BaoHiemTyLe | null>(null);

  // Edit/Delete state for BaoHiem
  const [editBaoHiem, setEditBaoHiem] = useState<BaoHiemNhanVien | null>(null);
  const [deleteBaoHiem, setDeleteBaoHiem] = useState<BaoHiemNhanVien | null>(null);

  // Edit/Delete state for TyLe
  const [editTyLe, setEditTyLe] = useState<BaoHiemTyLe | null>(null);
  const [deleteTyLe, setDeleteTyLe] = useState<BaoHiemTyLe | null>(null);

  const [newBaoHiemForm, setNewBaoHiemForm] = useState<NewBaoHiemForm>({
    ngayBatDau: "",
    ngayKetThuc: "",
    maPhieu: "",
    employees: [],
  });

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Fetch ty le
  const fetchTyLe = async () => {
    setIsLoadingTyLe(true);
    try {
      const response = await fetch("/api/bao-hiem-ty-le");
      const data = await response.json();

      if (data.success) {
        setTyLeData(data.data);
        // Set current rates (latest one)
        if (data.data.length > 0) {
          setCurrentRates(data.data[data.data.length - 1]);
        }
      } else {
        toast.error(data.error || "Không thể tải dữ liệu tỷ lệ bảo hiểm");
      }
    } catch (error) {
      console.error("Error fetching insurance rates:", error);
      toast.error("Lỗi khi tải dữ liệu tỷ lệ bảo hiểm");
    } finally {
      setIsLoadingTyLe(false);
    }
  };

  // Fetch bao hiem
  const fetchBaoHiem = async () => {
    setIsLoadingBaoHiem(true);
    try {
      const response = await fetch(`/api/bao-hiem?thang=${selectedMonth}&nam=${selectedYear}`);
      const data = await response.json();

      if (data.success) {
        setBaoHiemData(data.data);
        if (data.data.length === 0) {
          toast("Không có dữ liệu bảo hiểm cho tháng " + selectedMonth + "/" + selectedYear, { icon: "ℹ️" });
        }
      } else {
        toast.error(data.error || "Không thể tải dữ liệu bảo hiểm");
      }
    } catch (error) {
      console.error("Error fetching insurance data:", error);
      toast.error("Lỗi khi tải dữ liệu bảo hiểm");
    } finally {
      setIsLoadingBaoHiem(false);
    }
  };

  // Fetch employees
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

  // Initialize form
  const initializeNewBaoHiemForm = () => {
    setNewBaoHiemForm({
      ngayBatDau: formatDateForInput(1, selectedMonth, selectedYear),
      ngayKetThuc: formatDateForInput(daysInMonth, selectedMonth, selectedYear),
      maPhieu: generateBHCode(selectedMonth, selectedYear),
      employees: [],
    });
    setFormStep(1);
    fetchEmployees();
  };

  // Add employee to form
  const addEmployeeToForm = (emp: Employee) => {
    if (newBaoHiemForm.employees.some((e) => e.employeeId === emp.id)) {
      setNewBaoHiemForm((prev) => ({
        ...prev,
        employees: prev.employees.filter((e) => e.employeeId !== emp.id),
      }));
    } else {
      setNewBaoHiemForm((prev) => ({
        ...prev,
        employees: [
          ...prev.employees,
          {
            employeeId: emp.id,
            hoTen: emp.name || "Không tên",
            chucVu: emp.position || "",
            boPhan: emp.department || "",
            mucLuongCoBan: 0,
          },
        ],
      }));
    }
  };

  // Update employee salary
  const updateEmployeeSalary = (employeeId: number, salary: number) => {
    setNewBaoHiemForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.employeeId === employeeId ? { ...e, mucLuongCoBan: salary } : e
      ),
    }));
  };

  // Update employee ghiChu
  const updateEmployeeGhiChu = (employeeId: number, ghiChu: string) => {
    setNewBaoHiemForm((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.employeeId === employeeId ? { ...e, ghiChu } : e
      ),
    }));
  };

  // Calculate insurance amounts
  const calculateInsurance = (salary: number) => {
    if (!currentRates) {
      return {
        bhxhDN: 0,
        bhxhNV: 0,
        bhytDN: 0,
        bhytNV: 0,
        bhtnDN: 0,
        bhtnNV: 0,
        tongDN: 0,
        tongNV: 0,
      };
    }

    const bhxhDN = Math.round(salary * currentRates.bhxhDN / 100);
    const bhxhNV = Math.round(salary * currentRates.bhxhNV / 100);
    const bhytDN = Math.round(salary * currentRates.bhytDN / 100);
    const bhytNV = Math.round(salary * currentRates.bhytNV / 100);
    const bhtnDN = Math.round(salary * currentRates.bhtnDN / 100);
    const bhtnNV = Math.round(salary * currentRates.bhtnNV / 100);

    return {
      bhxhDN,
      bhxhNV,
      bhytDN,
      bhytNV,
      bhtnDN,
      bhtnNV,
      tongDN: bhxhDN + bhytDN + bhtnDN,
      tongNV: bhxhNV + bhytNV + bhtnNV,
    };
  };

  // Save ty le
  const handleSaveTyLe = async () => {
    if (!newTyLe.batDau || !newTyLe.ketThuc) {
      toast.error("Vui lòng nhập ngày bắt đầu và kết thúc");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/bao-hiem-ty-le", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTyLe),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã lưu tỷ lệ bảo hiểm!");
        setShowCreateTyLe(false);
        fetchTyLe();
      } else {
        toast.error(data.error || "Không thể lưu tỷ lệ bảo hiểm");
      }
    } catch (error) {
      console.error("Error saving insurance rate:", error);
      toast.error("Lỗi khi lưu tỷ lệ bảo hiểm");
    } finally {
      setIsSaving(false);
    }
  };

  // Save bao hiem
  const handleSaveBaoHiem = async () => {
    if (newBaoHiemForm.employees.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nhân viên");
      return;
    }

    const invalidEmployees = newBaoHiemForm.employees.filter((e) => e.mucLuongCoBan <= 0);
    if (invalidEmployees.length > 0) {
      toast.error("Vui lòng nhập mức lương cho tất cả nhân viên");
      return;
    }

    setIsSaving(true);
    try {
      const records = newBaoHiemForm.employees.map((emp) => {
        const insurance = calculateInsurance(emp.mucLuongCoBan);
        return {
          maPhieu: newBaoHiemForm.maPhieu,
          ngayBatDau: newBaoHiemForm.ngayBatDau,
          ngayKetThuc: newBaoHiemForm.ngayKetThuc,
          hoTen: emp.hoTen,
          chucVu: emp.chucVu,
          boPhan: emp.boPhan,
          mucLuongCoBan: emp.mucLuongCoBan,
          ...insurance,
          ghiChu: emp.ghiChu || "",
          thang: selectedMonth,
          nam: selectedYear,
        };
      });

      const response = await fetch("/api/bao-hiem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: records }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Đã tạo bảo hiểm cho ${newBaoHiemForm.employees.length} nhân viên!`);
        setShowCreateBaoHiem(false);
        fetchBaoHiem();
      } else {
        toast.error(data.error || "Không thể tạo bảo hiểm");
      }
    } catch (error) {
      console.error("Error saving insurance data:", error);
      toast.error("Lỗi khi tạo bảo hiểm");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update BaoHiem
  const handleUpdateBaoHiem = async () => {
    if (!editBaoHiem) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/bao-hiem", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowNumber: editBaoHiem.id,
          data: editBaoHiem,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã cập nhật bảo hiểm!");
        setEditBaoHiem(null);
        fetchBaoHiem();
      } else {
        toast.error(data.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error updating insurance:", error);
      toast.error("Lỗi khi cập nhật bảo hiểm");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete BaoHiem
  const handleDeleteBaoHiem = async () => {
    if (!deleteBaoHiem) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/bao-hiem", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: deleteBaoHiem.id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã xoá bảo hiểm!");
        setDeleteBaoHiem(null);
        fetchBaoHiem();
      } else {
        toast.error(data.error || "Không thể xoá");
      }
    } catch (error) {
      console.error("Error deleting insurance:", error);
      toast.error("Lỗi khi xoá bảo hiểm");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update TyLe
  const handleUpdateTyLe = async () => {
    if (!editTyLe) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/bao-hiem-ty-le", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowNumber: editTyLe.id,
          data: editTyLe,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã cập nhật tỷ lệ bảo hiểm!");
        setEditTyLe(null);
        fetchTyLe();
      } else {
        toast.error(data.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error updating insurance rate:", error);
      toast.error("Lỗi khi cập nhật tỷ lệ bảo hiểm");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete TyLe
  const handleDeleteTyLe = async () => {
    if (!deleteTyLe) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/bao-hiem-ty-le", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: deleteTyLe.id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã xoá tỷ lệ bảo hiểm!");
        setDeleteTyLe(null);
        fetchTyLe();
      } else {
        toast.error(data.error || "Không thể xoá");
      }
    } catch (error) {
      console.error("Error deleting insurance rate:", error);
      toast.error("Lỗi khi xoá tỷ lệ bảo hiểm");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchTyLe();
  }, []);

  useEffect(() => {
    if (activeSubTab === "bang-ke") {
      fetchBaoHiem();
    }
  }, [selectedMonth, selectedYear, activeSubTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Bảo hiểm</h2>
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

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          {activeSubTab === "bang-ke" && (
            <div className="relative">
              <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => {
                    if (selectedMonth === 1) {
                      setSelectedMonth(12);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Tháng trước"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    setPickerYear(selectedYear);
                    setShowMonthPicker(!showMonthPicker);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 min-w-[140px] justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Calendar size={18} className="text-blue-600" />
                  <span className="font-semibold text-gray-800">
                    Tháng {selectedMonth}/{selectedYear}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (selectedMonth === 12) {
                      setSelectedMonth(1);
                      setSelectedYear(selectedYear + 1);
                    } else {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Tháng sau"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Month Picker Popup */}
              {showMonthPicker && (
                <>
                  {/* Backdrop to close on click outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMonthPicker(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 min-w-[280px]">
                    {/* Year Selector */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setPickerYear(pickerYear - 1)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronLeft size={18} className="text-gray-600" />
                      </button>
                      <span className="font-bold text-gray-800 text-lg">{pickerYear}</span>
                      <button
                        onClick={() => setPickerYear(pickerYear + 1)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronRight size={18} className="text-gray-600" />
                      </button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <button
                          key={month}
                          onClick={() => {
                            setSelectedMonth(month);
                            setSelectedYear(pickerYear);
                            setShowMonthPicker(false);
                          }}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            month === selectedMonth && pickerYear === selectedYear
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          Th {month}
                        </button>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
                      <button
                        onClick={() => {
                          const now = new Date();
                          setSelectedMonth(now.getMonth() + 1);
                          setSelectedYear(now.getFullYear());
                          setShowMonthPicker(false);
                        }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Tháng hiện tại
                      </button>
                      <button
                        onClick={() => setShowMonthPicker(false)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeSubTab === "bang-ke") fetchBaoHiem();
              else fetchTyLe();
            }}
            disabled={isLoadingBaoHiem || isLoadingTyLe}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {(isLoadingBaoHiem || isLoadingTyLe) ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Tải lại
          </button>

          {activeSubTab === "bang-ke" && (
            <button
              onClick={() => {
                initializeNewBaoHiemForm();
                setShowCreateBaoHiem(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={18} />
              Tạo bảo hiểm
            </button>
          )}

          {activeSubTab === "ty-le" && (
            <button
              onClick={() => {
                setNewTyLe({
                  batDau: formatDateForInput(1, selectedMonth, selectedYear),
                  ketThuc: formatDateForInput(daysInMonth, selectedMonth, selectedYear),
                  loaiBH: "Tỷ lệ",
                  bhxhDN: 17.5,
                  bhxhNV: 8,
                  bhytDN: 3,
                  bhytNV: 1.5,
                  bhtnDN: 1,
                  bhtnNV: 1,
                });
                setShowCreateTyLe(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={18} />
              Thêm tỷ lệ mới
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Bao Hiem Tab */}
        {activeSubTab === "bang-ke" && (
          <>
            {isLoadingBaoHiem ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="ml-3 text-gray-600">Đang tải dữ liệu bảo hiểm...</span>
              </div>
            ) : baoHiemData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-gray-500">Chưa có dữ liệu bảo hiểm cho tháng {selectedMonth}/{selectedYear}</p>
                <button
                  onClick={() => {
                    initializeNewBaoHiemForm();
                    setShowCreateBaoHiem(true);
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Tạo bảo hiểm
                </button>
              </div>
            ) : (
              <div className="space-y-6 p-4">
                {/* Bảng 1: Tiền bảo hiểm */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Bảng 1: Tiền bảo hiểm</h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                          <th className="px-3 py-3 text-left font-semibold">STT</th>
                          <th className="px-3 py-3 text-left font-semibold">Mã phiếu</th>
                          <th className="px-3 py-3 text-left font-semibold">Nhân viên</th>
                          <th className="px-3 py-3 text-left font-semibold">Chức vụ</th>
                          <th className="px-3 py-3 text-left font-semibold">Bộ phận</th>
                          <th className="px-3 py-3 text-right font-semibold">Lương CB</th>
                          <th className="px-3 py-3 text-right font-semibold">BHXH DN</th>
                          <th className="px-3 py-3 text-right font-semibold">BHXH NV</th>
                          <th className="px-3 py-3 text-right font-semibold">BHYT DN</th>
                          <th className="px-3 py-3 text-right font-semibold">BHYT NV</th>
                          <th className="px-3 py-3 text-right font-semibold">BHTN DN</th>
                          <th className="px-3 py-3 text-right font-semibold">BHTN NV</th>
                          <th className="px-3 py-3 text-right font-semibold bg-green-600">Tổng DN</th>
                          <th className="px-3 py-3 text-right font-semibold bg-orange-600">Tổng NV</th>
                          <th className="px-3 py-3 text-center font-semibold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {baoHiemData.map((item, index) => (
                          <tr key={item.id} className="border-b hover:bg-blue-50 transition-colors">
                            <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                {item.maPhieu}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900">{item.hoTen}</td>
                            <td className="px-3 py-2 text-gray-600">{item.chucVu}</td>
                            <td className="px-3 py-2 text-gray-600">{item.boPhan}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.mucLuongCoBan)}</td>
                            <td className="px-3 py-2 text-right text-blue-600">{formatCurrency(item.bhxhDN)}</td>
                            <td className="px-3 py-2 text-right text-blue-600">{formatCurrency(item.bhxhNV)}</td>
                            <td className="px-3 py-2 text-right text-green-600">{formatCurrency(item.bhytDN)}</td>
                            <td className="px-3 py-2 text-right text-green-600">{formatCurrency(item.bhytNV)}</td>
                            <td className="px-3 py-2 text-right text-orange-600">{formatCurrency(item.bhtnDN)}</td>
                            <td className="px-3 py-2 text-right text-orange-600">{formatCurrency(item.bhtnNV)}</td>
                            <td className="px-3 py-2 text-right font-bold text-green-700 bg-green-50">{formatCurrency(item.tongDN)}</td>
                            <td className="px-3 py-2 text-right font-bold text-orange-700 bg-orange-50">{formatCurrency(item.tongNV)}</td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setEditBaoHiem(item)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Sửa"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => setDeleteBaoHiem(item)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Xoá"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* Total row */}
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={5} className="px-3 py-3 text-right">Tổng cộng:</td>
                          <td className="px-3 py-3 text-right">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.mucLuongCoBan, 0))}</td>
                          <td className="px-3 py-3 text-right text-blue-600">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.bhxhDN, 0))}</td>
                          <td className="px-3 py-3 text-right text-blue-600">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.bhxhNV, 0))}</td>
                          <td className="px-3 py-3 text-right text-green-600">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.bhytDN, 0))}</td>
                          <td className="px-3 py-3 text-right text-green-600">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.bhytNV, 0))}</td>
                          <td className="px-3 py-3 text-right text-orange-600">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.bhtnDN, 0))}</td>
                          <td className="px-3 py-3 text-right text-orange-600">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.bhtnNV, 0))}</td>
                          <td className="px-3 py-3 text-right text-green-700 bg-green-100">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.tongDN, 0))}</td>
                          <td className="px-3 py-3 text-right text-orange-700 bg-orange-100">{formatCurrency(baoHiemData.reduce((sum, i) => sum + i.tongNV, 0))}</td>
                          <td className="px-3 py-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bảng 2: Tỷ lệ % áp dụng */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Bảng 2: Tỷ lệ % đóng bảo hiểm áp dụng</h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                          <th className="px-3 py-3 text-left font-semibold">STT</th>
                          <th className="px-3 py-3 text-left font-semibold">Nhân viên</th>
                          <th className="px-3 py-3 text-center font-semibold">Loại BH</th>
                          <th className="px-3 py-3 text-center font-semibold">BHXH DN</th>
                          <th className="px-3 py-3 text-center font-semibold">BHXH NV</th>
                          <th className="px-3 py-3 text-center font-semibold">BHYT DN</th>
                          <th className="px-3 py-3 text-center font-semibold">BHYT NV</th>
                          <th className="px-3 py-3 text-center font-semibold">BHTN DN</th>
                          <th className="px-3 py-3 text-center font-semibold">BHTN NV</th>
                          <th className="px-3 py-3 text-center font-semibold bg-green-600">Tổng DN</th>
                          <th className="px-3 py-3 text-center font-semibold bg-orange-600">Tổng NV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {baoHiemData.map((item, index) => (
                          <tr key={`rate-${item.id}`} className="border-b hover:bg-purple-50 transition-colors">
                            <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{item.hoTen}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                {item.loaiBH || "Tỷ lệ"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center text-blue-600 font-medium">{item.tyLeBhxhDN}%</td>
                            <td className="px-3 py-2 text-center text-blue-600 font-medium">{item.tyLeBhxhNV}%</td>
                            <td className="px-3 py-2 text-center text-green-600 font-medium">{item.tyLeBhytDN}%</td>
                            <td className="px-3 py-2 text-center text-green-600 font-medium">{item.tyLeBhytNV}%</td>
                            <td className="px-3 py-2 text-center text-orange-600 font-medium">{item.tyLeBhtnDN}%</td>
                            <td className="px-3 py-2 text-center text-orange-600 font-medium">{item.tyLeBhtnNV}%</td>
                            <td className="px-3 py-2 text-center font-bold text-green-700 bg-green-50">{item.tyLeTongDN}%</td>
                            <td className="px-3 py-2 text-center font-bold text-orange-700 bg-orange-50">{item.tyLeTongNV}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Ty Le Tab */}
        {activeSubTab === "ty-le" && (
          <>
            {isLoadingTyLe ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="ml-3 text-gray-600">Đang tải dữ liệu tỷ lệ...</span>
              </div>
            ) : tyLeData.length === 0 ? (
              <div className="text-center py-12">
                <Percent className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-gray-500">Chưa có dữ liệu tỷ lệ bảo hiểm</p>
                <button
                  onClick={() => setShowCreateTyLe(true)}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Thêm tỷ lệ mới
                </button>
              </div>
            ) : (
              <div className="p-6">
                {/* Current rates cards */}
                {currentRates && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Tỷ lệ đóng hiện tại (từ {currentRates.batDau})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">BHXH (Bảo hiểm xã hội)</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{currentRates.bhxhDN + currentRates.bhxhNV}%</p>
                        <p className="text-xs text-gray-500 mt-1">NV: {currentRates.bhxhNV}% | DN: {currentRates.bhxhDN}%</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">BHYT (Bảo hiểm y tế)</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{currentRates.bhytDN + currentRates.bhytNV}%</p>
                        <p className="text-xs text-gray-500 mt-1">NV: {currentRates.bhytNV}% | DN: {currentRates.bhytDN}%</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">BHTN (Bảo hiểm thất nghiệp)</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">{currentRates.bhtnDN + currentRates.bhtnNV}%</p>
                        <p className="text-xs text-gray-500 mt-1">NV: {currentRates.bhtnNV}% | DN: {currentRates.bhtnDN}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* History table */}
                <h3 className="font-semibold text-gray-700 mb-4">Lịch sử tỷ lệ bảo hiểm</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-3 text-left font-semibold">Bắt đầu</th>
                        <th className="px-4 py-3 text-left font-semibold">Kết thúc</th>
                        <th className="px-4 py-3 text-left font-semibold">Loại</th>
                        <th className="px-4 py-3 text-center font-semibold text-blue-600">BHXH DN</th>
                        <th className="px-4 py-3 text-center font-semibold text-blue-600">BHXH NV</th>
                        <th className="px-4 py-3 text-center font-semibold text-green-600">BHYT DN</th>
                        <th className="px-4 py-3 text-center font-semibold text-green-600">BHYT NV</th>
                        <th className="px-4 py-3 text-center font-semibold text-orange-600">BHTN DN</th>
                        <th className="px-4 py-3 text-center font-semibold text-orange-600">BHTN NV</th>
                        <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tyLeData.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">{item.batDau}</td>
                          <td className="px-4 py-3">{item.ketThuc}</td>
                          <td className="px-4 py-3">{item.loaiBH}</td>
                          <td className="px-4 py-3 text-center text-blue-600 font-medium">{item.bhxhDN}%</td>
                          <td className="px-4 py-3 text-center text-blue-600 font-medium">{item.bhxhNV}%</td>
                          <td className="px-4 py-3 text-center text-green-600 font-medium">{item.bhytDN}%</td>
                          <td className="px-4 py-3 text-center text-green-600 font-medium">{item.bhytNV}%</td>
                          <td className="px-4 py-3 text-center text-orange-600 font-medium">{item.bhtnDN}%</td>
                          <td className="px-4 py-3 text-center text-orange-600 font-medium">{item.bhtnNV}%</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEditTyLe(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Sửa"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteTyLe(item)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Xoá"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Ty Le Modal */}
      {showCreateTyLe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Percent size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Thêm tỷ lệ bảo hiểm mới</h3>
              </div>
              <button onClick={() => setShowCreateTyLe(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="text"
                    value={newTyLe.batDau}
                    onChange={(e) => setNewTyLe({ ...newTyLe, batDau: e.target.value })}
                    placeholder="1/1/2026"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={newTyLe.ketThuc}
                    onChange={(e) => setNewTyLe({ ...newTyLe, ketThuc: e.target.value })}
                    placeholder="31/12/2026"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-3">BHXH</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Doanh nghiệp (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTyLe.bhxhDN}
                        onChange={(e) => setNewTyLe({ ...newTyLe, bhxhDN: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Nhân viên (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTyLe.bhxhNV}
                        onChange={(e) => setNewTyLe({ ...newTyLe, bhxhNV: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-3">BHYT</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Doanh nghiệp (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTyLe.bhytDN}
                        onChange={(e) => setNewTyLe({ ...newTyLe, bhytDN: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Nhân viên (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTyLe.bhytNV}
                        onChange={(e) => setNewTyLe({ ...newTyLe, bhytNV: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-700 mb-3">BHTN</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Doanh nghiệp (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTyLe.bhtnDN}
                        onChange={(e) => setNewTyLe({ ...newTyLe, bhtnDN: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Nhân viên (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTyLe.bhtnNV}
                        onChange={(e) => setNewTyLe({ ...newTyLe, bhtnNV: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowCreateTyLe(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTyLe}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lưu tỷ lệ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Bao Hiem Modal */}
      {showCreateBaoHiem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tạo bảo hiểm mới</h3>
                  <p className="text-green-100 text-sm">
                    {formStep === 1 ? "Bước 1: Chọn nhân viên" : "Bước 2: Nhập mức lương"} - Tháng {selectedMonth}/{selectedYear}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCreateBaoHiem(false)} className="p-2 hover:bg-white/20 rounded-lg">
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
                    value={newBaoHiemForm.ngayBatDau}
                    onChange={(e) => setNewBaoHiemForm({ ...newBaoHiemForm, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={newBaoHiemForm.ngayKetThuc}
                    onChange={(e) => setNewBaoHiemForm({ ...newBaoHiemForm, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={newBaoHiemForm.maPhieu}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              {/* Current rates info */}
              {currentRates && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Tỷ lệ áp dụng:</strong> BHXH (DN: {currentRates.bhxhDN}%, NV: {currentRates.bhxhNV}%) |
                    BHYT (DN: {currentRates.bhytDN}%, NV: {currentRates.bhytNV}%) |
                    BHTN (DN: {currentRates.bhtnDN}%, NV: {currentRates.bhtnNV}%)
                  </p>
                </div>
              )}

              {/* Step 1: Employee Selection */}
              {formStep === 1 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Chọn nhân viên</h4>
                  {isLoadingEmployees ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-green-600" size={24} />
                      <span className="ml-2 text-gray-600">Đang tải danh sách nhân viên...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                      {employeeList.map((emp) => {
                        const isSelected = newBaoHiemForm.employees.some((e) => e.employeeId === emp.id);
                        return (
                          <button
                            key={emp.id}
                            onClick={() => addEmployeeToForm(emp)}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                              isSelected
                                ? "bg-green-100 border-green-500 text-green-800"
                                : "bg-white border-gray-200 hover:border-green-300 text-gray-700"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                            }`}>
                              {emp.name?.split(" ").slice(-1)[0]?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{emp.name}</p>
                              <p className="text-xs text-gray-500 truncate">{emp.position}</p>
                            </div>
                            {isSelected && <Check size={16} className="text-green-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Salary Input */}
              {formStep === 2 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Nhập mức lương cơ bản</h4>
                  <div className="space-y-3">
                    {newBaoHiemForm.employees.map((emp) => {
                      const insurance = calculateInsurance(emp.mucLuongCoBan);
                      return (
                        <div key={emp.employeeId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {emp.hoTen?.split(" ").slice(-1)[0]?.[0] || "?"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{emp.hoTen}</p>
                                <p className="text-sm text-gray-500">{emp.chucVu} - {emp.boPhan}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Mức lương cơ bản</label>
                              <input
                                type="number"
                                value={emp.mucLuongCoBan || ""}
                                onChange={(e) => updateEmployeeSalary(emp.employeeId, parseInt(e.target.value) || 0)}
                                placeholder="Nhập mức lương..."
                                className="w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-right"
                              />
                            </div>
                          </div>

                          {emp.mucLuongCoBan > 0 && (
                            <div className="grid grid-cols-4 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                              <div>
                                <p className="text-xs text-gray-500">BHXH DN</p>
                                <p className="font-medium text-blue-600">{formatCurrency(insurance.bhxhDN)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">BHXH NV</p>
                                <p className="font-medium text-blue-600">{formatCurrency(insurance.bhxhNV)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">BHYT DN</p>
                                <p className="font-medium text-green-600">{formatCurrency(insurance.bhytDN)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">BHYT NV</p>
                                <p className="font-medium text-green-600">{formatCurrency(insurance.bhytNV)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">BHTN DN</p>
                                <p className="font-medium text-orange-600">{formatCurrency(insurance.bhtnDN)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">BHTN NV</p>
                                <p className="font-medium text-orange-600">{formatCurrency(insurance.bhtnNV)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Tổng DN</p>
                                <p className="font-bold text-green-700">{formatCurrency(insurance.tongDN)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Tổng NV</p>
                                <p className="font-bold text-orange-700">{formatCurrency(insurance.tongNV)}</p>
                              </div>
                            </div>
                          )}

                          {/* Ghi chú */}
                          <div className="mt-3">
                            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
                            <textarea
                              value={emp.ghiChu || ""}
                              onChange={(e) => updateEmployeeGhiChu(emp.employeeId, e.target.value)}
                              placeholder="Nhập ghi chú..."
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                {newBaoHiemForm.employees.length > 0 && (
                  <span className="text-green-600 font-medium">
                    {newBaoHiemForm.employees.length} nhân viên được chọn
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
                  onClick={() => setShowCreateBaoHiem(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                {formStep === 1 ? (
                  <button
                    onClick={() => setFormStep(2)}
                    disabled={newBaoHiemForm.employees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Tiếp tục
                    <ChevronDown size={18} className="rotate-[-90deg]" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveBaoHiem}
                    disabled={isSaving || newBaoHiemForm.employees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Lưu bảo hiểm ({newBaoHiemForm.employees.length} NV)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit BaoHiem Modal */}
      {editBaoHiem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Pencil size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Sửa bảo hiểm - {editBaoHiem.hoTen}</h3>
              </div>
              <button onClick={() => setEditBaoHiem(null)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={editBaoHiem.maPhieu}
                    onChange={(e) => setEditBaoHiem({ ...editBaoHiem, maPhieu: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mức lương CB</label>
                  <input
                    type="number"
                    value={editBaoHiem.mucLuongCoBan}
                    onChange={(e) => setEditBaoHiem({ ...editBaoHiem, mucLuongCoBan: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-700 text-sm mb-2">BHXH</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">DN</label>
                      <input
                        type="number"
                        value={editBaoHiem.bhxhDN}
                        onChange={(e) => setEditBaoHiem({ ...editBaoHiem, bhxhDN: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">NV</label>
                      <input
                        type="number"
                        value={editBaoHiem.bhxhNV}
                        onChange={(e) => setEditBaoHiem({ ...editBaoHiem, bhxhNV: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-700 text-sm mb-2">BHYT</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">DN</label>
                      <input
                        type="number"
                        value={editBaoHiem.bhytDN}
                        onChange={(e) => setEditBaoHiem({ ...editBaoHiem, bhytDN: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">NV</label>
                      <input
                        type="number"
                        value={editBaoHiem.bhytNV}
                        onChange={(e) => setEditBaoHiem({ ...editBaoHiem, bhytNV: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-orange-700 text-sm mb-2">BHTN</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">DN</label>
                      <input
                        type="number"
                        value={editBaoHiem.bhtnDN}
                        onChange={(e) => setEditBaoHiem({ ...editBaoHiem, bhtnDN: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">NV</label>
                      <input
                        type="number"
                        value={editBaoHiem.bhtnNV}
                        onChange={(e) => setEditBaoHiem({ ...editBaoHiem, bhtnNV: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <label className="block text-xs text-gray-600">Tổng DN</label>
                  <input
                    type="number"
                    value={editBaoHiem.tongDN}
                    onChange={(e) => setEditBaoHiem({ ...editBaoHiem, tongDN: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <label className="block text-xs text-gray-600">Tổng NV</label>
                  <input
                    type="number"
                    value={editBaoHiem.tongNV}
                    onChange={(e) => setEditBaoHiem({ ...editBaoHiem, tongNV: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={editBaoHiem.ghiChu || ""}
                  onChange={(e) => setEditBaoHiem({ ...editBaoHiem, ghiChu: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập ghi chú..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => setEditBaoHiem(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
                Hủy
              </button>
              <button
                onClick={handleUpdateBaoHiem}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete BaoHiem Confirmation */}
      {deleteBaoHiem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xoá</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xoá bảo hiểm của <strong>{deleteBaoHiem.hoTen}</strong>?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteBaoHiem(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteBaoHiem}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit TyLe Modal */}
      {editTyLe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Pencil size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Sửa tỷ lệ bảo hiểm</h3>
              </div>
              <button onClick={() => setEditTyLe(null)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="text"
                    value={editTyLe.batDau}
                    onChange={(e) => setEditTyLe({ ...editTyLe, batDau: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="text"
                    value={editTyLe.ketThuc}
                    onChange={(e) => setEditTyLe({ ...editTyLe, ketThuc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-3">BHXH</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Doanh nghiệp (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editTyLe.bhxhDN}
                        onChange={(e) => setEditTyLe({ ...editTyLe, bhxhDN: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Nhân viên (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editTyLe.bhxhNV}
                        onChange={(e) => setEditTyLe({ ...editTyLe, bhxhNV: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-3">BHYT</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Doanh nghiệp (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editTyLe.bhytDN}
                        onChange={(e) => setEditTyLe({ ...editTyLe, bhytDN: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Nhân viên (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editTyLe.bhytNV}
                        onChange={(e) => setEditTyLe({ ...editTyLe, bhytNV: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-700 mb-3">BHTN</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Doanh nghiệp (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editTyLe.bhtnDN}
                        onChange={(e) => setEditTyLe({ ...editTyLe, bhtnDN: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Nhân viên (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editTyLe.bhtnNV}
                        onChange={(e) => setEditTyLe({ ...editTyLe, bhtnNV: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => setEditTyLe(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
                Hủy
              </button>
              <button
                onClick={handleUpdateTyLe}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete TyLe Confirmation */}
      {deleteTyLe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xoá</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xoá tỷ lệ bảo hiểm từ <strong>{deleteTyLe.batDau}</strong> đến <strong>{deleteTyLe.ketThuc}</strong>?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteTyLe(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteTyLe}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
