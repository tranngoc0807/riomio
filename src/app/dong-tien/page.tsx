"use client";

import {
  Wallet,
  TrendingUp,
  CreditCard,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Portal from "@/components/Portal";

// Dữ liệu giao dịch mẫu
const initialTransactions: {
  id: number;
  code: string;
  date: string;
  type: "income" | "expense";
  category: string;
  entity: string;
  description: string;
  amount: number;
  account: string;
}[] = [
  {
    id: 1,
    code: "GD001",
    date: "2024-12-25",
    type: "income",
    category: "Bán hàng",
    entity: "Công ty ABC",
    description: "Thu tiền đơn hàng DH004",
    amount: 8500000,
    account: "Tiền mặt",
  },
  {
    id: 2,
    code: "GD002",
    date: "2024-12-25",
    type: "expense",
    category: "Lương",
    entity: "Nhân viên",
    description: "Chi lương nhân viên tháng 12",
    amount: 45000000,
    account: "Ngân hàng",
  },
  {
    id: 3,
    code: "GD003",
    date: "2024-12-24",
    type: "income",
    category: "Bán hàng",
    entity: "Khách lẻ",
    description: "Thu tiền đơn hàng DH003",
    amount: 450000,
    account: "Tiền mặt",
  },
  {
    id: 4,
    code: "GD004",
    date: "2024-12-24",
    type: "expense",
    category: "NPL",
    entity: "Toản Nhung",
    description: "Chi mua nguyên phụ liệu",
    amount: 12000000,
    account: "Ngân hàng",
  },
  {
    id: 5,
    code: "GD005",
    date: "2024-12-23",
    type: "income",
    category: "Bán hàng",
    entity: "Công ty ABC",
    description: "Thu tiền công ty ABC",
    amount: 15000000,
    account: "Ngân hàng",
  },
  {
    id: 6,
    code: "GD006",
    date: "2024-12-23",
    type: "expense",
    category: "Điện nước",
    entity: "EVN",
    description: "Chi tiền điện tháng 12",
    amount: 3500000,
    account: "Tiền mặt",
  },
  {
    id: 7,
    code: "GD007",
    date: "2024-12-20",
    type: "income",
    category: "Bán hàng",
    entity: "Shop XYZ",
    description: "Thu tiền shop XYZ",
    amount: 22000000,
    account: "Ngân hàng",
  },
  {
    id: 8,
    code: "GD008",
    date: "2024-12-18",
    type: "expense",
    category: "NPL",
    entity: "Phương Tiên",
    description: "Chi mua vải cotton",
    amount: 8500000,
    account: "Ngân hàng",
  },
  {
    id: 9,
    code: "GD009",
    date: "2024-12-15",
    type: "income",
    category: "Thu nợ",
    entity: "NPP Hải Dương",
    description: "NPP Hải Dương thanh toán",
    amount: 35000000,
    account: "Ngân hàng",
  },
  {
    id: 10,
    code: "GD010",
    date: "2024-12-10",
    type: "expense",
    category: "Thuê nhà",
    entity: "Chủ kho",
    description: "Tiền thuê kho tháng 12",
    amount: 15000000,
    account: "Ngân hàng",
  },
  {
    id: 11,
    code: "GD011",
    date: "2024-11-28",
    type: "income",
    category: "Bán hàng",
    entity: "Đại lý tháng 11",
    description: "Thu tiền đơn hàng tháng 11",
    amount: 42000000,
    account: "Ngân hàng",
  },
  {
    id: 12,
    code: "GD012",
    date: "2024-11-25",
    type: "expense",
    category: "Lương",
    entity: "Nhân viên",
    description: "Chi lương nhân viên tháng 11",
    amount: 43000000,
    account: "Ngân hàng",
  },
];

// Dữ liệu khoản vay (sẽ load từ Google Sheets)
const initialLoans = [
  {
    id: 1,
    code: "KV001",
    lender: "Ngân hàng VCB",
    amount: 500000000,
    remaining: 350000000,
    interestRate: 8.5,
    startDate: "2024-01-15",
    endDate: "2026-01-15",
    status: "active",
  },
  {
    id: 2,
    code: "KV002",
    lender: "Ông Nguyễn Văn B",
    amount: 100000000,
    remaining: 50000000,
    interestRate: 12,
    startDate: "2024-06-01",
    endDate: "2025-06-01",
    status: "active",
  },
];

// Helper functions
const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const formatDisplayDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Get start of week (Monday)
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Get end of week (Sunday)
const getEndOfWeek = (date: Date) => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

// Get start of month
const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Get end of month
const getEndOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export default function DongTien() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Đọc tab từ URL params, mặc định là "transactions"
  const getTabFromUrl = (): "transactions" | "accounts" | "loans" => {
    const tab = searchParams.get("tab");
    if (tab === "transactions" || tab === "accounts" || tab === "loans") {
      return tab;
    }
    return "transactions";
  };

  const [activeTab, setActiveTab] = useState<
    "transactions" | "accounts" | "loans"
  >(getTabFromUrl);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [accounts, setAccounts] = useState<{
    id: number;
    accountNumber: string;
    ownerName: string;
    type: string;
  }[]>([]);
  const [loans, setLoans] = useState<{
    id: number;
    code: string;
    lender: string;
    amount: number;
    remaining: number;
    interestRate: string;
    interestType: string;
    monthlyInterest: number;
    dueDate: string;
    status: string;
  }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  // Sync activeTab với URL khi searchParams thay đổi
  useEffect(() => {
    const newTab = getTabFromUrl();
    if (newTab !== activeTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(newTab);
    }
  }, [searchParams]);

  // Fetch accounts from API when accounts tab is active
  useEffect(() => {
    if (activeTab === "accounts") {
      fetchAccounts();
    }
  }, [activeTab]);

  // Fetch loans from API when loans tab is active
  useEffect(() => {
    if (activeTab === "loans") {
      fetchLoans();
    }
  }, [activeTab]);

  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await fetch("/api/accounts");
      const result = await response.json();
      if (result.success) {
        setAccounts(result.data);
      } else {
        console.error("Failed to fetch accounts:", result.error);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const fetchLoans = async () => {
    try {
      setIsLoadingLoans(true);
      const response = await fetch("/api/loans");
      const result = await response.json();
      if (result.success) {
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

  // Function để đổi tab và cập nhật URL
  const handleTabChange = (tab: "transactions" | "accounts" | "loans") => {
    setActiveTab(tab);
    router.push(`/dong-tien?tab=${tab}`);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Date range filter states
  const today = formatDate(new Date());
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  // Quick select presets
  const applyPreset = (preset: "today" | "week" | "month" | "all") => {
    const now = new Date();
    if (preset === "today") {
      const todayStr = formatDate(now);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === "week") {
      setFromDate(formatDate(getStartOfWeek(now)));
      setToDate(formatDate(getEndOfWeek(now)));
    } else if (preset === "month") {
      setFromDate(formatDate(getStartOfMonth(now)));
      setToDate(formatDate(getEndOfMonth(now)));
    } else {
      // All - show all transactions
      setFromDate("2020-01-01");
      setToDate(formatDate(now));
    }
  };

  // TODO: Bật lại filter khi có data thật
  // const dateFilteredTransactions = useMemo(() => {
  //   return transactions.filter((t) => {
  //     const txDate = t.date;
  //     return txDate >= fromDate && txDate <= toDate;
  //   });
  // }, [transactions, fromDate, toDate]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<{
    id: number;
    code: string;
    date: string;
    type: "income" | "expense";
    category: string;
    entity: string;
    description: string;
    amount: number;
    account: string;
  } | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    type: "income" as "income" | "expense",
    category: "",
    entity: "",
    description: "",
    amount: 0,
    account: "Tiền mặt",
  });

  // Account modal states
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<{
    id: number;
    accountNumber: string;
    ownerName: string;
    type: string;
  } | null>(null);
  const [newAccount, setNewAccount] = useState({
    accountNumber: "",
    ownerName: "",
    type: "Tiền mặt",
  });

  // Tạm thời bỏ filter theo ngày để hiện tất cả data mẫu
  const filteredTransactions = transactions.filter((t) => {
    const matchSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    return matchSearch && matchType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to page 1 when filter changes
  const handleFilterChange = (type: "all" | "income" | "expense") => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleAddTransaction = () => {
    if (newTransaction.category && newTransaction.amount > 0) {
      const today = new Date().toISOString().split("T")[0];
      setTransactions([
        {
          id: transactions.length + 1,
          code: `GD${String(transactions.length + 1).padStart(3, "0")}`,
          date: today,
          ...newTransaction,
        },
        ...transactions,
      ]);
      setNewTransaction({
        type: "income",
        category: "",
        entity: "",
        description: "",
        amount: 0,
        account: "Tiền mặt",
      });
      setShowAddModal(false);
    }
  };

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDeleteTransaction = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa giao dịch này?")) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  const handleEditTransaction = (tx: typeof editingTransaction) => {
    if (tx) {
      setEditingTransaction(tx);
      setShowEditTransactionModal(true);
    }
  };

  const handleSaveTransaction = () => {
    if (editingTransaction && editingTransaction.category && editingTransaction.amount > 0) {
      setTransactions(
        transactions.map((t) => (t.id === editingTransaction.id ? editingTransaction : t))
      );
      setShowEditTransactionModal(false);
      setEditingTransaction(null);
    }
  };

  // Account handlers
  const handleAddAccount = async () => {
    if (newAccount.accountNumber) {
      setIsAddingAccount(true);
      try {
        const response = await fetch("/api/accounts/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newAccount),
        });
        const result = await response.json();
        if (result.success) {
          setNewAccount({
            accountNumber: "",
            ownerName: "",
            type: "Tiền mặt",
          });
          setShowAddAccountModal(false);
          fetchAccounts(); // Reload accounts
        } else {
          alert("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error adding account:", error);
        alert("Không thể thêm tài khoản");
      } finally {
        setIsAddingAccount(false);
      }
    }
  };

  const handleEditAccount = (account: typeof editingAccount) => {
    if (account) {
      setEditingAccount(account);
      setShowEditAccountModal(true);
    }
  };

  const handleSaveAccount = async () => {
    if (editingAccount && editingAccount.accountNumber) {
      setIsUpdatingAccount(true);
      try {
        const response = await fetch("/api/accounts/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingAccount),
        });
        const result = await response.json();
        if (result.success) {
          setShowEditAccountModal(false);
          setEditingAccount(null);
          fetchAccounts(); // Reload accounts
        } else {
          alert("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error updating account:", error);
        alert("Không thể cập nhật tài khoản");
      } finally {
        setIsUpdatingAccount(false);
      }
    }
  };

  const handleDeleteAccount = (id: number) => {
    setAccountToDelete(id);
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (accountToDelete === null) return;

    setIsDeletingAccount(true);
    try {
      const response = await fetch(`/api/accounts/delete?id=${accountToDelete}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setShowDeleteAccountModal(false);
        setAccountToDelete(null);
        fetchAccounts(); // Reload accounts
      } else {
        alert("Lỗi: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Không thể xóa tài khoản");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Stats - hiện tất cả data mẫu
  const periodIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const periodExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = 255000000; // TODO: Tính từ giao dịch hoặc lưu trong Google Sheets
  const totalLoanRemaining = loans.reduce((sum, l) => sum + l.remaining, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dòng tiền</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thu chi và theo dõi dòng tiền
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Wallet className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng số dư</p>
              <p className="text-2xl font-bold text-blue-600">
                {(totalBalance / 1000000).toFixed(0)}M
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <ArrowUpCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Thu trong kỳ</p>
              <p className="text-2xl font-bold text-green-600">
                {(periodIncome / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <ArrowDownCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chi trong kỳ</p>
              <p className="text-2xl font-bold text-red-600">
                {(periodExpense / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <CreditCard className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nợ vay còn lại</p>
              <p className="text-2xl font-bold text-orange-600">
                {(totalLoanRemaining / 1000000).toFixed(0)}M
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
              onClick={() => handleTabChange("transactions")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "transactions"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={20} />
                Thu chi hàng ngày
              </div>
            </button>
            <button
              onClick={() => handleTabChange("accounts")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "accounts"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Wallet size={20} />
                Tài khoản
              </div>
            </button>
            <button
              onClick={() => handleTabChange("loans")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "loans"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard size={20} />
                Khoản vay
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Thu chi */}
          {activeTab === "transactions" && (
            <>
              {/* Date Filter Calendar */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Date Range Picker */}
                  <div className="flex items-center gap-3">
                    <Calendar className="text-blue-600" size={20} />
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <span className="text-sm text-gray-500">Từ</span>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="border-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none cursor-pointer"
                      />
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">Đến</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="border-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <span className="text-xs text-gray-500">
                        {transactions.length} giao dịch
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Thu</p>
                      <p className="font-semibold text-green-600">
                        +{periodIncome.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Chi</p>
                      <p className="font-semibold text-red-600">
                        -{periodExpense.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    {/* <div className="text-right border-l pl-4">
                      <p className="text-xs text-gray-500">Chênh lệch</p>
                      <p
                        className={`font-semibold ${
                          periodIncome - periodExpense >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(periodIncome - periodExpense).toLocaleString("vi-VN")}
                        đ
                      </p>
                    </div> */}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Tìm kiếm giao dịch..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFilterChange("all")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filterType === "all"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => handleFilterChange("income")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filterType === "income"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Thu
                    </button>
                    <button
                      onClick={() => handleFilterChange("expense")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        filterType === "expense"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Chi
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm giao dịch
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã GD
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Ngày
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Loại
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Danh mục
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Đối tượng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mô tả
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Số tiền
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tài khoản
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-blue-600">
                          {tx.code}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {new Date(tx.date).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              tx.type === "income"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {tx.type === "income" ? (
                              <ArrowUpCircle size={14} />
                            ) : (
                              <ArrowDownCircle size={14} />
                            )}
                            {tx.type === "income" ? "Thu" : "Chi"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                          {tx.entity || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {tx.description}
                        </td>
                        <td
                          className={`px-4 py-4 text-sm text-right font-medium ${
                            tx.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {tx.amount.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {tx.account}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewItem(tx)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditTransaction(tx)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} / {filteredTransactions.length} giao dịch
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab: Tài khoản */}
          {activeTab === "accounts" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Danh sách tài khoản</h3>
                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm tài khoản
                </button>
              </div>

              {isLoadingAccounts ? (
                <div className="text-center py-8 text-gray-500">
                  Đang tải dữ liệu...
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có tài khoản nào. Nhấn &quot;Thêm tài khoản&quot; để bắt đầu.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                          Số tài khoản
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                          Tên chủ tài khoản
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                          Loại
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {accounts.map((account, index) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {account.accountNumber}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {account.ownerName || "-"}
                          </td>
                          <td className="px-4 py-4">
                            {account.type ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  account.type === "Tài khoản"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {account.type}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditAccount(account)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Sửa"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(account.id)}
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

          {/* Tab: Khoản vay */}
          {activeTab === "loans" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Danh sách khoản vay</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Plus size={20} />
                  Thêm khoản vay
                </button>
              </div>

              {isLoadingLoans ? (
                <div className="text-center py-8 text-gray-500">
                  Đang tải dữ liệu...
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có khoản vay nào. Nhấn &quot;Thêm khoản vay&quot; để bắt đầu.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                          Mã món vay
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                          Chủ nợ
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                          Dư nợ gốc hiện tại
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                          Lãi suất
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                          Kiểu tính lãi
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                          Góc tính lãi
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                          Dư tính tiền lãi phải trả tháng này
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                          Ngày đến hạn trả lãi
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-blue-600">
                            {loan.code || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {loan.lender || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-orange-600 font-medium">
                            {loan.remaining ? loan.remaining.toLocaleString("vi-VN") + "đ" : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-center text-gray-600">
                            {loan.interestRate || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {loan.interestType || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-gray-900">
                            {loan.amount ? loan.amount.toLocaleString("vi-VN") + "đ" : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-red-600 font-medium">
                            {loan.monthlyInterest ? loan.monthlyInterest.toLocaleString("vi-VN") + "đ" : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {loan.dueDate || "-"}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {loan.status ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  loan.status === "Đang vay"
                                    ? "bg-blue-100 text-blue-700"
                                    : loan.status === "Sắp đến hạn"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : loan.status === "Đã trả"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {loan.status}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
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
      </div>

      {/* Modal thêm giao dịch */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thêm giao dịch mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giao dịch
                </label>
                <div className="flex gap-4">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer ${
                      newTransaction.type === "income"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={newTransaction.type === "income"}
                      onChange={() =>
                        setNewTransaction({ ...newTransaction, type: "income" })
                      }
                      className="hidden"
                    />
                    <ArrowUpCircle size={20} />
                    Thu
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer ${
                      newTransaction.type === "expense"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={newTransaction.type === "expense"}
                      onChange={() =>
                        setNewTransaction({
                          ...newTransaction,
                          type: "expense",
                        })
                      }
                      className="hidden"
                    />
                    <ArrowDownCircle size={20} />
                    Chi
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục *
                </label>
                <select
                  value={newTransaction.category}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn danh mục</option>
                  {newTransaction.type === "income" ? (
                    <>
                      <option value="Bán hàng">Bán hàng</option>
                      <option value="Thu nợ">Thu nợ</option>
                      <option value="Khác">Khác</option>
                    </>
                  ) : (
                    <>
                      <option value="Lương">Lương</option>
                      <option value="NPL">Nguyên phụ liệu</option>
                      <option value="Điện nước">Điện nước</option>
                      <option value="Thuê nhà">Thuê nhà</option>
                      <option value="Khác">Khác</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đối tượng
                </label>
                <input
                  type="text"
                  value={newTransaction.entity}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      entity: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Công ty ABC, NCC Toản Nhung..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mô tả"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newTransaction.amount || ""}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/^0+/, "")
                      .replace(/\D/g, "");
                    setNewTransaction({
                      ...newTransaction,
                      amount: val ? Number(val) : 0,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số tiền"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tài khoản
                </label>
                <select
                  value={newTransaction.account}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      account: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Ngân hàng">Ngân hàng</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.accountNumber}>
                      {acc.accountNumber} - {acc.ownerName}
                    </option>
                  ))}
                </select>
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
                onClick={handleAddTransaction}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  newTransaction.type === "income"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Thêm {newTransaction.type === "income" ? "thu" : "chi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Panel xem chi tiết giao dịch */}
      {showViewModal && selectedItem && (
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
                <h3 className="text-xl font-bold text-gray-900">Chi tiết giao dịch</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Transaction Type Badge */}
              <div className="mb-6">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    selectedItem.type === "income"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedItem.type === "income" ? (
                    <ArrowUpCircle size={18} />
                  ) : (
                    <ArrowDownCircle size={18} />
                  )}
                  {selectedItem.type === "income" ? "Thu" : "Chi"}
                </span>
              </div>

              {/* Amount */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Số tiền</p>
                <p
                  className={`text-3xl font-bold ${
                    selectedItem.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedItem.type === "income" ? "+" : "-"}
                  {selectedItem.amount.toLocaleString("vi-VN")}đ
                </p>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Mã giao dịch</span>
                  <span className="text-gray-900 font-medium">{selectedItem.code}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Ngày</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(selectedItem.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Danh mục</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {selectedItem.category}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Đối tượng</span>
                  <span className="text-gray-900 font-medium">{selectedItem.entity || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Tài khoản</span>
                  <span className="text-gray-900 font-medium">{selectedItem.account}</span>
                </div>
                <div className="py-3">
                  <p className="text-gray-500 mb-2">Mô tả</p>
                  <p className="text-gray-900">{selectedItem.description || "Không có mô tả"}</p>
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
                    handleEditTransaction(selectedItem);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Sửa giao dịch
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Slide Panel sửa giao dịch */}
      {showEditTransactionModal && editingTransaction && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditTransactionModal(false);
              setEditingTransaction(null);
            }}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Sửa giao dịch</h3>
                <button
                  onClick={() => {
                    setShowEditTransactionModal(false);
                    setEditingTransaction(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Transaction Code (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã giao dịch
                  </label>
                  <input
                    type="text"
                    value={editingTransaction.code}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày giao dịch
                  </label>
                  <input
                    type="date"
                    value={editingTransaction.date}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại giao dịch
                  </label>
                  <div className="flex gap-4">
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer ${
                        editingTransaction.type === "income"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="editTxType"
                        value="income"
                        checked={editingTransaction.type === "income"}
                        onChange={() =>
                          setEditingTransaction({
                            ...editingTransaction,
                            type: "income",
                            category: "",
                          })
                        }
                        className="hidden"
                      />
                      <ArrowUpCircle size={20} />
                      Thu
                    </label>
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer ${
                        editingTransaction.type === "expense"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="editTxType"
                        value="expense"
                        checked={editingTransaction.type === "expense"}
                        onChange={() =>
                          setEditingTransaction({
                            ...editingTransaction,
                            type: "expense",
                            category: "",
                          })
                        }
                        className="hidden"
                      />
                      <ArrowDownCircle size={20} />
                      Chi
                    </label>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục *
                  </label>
                  <select
                    value={editingTransaction.category}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {editingTransaction.type === "income" ? (
                      <>
                        <option value="Bán hàng">Bán hàng</option>
                        <option value="Thu nợ">Thu nợ</option>
                        <option value="Khác">Khác</option>
                      </>
                    ) : (
                      <>
                        <option value="Lương">Lương</option>
                        <option value="NPL">Nguyên phụ liệu</option>
                        <option value="Điện nước">Điện nước</option>
                        <option value="Thuê nhà">Thuê nhà</option>
                        <option value="Khác">Khác</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Entity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đối tượng
                  </label>
                  <input
                    type="text"
                    value={editingTransaction.entity}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        entity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Công ty ABC, NCC Toản Nhung..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    value={editingTransaction.description}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mô tả"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tiền *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingTransaction.amount || ""}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/^0+/, "")
                        .replace(/\D/g, "");
                      setEditingTransaction({
                        ...editingTransaction,
                        amount: val ? Number(val) : 0,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số tiền"
                  />
                </div>

                {/* Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tài khoản
                  </label>
                  <select
                    value={editingTransaction.account}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        account: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Ngân hàng">Ngân hàng</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.accountNumber}>
                        {acc.accountNumber} - {acc.ownerName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowEditTransactionModal(false);
                    setEditingTransaction(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveTransaction}
                  className={`flex-1 px-4 py-3 text-white rounded-lg font-medium ${
                    editingTransaction.type === "income"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal thêm tài khoản */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thêm tài khoản mới</h3>
              <button
                onClick={() => setShowAddAccountModal(false)}
                disabled={isAddingAccount}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tài khoản *
                </label>
                <input
                  type="text"
                  value={newAccount.accountNumber}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, accountNumber: e.target.value })
                  }
                  disabled={isAddingAccount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Nhập số tài khoản"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chủ tài khoản
                </label>
                <input
                  type="text"
                  value={newAccount.ownerName}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, ownerName: e.target.value })
                  }
                  disabled={isAddingAccount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Nhập tên chủ tài khoản"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại tài khoản *
                </label>
                <div className="flex gap-4">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer ${
                      newAccount.type === "Tiền mặt"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value="Tiền mặt"
                      checked={newAccount.type === "Tiền mặt"}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, type: e.target.value })
                      }
                      className="hidden"
                    />
                    <Wallet size={20} />
                    Tiền mặt
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer ${
                      newAccount.type === "Tài khoản"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value="Tài khoản"
                      checked={newAccount.type === "Tài khoản"}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, type: e.target.value })
                      }
                      className="hidden"
                    />
                    <CreditCard size={20} />
                    Tài khoản
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddAccountModal(false)}
                disabled={isAddingAccount}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleAddAccount}
                disabled={isAddingAccount}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingAccount ? (
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
                  "Thêm tài khoản"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa tài khoản */}
      {showEditAccountModal && editingAccount && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sửa tài khoản</h3>
              <button
                onClick={() => {
                  setShowEditAccountModal(false);
                  setEditingAccount(null);
                }}
                disabled={isUpdatingAccount}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tài khoản *
                </label>
                <input
                  type="text"
                  value={editingAccount.accountNumber}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      accountNumber: e.target.value,
                    })
                  }
                  disabled={isUpdatingAccount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Nhập số tài khoản"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chủ tài khoản
                </label>
                <input
                  type="text"
                  value={editingAccount.ownerName}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      ownerName: e.target.value,
                    })
                  }
                  disabled={isUpdatingAccount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Nhập tên chủ tài khoản"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại tài khoản *
                </label>
                <div className="flex gap-4">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer ${
                      editingAccount.type === "Tiền mặt"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editAccountType"
                      value="Tiền mặt"
                      checked={editingAccount.type === "Tiền mặt"}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          type: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <Wallet size={20} />
                    Tiền mặt
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer ${
                      editingAccount.type === "Tài khoản"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editAccountType"
                      value="Tài khoản"
                      checked={editingAccount.type === "Tài khoản"}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          type: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <CreditCard size={20} />
                    Tài khoản
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditAccountModal(false);
                  setEditingAccount(null);
                }}
                disabled={isUpdatingAccount}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAccount}
                disabled={isUpdatingAccount}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingAccount ? (
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
      )}

      {/* Modal xác nhận xóa tài khoản */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setAccountToDelete(null);
                }}
                disabled={isDeletingAccount}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setAccountToDelete(null);
                }}
                disabled={isDeletingAccount}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
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
                    Đang xóa...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
