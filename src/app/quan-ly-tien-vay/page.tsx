"use client";

import {
  HandCoins,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Percent,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  X,
  CreditCard,
  History,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
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


// Google Sheets loan interface - matches new structure
interface GoogleSheetsLoan {
  id: number;
  code: string;                    // A - Mã món vay
  lender: string;                  // B - Người cho vay
  category: string;                // C - Phân loại
  maturityDate: string;            // D - Ngày đáo hạn
  principalAmount: number;         // E - Số tiền vay gốc ban đầu
  initialInterestRate: string;     // F - Lãi suất ban đầu
  interestType: string;            // G - Loại lãi suất
  interestPaymentDate: string;     // H - Ngày trả lãi quy định
  paymentTerm: string;             // I - Kỳ hạn trả lãi
  status: string;                  // J - Trạng thái
  disbursementDate: string;        // K - Ngày giải ngân
  purpose: string;                 // L - Mục đích vay
}

// Map Google Sheets status to app status
const mapStatus = (sheetStatus: string): Loan["status"] => {
  const status = sheetStatus.toLowerCase();
  if (status.includes("ổn định") || status.includes("active")) return "active";
  if (status.includes("sắp") || status.includes("near")) return "near_due";
  if (status.includes("hoàn") || status.includes("completed")) return "completed";
  if (status.includes("quá") || status.includes("overdue")) return "overdue";
  return "active";
};

// Map Google Sheets interest type to loan type
const mapLoanType = (interestType: string, lender: string): Loan["type"] => {
  if (lender.toLowerCase().includes("cá nhân")) return "personal";
  if (lender.toLowerCase().includes("ngân hàng")) return "long_term";
  return "short_term";
};

// Parse interest rate string (e.g., "12,0%" -> 12.0)
const parseInterestRate = (rate: string | undefined): number => {
  if (!rate) return 0;
  const cleaned = rate.replace(/[%,]/g, ".").replace(/\s/g, "");
  return parseFloat(cleaned) || 0;
};

// Convert Google Sheets loan to app loan - keeping all original fields
const convertGoogleSheetsLoan = (sheetLoan: GoogleSheetsLoan): any => {
  return {
    // Use code as the primary id (string) for the Loan interface
    id: sheetLoan.code,
    code: sheetLoan.code,
    lender: sheetLoan.lender,
    category: sheetLoan.category,
    maturityDate: sheetLoan.maturityDate,
    principalAmount: sheetLoan.principalAmount,
    initialInterestRate: sheetLoan.initialInterestRate,
    interestType: sheetLoan.interestType,
    interestPaymentDate: sheetLoan.interestPaymentDate,
    paymentTerm: sheetLoan.paymentTerm,
    disbursementDate: sheetLoan.disbursementDate,
    purpose: sheetLoan.purpose,
    // Mapped fields for compatibility
    type: mapLoanType(sheetLoan.interestType, sheetLoan.category),
    principal: sheetLoan.principalAmount,
    interestRate: parseInterestRate(sheetLoan.initialInterestRate),
    startDate: sheetLoan.disbursementDate || "",
    endDate: sheetLoan.maturityDate || "",
    monthlyPayment: 0,
    remainingPrincipal: sheetLoan.principalAmount,
    status: mapStatus(sheetLoan.status),
    notes: undefined,
  };
};

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

  // Get tab from URL or default to "khoan-vay"
  const tabFromUrl = searchParams.get("tab") || "khoan-vay";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loans, setLoans] = useState<Loan[]>([]);
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
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
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

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLoan, setNewLoan] = useState<Partial<Loan>>({
    type: "long_term",
    status: "active",
  });

  const tabs = [
    { id: "khoan-vay", label: "Khoản vay", icon: HandCoins },
    { id: "lich-thanh-toan", label: "Lịch thanh toán", icon: Calendar },
    { id: "lich-su-tra", label: "Lịch sử trả nợ", icon: History },
  ];

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  // Sync activeTab with URL on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "khoan-vay";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Fetch loans from Google Sheets API
  const fetchLoans = async () => {
    try {
      setIsLoadingLoans(true);
      const response = await fetch("/api/loans");
      const result = await response.json();

      if (result.success && result.data) {
        const convertedLoans = result.data.map((sheetLoan: GoogleSheetsLoan) =>
          convertGoogleSheetsLoan(sheetLoan)
        );
        setLoans(convertedLoans);
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

  // Calculations
  const totalPrincipal = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalRemaining = loans.reduce((sum, l) => sum + l.remainingPrincipal, 0);
  const totalPaid = totalPrincipal - totalRemaining;
  const monthlyPayment = loans
    .filter((l) => l.status !== "completed")
    .reduce((sum, l) => sum + l.monthlyPayment, 0);
  const activeLoans = loans.filter((l) => l.status !== "completed").length;

  // Generate upcoming payments from loans data
  const upcomingPayments = loans
    .filter((l) => l.status !== "completed" && l.monthlyPayment > 0)
    .map((loan) => ({
      date: loan.endDate || new Date().toISOString().split("T")[0],
      loanId: loan.id,
      amount: loan.monthlyPayment,
    }));

  const stats = [
    {
      label: "Tổng vay ban đầu",
      value: formatCurrency(totalPrincipal),
      change: `${loans.length} khoản vay`,
      icon: HandCoins,
      color: "bg-blue-500",
    },
    {
      label: "Đã trả",
      value: formatCurrency(totalPaid),
      change: `${((totalPaid / totalPrincipal) * 100).toFixed(1)}% tổng nợ`,
      isPositive: true,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      label: "Dư nợ còn lại",
      value: formatCurrency(totalRemaining),
      change: `${activeLoans} khoản đang vay`,
      icon: TrendingDown,
      color: "bg-red-500",
    },
    {
      label: "Trả góp/tháng",
      value: formatCurrency(monthlyPayment),
      change: "Kỳ thanh toán tiếp theo",
      icon: Calendar,
      color: "bg-orange-500",
    },
  ];

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
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Vay dài hạn</span>;
      case "short_term":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Vay ngắn hạn</span>;
      case "personal":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Vay cá nhân</span>;
      default:
        return null;
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.lender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || loan.status === filterStatus;
    return matchesSearch && matchesFilter;
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
        status: selectedLoan.status === "active" ? "Ổn Định" :
                selectedLoan.status === "near_due" ? "Sắp Đáo Hạn Gốc" :
                selectedLoan.status === "completed" ? "Hoàn Thành" : "Quá Hạn",
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
      const response = await fetch(`/api/payment-history/delete?id=${paymentToDelete}`, {
        method: "DELETE",
      });

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
          <p className="text-gray-500 mt-1">Theo dõi và quản lý các khoản vay</p>
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
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
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
            {activeTab === "khoan-vay" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm khoản vay
              </button>
            )}
            {activeTab === "lich-thanh-toan" && (
              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm giao dịch
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Khoản vay */}
          {activeTab === "khoan-vay" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Tìm khoản vay..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang vay</option>
                    <option value="near_due">Sắp đến hạn</option>
                    <option value="completed">Đã tất toán</option>
                  </select>
                </div>
              </div>

              {isLoadingLoans ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                </div>
              ) : filteredLoans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <HandCoins className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Chưa có khoản vay nào</p>
                  <p className="text-sm mt-1">Nhấn &quot;Thêm khoản vay&quot; để bắt đầu</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mã món vay</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Người cho vay</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phân loại</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày đáo hạn</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Số tiền vay gốc</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lãi suất ban đầu</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loại lãi suất</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày trả lãi</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kỳ hạn trả lãi</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày giải ngân</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mục đích vay</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLoans.map((loan: any) => (
                      <tr key={loan.code} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <span className="font-medium text-blue-600">{loan.code}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.lender}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.category || "-"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.maturityDate || "-"}</span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(loan.principalAmount)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.initialInterestRate || "-"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.interestType || "-"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.interestPaymentDate || "-"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.paymentTerm || "-"}</span>
                        </td>
                        <td className="px-4 py-4 text-center">{getStatusBadge(loan.status)}</td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.disbursementDate || "-"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{loan.purpose || "-"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewLoan(loan)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditLoan(loan)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLoan(loan)}
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
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Lịch thanh toán */}
          {activeTab === "lich-thanh-toan" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử thanh toán</h3>
              {isLoadingPaymentHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Chưa có lịch sử thanh toán nào</p>
                  <p className="text-sm mt-1">Nhấn &quot;Thêm giao dịch&quot; để bắt đầu</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày giao dịch</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mã món vay</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loại giao dịch</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Số tiền thu</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Số tiền chi</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{payment.transactionDate}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-blue-600">{payment.loanCode}</span>
                          </td>
                          <td className="px-4 py-4 text-gray-900">{payment.transactionType}</td>
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
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewPayment(payment)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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
                        <td className="px-4 py-3 text-gray-900" colSpan={3}>Tổng cộng</td>
                        <td className="px-4 py-3 text-right text-green-600">
                          {formatCurrency(paymentHistory.reduce((s, p) => s + p.amountIn, 0))}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">
                          {formatCurrency(paymentHistory.reduce((s, p) => s + p.amountOut, 0))}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Lịch sử trả nợ */}
          {activeTab === "lich-su-tra" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Các khoản thanh toán sắp tới</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingPayments.map((payment, index) => {
                  const loan = loans.find((l) => l.id === payment.loanId);
                  const daysLeft = Math.ceil((new Date(payment.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-l-4 ${
                        daysLeft <= 3 ? "border-red-500 bg-red-50" : daysLeft <= 7 ? "border-yellow-500 bg-yellow-50" : "border-blue-500 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-600">{payment.loanId}</span>
                        <span className={`text-sm font-medium ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-yellow-600" : "text-blue-600"}`}>
                          {daysLeft <= 0 ? "Đến hạn hôm nay" : `Còn ${daysLeft} ngày`}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{loan?.lender}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">
                          {new Date(payment.date).toLocaleDateString("vi-VN")}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                      </div>
                      <button className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Thanh toán ngay
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Tổng thanh toán tháng này</span>
                </div>
                <p className="text-3xl font-bold text-yellow-700">
                  {formatCurrency(upcomingPayments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
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
                <h3 className="text-lg font-semibold text-gray-900">Thêm khoản vay mới</h3>
                <p className="text-sm text-gray-500">Nhập thông tin khoản vay</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bên cho vay *</label>
                  <input
                    type="text"
                    value={newLoan.lender || ""}
                    onChange={(e) => setNewLoan({ ...newLoan, lender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên ngân hàng/tổ chức"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại vay</label>
                  <select
                    value={newLoan.type || "long_term"}
                    onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value as Loan["type"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="long_term">Vay dài hạn</option>
                    <option value="short_term">Vay ngắn hạn</option>
                    <option value="personal">Vay cá nhân</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền vay *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newLoan.principal || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setNewLoan({ ...newLoan, principal: val ? Number(val) : 0 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số tiền"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lãi suất (%/năm)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newLoan.interestRate || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=\d)/, "").replace(/[^\d.]/g, "");
                        setNewLoan({ ...newLoan, interestRate: val ? Number(val) : 0 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Lãi suất"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                    <input
                      type="date"
                      value={newLoan.startDate || ""}
                      onChange={(e) => setNewLoan({ ...newLoan, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                    <input
                      type="date"
                      value={newLoan.endDate || ""}
                      onChange={(e) => setNewLoan({ ...newLoan, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền trả/tháng</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newLoan.monthlyPayment || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                      setNewLoan({ ...newLoan, monthlyPayment: val ? Number(val) : 0 });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số tiền trả/tháng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mục đích vay</label>
                  <input
                    type="text"
                    value={newLoan.purpose || ""}
                    onChange={(e) => setNewLoan({ ...newLoan, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mục đích vay"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={newLoan.notes || ""}
                    onChange={(e) => setNewLoan({ ...newLoan, notes: e.target.value })}
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
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết khoản vay</h3>
                <p className="text-sm text-blue-600 font-medium">{selectedLoan.id}</p>
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
                        {Math.round(((selectedLoan.principal - selectedLoan.remainingPrincipal) / selectedLoan.principal) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${((selectedLoan.principal - selectedLoan.remainingPrincipal) / selectedLoan.principal) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Bên cho vay</span>
                  <span className="text-gray-900 font-medium">{selectedLoan.lender}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Lãi suất</span>
                  <span className="text-gray-900 font-medium">{selectedLoan.interestRate}%/năm</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Ngày bắt đầu</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(selectedLoan.startDate).toLocaleDateString("vi-VN")}
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
                  <span className="text-orange-600 font-medium">{formatCurrency(selectedLoan.monthlyPayment)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Mục đích vay</span>
                  <span className="text-gray-900 font-medium">{selectedLoan.purpose}</span>
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
                <h3 className="text-lg font-semibold text-gray-900">Sửa khoản vay</h3>
                <p className="text-sm text-blue-600 font-medium">{selectedLoan.id}</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bên cho vay *</label>
                  <input
                    type="text"
                    value={selectedLoan.lender}
                    onChange={(e) => setSelectedLoan({ ...selectedLoan, lender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại vay</label>
                  <select
                    value={selectedLoan.type}
                    onChange={(e) => setSelectedLoan({ ...selectedLoan, type: e.target.value as Loan["type"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="long_term">Vay dài hạn</option>
                    <option value="short_term">Vay ngắn hạn</option>
                    <option value="personal">Vay cá nhân</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền vay</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedLoan.principal || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setSelectedLoan({ ...selectedLoan, principal: val ? Number(val) : 0 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lãi suất (%/năm)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={selectedLoan.interestRate || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=\d)/, "").replace(/[^\d.]/g, "");
                        setSelectedLoan({ ...selectedLoan, interestRate: val ? Number(val) : 0 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Còn nợ</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedLoan.remainingPrincipal || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setSelectedLoan({ ...selectedLoan, remainingPrincipal: val ? Number(val) : 0 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trả góp/tháng</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedLoan.monthlyPayment || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setSelectedLoan({ ...selectedLoan, monthlyPayment: val ? Number(val) : 0 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={selectedLoan.status}
                    onChange={(e) => setSelectedLoan({ ...selectedLoan, status: e.target.value as Loan["status"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Đang vay</option>
                    <option value="near_due">Sắp đến hạn</option>
                    <option value="completed">Đã tất toán</option>
                    <option value="overdue">Quá hạn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mục đích vay</label>
                  <input
                    type="text"
                    value={selectedLoan.purpose}
                    onChange={(e) => setSelectedLoan({ ...selectedLoan, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={selectedLoan.notes || ""}
                    onChange={(e) => setSelectedLoan({ ...selectedLoan, notes: e.target.value })}
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
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa khoản vay</h3>
                  <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa khoản vay <span className="font-semibold text-blue-600">{loanToDelete.id}</span> của{" "}
                <span className="font-semibold">{loanToDelete.lender}</span>?
              </p>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Dữ liệu sẽ bị xóa vĩnh viễn khỏi Google Sheets.
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
                <h3 className="text-lg font-semibold text-gray-900">Thêm giao dịch mới</h3>
                <p className="text-sm text-gray-500">Nhập thông tin giao dịch</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao dịch *</label>
                  <input
                    type="date"
                    value={newPayment.transactionDate}
                    onChange={(e) => setNewPayment({ ...newPayment, transactionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã món vay</label>
                  <input
                    type="text"
                    value={newPayment.loanCode}
                    onChange={(e) => setNewPayment({ ...newPayment, loanCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: MV01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                  <input
                    type="text"
                    value={newPayment.transactionType}
                    onChange={(e) => setNewPayment({ ...newPayment, transactionType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Trả lãi, Trả gốc..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thu</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newPayment.amountIn || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setNewPayment({ ...newPayment, amountIn: val ? Number(val) : 0 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền chi</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newPayment.amountOut || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setNewPayment({ ...newPayment, amountOut: val ? Number(val) : 0 });
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
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết giao dịch</h3>
                <p className="text-sm text-gray-500">ID: {selectedPayment.id}</p>
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
                  <span className="text-gray-900 font-medium">{selectedPayment.transactionDate}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Mã món vay</span>
                  <span className="text-blue-600 font-medium">{selectedPayment.loanCode}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Loại giao dịch</span>
                  <span className="text-gray-900 font-medium">{selectedPayment.transactionType}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Số tiền thu</span>
                  <span className="text-green-600 font-medium">{formatCurrency(selectedPayment.amountIn)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Số tiền chi</span>
                  <span className="text-red-600 font-medium">{formatCurrency(selectedPayment.amountOut)}</span>
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
                <h3 className="text-lg font-semibold text-gray-900">Sửa giao dịch</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao dịch *</label>
                  <input
                    type="date"
                    value={editPayment.transactionDate}
                    onChange={(e) => setEditPayment({ ...editPayment, transactionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã món vay</label>
                  <input
                    type="text"
                    value={editPayment.loanCode}
                    onChange={(e) => setEditPayment({ ...editPayment, loanCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: MV01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                  <input
                    type="text"
                    value={editPayment.transactionType}
                    onChange={(e) => setEditPayment({ ...editPayment, transactionType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Trả lãi, Trả gốc..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thu</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editPayment.amountIn || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setEditPayment({ ...editPayment, amountIn: val ? Number(val) : 0 });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền chi</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editPayment.amountOut || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setEditPayment({ ...editPayment, amountOut: val ? Number(val) : 0 });
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
            onClick={() => !isDeletingPayment && setShowDeletePaymentModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md bg-white rounded-xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa giao dịch</h3>
                  <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa giao dịch này?
              </p>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Dữ liệu sẽ bị xóa vĩnh viễn khỏi Google Sheets.
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
    </div>
  );
}
