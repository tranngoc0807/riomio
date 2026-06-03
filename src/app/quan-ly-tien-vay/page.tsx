"use client";

import {
  HandCoins,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  X,
  History,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Portal from "@/components/Portal";
import type { PaymentHistory } from "@/lib/googleSheets";

// Types
interface Loan {
  id: string;
  lender: string;
  type: "long_term" | "short_term" | "personal";
  principal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  remainingPrincipal: number;
  status: "active" | "near_due" | "completed" | "overdue";
  purpose: string;
  notes?: string;
}

// Lãi vay (Danh sách người cho vay) - sheet "Lãi vay"
interface LaiVayItem {
  id: number;
  stt: string;
  nguoiChoVay: string;
  laiSuatNam: string;
  cachTinhLai: string;
  ghiChu: string;
  rowIndex: number;
}

const emptyLaiVay = {
  stt: "",
  nguoiChoVay: "",
  laiSuatNam: "",
  cachTinhLai: "",
  ghiChu: "",
};

// Giao dịch vay (Sổ giao dịch) - sheet "Giao dịch vay"
interface GiaoDichVayItem {
  id: number;
  stt: string;
  ngay: string;
  maMonVay: string;
  nguoiChoVay: string;
  loaiGD: string;
  soTien: number;
  ghiChu: string;
  gocSauGD: number;
  ngayGDTruoc: string;
  gocTruocGD: number;
  laiSuat: string;
  laiPhatSinh: number;
  rowIndex: number;
}

const emptyGiaoDich = {
  ngay: new Date().toISOString().split("T")[0],
  maMonVay: "",
  nguoiChoVay: "",
  loaiGD: "Vay mới",
  soTien: "",
  ghiChu: "",
};

const LOAI_GD_OPTIONS = ["Vay mới", "Trả gốc", "Trả lãi"];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function QuanLyTienVay() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get tab from URL or default to "danh-sach-mon-vay"
  const tabFromUrl = searchParams.get("tab") || "danh-sach-mon-vay";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  // Món vay đọc từ sheet (chỉ xem) - cấu trúc tự tổng hợp từ Giao dịch
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  // Payment History state
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoadingPaymentHistory, setIsLoadingPaymentHistory] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  // Payment History modal states
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(
    null,
  );
  const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);
  const [newPayment, setNewPayment] = useState<Omit<PaymentHistory, "id">>({
    transactionDate: "",
    loanCode: "",
    transactionType: "",
    amountIn: 0,
    amountOut: 0,
  });
  const [editPayment, setEditPayment] = useState<PaymentHistory>({
    id: 0,
    transactionDate: "",
    loanCode: "",
    transactionType: "",
    amountIn: 0,
    amountOut: 0,
  });

  // Dashboard state
  interface DashboardData {
    tongDuNoToanCongTy: number;
    tongApLucLaiVayThangNay: number;
    duNoVayBank: number;
    duNoVayNgoai: number;
    canhBao: number;
    laiVayDaTra: number;
    laiConLai: number;
    gocDaTra: number;
    gocConLai: number;
  }
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLoan, setNewLoan] = useState<Partial<Loan>>({
    type: "long_term",
    status: "active",
  });

  // Lãi vay (Danh sách người cho vay) state
  const [laiVayList, setLaiVayList] = useState<LaiVayItem[]>([]);
  const [isLoadingLaiVay, setIsLoadingLaiVay] = useState(false);
  const [showLaiVayModal, setShowLaiVayModal] = useState(false);
  const [editingLaiVay, setEditingLaiVay] = useState<LaiVayItem | null>(null);
  const [laiVayForm, setLaiVayForm] = useState(emptyLaiVay);
  const [isSubmittingLaiVay, setIsSubmittingLaiVay] = useState(false);
  const [laiVayToDelete, setLaiVayToDelete] = useState<LaiVayItem | null>(null);
  const [isDeletingLaiVay, setIsDeletingLaiVay] = useState(false);

  // Giao dịch vay (Sổ giao dịch) state
  const [giaoDichList, setGiaoDichList] = useState<GiaoDichVayItem[]>([]);
  const [isLoadingGiaoDich, setIsLoadingGiaoDich] = useState(false);
  const [showGiaoDichModal, setShowGiaoDichModal] = useState(false);
  const [editingGiaoDich, setEditingGiaoDich] = useState<GiaoDichVayItem | null>(
    null,
  );
  const [giaoDichForm, setGiaoDichForm] = useState(emptyGiaoDich);
  const [isSubmittingGiaoDich, setIsSubmittingGiaoDich] = useState(false);
  const [giaoDichToDelete, setGiaoDichToDelete] =
    useState<GiaoDichVayItem | null>(null);
  const [isDeletingGiaoDich, setIsDeletingGiaoDich] = useState(false);
  const [giaoDichDetail, setGiaoDichDetail] =
    useState<GiaoDichVayItem | null>(null);

  // Chi tiết món vay - mã món đang chọn (dropdown)
  const [selectedMaMonVay, setSelectedMaMonVay] = useState("");

  const tabs = [
    { id: "danh-sach-mon-vay", label: "Danh sách món vay", icon: HandCoins },
    { id: "chi-tiet-mon-vay", label: "Chi tiết món vay", icon: HandCoins },
    { id: "lai-vay", label: "Lãi vay", icon: HandCoins },
    { id: "giao-dich-vay", label: "Giao dịch vay", icon: History },
    { id: "dashboard", label: "DASHBOARD", icon: TrendingDown },
  ];

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  // Sync activeTab with URL on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "danh-sach-mon-vay";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Fetch loans from Google Sheets API
  const fetchLoans = async () => {
    try {
      setIsLoadingLoans(true);
      const response = await fetch("/api/loans");
      const result = await response.json();

      if (result.success && result.data) {
        // Sheet "Món vay" tự tổng hợp từ Giao dịch → đọc trực tiếp (chỉ xem)
        setLoans(result.data);
      } else {
        console.error("Failed to fetch loans:", result.error);
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  // Load loans on component mount
  useEffect(() => {
    fetchLoans();
  }, []);

  // ===== Lãi vay (Danh sách người cho vay) =====
  const fetchLaiVay = async () => {
    try {
      setIsLoadingLaiVay(true);
      const response = await fetch("/api/lai-vay");
      const result = await response.json();
      if (result.success) {
        setLaiVayList(result.data);
      } else {
        console.error("Failed to fetch lãi vay:", result.error);
      }
    } catch (error) {
      console.error("Error fetching lãi vay:", error);
    } finally {
      setIsLoadingLaiVay(false);
    }
  };

  useEffect(() => {
    fetchLaiVay();
  }, []);

  const openAddLaiVay = () => {
    setEditingLaiVay(null);
    setLaiVayForm(emptyLaiVay);
    setShowLaiVayModal(true);
  };

  const openEditLaiVay = (item: LaiVayItem) => {
    setEditingLaiVay(item);
    setLaiVayForm({
      stt: item.stt,
      nguoiChoVay: item.nguoiChoVay,
      laiSuatNam: item.laiSuatNam,
      cachTinhLai: item.cachTinhLai,
      ghiChu: item.ghiChu,
    });
    setShowLaiVayModal(true);
  };

  const handleSubmitLaiVay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laiVayForm.nguoiChoVay.trim()) {
      toast.error("Vui lòng nhập Người cho vay");
      return;
    }
    try {
      setIsSubmittingLaiVay(true);
      const response = await fetch("/api/lai-vay", {
        method: editingLaiVay ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingLaiVay
            ? { ...laiVayForm, rowIndex: editingLaiVay.rowIndex }
            : laiVayForm,
        ),
      });
      const result = await response.json();
      if (result.success) {
        setLaiVayList(result.data);
        setShowLaiVayModal(false);
        setEditingLaiVay(null);
        setLaiVayForm(emptyLaiVay);
        toast.success(editingLaiVay ? "Cập nhật thành công" : "Thêm thành công");
      } else {
        toast.error(result.error || "Không thể lưu");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi lưu");
    } finally {
      setIsSubmittingLaiVay(false);
    }
  };

  const confirmDeleteLaiVay = async () => {
    if (!laiVayToDelete) return;
    try {
      setIsDeletingLaiVay(true);
      const response = await fetch(
        `/api/lai-vay?rowIndex=${laiVayToDelete.rowIndex}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (result.success) {
        setLaiVayList(result.data);
        setLaiVayToDelete(null);
        toast.success("Xóa thành công");
      } else {
        toast.error(result.error || "Không thể xóa");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi xóa");
    } finally {
      setIsDeletingLaiVay(false);
    }
  };

  // ===== Giao dịch vay (Sổ giao dịch) =====
  const fetchGiaoDich = async () => {
    try {
      setIsLoadingGiaoDich(true);
      const response = await fetch("/api/giao-dich-vay");
      const result = await response.json();
      if (result.success) {
        setGiaoDichList(result.data);
      } else {
        console.error("Failed to fetch giao dịch vay:", result.error);
      }
    } catch (error) {
      console.error("Error fetching giao dịch vay:", error);
    } finally {
      setIsLoadingGiaoDich(false);
    }
  };

  useEffect(() => {
    fetchGiaoDich();
  }, []);

  // Mặc định chọn mã món vay đầu tiên cho tab Chi tiết
  useEffect(() => {
    if (loans.length === 0) return;
    const codes = loans.map((l) => l.code);
    if (!selectedMaMonVay || !codes.includes(selectedMaMonVay)) {
      setSelectedMaMonVay(loans[0].code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans]);

  const openAddGiaoDich = () => {
    setEditingGiaoDich(null);
    setGiaoDichForm({
      ...emptyGiaoDich,
      ngay: new Date().toISOString().split("T")[0],
    });
    setShowGiaoDichModal(true);
  };

  const openEditGiaoDich = (item: GiaoDichVayItem) => {
    // Chuyển ngày dd/MM/yyyy -> yyyy-MM-dd cho input date
    const toIso = (d: string) => {
      if (!d) return "";
      if (d.includes("/")) {
        const [dd, mm, yyyy] = d.split("/");
        if (dd && mm && yyyy)
          return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      }
      return d;
    };
    setEditingGiaoDich(item);
    setGiaoDichForm({
      ngay: toIso(item.ngay),
      maMonVay: item.maMonVay,
      nguoiChoVay: item.nguoiChoVay,
      loaiGD: item.loaiGD || "Vay mới",
      soTien: item.soTien ? String(item.soTien) : "",
      ghiChu: item.ghiChu,
    });
    setShowGiaoDichModal(true);
  };

  const handleSubmitGiaoDich = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giaoDichForm.maMonVay.trim()) {
      toast.error("Vui lòng nhập Mã món vay");
      return;
    }
    try {
      setIsSubmittingGiaoDich(true);
      const response = await fetch("/api/giao-dich-vay", {
        method: editingGiaoDich ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingGiaoDich
            ? { ...giaoDichForm, rowIndex: editingGiaoDich.rowIndex }
            : giaoDichForm,
        ),
      });
      const result = await response.json();
      if (result.success) {
        setGiaoDichList(result.data);
        setShowGiaoDichModal(false);
        setEditingGiaoDich(null);
        setGiaoDichForm(emptyGiaoDich);
        // Giao dịch ảnh hưởng tới Món vay → tải lại danh sách món vay
        fetchLoans();
        toast.success(
          editingGiaoDich ? "Cập nhật thành công" : "Thêm thành công",
        );
      } else {
        toast.error(result.error || "Không thể lưu");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi lưu");
    } finally {
      setIsSubmittingGiaoDich(false);
    }
  };

  const confirmDeleteGiaoDich = async () => {
    if (!giaoDichToDelete) return;
    try {
      setIsDeletingGiaoDich(true);
      const response = await fetch(
        `/api/giao-dich-vay?rowIndex=${giaoDichToDelete.rowIndex}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (result.success) {
        setGiaoDichList(result.data);
        setGiaoDichToDelete(null);
        fetchLoans();
        toast.success("Xóa thành công");
      } else {
        toast.error(result.error || "Không thể xóa");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi xóa");
    } finally {
      setIsDeletingGiaoDich(false);
    }
  };

  // Xuất file Excel cho một giao dịch
  const handleExportGiaoDichExcel = (gd: GiaoDichVayItem) => {
    const sheetData = [
      { "Thông tin": "STT", "Giá trị": gd.stt || "" },
      { "Thông tin": "Ngày", "Giá trị": gd.ngay || "" },
      { "Thông tin": "Mã món vay", "Giá trị": gd.maMonVay || "" },
      { "Thông tin": "Người cho vay", "Giá trị": gd.nguoiChoVay || "" },
      { "Thông tin": "Loại GD", "Giá trị": gd.loaiGD || "" },
      { "Thông tin": "Số tiền", "Giá trị": gd.soTien || 0 },
      { "Thông tin": "Ghi chú", "Giá trị": gd.ghiChu || "" },
      { "Thông tin": "Gốc sau GD", "Giá trị": gd.gocSauGD || 0 },
      {
        "Thông tin": "Ngày GD trước",
        "Giá trị":
          gd.ngayGDTruoc && gd.ngayGDTruoc !== "0" ? gd.ngayGDTruoc : "",
      },
      { "Thông tin": "Gốc trước GD", "Giá trị": gd.gocTruocGD || 0 },
      { "Thông tin": "Lãi suất", "Giá trị": gd.laiSuat || "" },
      { "Thông tin": "Lãi phát sinh", "Giá trị": gd.laiPhatSinh || 0 },
    ];
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Giao dich vay");
    const safeName = (gd.maMonVay || "giao-dich").replace(/[/\\?*[\]]/g, "_");
    XLSX.writeFile(wb, `Giao_dich_${safeName}.xlsx`);
  };

  // In một giao dịch
  const handlePrintGiaoDich = (gd: GiaoDichVayItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => (v ? v.toLocaleString("vi-VN") : "-");
    const rows: [string, string][] = [
      ["STT", gd.stt || "-"],
      ["Ngày", gd.ngay || "-"],
      ["Mã món vay", gd.maMonVay || "-"],
      ["Người cho vay", gd.nguoiChoVay || "-"],
      ["Loại GD", gd.loaiGD || "-"],
      ["Số tiền", fmt(gd.soTien)],
      ["Gốc sau GD", fmt(gd.gocSauGD)],
      [
        "Ngày GD trước",
        gd.ngayGDTruoc && gd.ngayGDTruoc !== "0" ? gd.ngayGDTruoc : "-",
      ],
      ["Gốc trước GD", fmt(gd.gocTruocGD)],
      ["Lãi suất", gd.laiSuat || "-"],
      ["Lãi phát sinh", fmt(gd.laiPhatSinh)],
      ["Ghi chú", gd.ghiChu || "-"],
    ];
    const body = rows
      .map(
        ([label, value]) => `<tr>
      <td style="padding:8px 12px;border:1px solid #ddd;background:#f5f5f5;font-weight:600;width:40%;">${label}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;">${value}</td>
    </tr>`,
      )
      .join("");
    const title = "Chi tiết giao dịch vay";
    printWindow.document.write(`<html><head><title>${title}</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:6px; text-align:center; } p.sub { text-align:center; color:#666; margin-bottom:20px; font-size:13px; } table { width:100%; border-collapse:collapse; font-size:13px; } @media print { body { padding:15px; } }</style></head><body>
      <h1>${title.toUpperCase()}</h1>
      <p class="sub">${gd.maMonVay || ""} · ${gd.loaiGD || ""}</p>
      <table><tbody>${body}</tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  // Fetch payment history from API
  const fetchPaymentHistory = async () => {
    try {
      setIsLoadingPaymentHistory(true);
      const response = await fetch("/api/payment-history");
      const result = await response.json();

      if (result.success && result.data) {
        setPaymentHistory(result.data);
      } else {
        console.error("Failed to fetch payment history:", result.error);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setIsLoadingPaymentHistory(false);
    }
  };

  // Load payment history on component mount
  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      const response = await fetch("/api/dashboard-loan");
      const result = await response.json();

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        console.error("Failed to fetch dashboard data:", result.error);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Load dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculations
  // Tổng hợp từ dữ liệu "Món vay" (cấu trúc mới)
  const totalPrincipal = loans.reduce((sum, l) => sum + (l.soTienVay || 0), 0);
  const totalGocDaTra = loans.reduce((sum, l) => sum + (l.gocDaTra || 0), 0);
  const totalRemaining = loans.reduce((sum, l) => sum + (l.gocConLai || 0), 0);
  const totalLaiConLai = loans.reduce((sum, l) => sum + (l.laiConLai || 0), 0);
  const totalPhaiTra = loans.reduce((sum, l) => sum + (l.tongPhaiTra || 0), 0);
  const activeLoans = loans.filter((l) => (l.gocConLai || 0) > 0).length;
  const paidPct =
    totalPrincipal > 0
      ? ((totalGocDaTra / totalPrincipal) * 100).toFixed(1)
      : "0";

  const stats = [
    {
      label: "Tổng vay ban đầu",
      value: formatCurrency(totalPrincipal),
      change: `${loans.length} khoản vay`,
      icon: HandCoins,
      color: "bg-blue-500",
    },
    {
      label: "Gốc đã trả",
      value: formatCurrency(totalGocDaTra),
      change: `${paidPct}% tổng gốc`,
      isPositive: true,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      label: "Gốc còn lại",
      value: formatCurrency(totalRemaining),
      change: `${activeLoans} khoản đang vay`,
      icon: TrendingDown,
      color: "bg-red-500",
    },
    {
      label: "Lãi còn phải trả",
      value: formatCurrency(totalLaiConLai),
      change: `Tổng phải trả: ${formatCurrency(totalPhaiTra)}`,
      icon: Calendar,
      color: "bg-orange-500",
    },
  ];

  // Tổng lãi cộng dồn (cho dashboard)
  const totalLaiCongDon = loans.reduce(
    (sum, l) => sum + (l.laiCongDon || 0),
    0,
  );

  // Tổng hợp theo người cho vay (cho dashboard) - gom nhóm từ Món vay
  const lenderSummary = (() => {
    const map: Record<string, any> = {};
    for (const l of loans) {
      const key = l.lender || "(không tên)";
      if (!map[key]) {
        map[key] = {
          lender: key,
          soMon: 0,
          tongVay: 0,
          gocDaTra: 0,
          gocConLai: 0,
          laiCongDon: 0,
          laiDaTra: 0,
          laiConLai: 0,
          tongPhaiTra: 0,
        };
      }
      const g = map[key];
      g.soMon += 1;
      g.tongVay += l.soTienVay || 0;
      g.gocDaTra += l.gocDaTra || 0;
      g.gocConLai += l.gocConLai || 0;
      g.laiCongDon += l.laiCongDon || 0;
      g.laiDaTra += l.laiDaTra || 0;
      g.laiConLai += l.laiConLai || 0;
      g.tongPhaiTra += l.tongPhaiTra || 0;
    }
    return Object.values(map);
  })();

  // ===== Chi tiết món vay (theo mã món đang chọn) =====
  const selectedMon = loans.find((l) => l.code === selectedMaMonVay) || null;

  const parseVNDate = (d: string): number => {
    if (!d) return 0;
    if (d.includes("/")) {
      const [dd, mm, yyyy] = d.split("/");
      return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0;
    }
    return new Date(d).getTime() || 0;
  };

  // Lịch sử giao dịch của món đang chọn + tính lãi còn lại / tổng phải trả lũy kế
  const isVayMoi = (t: string) => t === "Vay mới" || t === "Vay thêm";
  const monTransactions = (() => {
    if (!selectedMon) return [];
    const txs = giaoDichList
      .filter((g) => g.maMonVay === selectedMon.code)
      .sort((a, b) => parseVNDate(a.ngay) - parseVNDate(b.ngay));
    let laiConLaiRun = 0;
    const rows = txs.map((g) => {
      const gocTang = isVayMoi(g.loaiGD) ? g.soTien : 0;
      const gocGiam = g.loaiGD === "Trả gốc" ? g.soTien : 0;
      const laiGiam = g.loaiGD === "Trả lãi" ? g.soTien : 0;
      laiConLaiRun += (g.laiPhatSinh || 0) - laiGiam;
      const gocConLai = g.gocSauGD || 0;
      return {
        ngay: g.ngay,
        loaiGD: g.loaiGD,
        noiDung: g.ghiChu,
        gocTang,
        gocGiam,
        gocConLai,
        laiPhatSinh: g.laiPhatSinh || 0,
        laiGiam,
        laiConLai: laiConLaiRun,
        tongPhaiTra: gocConLai + laiConLaiRun,
      };
    });
    // Dòng "Chốt số" - cập nhật số liệu đến hiện tại (khớp tổng từ Món vay)
    const laiPhatSinhChot = Math.max(0, (selectedMon.laiConLai || 0) - laiConLaiRun);
    rows.push({
      ngay: new Date().toLocaleDateString("vi-VN"),
      loaiGD: "Chốt số",
      noiDung: "Cập nhật số liệu đến hiện tại",
      gocTang: 0,
      gocGiam: 0,
      gocConLai: selectedMon.gocConLai || 0,
      laiPhatSinh: laiPhatSinhChot,
      laiGiam: 0,
      laiConLai: selectedMon.laiConLai || 0,
      tongPhaiTra: selectedMon.tongPhaiTra || 0,
    });
    return rows;
  })();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" />
            Đang vay
          </span>
        );
      case "near_due":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertTriangle className="w-3 h-3" />
            Sắp đến hạn
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Đã tất toán
          </span>
        );
      case "overdue":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" />
            Quá hạn
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "long_term":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            Vay dài hạn
          </span>
        );
      case "short_term":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Vay ngắn hạn
          </span>
        );
      case "personal":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Vay cá nhân
          </span>
        );
      default:
        return null;
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const s = searchTerm.toLowerCase();
    if (!s) return true;
    return (
      (loan.lender || "").toLowerCase().includes(s) ||
      (loan.code || "").toLowerCase().includes(s) ||
      (loan.status || "").toLowerCase().includes(s)
    );
  });

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowViewModal(true);
  };

  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowEditModal(true);
  };

  const handleDeleteLoan = (loan: Loan) => {
    setLoanToDelete(loan);
    setShowDeleteModal(true);
  };

  const confirmDeleteLoan = async () => {
    if (!loanToDelete) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/loans/delete?id=${loanToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Xóa khoản vay thành công!");
        // Refresh loans list
        await fetchLoans();
        setShowDeleteModal(false);
        setLoanToDelete(null);
      } else {
        toast.error(`Lỗi xóa khoản vay: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast.error("Có lỗi xảy ra khi xóa khoản vay");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLoan = async () => {
    try {
      setIsSubmitting(true);
      // Generate new loan code
      const newCode = `MV${String(loans.length + 1).padStart(2, "0")}`;

      const loanData = {
        code: newCode,
        lender: newLoan.lender || "",
        remaining: newLoan.principal || 0,
        interestRate: `${newLoan.interestRate || 0}%`,
        interestType: newLoan.purpose || "",
        amount: newLoan.principal || 0,
        monthlyInterest: newLoan.monthlyPayment || 0,
        dueDate: newLoan.endDate || "",
        status: newLoan.status === "active" ? "Ổn Định" : "Sắp Đáo Hạn Gốc",
      };

      const response = await fetch("/api/loans/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loanData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Thêm khoản vay thành công!");
        // Refresh loans list
        await fetchLoans();
        setShowAddModal(false);
        setNewLoan({ type: "long_term", status: "active" });
      } else {
        toast.error(`Lỗi thêm khoản vay: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding loan:", error);
      toast.error("Có lỗi xảy ra khi thêm khoản vay");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedLoan) return;

    try {
      setIsSubmitting(true);
      const loanData = {
        id: selectedLoan.id,
        code: selectedLoan.id,
        lender: selectedLoan.lender,
        remaining: selectedLoan.remainingPrincipal,
        interestRate: `${selectedLoan.interestRate}%`,
        interestType: selectedLoan.purpose,
        amount: selectedLoan.principal,
        monthlyInterest: selectedLoan.monthlyPayment,
        dueDate: selectedLoan.endDate,
        status:
          selectedLoan.status === "active"
            ? "Ổn Định"
            : selectedLoan.status === "near_due"
              ? "Sắp Đáo Hạn Gốc"
              : selectedLoan.status === "completed"
                ? "Hoàn Thành"
                : "Quá Hạn",
      };

      const response = await fetch("/api/loans/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loanData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật khoản vay thành công!");
        // Refresh loans list
        await fetchLoans();
        setShowEditModal(false);
        setSelectedLoan(null);
      } else {
        toast.error(`Lỗi cập nhật khoản vay: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating loan:", error);
      toast.error("Có lỗi xảy ra khi cập nhật khoản vay");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment History handlers
  const handleViewPayment = (payment: PaymentHistory) => {
    setSelectedPayment(payment);
    setShowViewPaymentModal(true);
  };

  const handleEditPayment = (payment: PaymentHistory) => {
    setEditPayment({ ...payment });
    setShowEditPaymentModal(true);
  };

  const handleDeletePayment = (id: number) => {
    setPaymentToDelete(id);
    setShowDeletePaymentModal(true);
  };

  const handleAddPayment = async () => {
    try {
      setIsAddingPayment(true);
      const response = await fetch("/api/payment-history/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPayment),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Thêm lịch sử thanh toán thành công!");
        await fetchPaymentHistory();
        setShowAddPaymentModal(false);
        setNewPayment({
          transactionDate: "",
          loanCode: "",
          transactionType: "",
          amountIn: 0,
          amountOut: 0,
        });
      } else {
        toast.error(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Có lỗi xảy ra khi thêm lịch sử thanh toán");
    } finally {
      setIsAddingPayment(false);
    }
  };

  const handleSaveEditPayment = async () => {
    try {
      setIsUpdatingPayment(true);
      const response = await fetch("/api/payment-history/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editPayment),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật lịch sử thanh toán thành công!");
        await fetchPaymentHistory();
        setShowEditPaymentModal(false);
        setEditPayment({
          id: 0,
          transactionDate: "",
          loanCode: "",
          transactionType: "",
          amountIn: 0,
          amountOut: 0,
        });
      } else {
        toast.error(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Có lỗi xảy ra khi cập nhật lịch sử thanh toán");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const confirmDeletePayment = async () => {
    if (paymentToDelete === null) return;

    try {
      setIsDeletingPayment(true);
      const response = await fetch(
        `/api/payment-history/delete?id=${paymentToDelete}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Xóa lịch sử thanh toán thành công!");
        await fetchPaymentHistory();
        setShowDeletePaymentModal(false);
        setPaymentToDelete(null);
      } else {
        toast.error(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Có lỗi xảy ra khi xóa lịch sử thanh toán");
    } finally {
      setIsDeletingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {/* Header */}
      <div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HandCoins className="w-7 h-7 text-blue-600" />
            Quản lý tiền vay
          </h1>
          <p className="text-gray-500 mt-1">
            Theo dõi và quản lý các khoản vay
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Danh sách món vay */}
          {activeTab === "danh-sach-mon-vay" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Tìm mã món, người cho vay..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 italic">
                    Tổng hợp từ sheet Giao dịch
                  </span>
                </div>
              </div>

              {isLoadingLoans ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">
                    Đang tải dữ liệu...
                  </span>
                </div>
              ) : filteredLoans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <HandCoins className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Chưa có món vay nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Mã món vay</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Người cho vay</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Ngày vay</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Số tiền vay</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Lãi vay</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Gốc đã trả</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Gốc còn lại</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Lãi cộng dồn</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Lãi đã trả</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Lãi còn lại</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Tổng phải trả</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLoans.map((loan: any) => (
                        <tr key={loan.code} className="hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium text-blue-600">
                            {loan.code}
                          </td>
                          <td className="px-3 py-3 text-gray-900">
                            {loan.lender || "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                            {loan.ngayVay || "-"}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(loan.soTienVay)}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-700">
                            {loan.laiVay || "-"}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-700">
                            {loan.gocDaTra ? formatCurrency(loan.gocDaTra) : "-"}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-orange-600">
                            {loan.gocConLai ? formatCurrency(loan.gocConLai) : "-"}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-700">
                            {loan.laiCongDon ? formatCurrency(loan.laiCongDon) : "-"}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-700">
                            {loan.laiDaTra ? formatCurrency(loan.laiDaTra) : "-"}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-red-600">
                            {loan.laiConLai ? formatCurrency(loan.laiConLai) : "-"}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-purple-700">
                            {loan.tongPhaiTra ? formatCurrency(loan.tongPhaiTra) : "-"}
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs whitespace-nowrap">
                              {loan.status || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Chi tiết món vay */}
          {activeTab === "chi-tiet-mon-vay" && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm italic text-gray-500">
                  Công ty Cổ phần Riomio | Tận Tâm + Tốc Độ + Chính Xác
                </p>
                <h3 className="text-xl font-bold text-blue-700 mt-1">
                  BẢNG KÊ CHI TIẾT KHOẢN VAY
                </h3>
              </div>

              {/* Chọn mã món vay (dropdown) */}
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">
                  Chọn mã món vay:
                </label>
                <select
                  value={selectedMaMonVay}
                  onChange={(e) => setSelectedMaMonVay(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-red-600 focus:ring-2 focus:ring-blue-500 bg-yellow-50 min-w-40"
                >
                  {loans.length === 0 && <option value="">—</option>}
                  {loans.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.code} — {l.lender}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  Ngày báo cáo: {new Date().toLocaleDateString("vi-VN")}
                </span>
              </div>

              {!selectedMon ? (
                <div className="text-center py-12 text-gray-500">
                  Chọn một mã món vay để xem chi tiết
                </div>
              ) : (
                <>
                  {/* I. THÔNG TIN MÓN VAY */}
                  <div>
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-t-lg font-semibold">
                      I. THÔNG TIN MÓN VAY
                    </div>
                    <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
                      {[
                        ["Người cho vay", selectedMon.lender || "-"],
                        ["Ngày vay", selectedMon.ngayVay || "-"],
                        ["Số tiền vay gốc", formatCurrency(selectedMon.soTienVay)],
                        ["Lãi suất/năm", selectedMon.laiVay || "-"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex px-4 py-2.5 text-sm">
                          <span className="w-48 font-medium text-gray-700">{k}</span>
                          <span className="font-semibold text-red-600">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* II. TÌNH HÌNH TÀI CHÍNH */}
                  <div>
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-t-lg font-semibold">
                      II. TÌNH HÌNH TÀI CHÍNH TẠI NGÀY BÁO CÁO
                    </div>
                    <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
                      {[
                        ["Gốc đã trả", formatCurrency(selectedMon.gocDaTra)],
                        ["Gốc còn nợ", formatCurrency(selectedMon.gocConLai)],
                        ["Lãi cộng dồn", formatCurrency(selectedMon.laiCongDon)],
                        ["Lãi đã trả", formatCurrency(selectedMon.laiDaTra)],
                        ["Lãi còn phải trả", formatCurrency(selectedMon.laiConLai)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex px-4 py-2.5 text-sm">
                          <span className="w-48 font-medium text-gray-700">{k}</span>
                          <span className="font-semibold text-red-600">{v}</span>
                        </div>
                      ))}
                      <div className="flex px-4 py-2.5 text-sm bg-amber-50">
                        <span className="w-48 font-bold text-gray-800">
                          TỔNG SỐ TIỀN PHẢI TRẢ
                        </span>
                        <span className="font-bold text-red-600 text-base">
                          {formatCurrency(selectedMon.tongPhaiTra)}
                        </span>
                      </div>
                      <div className="flex px-4 py-2.5 text-sm">
                        <span className="w-48 font-medium text-gray-700">Trạng thái</span>
                        <span className="font-semibold text-red-600">
                          {selectedMon.status || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* III. LỊCH SỬ GIAO DỊCH */}
                  <div>
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-t-lg font-semibold">
                      III. LỊCH SỬ GIAO DỊCH
                    </div>
                    <div className="overflow-x-auto border border-t-0 border-gray-200 rounded-b-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-700 text-white">
                            <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Ngày tháng</th>
                            <th className="px-3 py-2 text-left font-medium">Loại GD</th>
                            <th className="px-3 py-2 text-left font-medium">Nội dung</th>
                            <th className="px-3 py-2 text-right font-medium">Gốc Tăng (Vay thêm)</th>
                            <th className="px-3 py-2 text-right font-medium">Gốc Giảm (Trả gốc)</th>
                            <th className="px-3 py-2 text-right font-medium">Gốc còn lại</th>
                            <th className="px-3 py-2 text-right font-medium">Lãi phát sinh</th>
                            <th className="px-3 py-2 text-right font-medium">Lãi giảm (Trả lãi)</th>
                            <th className="px-3 py-2 text-right font-medium">Lãi còn lại</th>
                            <th className="px-3 py-2 text-right font-medium">Tổng phải trả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {monTransactions.map((r, i) => (
                            <tr
                              key={i}
                              className={
                                r.loaiGD === "Chốt số"
                                  ? "bg-amber-50 font-medium"
                                  : "hover:bg-gray-50"
                              }
                            >
                              <td className="px-3 py-2 whitespace-nowrap text-gray-700">{r.ngay}</td>
                              <td className="px-3 py-2 text-gray-700">{r.loaiGD}</td>
                              <td className="px-3 py-2 text-gray-600">{r.noiDung || "-"}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{r.gocTang ? formatCurrency(r.gocTang) : "0"}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{r.gocGiam ? formatCurrency(r.gocGiam) : "0"}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(r.gocConLai)}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{r.laiPhatSinh ? formatCurrency(r.laiPhatSinh) : "0"}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{r.laiGiam ? formatCurrency(r.laiGiam) : "0"}</td>
                              <td className="px-3 py-2 text-right font-medium text-red-600">{formatCurrency(r.laiConLai)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-purple-700">{formatCurrency(r.tongPhaiTra)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Lãi vay (Danh sách người cho vay) */}
          {activeTab === "lai-vay" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách người cho vay ({laiVayList.length})
                </h3>
                <button
                  onClick={openAddLaiVay}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} /> Thêm người cho vay
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">
                          Người cho vay
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">
                          Lãi suất năm
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 w-48">
                          Cách tính lãi
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">
                          Ghi chú
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoadingLaiVay ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            <Loader2 className="animate-spin inline mr-2" size={18} />
                            Đang tải dữ liệu...
                          </td>
                        </tr>
                      ) : laiVayList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            Chưa có dữ liệu
                          </td>
                        </tr>
                      ) : (
                        laiVayList.map((item, index) => (
                          <tr key={item.rowIndex} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">
                              {item.stt || index + 1}
                            </td>
                            <td className="px-4 py-3 font-medium text-blue-600">
                              {item.nguoiChoVay}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {item.laiSuatNam || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.cachTinhLai || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {item.ghiChu || "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openEditLaiVay(item)}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Sửa"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => setLaiVayToDelete(item)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Giao dịch vay (Sổ giao dịch) */}
          {activeTab === "giao-dich-vay" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Sổ giao dịch vay ({giaoDichList.length})
                </h3>
                <button
                  onClick={openAddGiaoDich}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} /> Thêm giao dịch
                </button>
              </div>

              {isLoadingGiaoDich ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-3 text-left font-medium text-gray-600 w-12">STT</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Ngày</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Mã món vay</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Người cho vay</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Loại GD</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600">Số tiền</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600">Ghi chú</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600 bg-gray-100">Gốc sau GD</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-600 bg-gray-100">Ngày GD trước</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600 bg-gray-100">Gốc trước GD</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600 bg-gray-100">Lãi suất</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-600 bg-gray-100">Lãi phát sinh</th>
                        <th className="px-3 py-3 text-center font-medium text-gray-600 w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {giaoDichList.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                            Chưa có giao dịch
                          </td>
                        </tr>
                      ) : (
                        giaoDichList.map((gd, index) => (
                          <tr
                            key={gd.rowIndex}
                            onClick={() => setGiaoDichDetail(gd)}
                            className="hover:bg-blue-50 cursor-pointer"
                          >
                            <td className="px-3 py-3 text-gray-600">{gd.stt || index + 1}</td>
                            <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{gd.ngay || "-"}</td>
                            <td className="px-3 py-3 font-medium text-blue-600">{gd.maMonVay}</td>
                            <td className="px-3 py-3 text-gray-900">{gd.nguoiChoVay || "-"}</td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs whitespace-nowrap">
                                {gd.loaiGD || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-gray-900">
                              {gd.soTien ? formatCurrency(gd.soTien) : "-"}
                            </td>
                            <td className="px-3 py-3 text-gray-500 max-w-xs truncate" title={gd.ghiChu}>
                              {gd.ghiChu || "-"}
                            </td>
                            <td className="px-3 py-3 text-right text-gray-700 bg-gray-50">
                              {gd.gocSauGD ? formatCurrency(gd.gocSauGD) : "-"}
                            </td>
                            <td className="px-3 py-3 text-gray-700 bg-gray-50 whitespace-nowrap">
                              {gd.ngayGDTruoc && gd.ngayGDTruoc !== "0"
                                ? gd.ngayGDTruoc
                                : "-"}
                            </td>
                            <td className="px-3 py-3 text-right text-gray-700 bg-gray-50">
                              {gd.gocTruocGD ? formatCurrency(gd.gocTruocGD) : "-"}
                            </td>
                            <td className="px-3 py-3 text-right text-gray-700 bg-gray-50">
                              {gd.laiSuat || "-"}
                            </td>
                            <td className="px-3 py-3 text-right text-gray-700 bg-gray-50">
                              {gd.laiPhatSinh ? formatCurrency(gd.laiPhatSinh) : "-"}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditGiaoDich(gd);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Sửa"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGiaoDichToDelete(gd);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} />
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
          )}

          {/* Tab: Nhật ký món vay */}
          {activeTab === "nhat-ky-mon-vay" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nhật ký món vay
              </h3>
              {isLoadingPaymentHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">
                    Đang tải dữ liệu...
                  </span>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Chưa có lịch sử thanh toán nào</p>
                  <p className="text-sm mt-1">
                    Nhấn &quot;Thêm giao dịch&quot; để bắt đầu
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Ngày giao dịch
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Mã món vay
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Loại giao dịch
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Số tiền thu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Số tiền chi
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewPayment(payment)}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">
                                {payment.transactionDate}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-blue-600">
                              {payment.loanCode}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-900">
                            {payment.transactionType}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {payment.amountIn > 0 && (
                              <span className="flex items-center justify-end gap-1 text-green-600 font-medium">
                                <ArrowDownRight className="w-4 h-4" />
                                {formatCurrency(payment.amountIn)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {payment.amountOut > 0 && (
                              <span className="flex items-center justify-end gap-1 text-red-600 font-medium">
                                <ArrowUpRight className="w-4 h-4" />
                                {formatCurrency(payment.amountOut)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditPayment(payment)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        <td className="px-4 py-3 text-gray-900" colSpan={3}>
                          Tổng cộng
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">
                          {formatCurrency(
                            paymentHistory.reduce((s, p) => s + p.amountIn, 0),
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">
                          {formatCurrency(
                            paymentHistory.reduce((s, p) => s + p.amountOut, 0),
                          )}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-blue-700">
                  DASHBOARD - TỔNG QUAN KHOẢN VAY
                </h3>
                <p className="text-xs text-gray-500 italic mt-0.5">
                  Cập nhật đến: {new Date().toLocaleDateString("vi-VN")}
                </p>
              </div>

              {isLoadingLoans ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <>
                  {/* CHỈ SỐ TỔNG QUAN */}
                  <div>
                    <h4 className="text-base font-bold text-blue-700 mb-3">
                      CHỈ SỐ TỔNG QUAN
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Tổng gốc còn nợ", value: totalRemaining },
                        { label: "Lãi cộng dồn", value: totalLaiCongDon },
                        { label: "Lãi còn phải trả", value: totalLaiConLai },
                        { label: "Tổng phải trả", value: totalPhaiTra },
                      ].map((c) => (
                        <div
                          key={c.label}
                          className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center"
                        >
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {c.label}
                          </p>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrency(c.value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TỔNG HỢP THEO NGƯỜI CHO VAY */}
                  <div>
                    <h4 className="text-base font-bold text-blue-700 mb-3">
                      TỔNG HỢP THEO NGƯỜI CHO VAY
                    </h4>
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800 text-white">
                            <th className="px-3 py-2.5 text-center font-medium w-12">STT</th>
                            <th className="px-3 py-2.5 text-left font-medium">Người cho vay</th>
                            <th className="px-3 py-2.5 text-center font-medium">Số món</th>
                            <th className="px-3 py-2.5 text-right font-medium">Tổng vay</th>
                            <th className="px-3 py-2.5 text-right font-medium">Gốc đã trả</th>
                            <th className="px-3 py-2.5 text-right font-medium">Gốc còn lại</th>
                            <th className="px-3 py-2.5 text-right font-medium">Lãi cộng dồn</th>
                            <th className="px-3 py-2.5 text-right font-medium">Lãi đã trả</th>
                            <th className="px-3 py-2.5 text-right font-medium">Lãi còn lại</th>
                            <th className="px-3 py-2.5 text-right font-medium">Tổng phải trả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {lenderSummary.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                Chưa có dữ liệu
                              </td>
                            </tr>
                          ) : (
                            lenderSummary.map((g: any, index: number) => (
                              <tr key={g.lender} className="hover:bg-gray-50">
                                <td className="px-3 py-2.5 text-center text-gray-600">{index + 1}</td>
                                <td className="px-3 py-2.5 font-medium text-blue-600">{g.lender}</td>
                                <td className="px-3 py-2.5 text-center text-gray-700">{g.soMon}</td>
                                <td className="px-3 py-2.5 text-right text-gray-900">{formatCurrency(g.tongVay)}</td>
                                <td className="px-3 py-2.5 text-right text-gray-700">{g.gocDaTra ? formatCurrency(g.gocDaTra) : "0"}</td>
                                <td className="px-3 py-2.5 text-right font-medium text-orange-600">{g.gocConLai ? formatCurrency(g.gocConLai) : "0"}</td>
                                <td className="px-3 py-2.5 text-right text-gray-700">{g.laiCongDon ? formatCurrency(g.laiCongDon) : "0"}</td>
                                <td className="px-3 py-2.5 text-right text-gray-700">{g.laiDaTra ? formatCurrency(g.laiDaTra) : "0"}</td>
                                <td className="px-3 py-2.5 text-right font-medium text-red-600">{g.laiConLai ? formatCurrency(g.laiConLai) : "0"}</td>
                                <td className="px-3 py-2.5 text-right font-semibold text-purple-700">{formatCurrency(g.tongPhaiTra)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {lenderSummary.length > 0 && (
                          <tfoot>
                            <tr className="bg-gray-100 font-semibold">
                              <td colSpan={2} className="px-3 py-2.5 text-right">Tổng cộng:</td>
                              <td className="px-3 py-2.5 text-center">{loans.length}</td>
                              <td className="px-3 py-2.5 text-right">{formatCurrency(totalPrincipal)}</td>
                              <td className="px-3 py-2.5 text-right">{formatCurrency(totalGocDaTra)}</td>
                              <td className="px-3 py-2.5 text-right text-orange-700">{formatCurrency(totalRemaining)}</td>
                              <td className="px-3 py-2.5 text-right">{formatCurrency(totalLaiCongDon)}</td>
                              <td className="px-3 py-2.5 text-right">{formatCurrency(loans.reduce((s, l) => s + (l.laiDaTra || 0), 0))}</td>
                              <td className="px-3 py-2.5 text-right text-red-700">{formatCurrency(totalLaiConLai)}</td>
                              <td className="px-3 py-2.5 text-right text-purple-700">{formatCurrency(totalPhaiTra)}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Loan Slide Panel */}
      {showAddModal && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowAddModal(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm khoản vay mới
                </h3>
                <p className="text-sm text-gray-500">
                  Nhập thông tin khoản vay
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bên cho vay *
                  </label>
                  <input
                    type="text"
                    value={newLoan.lender || ""}
                    onChange={(e) =>
                      setNewLoan({ ...newLoan, lender: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên ngân hàng/tổ chức"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại vay
                  </label>
                  <select
                    value={newLoan.type || "long_term"}
                    onChange={(e) =>
                      setNewLoan({
                        ...newLoan,
                        type: e.target.value as Loan["type"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="long_term">Vay dài hạn</option>
                    <option value="short_term">Vay ngắn hạn</option>
                    <option value="personal">Vay cá nhân</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền vay *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newLoan.principal || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+/, "")
                          .replace(/\D/g, "");
                        setNewLoan({
                          ...newLoan,
                          principal: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số tiền"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lãi suất (%/năm)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newLoan.interestRate || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+(?=\d)/, "")
                          .replace(/[^\d.]/g, "");
                        setNewLoan({
                          ...newLoan,
                          interestRate: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Lãi suất"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      value={newLoan.startDate || ""}
                      onChange={(e) =>
                        setNewLoan({ ...newLoan, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={newLoan.endDate || ""}
                      onChange={(e) =>
                        setNewLoan({ ...newLoan, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tiền trả/tháng
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newLoan.monthlyPayment || ""}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/^0+/, "")
                        .replace(/\D/g, "");
                      setNewLoan({
                        ...newLoan,
                        monthlyPayment: val ? Number(val) : 0,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số tiền trả/tháng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mục đích vay
                  </label>
                  <input
                    type="text"
                    value={newLoan.purpose || ""}
                    onChange={(e) =>
                      setNewLoan({ ...newLoan, purpose: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mục đích vay"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={newLoan.notes || ""}
                    onChange={(e) =>
                      setNewLoan({ ...newLoan, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Ghi chú thêm"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddLoan}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {isSubmitting ? "Đang thêm..." : "Thêm khoản vay"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* View Loan Slide Panel */}
      {showViewModal && selectedLoan && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowViewModal(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi tiết khoản vay
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  {selectedLoan.id}
                </p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Status & Type Badges */}
              <div className="flex items-center gap-2 mb-6">
                {getStatusBadge(selectedLoan.status)}
                {getTypeBadge(selectedLoan.type)}
              </div>

              {/* Principal Amount */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Số tiền vay</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(selectedLoan.principal)}
                </p>
              </div>

              {/* Remaining Amount */}
              <div className="mb-6 p-4 bg-red-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Còn nợ</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(selectedLoan.remainingPrincipal)}
                </p>
                {selectedLoan.status !== "completed" && (
                  <div className="mt-3">
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-600">Tiến độ trả nợ</span>
                      <span className="font-medium">
                        {Math.round(
                          ((selectedLoan.principal -
                            selectedLoan.remainingPrincipal) /
                            selectedLoan.principal) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${((selectedLoan.principal - selectedLoan.remainingPrincipal) / selectedLoan.principal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Bên cho vay</span>
                  <span className="text-gray-900 font-medium">
                    {selectedLoan.lender}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Lãi suất</span>
                  <span className="text-gray-900 font-medium">
                    {selectedLoan.interestRate}%/năm
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Ngày bắt đầu</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(selectedLoan.startDate).toLocaleDateString(
                      "vi-VN",
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Ngày kết thúc</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(selectedLoan.endDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Trả góp/tháng</span>
                  <span className="text-orange-600 font-medium">
                    {formatCurrency(selectedLoan.monthlyPayment)}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Mục đích vay</span>
                  <span className="text-gray-900 font-medium">
                    {selectedLoan.purpose}
                  </span>
                </div>
                {selectedLoan.notes && (
                  <div className="py-3">
                    <p className="text-gray-500 mb-2">Ghi chú</p>
                    <p className="text-gray-900">{selectedLoan.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditLoan(selectedLoan);
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sửa khoản vay
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Loan Slide Panel */}
      {showEditModal && selectedLoan && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditModal(false);
              setSelectedLoan(null);
            }}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sửa khoản vay
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  {selectedLoan.id}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedLoan(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bên cho vay *
                  </label>
                  <input
                    type="text"
                    value={selectedLoan.lender}
                    onChange={(e) =>
                      setSelectedLoan({
                        ...selectedLoan,
                        lender: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại vay
                  </label>
                  <select
                    value={selectedLoan.type}
                    onChange={(e) =>
                      setSelectedLoan({
                        ...selectedLoan,
                        type: e.target.value as Loan["type"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="long_term">Vay dài hạn</option>
                    <option value="short_term">Vay ngắn hạn</option>
                    <option value="personal">Vay cá nhân</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền vay
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedLoan.principal || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+/, "")
                          .replace(/\D/g, "");
                        setSelectedLoan({
                          ...selectedLoan,
                          principal: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lãi suất (%/năm)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={selectedLoan.interestRate || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+(?=\d)/, "")
                          .replace(/[^\d.]/g, "");
                        setSelectedLoan({
                          ...selectedLoan,
                          interestRate: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Còn nợ
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedLoan.remainingPrincipal || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+/, "")
                          .replace(/\D/g, "");
                        setSelectedLoan({
                          ...selectedLoan,
                          remainingPrincipal: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trả góp/tháng
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedLoan.monthlyPayment || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+/, "")
                          .replace(/\D/g, "");
                        setSelectedLoan({
                          ...selectedLoan,
                          monthlyPayment: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={selectedLoan.status}
                    onChange={(e) =>
                      setSelectedLoan({
                        ...selectedLoan,
                        status: e.target.value as Loan["status"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Đang vay</option>
                    <option value="near_due">Sắp đến hạn</option>
                    <option value="completed">Đã tất toán</option>
                    <option value="overdue">Quá hạn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mục đích vay
                  </label>
                  <input
                    type="text"
                    value={selectedLoan.purpose}
                    onChange={(e) =>
                      setSelectedLoan({
                        ...selectedLoan,
                        purpose: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={selectedLoan.notes || ""}
                    onChange={(e) =>
                      setSelectedLoan({
                        ...selectedLoan,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedLoan(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && loanToDelete && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => !isSubmitting && setShowDeleteModal(false)}
          />
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md bg-white rounded-xl shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Xác nhận xóa khoản vay
                  </h3>
                  <p className="text-sm text-gray-500">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa khoản vay{" "}
                <span className="font-semibold text-blue-600">
                  {loanToDelete.id}
                </span>{" "}
                của <span className="font-semibold">{loanToDelete.lender}</span>
                ?
              </p>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Dữ liệu sẽ bị xóa vĩnh viễn khỏi
                  Google Sheets.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setLoanToDelete(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteLoan}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {isSubmitting ? "Đang xóa..." : "Xóa khoản vay"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Add Payment History Modal */}
      {showAddPaymentModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowAddPaymentModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm giao dịch mới
                </h3>
                <p className="text-sm text-gray-500">
                  Nhập thông tin giao dịch
                </p>
              </div>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày giao dịch *
                  </label>
                  <input
                    type="date"
                    value={newPayment.transactionDate}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        transactionDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã món vay
                  </label>
                  <input
                    type="text"
                    value={newPayment.loanCode}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, loanCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: MV01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại giao dịch
                  </label>
                  <input
                    type="text"
                    value={newPayment.transactionType}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        transactionType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Trả lãi, Trả gốc..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền thu
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newPayment.amountIn || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+/, "")
                          .replace(/\D/g, "");
                        setNewPayment({
                          ...newPayment,
                          amountIn: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền chi
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newPayment.amountOut || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+/, "")
                          .replace(/\D/g, "");
                        setNewPayment({
                          ...newPayment,
                          amountOut: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  disabled={isAddingPayment}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={isAddingPayment}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAddingPayment && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {isAddingPayment ? "Đang thêm..." : "Thêm giao dịch"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* View Payment History Modal */}
      {showViewPaymentModal && selectedPayment && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowViewPaymentModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi tiết giao dịch
                </h3>
                <p className="text-sm text-gray-500">
                  ID: {selectedPayment.id}
                </p>
              </div>
              <button
                onClick={() => setShowViewPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Ngày giao dịch</span>
                  <span className="text-gray-900 font-medium">
                    {selectedPayment.transactionDate}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Mã món vay</span>
                  <span className="text-blue-600 font-medium">
                    {selectedPayment.loanCode}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Loại giao dịch</span>
                  <span className="text-gray-900 font-medium">
                    {selectedPayment.transactionType}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Số tiền thu</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(selectedPayment.amountIn)}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Số tiền chi</span>
                  <span className="text-red-600 font-medium">
                    {formatCurrency(selectedPayment.amountOut)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowViewPaymentModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewPaymentModal(false);
                    handleEditPayment(selectedPayment);
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sửa giao dịch
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Payment History Modal */}
      {showEditPaymentModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowEditPaymentModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sửa giao dịch
                </h3>
                <p className="text-sm text-gray-500">ID: {editPayment.id}</p>
              </div>
              <button
                onClick={() => setShowEditPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày giao dịch *
                  </label>
                  <input
                    type="date"
                    value={editPayment.transactionDate}
                    onChange={(e) =>
                      setEditPayment({
                        ...editPayment,
                        transactionDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã món vay
                  </label>
                  <input
                    type="text"
                    value={editPayment.loanCode}
                    onChange={(e) =>
                      setEditPayment({
                        ...editPayment,
                        loanCode: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: MV01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại giao dịch
                  </label>
                  <input
                    type="text"
                    value={editPayment.transactionType}
                    onChange={(e) =>
                      setEditPayment({
                        ...editPayment,
                        transactionType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Trả lãi, Trả gốc..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền thu
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editPayment.amountIn || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+/, "")
                          .replace(/\D/g, "");
                        setEditPayment({
                          ...editPayment,
                          amountIn: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền chi
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editPayment.amountOut || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/^0+/, "")
                          .replace(/\D/g, "");
                        setEditPayment({
                          ...editPayment,
                          amountOut: val ? Number(val) : 0,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditPaymentModal(false)}
                  disabled={isUpdatingPayment}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditPayment}
                  disabled={isUpdatingPayment}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdatingPayment && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {isUpdatingPayment ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Payment History Modal */}
      {showDeletePaymentModal && paymentToDelete !== null && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() =>
              !isDeletingPayment && setShowDeletePaymentModal(false)
            }
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md bg-white rounded-xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Xác nhận xóa giao dịch
                  </h3>
                  <p className="text-sm text-gray-500">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa giao dịch này?
              </p>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Dữ liệu sẽ bị xóa vĩnh viễn khỏi
                  Google Sheets.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeletePaymentModal(false);
                    setPaymentToDelete(null);
                  }}
                  disabled={isDeletingPayment}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeletePayment}
                  disabled={isDeletingPayment}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingPayment && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {isDeletingPayment ? "Đang xóa..." : "Xóa giao dịch"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Thêm/Sửa Lãi vay (người cho vay) */}
      {showLaiVayModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingLaiVay ? "Sửa người cho vay" : "Thêm người cho vay"}
                </h3>
                <button
                  onClick={() => {
                    setShowLaiVayModal(false);
                    setEditingLaiVay(null);
                    setLaiVayForm(emptyLaiVay);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitLaiVay} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người cho vay <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={laiVayForm.nguoiChoVay}
                    onChange={(e) =>
                      setLaiVayForm({ ...laiVayForm, nguoiChoVay: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Mr Việt 12%"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lãi suất năm
                    </label>
                    <input
                      type="text"
                      value={laiVayForm.laiSuatNam}
                      onChange={(e) =>
                        setLaiVayForm({ ...laiVayForm, laiSuatNam: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: 12,00%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cách tính lãi
                    </label>
                    <input
                      type="text"
                      value={laiVayForm.cachTinhLai}
                      onChange={(e) =>
                        setLaiVayForm({ ...laiVayForm, cachTinhLai: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: Lãi đơn theo ngày"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={laiVayForm.ghiChu}
                    onChange={(e) =>
                      setLaiVayForm({ ...laiVayForm, ghiChu: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú (nếu có)"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLaiVayModal(false);
                      setEditingLaiVay(null);
                      setLaiVayForm(emptyLaiVay);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLaiVay}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmittingLaiVay && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
                    {editingLaiVay ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa Lãi vay */}
      {laiVayToDelete && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
                <button
                  onClick={() => setLaiVayToDelete(null)}
                  disabled={isDeletingLaiVay}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-700">
                  Bạn có chắc muốn xóa người cho vay{" "}
                  <span className="font-semibold text-blue-600">
                    {laiVayToDelete.nguoiChoVay}
                  </span>
                  ?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setLaiVayToDelete(null)}
                  disabled={isDeletingLaiVay}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteLaiVay}
                  disabled={isDeletingLaiVay}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeletingLaiVay && <Loader2 className="animate-spin" size={16} />}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Thêm/Sửa Giao dịch vay */}
      {showGiaoDichModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingGiaoDich ? "Sửa giao dịch" : "Thêm giao dịch"}
                </h3>
                <button
                  onClick={() => {
                    setShowGiaoDichModal(false);
                    setEditingGiaoDich(null);
                    setGiaoDichForm(emptyGiaoDich);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitGiaoDich} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày
                    </label>
                    <input
                      type="date"
                      value={giaoDichForm.ngay}
                      onChange={(e) =>
                        setGiaoDichForm({ ...giaoDichForm, ngay: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại GD
                    </label>
                    <select
                      value={giaoDichForm.loaiGD}
                      onChange={(e) =>
                        setGiaoDichForm({ ...giaoDichForm, loaiGD: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {LOAI_GD_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã món vay <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={giaoDichForm.maMonVay}
                      onChange={(e) =>
                        setGiaoDichForm({
                          ...giaoDichForm,
                          maMonVay: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: MV1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Người cho vay
                    </label>
                    <input
                      type="text"
                      value={giaoDichForm.nguoiChoVay}
                      onChange={(e) =>
                        setGiaoDichForm({
                          ...giaoDichForm,
                          nguoiChoVay: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: Mr Việt 12%"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tiền
                  </label>
                  <input
                    type="number"
                    value={giaoDichForm.soTien}
                    onChange={(e) =>
                      setGiaoDichForm({ ...giaoDichForm, soTien: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={giaoDichForm.ghiChu}
                    onChange={(e) =>
                      setGiaoDichForm({ ...giaoDichForm, ghiChu: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú (nếu có)"
                  />
                </div>
                {/* Các cột [H] do sheet tự tính - chỉ xem */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Thông tin tự tính (sheet){" "}
                    {!editingGiaoDich && (
                      <span className="italic font-normal">
                        — sẽ hiện sau khi lưu
                      </span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Gốc sau GD:</span>
                      <span className="font-medium text-gray-800">
                        {editingGiaoDich?.gocSauGD
                          ? formatCurrency(editingGiaoDich.gocSauGD)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Lãi suất:</span>
                      <span className="font-medium text-gray-800">
                        {editingGiaoDich?.laiSuat || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Ngày GD trước:</span>
                      <span className="font-medium text-gray-800">
                        {editingGiaoDich?.ngayGDTruoc &&
                        editingGiaoDich.ngayGDTruoc !== "0"
                          ? editingGiaoDich.ngayGDTruoc
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Gốc trước GD:</span>
                      <span className="font-medium text-gray-800">
                        {editingGiaoDich?.gocTruocGD
                          ? formatCurrency(editingGiaoDich.gocTruocGD)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Lãi phát sinh:</span>
                      <span className="font-medium text-red-600">
                        {editingGiaoDich?.laiPhatSinh
                          ? formatCurrency(editingGiaoDich.laiPhatSinh)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGiaoDichModal(false);
                      setEditingGiaoDich(null);
                      setGiaoDichForm(emptyGiaoDich);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingGiaoDich}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmittingGiaoDich && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
                    {editingGiaoDich ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa Giao dịch vay */}
      {giaoDichToDelete && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
                <button
                  onClick={() => setGiaoDichToDelete(null)}
                  disabled={isDeletingGiaoDich}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-700">
                  Bạn có chắc muốn xóa giao dịch{" "}
                  <span className="font-semibold text-blue-600">
                    {giaoDichToDelete.maMonVay}
                  </span>{" "}
                  ({giaoDichToDelete.loaiGD}) ngày{" "}
                  <span className="font-medium">{giaoDichToDelete.ngay}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setGiaoDichToDelete(null)}
                  disabled={isDeletingGiaoDich}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteGiaoDich}
                  disabled={isDeletingGiaoDich}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeletingGiaoDich && (
                    <Loader2 className="animate-spin" size={16} />
                  )}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal chi tiết giao dịch vay */}
      {giaoDichDetail && (
        <Portal>
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setGiaoDichDetail(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chi tiết giao dịch
                  </h3>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-blue-600">
                      {giaoDichDetail.maMonVay}
                    </span>{" "}
                    · {giaoDichDetail.loaiGD}
                  </p>
                </div>
                <button
                  onClick={() => setGiaoDichDetail(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-1">
                {[
                  { label: "STT", value: giaoDichDetail.stt || "-" },
                  { label: "Ngày", value: giaoDichDetail.ngay || "-" },
                  { label: "Mã món vay", value: giaoDichDetail.maMonVay || "-" },
                  {
                    label: "Người cho vay",
                    value: giaoDichDetail.nguoiChoVay || "-",
                  },
                  { label: "Loại GD", value: giaoDichDetail.loaiGD || "-" },
                  {
                    label: "Số tiền",
                    value: giaoDichDetail.soTien
                      ? formatCurrency(giaoDichDetail.soTien)
                      : "-",
                  },
                  {
                    label: "Gốc sau GD",
                    value: giaoDichDetail.gocSauGD
                      ? formatCurrency(giaoDichDetail.gocSauGD)
                      : "-",
                  },
                  {
                    label: "Ngày GD trước",
                    value:
                      giaoDichDetail.ngayGDTruoc &&
                      giaoDichDetail.ngayGDTruoc !== "0"
                        ? giaoDichDetail.ngayGDTruoc
                        : "-",
                  },
                  {
                    label: "Gốc trước GD",
                    value: giaoDichDetail.gocTruocGD
                      ? formatCurrency(giaoDichDetail.gocTruocGD)
                      : "-",
                  },
                  { label: "Lãi suất", value: giaoDichDetail.laiSuat || "-" },
                  {
                    label: "Lãi phát sinh",
                    value: giaoDichDetail.laiPhatSinh
                      ? formatCurrency(giaoDichDetail.laiPhatSinh)
                      : "-",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm font-medium text-gray-900 text-right">
                      {row.value}
                    </span>
                  </div>
                ))}
                <div className="pt-2">
                  <span className="text-sm text-gray-500 block mb-1">
                    Ghi chú
                  </span>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                    {giaoDichDetail.ghiChu || "-"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  onClick={() => handlePrintGiaoDich(giaoDichDetail)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Printer size={16} /> In
                </button>
                <button
                  onClick={() => handleExportGiaoDichExcel(giaoDichDetail)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FileSpreadsheet size={16} /> Xuất Excel
                </button>
                <button
                  onClick={() => {
                    const gd = giaoDichDetail;
                    setGiaoDichDetail(null);
                    openEditGiaoDich(gd);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit size={16} /> Sửa
                </button>
                <button
                  onClick={() => setGiaoDichDetail(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
