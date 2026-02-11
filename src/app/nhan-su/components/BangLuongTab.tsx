"use client";

import { Banknote, FileText, Calculator, History, Send, Loader2, RefreshCw, Plus, X, Check, User, Briefcase, DollarSign, Clock, Gift, AlertCircle, CheckCircle, Calendar, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BangKeTienLuongItem } from "@/lib/googleSheets";

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
}

type SubTabType = "co-che-luong" | "bang-luong" | "phieu-luong-thang" | "phieu-luong-nv" | "lich-su";

interface CoCheLuong {
  id: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string; // Mã phiếu như PTL01/26
  nhanVien: string;
  boPhan: string;
  mucLuongCoBan: number;
  thuongChuyenCan: number;
  phuCapAnTrua: number;
  phuCapXangXe: number;
  phuCapDienThoai: number;
  phuCapKhac1: number;
  phuCapTrangPhuc: number;
  phuCapNhaO: number;
  giuTreNuoiCon: number;
  phuCapKhac: number;
  thuongSangKien: number;
  luongPartime: number;
  ghiChu: string;
  thang: number;
  nam: number;
}

const SUB_TABS = [
  { id: "co-che-luong" as SubTabType, label: "Cơ chế lương", icon: FileText },
  { id: "bang-luong" as SubTabType, label: "Bảng lương", icon: Calculator },
  { id: "phieu-luong-thang" as SubTabType, label: "Phiếu lương theo tháng", icon: FileText },
  { id: "phieu-luong-nv" as SubTabType, label: "Phiếu thông báo lương cho NV", icon: Send },
  { id: "lich-su" as SubTabType, label: "Lịch sử trả lương", icon: History },
];

// Generate mã phiếu like PTL01/26
const generateMaPhieu = (month: number, year: number) => {
  const monthStr = month.toString().padStart(2, "0");
  const yearStr = year.toString().slice(-2);
  return `PTL${monthStr}/${yearStr}`;
};

// Get default dates for the month
const getDefaultDates = (month: number, year: number) => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const formatDate = (date: Date) => {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return {
    ngayBatDau: formatDate(firstDay),
    ngayKetThuc: formatDate(lastDay),
  };
};

// Get days in month
const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

const VALID_SUB_TABS: SubTabType[] = ["co-che-luong", "bang-luong", "phieu-luong-thang", "phieu-luong-nv", "lich-su"];

export default function BangLuongTab() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get sub-tab from URL
  const subTabFromUrl = searchParams.get("subtab") as SubTabType | null;
  const activeSubTab: SubTabType = subTabFromUrl && VALID_SUB_TABS.includes(subTabFromUrl) ? subTabFromUrl : "co-che-luong";

  // Handle sub-tab change with URL update
  const handleSubTabChange = (subTab: SubTabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subtab", subTab);
    router.push(`/nhan-su?tab=bang-luong&subtab=${subTab}`, { scroll: false });
  };

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  // State for Cơ chế lương
  const [coCheLuongData, setCoCheLuongData] = useState<CoCheLuong[]>([]);
  const [loadingCoCheLuong, setLoadingCoCheLuong] = useState(false);
  const [errorCoCheLuong, setErrorCoCheLuong] = useState<string | null>(null);

  // State for creating CoCheLuong
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [savingCoCheLuong, setSavingCoCheLuong] = useState(false);
  const [formData, setFormData] = useState<{ [key: number]: Partial<CoCheLuong> }>({});
  const [step, setStep] = useState<1 | 2>(1); // Step 1: select employees, Step 2: fill data
  const [inputMaPhieu, setInputMaPhieu] = useState(""); // Mã phiếu do người dùng nhập

  // State for Bảng kê tiền lương
  const [salaryData, setSalaryData] = useState<BangKeTienLuongItem[]>([]);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [errorSalary, setErrorSalary] = useState<string | null>(null);
  const [selectedSalaryEmployee, setSelectedSalaryEmployee] = useState<BangKeTienLuongItem | null>(null);
  const [selectedSalaryMaPhieu, setSelectedSalaryMaPhieu] = useState<string>("");

  // State for Phiếu tính lương hàng tháng (uses same data as Bảng kê tiền lương)
  const [selectedPhieuLuongThangMaPhieu, setSelectedPhieuLuongThangMaPhieu] = useState<string>("");

  // State for Phiếu thông báo lương cho NV
  const [selectedPhieuNVMaPhieu, setSelectedPhieuNVMaPhieu] = useState<string>("");
  const [selectedPhieuNVEmployee, setSelectedPhieuNVEmployee] = useState<string>("");

  // Fetch Cơ chế lương data
  const fetchCoCheLuong = async () => {
    setLoadingCoCheLuong(true);
    setErrorCoCheLuong(null);
    try {
      const res = await fetch(`/api/co-che-luong?thang=${selectedMonth}&nam=${selectedYear}`);
      const result = await res.json();
      if (result.success) {
        setCoCheLuongData(result.data || []);
      } else {
        setErrorCoCheLuong(result.error || "Lỗi khi tải dữ liệu");
      }
    } catch (error) {
      setErrorCoCheLuong("Lỗi kết nối");
    } finally {
      setLoadingCoCheLuong(false);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch("/api/employees");
      const result = await res.json();
      if (result.success) {
        setEmployees(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Get default dates for the selected month
  const defaultDates = getDefaultDates(selectedMonth, selectedYear);

  // Fetch Bảng kê tiền lương
  const fetchSalaryData = async () => {
    setLoadingSalary(true);
    setErrorSalary(null);
    try {
      const response = await fetch("/api/bang-ke-tien-luong");
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setSalaryData(data.data);

        // Auto-select the current month's period if not already selected
        if (!selectedSalaryMaPhieu) {
          const uniqueList = (Array.from(
            new Set(data.data.map((item: BangKeTienLuongItem) => item.maPhieu).filter((m: string) => m))
          ) as string[]).sort((a, b) => b.localeCompare(a));

          // Try to find the current month's period (e.g., BL01/26 for January 2026)
          const currentMonth = String(selectedMonth).padStart(2, "0");
          const currentYear = String(selectedYear).slice(-2);
          const currentPeriod = `BL${currentMonth}/${currentYear}`;

          // Check if current period exists, otherwise use the latest one
          const defaultPeriod = uniqueList.includes(currentPeriod)
            ? currentPeriod
            : uniqueList[0];

          if (defaultPeriod) {
            setSelectedSalaryMaPhieu(defaultPeriod);
          }
        }
      } else {
        setErrorSalary("Không có dữ liệu bảng lương");
      }
    } catch (error) {
      console.error("Error loading salary from sheet:", error);
      setErrorSalary("Lỗi khi tải dữ liệu từ Google Sheets");
    } finally {
      setLoadingSalary(false);
    }
  };


  // Save CoCheLuong data
  const handleSaveCoCheLuong = async () => {
    if (selectedEmployees.length === 0) return;

    // Validate mã phiếu
    if (!inputMaPhieu.trim()) {
      alert("Vui lòng nhập Mã phiếu");
      return;
    }

    // Validate required fields
    for (const empId of selectedEmployees) {
      const form = formData[empId] || {};
      if (!form.ngayBatDau || !form.ngayKetThuc) {
        alert("Vui lòng nhập đầy đủ Ngày bắt đầu và Ngày kết thúc cho tất cả nhân viên");
        return;
      }
    }

    setSavingCoCheLuong(true);
    try {
      const dataToSave: CoCheLuong[] = selectedEmployees.map((empId, index) => {
        const emp = employees.find((e) => e.id === empId);
        const form = formData[empId] || {};
        return {
          id: Date.now() + index,
          ngayBatDau: form.ngayBatDau || defaultDates.ngayBatDau,
          ngayKetThuc: form.ngayKetThuc || defaultDates.ngayKetThuc,
          maPhieu: inputMaPhieu.trim(),
          nhanVien: emp?.name || "",
          boPhan: emp?.department || "",
          mucLuongCoBan: form.mucLuongCoBan || 0,
          thuongChuyenCan: form.thuongChuyenCan || 0,
          phuCapAnTrua: form.phuCapAnTrua || 0,
          phuCapXangXe: form.phuCapXangXe || 0,
          phuCapDienThoai: form.phuCapDienThoai || 0,
          phuCapKhac1: form.phuCapKhac1 || 0,
          phuCapTrangPhuc: form.phuCapTrangPhuc || 0,
          phuCapNhaO: form.phuCapNhaO || 0,
          giuTreNuoiCon: form.giuTreNuoiCon || 0,
          phuCapKhac: form.phuCapKhac || 0,
          thuongSangKien: form.thuongSangKien || 0,
          luongPartime: form.luongPartime || 0,
          ghiChu: form.ghiChu || "",
          thang: selectedMonth,
          nam: selectedYear,
        };
      });

      const res = await fetch("/api/co-che-luong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSave }),
      });

      const result = await res.json();
      if (result.success) {
        setShowCreateForm(false);
        setSelectedEmployees([]);
        setFormData({});
        setStep(1);
        setInputMaPhieu("");
        fetchCoCheLuong();
      } else {
        alert(result.error || "Lỗi khi lưu dữ liệu");
      }
    } catch (error) {
      alert("Lỗi kết nối");
    } finally {
      setSavingCoCheLuong(false);
    }
  };

  // Initialize form with default dates when moving to step 2
  const handleGoToStep2 = () => {
    // Pre-fill dates for all selected employees
    const newFormData = { ...formData };
    selectedEmployees.forEach((empId) => {
      if (!newFormData[empId]) {
        newFormData[empId] = {};
      }
      if (!newFormData[empId].ngayBatDau) {
        newFormData[empId].ngayBatDau = defaultDates.ngayBatDau;
      }
      if (!newFormData[empId].ngayKetThuc) {
        newFormData[empId].ngayKetThuc = defaultDates.ngayKetThuc;
      }
    });
    setFormData(newFormData);
    setStep(2);
  };

  // Update form data for a specific employee
  const updateFormData = (empId: number, field: keyof CoCheLuong, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value,
      },
    }));
  };

  // Fetch data when tab or month/year changes
  useEffect(() => {
    if (activeSubTab === "co-che-luong") {
      fetchCoCheLuong();
    } else if (activeSubTab === "bang-luong" || activeSubTab === "phieu-luong-thang" || activeSubTab === "phieu-luong-nv") {
      fetchSalaryData();
    }
  }, [activeSubTab, selectedMonth, selectedYear]);

  // Auto-select Mã phiếu for Phiếu tính lương hàng tháng when data loads
  useEffect(() => {
    if (activeSubTab === "phieu-luong-thang" && salaryData.length > 0 && !selectedPhieuLuongThangMaPhieu) {
      const uniqueList = Array.from(
        new Set(salaryData.map((item) => item.maPhieu).filter((m) => m))
      ).sort((a, b) => b.localeCompare(a));
      if (uniqueList.length > 0) {
        setSelectedPhieuLuongThangMaPhieu(uniqueList[0]);
      }
    }
  }, [activeSubTab, salaryData, selectedPhieuLuongThangMaPhieu]);

  // Auto-select Mã phiếu for Phiếu thông báo lương NV when data loads
  useEffect(() => {
    if (activeSubTab === "phieu-luong-nv" && salaryData.length > 0 && !selectedPhieuNVMaPhieu) {
      const uniqueList = Array.from(
        new Set(salaryData.map((item) => item.maPhieu).filter((m) => m))
      ).sort((a, b) => b.localeCompare(a));
      if (uniqueList.length > 0) {
        setSelectedPhieuNVMaPhieu(uniqueList[0]);
      }
    }
  }, [activeSubTab, salaryData, selectedPhieuNVMaPhieu]);

  // Fetch employees and set default mã phiếu when showing create form
  useEffect(() => {
    if (showCreateForm) {
      if (employees.length === 0) {
        fetchEmployees();
      }
      // Set default mã phiếu
      setInputMaPhieu(generateMaPhieu(selectedMonth, selectedYear));
    }
  }, [showCreateForm, selectedMonth, selectedYear]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value === 0 || isNaN(value)) return "-";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  // Format money helper functions for salary table
  const formatMoney = (value: number | null | undefined): string => {
    if (!value || value === 0) return "-";
    return value.toLocaleString("vi-VN");
  };

  const formatPositiveMoney = (value: number | null | undefined): string => {
    if (!value || value === 0) return "-";
    return `+${value.toLocaleString("vi-VN")}`;
  };

  const formatNegativeMoney = (value: number | null | undefined): string => {
    if (!value || value === 0) return "-";
    return `-${value.toLocaleString("vi-VN")}`;
  };

  // Get unique Mã phiếu list for salary
  const uniqueSalaryMaPhieuList = Array.from(
    new Set(salaryData.map((item) => item.maPhieu).filter((m) => m))
  ).sort((a, b) => b.localeCompare(a));

  // Filter salary data by selected Mã phiếu
  const filteredSalaryData = salaryData.filter((item) => item.maPhieu === selectedSalaryMaPhieu);

  // Calculate totals from filtered salary data
  const salaryTotals = filteredSalaryData.reduce(
    (acc, row) => ({
      mucLuongCoBan: acc.mucLuongCoBan + row.mucLuongCoBan,
      luongThucTe: acc.luongThucTe + row.luongThucTe,
      tongPhuCap: acc.tongPhuCap + row.tongPhuCap,
      kpiSXVP: acc.kpiSXVP + row.kpiSXVP,
      kpiSale: acc.kpiSale + row.kpiSale,
      thuongSangKien: acc.thuongSangKien + row.thuongSangKien,
      truBHYTBHXHBHTN: acc.truBHYTBHXHBHTN + row.truBHYTBHXHBHTN,
      truTNCN: acc.truTNCN + row.truTNCN,
      thucLinh: acc.thucLinh + row.thucLinh,
    }),
    {
      mucLuongCoBan: 0,
      luongThucTe: 0,
      tongPhuCap: 0,
      kpiSXVP: 0,
      kpiSale: 0,
      thuongSangKien: 0,
      truBHYTBHXHBHTN: 0,
      truTNCN: 0,
      thucLinh: 0,
    }
  );

  // Filter data for Phiếu tính lương hàng tháng
  const filteredPhieuLuongThangData = salaryData.filter((item) => item.maPhieu === selectedPhieuLuongThangMaPhieu);

  // Get unique employee list for selected Mã phiếu in Phiếu thông báo lương NV
  const filteredPhieuNVByMaPhieu = salaryData.filter((item) => item.maPhieu === selectedPhieuNVMaPhieu);
  const uniquePhieuNVEmployeeList = Array.from(
    new Set(filteredPhieuNVByMaPhieu.map((item) => item.hoVaTen).filter((n) => n))
  ).sort((a, b) => a.localeCompare(b));

  // Get selected employee data for Phiếu thông báo lương NV
  const selectedPhieuNVData = salaryData.find(
    (item) => item.maPhieu === selectedPhieuNVMaPhieu && item.hoVaTen === selectedPhieuNVEmployee
  );

  const handleExportPhieuLuongPDF = () => {
    if (!selectedPhieuNVData) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const d = selectedPhieuNVData;
    const fmt = (v: number | null | undefined) => (!v || v === 0) ? "-" : v.toLocaleString("vi-VN");

    printWindow.document.write(`<html><head><title>Phiếu lương - ${d.hoVaTen}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial,sans-serif; padding:30px; color:#333; max-width:800px; margin:0 auto; }
        h1 { font-size:20px; margin-bottom:5px; text-align:center; color:#7c3aed; }
        .subtitle { text-align:center; color:#666; margin-bottom:20px; font-size:13px; }
        .info { display:flex; justify-content:space-between; padding:15px; background:#f5f3ff; border-radius:8px; margin-bottom:20px; }
        .info-left { font-size:14px; }
        .info-left strong { font-size:18px; display:block; margin-bottom:4px; }
        .info-right { text-align:right; }
        .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:15px; }
        .card { padding:12px; border-radius:8px; border:1px solid #e5e7eb; }
        .card .label { font-size:11px; color:#666; margin-bottom:4px; }
        .card .value { font-size:18px; font-weight:700; }
        .section { margin-bottom:15px; }
        .section-title { font-size:14px; font-weight:600; padding:8px 12px; background:#f9fafb; border-bottom:1px solid #e5e7eb; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        td { padding:8px 12px; border-bottom:1px solid #f0f0f0; }
        .row { display:flex; justify-content:space-between; padding:6px 12px; background:#f9fafb; margin:3px 0; border-radius:4px; }
        .total-box { text-align:center; padding:20px; background:linear-gradient(135deg,#22c55e,#059669); color:white; border-radius:12px; margin-top:20px; }
        .total-box .amount { font-size:36px; font-weight:900; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px; }
        @media print { body { padding:15px; } }
      </style></head><body>
      <h1>PHIẾU THÔNG BÁO LƯƠNG</h1>
      <p class="subtitle">Mã phiếu: ${d.maPhieu}</p>

      <div class="info">
        <div class="info-left">
          <strong>${d.hoVaTen}</strong>
          <span>Chức vụ: ${d.chucVu || "N/A"} | Bộ phận: ${d.boPhan || "N/A"}</span>
        </div>
        <div class="info-right">
          <div style="font-size:12px;color:#666;">Kỳ lương</div>
          <div style="font-size:13px;">${d.ngayBatDau} - ${d.ngayKetThuc}</div>
        </div>
      </div>

      <div class="grid3">
        <div class="card" style="background:#eff6ff;border-color:#bfdbfe;">
          <div class="label">Mức lương cơ bản</div>
          <div class="value" style="color:#1d4ed8;">${fmt(d.mucLuongCoBan)}</div>
        </div>
        <div class="card" style="background:#f0fdf4;border-color:#bbf7d0;">
          <div class="label">Thưởng chuyên cần</div>
          <div class="value" style="color:#15803d;">${fmt(d.thuongChuyenCan)}</div>
        </div>
        <div class="card" style="background:#f5f3ff;border-color:#ddd6fe;">
          <div class="label">Quỹ lương</div>
          <div class="value" style="color:#7c3aed;">${fmt(d.quyLuong)}</div>
        </div>
      </div>

      <div class="section" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div class="section-title">Công & Lương thực tế</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding:12px;">
          <div style="text-align:center;padding:8px;background:#f9fafb;border-radius:6px;">
            <div style="font-size:11px;color:#666;">Công thực tế</div>
            <div style="font-size:18px;font-weight:700;">${d.congThucTe || 0}</div>
          </div>
          <div style="text-align:center;padding:8px;background:#fff7ed;border-radius:6px;">
            <div style="font-size:11px;color:#666;">Đi muộn</div>
            <div style="font-size:18px;font-weight:700;color:#ea580c;">${d.diMuon || 0}</div>
          </div>
          <div style="text-align:center;padding:8px;background:#eff6ff;border-radius:6px;">
            <div style="font-size:11px;color:#666;">Lương thực tế</div>
            <div style="font-size:16px;font-weight:700;color:#1d4ed8;">${fmt(d.luongThucTe)}</div>
          </div>
          <div style="text-align:center;padding:8px;background:#f0fdf4;border-radius:6px;">
            <div style="font-size:11px;color:#666;">Lương thêm giờ</div>
            <div style="font-size:16px;font-weight:700;color:#16a34a;">${fmt(d.luongThemGio)}</div>
          </div>
        </div>
      </div>

      <div class="section" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div class="section-title" style="background:#f0fdf4;">Phụ cấp</div>
        <div style="padding:10px;">
          <div class="grid3">
            <div class="row"><span>Ăn trưa/ngày</span><span>${fmt(d.phuCapAnTruaNgay)}</span></div>
            <div class="row"><span>Ăn trưa/tháng</span><span>${fmt(d.phuCapAnTruaThang)}</span></div>
            <div class="row"><span>Xăng xe</span><span>${fmt(d.phuCapXangXeThang)}</span></div>
            <div class="row"><span>Điện thoại</span><span>${fmt(d.phuCapDienThoaiThang)}</span></div>
            <div class="row"><span>Độc hại</span><span>${fmt(d.phuCapDocHaiNangNhocThang)}</span></div>
            <div class="row"><span>Trang phục</span><span>${fmt(d.phuCapTrangPhucThang)}</span></div>
            <div class="row"><span>Nhà ở</span><span>${fmt(d.phuCapNhaOThang)}</span></div>
            <div class="row"><span>Giữ trẻ/nuôi con</span><span>${fmt(d.giuTreVaNuoiCon)}</span></div>
            <div class="row"><span>Khác</span><span>${fmt(d.phuCapKhac)}</span></div>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 12px;background:#dcfce7;border-radius:6px;font-weight:700;color:#166534;border:1px solid #86efac;">
            <span>TỔNG PHỤ CẤP</span><span style="font-size:18px;">${fmt(d.tongPhuCap)}</span>
          </div>
        </div>
      </div>

      <div class="grid2">
        <div class="section" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div class="section-title" style="background:#eff6ff;">Thưởng & KPI</div>
          <div style="padding:10px;">
            <div class="row"><span>KPI SX, VP</span><span style="color:#2563eb;font-weight:600;">+${fmt(d.kpiSXVP)}</span></div>
            <div class="row"><span>KPI Sale</span><span style="color:#0891b2;font-weight:600;">+${fmt(d.kpiSale)}</span></div>
            <div class="row"><span>Thưởng sáng kiến</span><span style="color:#16a34a;font-weight:600;">+${fmt(d.thuongSangKien)}</span></div>
            <div class="row"><span>Cộng khác</span><span style="color:#7c3aed;font-weight:600;">+${fmt(d.congKhac)}</span></div>
          </div>
        </div>
        <div class="section" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div class="section-title" style="background:#fff7ed;">Các khoản trừ</div>
          <div style="padding:10px;">
            <div class="row"><span>BHXH, BHYT, BHTN</span><span style="color:#ea580c;font-weight:600;">-${fmt(d.truBHYTBHXHBHTN)}</span></div>
            <div class="row"><span>Thuế TNCN</span><span style="color:#dc2626;font-weight:600;">-${fmt(d.truTNCN)}</span></div>
            <div class="row"><span>Công đoàn</span><span style="color:#666;font-weight:600;">-${fmt(d.truCongDoan)}</span></div>
            <div class="row"><span>Trừ khác</span><span style="color:#666;font-weight:600;">-${fmt(d.truKhac)}</span></div>
          </div>
        </div>
      </div>

      <div class="total-box">
        <div style="font-size:16px;margin-bottom:8px;">THỰC LĨNH</div>
        <div class="amount">${fmt(d.thucLinh)}</div>
        <div style="font-size:14px;margin-top:4px;">VNĐ</div>
      </div>

      ${d.ghiChu ? `<div style="margin-top:15px;padding:12px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;">
        <strong style="color:#92400e;font-size:13px;">Ghi chú:</strong>
        <p style="color:#666;margin-top:4px;">${d.ghiChu}</p>
      </div>` : ""}
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Banknote className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Bảng lương</h2>
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

      {/* Month/Year selector for relevant tabs */}
      {["co-che-luong", "bang-luong", "phieu-luong-thang", "phieu-luong-nv", "lich-su"].includes(activeSubTab) && (
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
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
              if (activeSubTab === "co-che-luong") {
                fetchCoCheLuong();
              } else if (activeSubTab === "bang-luong" || activeSubTab === "phieu-luong-thang" || activeSubTab === "phieu-luong-nv") {
                fetchSalaryData();
              }
            }}
            disabled={loadingCoCheLuong || loadingSalary}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {(loadingCoCheLuong || loadingSalary) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Xem
          </button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {activeSubTab === "co-che-luong" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Cơ chế lương tháng {selectedMonth}/{selectedYear}
              </h3>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tạo cơ chế lương
                </button>
              )}
            </div>

            {loadingCoCheLuong ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            ) : errorCoCheLuong ? (
              <div className="text-center text-red-500 py-8">
                <p>{errorCoCheLuong}</p>
                <button
                  onClick={fetchCoCheLuong}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </div>
            ) : coCheLuongData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                <p>Chưa có cơ chế lương được thiết lập</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">Ngày BĐ</th>
                      <th className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">Ngày KT</th>
                      <th className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">Mã phiếu</th>
                      <th className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">Nhân viên</th>
                      <th className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">Bộ phận</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">Mức lương cơ bản</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">Thưởng chuyên cần</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">PC ăn trưa</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">PC xăng xe</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">PC điện thoại</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">PC khác 1</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">PC trang phục</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">PC nhà ở</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">Giữ trẻ/nuôi con</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">PC khác</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">Thưởng sáng kiến</th>
                      <th className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">Lương partime</th>
                      <th className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coCheLuongData.map((item, index) => (
                      <tr key={item.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-300 px-2 py-2 whitespace-nowrap">{item.ngayBatDau || "-"}</td>
                        <td className="border border-gray-300 px-2 py-2 whitespace-nowrap">{item.ngayKetThuc || "-"}</td>
                        <td className="border border-gray-300 px-2 py-2 whitespace-nowrap">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {item.maPhieu || "-"}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 whitespace-nowrap font-medium">{item.nhanVien || "-"}</td>
                        <td className="border border-gray-300 px-2 py-2 whitespace-nowrap">{item.boPhan || "-"}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.mucLuongCoBan)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.thuongChuyenCan)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.phuCapAnTrua)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.phuCapXangXe)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.phuCapDienThoai)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.phuCapKhac1)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.phuCapTrangPhuc)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.phuCapNhaO)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.giuTreNuoiCon)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.phuCapKhac)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.thuongSangKien)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right whitespace-nowrap">{formatCurrency(item.luongPartime)}</td>
                        <td className="border border-gray-300 px-2 py-2 max-w-50 truncate">{item.ghiChu || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-sm text-gray-600">
                  Tổng số: {coCheLuongData.length} nhân viên
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "bang-luong" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">
                  Bảng kê tiền lương ({filteredSalaryData.length} nhân viên)
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Kỳ lương:</label>
                  <select
                    value={selectedSalaryMaPhieu}
                    onChange={(e) => setSelectedSalaryMaPhieu(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {uniqueSalaryMaPhieuList.map((maPhieu) => (
                      <option key={maPhieu} value={maPhieu}>
                        {maPhieu}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loadingSalary ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            ) : errorSalary ? (
              <div className="text-center text-red-500 py-8">
                <p>{errorSalary}</p>
                <button
                  onClick={fetchSalaryData}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredSalaryData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="mx-auto mb-4 text-gray-300" size={48} />
                <p>Chưa có dữ liệu bảng lương cho kỳ này</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 sticky left-0 bg-gray-50">STT</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 sticky left-14 bg-gray-50">Họ và tên</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500" style={{ minWidth: "200px" }}>Chức vụ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Lương cơ bản</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Công thực tế</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Tổng phụ cấp</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">KPI SX, VP</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">KPI Sale</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-orange-50">Trừ BHXH/BHYT/BHTN</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-orange-50">Trừ TNCN</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-green-50">Thực lĩnh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSalaryData.map((row, index) => (
                      <tr
                        key={row.id}
                        className="group cursor-pointer transition-colors"
                        onClick={() => setSelectedSalaryEmployee(row)}
                      >
                        <td className="px-4 py-4 text-sm text-gray-600 sticky left-0 bg-white group-hover:bg-blue-50 transition-colors">{index + 1}</td>
                        <td className="px-4 py-4 sticky left-14 bg-white group-hover:bg-blue-50 transition-colors">
                          <p className="text-sm font-medium text-gray-900">{row.hoVaTen}</p>
                        </td>
                        <td className="px-4 py-4 group-hover:bg-blue-50 transition-colors">
                          {row.chucVu && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">{row.chucVu}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 group-hover:bg-blue-50 transition-colors">{formatMoney(row.mucLuongCoBan)}</td>
                        <td className="px-4 py-4 text-sm text-center text-gray-600 group-hover:bg-blue-50 transition-colors">{row.congThucTe || "-"}</td>
                        <td className="px-4 py-4 text-sm text-right text-green-600 group-hover:bg-blue-50 transition-colors">{formatPositiveMoney(row.tongPhuCap)}</td>
                        <td className="px-4 py-4 text-sm text-right text-blue-600 group-hover:bg-blue-50 transition-colors">{formatPositiveMoney(row.kpiSXVP)}</td>
                        <td className="px-4 py-4 text-sm text-right text-blue-600 group-hover:bg-blue-50 transition-colors">{formatPositiveMoney(row.kpiSale)}</td>
                        <td className="px-4 py-4 text-sm text-right text-orange-600 bg-orange-50 group-hover:bg-blue-50 transition-colors">{formatNegativeMoney(row.truBHYTBHXHBHTN)}</td>
                        <td className="px-4 py-4 text-sm text-right text-orange-600 bg-orange-50 group-hover:bg-blue-50 transition-colors">{formatNegativeMoney(row.truTNCN)}</td>
                        <td className="px-4 py-4 text-sm text-right font-bold text-green-600 bg-green-50 group-hover:bg-blue-50 transition-colors">{formatMoney(row.thucLinh)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={3} className="px-4 py-3 text-right">Tổng cộng:</td>
                      <td className="px-4 py-3 text-right">{formatMoney(salaryTotals.mucLuongCoBan)}</td>
                      <td className="px-4 py-3 text-center">-</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatPositiveMoney(salaryTotals.tongPhuCap)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatPositiveMoney(salaryTotals.kpiSXVP)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatPositiveMoney(salaryTotals.kpiSale)}</td>
                      <td className="px-4 py-3 text-right text-orange-600 bg-orange-100">{formatNegativeMoney(salaryTotals.truBHYTBHXHBHTN)}</td>
                      <td className="px-4 py-3 text-right text-orange-600 bg-orange-100">{formatNegativeMoney(salaryTotals.truTNCN)}</td>
                      <td className="px-4 py-3 text-right text-green-700 bg-green-100">{formatMoney(salaryTotals.thucLinh)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "phieu-luong-thang" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">
                  Phiếu tính lương hàng tháng ({filteredPhieuLuongThangData.length} nhân viên)
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Kỳ lương:</label>
                  <select
                    value={selectedPhieuLuongThangMaPhieu}
                    onChange={(e) => setSelectedPhieuLuongThangMaPhieu(e.target.value)}
                    className="px-3 py-2 border border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50 font-semibold text-green-800"
                  >
                    {uniqueSalaryMaPhieuList.map((maPhieu) => (
                      <option key={maPhieu} value={maPhieu}>
                        {maPhieu}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loadingSalary ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            ) : errorSalary ? (
              <div className="text-center text-red-500 py-8">
                <p>{errorSalary}</p>
                <button
                  onClick={fetchSalaryData}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredPhieuLuongThangData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                <p>Chưa có dữ liệu phiếu lương cho kỳ này</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                      <th className="px-4 py-3 text-left text-sm font-medium sticky left-0 bg-green-600">STT</th>
                      <th className="px-4 py-3 text-left text-sm font-medium sticky left-14 bg-green-600">Họ và tên</th>
                      <th className="px-4 py-3 text-left text-sm font-medium" style={{ minWidth: "150px" }}>Chức vụ</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Bộ phận</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Lương cơ bản</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Công thực tế</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Lương thực tế</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Tổng phụ cấp</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">KPI SX, VP</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">KPI Sale</th>
                      <th className="px-4 py-3 text-right text-sm font-medium bg-orange-600">Trừ BH</th>
                      <th className="px-4 py-3 text-right text-sm font-medium bg-orange-600">Trừ TNCN</th>
                      <th className="px-4 py-3 text-right text-sm font-medium bg-green-800">Thực lĩnh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPhieuLuongThangData.map((row, index) => (
                      <tr
                        key={row.id}
                        className="group cursor-pointer transition-colors hover:bg-green-50"
                        onClick={() => setSelectedSalaryEmployee(row)}
                      >
                        <td className="px-4 py-4 text-sm text-gray-600 sticky left-0 bg-white group-hover:bg-green-50 transition-colors">{index + 1}</td>
                        <td className="px-4 py-4 sticky left-14 bg-white group-hover:bg-green-50 transition-colors">
                          <p className="text-sm font-medium text-gray-900">{row.hoVaTen}</p>
                        </td>
                        <td className="px-4 py-4 group-hover:bg-green-50 transition-colors">
                          {row.chucVu && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">{row.chucVu}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 group-hover:bg-green-50 transition-colors">{row.boPhan || "-"}</td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 group-hover:bg-green-50 transition-colors">{formatMoney(row.mucLuongCoBan)}</td>
                        <td className="px-4 py-4 text-sm text-center text-gray-600 group-hover:bg-green-50 transition-colors">{row.congThucTe || "-"}</td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 group-hover:bg-green-50 transition-colors">{formatMoney(row.luongThucTe)}</td>
                        <td className="px-4 py-4 text-sm text-right text-green-600 group-hover:bg-green-50 transition-colors">{formatPositiveMoney(row.tongPhuCap)}</td>
                        <td className="px-4 py-4 text-sm text-right text-blue-600 group-hover:bg-green-50 transition-colors">{formatPositiveMoney(row.kpiSXVP)}</td>
                        <td className="px-4 py-4 text-sm text-right text-blue-600 group-hover:bg-green-50 transition-colors">{formatPositiveMoney(row.kpiSale)}</td>
                        <td className="px-4 py-4 text-sm text-right text-orange-600 bg-orange-50 group-hover:bg-green-50 transition-colors">{formatNegativeMoney(row.truBHYTBHXHBHTN)}</td>
                        <td className="px-4 py-4 text-sm text-right text-orange-600 bg-orange-50 group-hover:bg-green-50 transition-colors">{formatNegativeMoney(row.truTNCN)}</td>
                        <td className="px-4 py-4 text-sm text-right font-bold text-green-600 bg-green-50 group-hover:bg-green-100 transition-colors">{formatMoney(row.thucLinh)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={4} className="px-4 py-3 text-right">Tổng cộng:</td>
                      <td className="px-4 py-3 text-right">{formatMoney(filteredPhieuLuongThangData.reduce((sum, r) => sum + r.mucLuongCoBan, 0))}</td>
                      <td className="px-4 py-3 text-center">-</td>
                      <td className="px-4 py-3 text-right">{formatMoney(filteredPhieuLuongThangData.reduce((sum, r) => sum + r.luongThucTe, 0))}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatPositiveMoney(filteredPhieuLuongThangData.reduce((sum, r) => sum + r.tongPhuCap, 0))}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatPositiveMoney(filteredPhieuLuongThangData.reduce((sum, r) => sum + r.kpiSXVP, 0))}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatPositiveMoney(filteredPhieuLuongThangData.reduce((sum, r) => sum + r.kpiSale, 0))}</td>
                      <td className="px-4 py-3 text-right text-orange-600 bg-orange-100">{formatNegativeMoney(filteredPhieuLuongThangData.reduce((sum, r) => sum + r.truBHYTBHXHBHTN, 0))}</td>
                      <td className="px-4 py-3 text-right text-orange-600 bg-orange-100">{formatNegativeMoney(filteredPhieuLuongThangData.reduce((sum, r) => sum + r.truTNCN, 0))}</td>
                      <td className="px-4 py-3 text-right text-green-700 bg-green-100">{formatMoney(filteredPhieuLuongThangData.reduce((sum, r) => sum + r.thucLinh, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "phieu-luong-nv" && (
          <div>
            {/* Header with dropdowns */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Send size={24} />
                  Phiếu thông báo lương cho nhân viên
                </h3>
                <button
                  onClick={handleExportPhieuLuongPDF}
                  disabled={!selectedPhieuNVData}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown size={16} />
                  Xuất PDF
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-100 mb-1">Nhân viên</label>
                  <select
                    value={selectedPhieuNVEmployee}
                    onChange={(e) => setSelectedPhieuNVEmployee(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-purple-300"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {uniquePhieuNVEmployeeList.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-100 mb-1">Mã phiếu</label>
                  <select
                    value={selectedPhieuNVMaPhieu}
                    onChange={(e) => {
                      setSelectedPhieuNVMaPhieu(e.target.value);
                      setSelectedPhieuNVEmployee(""); // Reset employee when changing period
                    }}
                    className="w-full px-4 py-2 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-purple-300"
                  >
                    {uniqueSalaryMaPhieuList.map((maPhieu) => (
                      <option key={maPhieu} value={maPhieu}>
                        {maPhieu}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="border border-t-0 border-gray-200 rounded-b-xl p-6">
              {loadingSalary ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                </div>
              ) : !selectedPhieuNVEmployee ? (
                <div className="text-center text-gray-500 py-12">
                  <User className="mx-auto mb-4 text-gray-300" size={64} />
                  <p className="text-lg">Vui lòng chọn nhân viên để xem phiếu lương</p>
                </div>
              ) : !selectedPhieuNVData ? (
                <div className="text-center text-gray-500 py-12">
                  <AlertCircle className="mx-auto mb-4 text-gray-300" size={64} />
                  <p className="text-lg">Không tìm thấy dữ liệu lương cho nhân viên này</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Employee Info Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {selectedPhieuNVData.hoVaTen?.split(" ").slice(-1)[0]?.[0] || "?"}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-2xl font-bold text-gray-900">{selectedPhieuNVData.hoVaTen}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {selectedPhieuNVData.chucVu || "N/A"}
                          </span>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                            {selectedPhieuNVData.boPhan || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Mã phiếu</p>
                        <p className="text-xl font-bold text-purple-600">{selectedPhieuNVData.maPhieu}</p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Details Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Lương cơ bản */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Mức lương cơ bản</p>
                      <p className="text-2xl font-bold text-blue-700">{formatMoney(selectedPhieuNVData.mucLuongCoBan)}</p>
                    </div>
                    {/* Thưởng chuyên cần */}
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Thưởng chuyên cần</p>
                      <p className="text-2xl font-bold text-green-700">{formatMoney(selectedPhieuNVData.thuongChuyenCan)}</p>
                    </div>
                    {/* Quỹ lương */}
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-gray-600 mb-1">Quỹ lương</p>
                      <p className="text-2xl font-bold text-purple-700">{formatMoney(selectedPhieuNVData.quyLuong)}</p>
                    </div>
                  </div>

                  {/* Công & Lương thực tế */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Clock size={18} className="text-gray-600" />
                        Công & Lương thực tế
                      </h5>
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Công thực tế</p>
                        <p className="text-xl font-bold text-gray-800">{selectedPhieuNVData.congThucTe || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Đi muộn</p>
                        <p className="text-xl font-bold text-orange-600">{selectedPhieuNVData.diMuon || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Lương thực tế</p>
                        <p className="text-lg font-bold text-blue-700">{formatMoney(selectedPhieuNVData.luongThucTe)}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Lương thêm giờ</p>
                        <p className="text-lg font-bold text-green-600">{formatMoney(selectedPhieuNVData.luongThemGio)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Phụ cấp */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Gift size={18} className="text-green-600" />
                        Phụ cấp
                      </h5>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-3">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Ăn trưa/ngày</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.phuCapAnTruaNgay)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Ăn trưa/tháng</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.phuCapAnTruaThang)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Xăng xe</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.phuCapXangXeThang)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Điện thoại</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.phuCapDienThoaiThang)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Độc hại</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.phuCapDocHaiNangNhocThang)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Trang phục</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.phuCapTrangPhucThang)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Nhà ở</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.phuCapNhaOThang)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Giữ trẻ/nuôi con</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.giuTreVaNuoiCon)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Khác</span>
                        <span className="font-medium">{formatMoney(selectedPhieuNVData.phuCapKhac)}</span>
                      </div>
                      <div className="col-span-3 flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-300">
                        <span className="font-semibold text-green-800">TỔNG PHỤ CẤP</span>
                        <span className="text-xl font-bold text-green-700">{formatMoney(selectedPhieuNVData.tongPhuCap)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Thưởng & KPI */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                        <h5 className="font-semibold text-gray-800">Thưởng & KPI</h5>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <span className="text-sm">KPI SX, VP</span>
                          <span className="font-bold text-blue-600">+{formatMoney(selectedPhieuNVData.kpiSXVP)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-cyan-50 rounded">
                          <span className="text-sm">KPI Sale</span>
                          <span className="font-bold text-cyan-600">+{formatMoney(selectedPhieuNVData.kpiSale)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-sm">Thưởng sáng kiến</span>
                          <span className="font-bold text-green-600">+{formatMoney(selectedPhieuNVData.thuongSangKien)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                          <span className="text-sm">Cộng khác</span>
                          <span className="font-bold text-purple-600">+{formatMoney(selectedPhieuNVData.congKhac)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Các khoản trừ */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-orange-50 px-4 py-3 border-b border-gray-200">
                        <h5 className="font-semibold text-gray-800">Các khoản trừ</h5>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                          <span className="text-sm">BHXH, BHYT, BHTN</span>
                          <span className="font-bold text-orange-600">-{formatMoney(selectedPhieuNVData.truBHYTBHXHBHTN)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <span className="text-sm">Thuế TNCN</span>
                          <span className="font-bold text-red-600">-{formatMoney(selectedPhieuNVData.truTNCN)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Công đoàn</span>
                          <span className="font-bold text-gray-600">-{formatMoney(selectedPhieuNVData.truCongDoan)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Trừ khác</span>
                          <span className="font-bold text-gray-600">-{formatMoney(selectedPhieuNVData.truKhac)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thực lĩnh */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white text-center">
                    <p className="text-lg font-medium mb-2">THỰC LĨNH</p>
                    <p className="text-5xl font-black">{formatMoney(selectedPhieuNVData.thucLinh)}</p>
                    <p className="text-lg mt-1">VNĐ</p>
                  </div>

                  {/* Ghi chú */}
                  {selectedPhieuNVData.ghiChu && (
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Ghi chú:</p>
                      <p className="text-gray-700">{selectedPhieuNVData.ghiChu}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "lich-su" && (
          <div className="text-center text-gray-500 py-8">
            <History className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Lịch sử trả lương nhân viên</p>
            <p className="text-sm mt-2">Chưa có lịch sử</p>
          </div>
        )}
      </div>

      {/* Create Co Che Luong Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Banknote size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tạo cơ chế lương mới</h3>
                  <p className="text-green-100 text-sm">
                    {step === 1 ? "Bước 1: Chọn nhân viên" : "Bước 2: Nhập thông tin lương"} - Tháng {selectedMonth}/{selectedYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedEmployees([]);
                  setFormData({});
                  setStep(1);
                  setInputMaPhieu("");
                }}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(95vh-150px)]">
              {/* Step 1: Employee Selection */}
              {step === 1 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Chọn nhân viên</h4>
                  {loadingEmployees ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-green-600" size={24} />
                      <span className="ml-2 text-gray-600">Đang tải danh sách nhân viên...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                      {employees.map((emp) => {
                        const isSelected = selectedEmployees.includes(emp.id);
                        return (
                          <button
                            key={emp.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id));
                              } else {
                                setSelectedEmployees([...selectedEmployees, emp.id]);
                              }
                            }}
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
                              <p className="text-xs text-gray-500 truncate">{emp.department}</p>
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
              {step === 2 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-700">Nhập thông tin lương</h4>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Mã phiếu <span className="text-red-500">*</span>:</label>
                      <input
                        type="text"
                        value={inputMaPhieu}
                        onChange={(e) => setInputMaPhieu(e.target.value)}
                        className="px-3 py-1 border border-green-400 rounded-lg font-bold text-green-800 bg-green-50 focus:ring-2 focus:ring-green-500 focus:border-green-500 w-32"
                        placeholder="PTL01/26"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Ngày bắt đầu và Ngày kết thúc là bắt buộc (định dạng: ngày/tháng/năm, VD: 1/2/2026)
                    </p>
                  </div>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                          <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Nhân viên</th>
                          <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Bộ phận</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Ngày BĐ</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Ngày KT</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Lương CB</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Chuyên cần</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Ăn trưa</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Xăng xe</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Điện thoại</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">PC khác 1</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Trang phục</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Nhà ở</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Giữ trẻ</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">PC khác</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Sáng kiến</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Partime</th>
                          <th className="px-3 py-3 font-semibold whitespace-nowrap">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmployees.map((empId, index) => {
                          const emp = employees.find((e) => e.id === empId);
                          const form = formData[empId] || {};
                          return (
                            <tr key={empId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-3 py-2 font-medium whitespace-nowrap">{emp?.name}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{emp?.department}</td>
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={form.ngayBatDau || ""}
                                  onChange={(e) => updateFormData(empId, "ngayBatDau", e.target.value)}
                                  className="w-24 px-2 py-1 border border-red-300 rounded text-sm focus:ring-2 focus:ring-green-500 bg-red-50"
                                  placeholder="1/2/2026"
                                  required
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={form.ngayKetThuc || ""}
                                  onChange={(e) => updateFormData(empId, "ngayKetThuc", e.target.value)}
                                  className="w-24 px-2 py-1 border border-red-300 rounded text-sm focus:ring-2 focus:ring-green-500 bg-red-50"
                                  placeholder="28/2/2026"
                                  required
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.mucLuongCoBan || ""}
                                  onChange={(e) => updateFormData(empId, "mucLuongCoBan", parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.thuongChuyenCan || ""}
                                  onChange={(e) => updateFormData(empId, "thuongChuyenCan", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.phuCapAnTrua || ""}
                                  onChange={(e) => updateFormData(empId, "phuCapAnTrua", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.phuCapXangXe || ""}
                                  onChange={(e) => updateFormData(empId, "phuCapXangXe", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.phuCapDienThoai || ""}
                                  onChange={(e) => updateFormData(empId, "phuCapDienThoai", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.phuCapKhac1 || ""}
                                  onChange={(e) => updateFormData(empId, "phuCapKhac1", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.phuCapTrangPhuc || ""}
                                  onChange={(e) => updateFormData(empId, "phuCapTrangPhuc", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.phuCapNhaO || ""}
                                  onChange={(e) => updateFormData(empId, "phuCapNhaO", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.giuTreNuoiCon || ""}
                                  onChange={(e) => updateFormData(empId, "giuTreNuoiCon", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.phuCapKhac || ""}
                                  onChange={(e) => updateFormData(empId, "phuCapKhac", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.thuongSangKien || ""}
                                  onChange={(e) => updateFormData(empId, "thuongSangKien", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={form.luongPartime || ""}
                                  onChange={(e) => updateFormData(empId, "luongPartime", parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={form.ghiChu || ""}
                                  onChange={(e) => updateFormData(empId, "ghiChu", e.target.value)}
                                  className="w-24 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500"
                                  placeholder="Ghi chú"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Đã chọn: {selectedEmployees.length} nhân viên
              </div>
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                  >
                    Quay lại
                  </button>
                )}
                {step === 1 ? (
                  <button
                    onClick={handleGoToStep2}
                    disabled={selectedEmployees.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <button
                    onClick={handleSaveCoCheLuong}
                    disabled={savingCoCheLuong}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {savingCoCheLuong ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Lưu cơ chế lương
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Employee Detail Modal */}
      {selectedSalaryEmployee && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSalaryEmployee(null)}
        >
          <div
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <User size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedSalaryEmployee.hoVaTen}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                        {selectedSalaryEmployee.chucVu}
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                        {selectedSalaryEmployee.boPhan}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSalaryEmployee(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-600" size={24} />
                    <h4 className="font-bold text-lg text-gray-800">Thông tin cơ bản</h4>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Mã phiếu</p>
                    <p className="font-semibold text-gray-900 text-lg">{selectedSalaryEmployee.maPhieu || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày bắt đầu</p>
                    </div>
                    <p className="font-semibold text-gray-900">{selectedSalaryEmployee.ngayBatDau || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày kết thúc</p>
                    </div>
                    <p className="font-semibold text-gray-900">{selectedSalaryEmployee.ngayKetThuc || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Lương & Công */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-green-600" size={24} />
                    <h4 className="font-bold text-lg text-gray-800">Lương & Công</h4>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Lương cơ bản</p>
                      <p className="font-bold text-xl text-gray-900">{selectedSalaryEmployee.mucLuongCoBan.toLocaleString("vi-VN")}</p>
                      <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Thưởng chuyên cần</p>
                      <p className="font-bold text-xl text-green-700">+{selectedSalaryEmployee.thuongChuyenCan.toLocaleString("vi-VN")}</p>
                      <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Quỹ lương</p>
                      <p className="font-bold text-xl text-gray-900">{selectedSalaryEmployee.quyLuong.toLocaleString("vi-VN")}</p>
                      <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-gray-600" />
                        <p className="text-xs text-gray-600">Công thực tế</p>
                      </div>
                      <p className="font-bold text-2xl text-gray-900">{selectedSalaryEmployee.congThucTe}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-orange-600" />
                        <p className="text-xs text-gray-600">Đi muộn</p>
                      </div>
                      <p className="font-bold text-2xl text-orange-600">{selectedSalaryEmployee.diMuon}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-blue-600" />
                        <p className="text-xs text-gray-600">Làm thêm giờ</p>
                      </div>
                      <p className="font-bold text-2xl text-blue-600">{selectedSalaryEmployee.lamThemGio}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Lương thực tế</p>
                      <p className="font-bold text-lg text-gray-900">{selectedSalaryEmployee.luongThucTe.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Trừ đi muộn</p>
                      <p className="font-bold text-lg text-orange-600">-{selectedSalaryEmployee.truDiMuon.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Lương thêm giờ</p>
                      <p className="font-bold text-lg text-green-600">+{selectedSalaryEmployee.luongThemGio.toLocaleString("vi-VN")} đ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phụ cấp */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-purple-600" size={24} />
                    <h4 className="font-bold text-lg text-gray-800">Phụ cấp</h4>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-3">
                  {[
                    { label: "Ăn trưa/ngày", value: selectedSalaryEmployee.phuCapAnTruaNgay },
                    { label: "Ăn trưa/tháng", value: selectedSalaryEmployee.phuCapAnTruaThang },
                    { label: "Xăng xe", value: selectedSalaryEmployee.phuCapXangXeThang },
                    { label: "Điện thoại", value: selectedSalaryEmployee.phuCapDienThoaiThang },
                    { label: "Độc hại, nặng nhọc", value: selectedSalaryEmployee.phuCapDocHaiNangNhocThang },
                    { label: "Trang phục", value: selectedSalaryEmployee.phuCapTrangPhucThang },
                    { label: "Nhà ở", value: selectedSalaryEmployee.phuCapNhaOThang },
                    { label: "Giữ trẻ và nuôi con", value: selectedSalaryEmployee.giuTreVaNuoiCon },
                    { label: "Phụ cấp khác", value: selectedSalaryEmployee.phuCapKhac },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700">{item.label}</p>
                      <p className="font-semibold text-gray-900">{item.value.toLocaleString("vi-VN")} đ</p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-300">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800">TỔNG PHỤ CẤP</p>
                      <p className="font-bold text-2xl text-purple-700">{selectedSalaryEmployee.tongPhuCap.toLocaleString("vi-VN")} đ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thưởng & Các khoản trừ */}
              <div className="grid grid-cols-2 gap-6">
                {/* Thưởng */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Gift className="text-blue-600" size={24} />
                      <h4 className="font-bold text-lg text-gray-800">Thưởng</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">KPI SX, VP</p>
                      <p className="font-bold text-xl text-blue-600">+{selectedSalaryEmployee.kpiSXVP.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                      <p className="text-xs text-gray-600 mb-1">KPI Sale</p>
                      <p className="font-bold text-xl text-cyan-600">+{selectedSalaryEmployee.kpiSale.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Thưởng sáng kiến</p>
                      <p className="font-bold text-xl text-green-600">+{selectedSalaryEmployee.thuongSangKien.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Cộng khác</p>
                      <p className="font-bold text-xl text-purple-600">+{selectedSalaryEmployee.congKhac.toLocaleString("vi-VN")} đ</p>
                    </div>
                  </div>
                </div>

                {/* Các khoản trừ */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-orange-600" size={24} />
                      <h4 className="font-bold text-lg text-gray-800">Các khoản trừ</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">BHXH, BHYT, BHTN</p>
                      <p className="font-bold text-xl text-orange-600">-{selectedSalaryEmployee.truBHYTBHXHBHTN.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-xs text-gray-600 mb-1">Thuế TNCN</p>
                      <p className="font-bold text-xl text-red-600">-{selectedSalaryEmployee.truTNCN.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Trừ công đoàn</p>
                      <p className="font-bold text-xl text-gray-600">-{selectedSalaryEmployee.truCongDoan.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Trừ khác</p>
                      <p className="font-bold text-xl text-gray-600">-{selectedSalaryEmployee.truKhac.toLocaleString("vi-VN")} đ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thực lĩnh */}
              <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl border-4 border-green-400 overflow-hidden">
                <div className="relative p-8">
                  <div className="absolute inset-0 bg-grid-white/10"></div>
                  <div className="relative text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <CheckCircle size={32} className="text-white" />
                      <p className="text-white text-lg font-semibold uppercase tracking-wide">Thực lĩnh</p>
                    </div>
                    <p className="text-6xl font-black text-white drop-shadow-lg">{selectedSalaryEmployee.thucLinh.toLocaleString("vi-VN")}</p>
                    <p className="text-2xl text-white/90 font-semibold mt-2">VNĐ</p>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              {selectedSalaryEmployee.ghiChu && (
                <div className="bg-yellow-50 rounded-xl shadow-md border-2 border-yellow-200 p-6">
                  <div className="flex items-start gap-3">
                    <FileText className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Ghi chú</h4>
                      <p className="text-gray-700 leading-relaxed">{selectedSalaryEmployee.ghiChu}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
