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
import toast, { Toaster } from "react-hot-toast";
import { ThuChi } from "@/lib/googleSheets";



// Helper functions
const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
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
  const [thuChiList, setThuChiList] = useState<ThuChi[]>([]);
  const [isLoadingThuChi, setIsLoadingThuChi] = useState(false);
  const [isAddingThuChi, setIsAddingThuChi] = useState(false);
  const [isUpdatingThuChi, setIsUpdatingThuChi] = useState(false);
  const [isDeletingThuChi, setIsDeletingThuChi] = useState(false);
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

  // Suppliers and Workshops for searchable dropdowns
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [workshops, setWorkshops] = useState<{ id: number; name: string }[]>([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [workshopSearch, setWorkshopSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showWorkshopDropdown, setShowWorkshopDropdown] = useState(false);

  // Account name dropdown
  const [accountSearch, setAccountSearch] = useState("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Category dropdown (Phân loại thu chi)
  const [categories, setCategories] = useState<{ id: number; loaiPhieu: string; noiDung: string }[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Sync activeTab với URL khi searchParams thay đổi
  useEffect(() => {
    const newTab = getTabFromUrl();
    if (newTab !== activeTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(newTab);
    }
  }, [searchParams]);

  // Fetch thu chi from API when transactions tab is active
  useEffect(() => {
    if (activeTab === "transactions") {
      fetchThuChi();
    }
  }, [activeTab]);

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

  // Fetch suppliers, workshops, accounts and categories for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      // Fetch each API separately to handle errors individually
      try {
        const suppliersRes = await fetch("/api/suppliers");
        const suppliersData = await suppliersRes.json();
        if (suppliersData.success) setSuppliers(suppliersData.data);
      } catch (e) {
        console.error("Error fetching suppliers:", e);
      }

      try {
        const workshopsRes = await fetch("/api/workshops");
        const workshopsData = await workshopsRes.json();
        if (workshopsData.success) setWorkshops(workshopsData.data);
      } catch (e) {
        console.error("Error fetching workshops:", e);
      }

      try {
        const accountsRes = await fetch("/api/accounts");
        const accountsData = await accountsRes.json();
        if (accountsData.success) setAccounts(accountsData.data);
      } catch (e) {
        console.error("Error fetching accounts:", e);
      }

      try {
        const categoriesRes = await fetch("/api/phan-loai-thu-chi");
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) setCategories(categoriesData.data);
      } catch (e) {
        console.error("Error fetching categories:", e);
      }
    };
    fetchDropdownData();
  }, []);

  const fetchThuChi = async () => {
    try {
      setIsLoadingThuChi(true);
      const response = await fetch("/api/thu-chi");
      const result = await response.json();
      if (result.success) {
        setThuChiList(result.data);
      } else {
        console.error("Failed to fetch thu chi:", result.error);
        toast.error("Không thể tải dữ liệu thu chi");
      }
    } catch (error) {
      console.error("Error fetching thu chi:", error);
      toast.error("Lỗi khi tải dữ liệu thu chi");
    } finally {
      setIsLoadingThuChi(false);
    }
  };

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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
      // All - show all transactions (clear date filter)
      setFromDate("");
      setToDate("");
    }
  };


  // Thu Chi modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<"income" | "expense">("income");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditThuChiModal, setShowEditThuChiModal] = useState(false);
  const [showDeleteThuChiModal, setShowDeleteThuChiModal] = useState(false);
  const [selectedThuChi, setSelectedThuChi] = useState<ThuChi | null>(null);
  const [thuChiToDelete, setThuChiToDelete] = useState<number | null>(null);
  const [editingThuChi, setEditingThuChi] = useState<ThuChi | null>(null);
  const [newThuChi, setNewThuChi] = useState<Partial<ThuChi>>({
    date: formatDate(new Date()),
    accountName: "",
    nccNpl: "",
    workshop: "",
    shippingCost: 0,
    salesIncome: 0,
    otherIncome: 0,
    otherExpense: 0,
    entity: "",
    content: "",
    category: "",
    totalIncome: 0,
    totalExpense: 0,
    note: "",
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

  // Filter thu chi by search, type, and date range
  const filteredThuChi = thuChiList.filter((t) => {
    const matchSearch =
      (t.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.entity || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.accountName || "").toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by date range
    let matchDate = true;
    if (t.date && fromDate && toDate) {
      // Parse date from t.date (có thể là "02/01/2026" hoặc "2026-01-02")
      let itemDate: Date | null = null;
      if (t.date.includes("/")) {
        // Format DD/MM/YYYY
        const parts = t.date.split("/");
        if (parts.length === 3) {
          itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else if (t.date.includes("-")) {
        // Format YYYY-MM-DD
        itemDate = new Date(t.date);
      }

      if (itemDate && !isNaN(itemDate.getTime())) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        // Reset time part for accurate date comparison
        itemDate.setHours(0, 0, 0, 0);
        from.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);
        matchDate = itemDate >= from && itemDate <= to;
      }
    }

    // Filter by type: income (totalIncome > 0), expense (totalExpense > 0)
    if (filterType === "income") return matchSearch && matchDate && t.totalIncome > 0;
    if (filterType === "expense") return matchSearch && matchDate && t.totalExpense > 0;
    return matchSearch && matchDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredThuChi.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedThuChi = filteredThuChi.slice(
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

  // Thu Chi handlers
  const handleAddThuChi = async () => {
    if (!newThuChi.date) {
      toast.error("Vui lòng điền ngày tháng");
      return;
    }

    setIsAddingThuChi(true);
    try {
      const response = await fetch("/api/thu-chi/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newThuChi, type: addModalType }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Thêm thu chi thành công");
        setNewThuChi({
          date: formatDate(new Date()),
          accountName: "",
          nccNpl: "",
          workshop: "",
          shippingCost: 0,
          salesIncome: 0,
          otherIncome: 0,
          otherExpense: 0,
          entity: "",
          content: "",
          category: "",
          totalIncome: 0,
          totalExpense: 0,
          note: "",
        });
        setAccountSearch("");
        setSupplierSearch("");
        setWorkshopSearch("");
        setCategorySearch("");
        setShowAddModal(false);
        fetchThuChi();
      } else {
        toast.error(result.error || "Không thể thêm thu chi");
      }
    } catch (error) {
      console.error("Error adding thu chi:", error);
      toast.error("Lỗi khi thêm thu chi");
    } finally {
      setIsAddingThuChi(false);
    }
  };

  const handleViewThuChi = (item: ThuChi) => {
    setSelectedThuChi(item);
    setShowViewModal(true);
  };

  const handleEditThuChi = (item: ThuChi) => {
    setEditingThuChi(item);
    setShowEditThuChiModal(true);
  };

  const handleSaveThuChi = async () => {
    if (!editingThuChi) return;

    if (!editingThuChi.date) {
      toast.error("Vui lòng điền ngày tháng");
      return;
    }

    setIsUpdatingThuChi(true);
    try {
      const response = await fetch("/api/thu-chi/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingThuChi),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật thu chi thành công");
        setShowEditThuChiModal(false);
        setEditingThuChi(null);
        fetchThuChi();
      } else {
        toast.error(result.error || "Không thể cập nhật thu chi");
      }
    } catch (error) {
      console.error("Error updating thu chi:", error);
      toast.error("Lỗi khi cập nhật thu chi");
    } finally {
      setIsUpdatingThuChi(false);
    }
  };

  const handleDeleteThuChi = (id: number) => {
    setThuChiToDelete(id);
    setShowDeleteThuChiModal(true);
  };

  const confirmDeleteThuChi = async () => {
    if (thuChiToDelete === null) return;

    setIsDeletingThuChi(true);
    try {
      const response = await fetch(`/api/thu-chi/delete?id=${thuChiToDelete}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Xóa thu chi thành công");
        setShowDeleteThuChiModal(false);
        setThuChiToDelete(null);
        fetchThuChi();
      } else {
        toast.error(result.error || "Không thể xóa thu chi");
      }
    } catch (error) {
      console.error("Error deleting thu chi:", error);
      toast.error("Lỗi khi xóa thu chi");
    } finally {
      setIsDeletingThuChi(false);
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
          fetchAccounts();
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

  // Stats - tính từ filteredThuChi (dữ liệu đã filter)
  const periodIncome = filteredThuChi.reduce((sum, t) => sum + (t.totalIncome || 0), 0);
  const periodExpense = filteredThuChi.reduce((sum, t) => sum + (t.totalExpense || 0), 0);
  const totalBalance = periodIncome - periodExpense;
  const totalLoanRemaining = loans.reduce((sum, l) => sum + l.remaining, 0);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="text-blue-600" size={32} />
            Dòng tiền
          </h1>
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
                        onChange={(e) => {
                          setFromDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="border-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none cursor-pointer"
                      />
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">Đến</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => {
                          setToDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="border-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <span className="text-xs text-gray-500">
                        {filteredThuChi.length} giao dịch
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
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAddModalType("income");
                      setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowDownCircle size={20} />
                    Thu
                  </button>
                  <button
                    onClick={() => {
                      setAddModalType("expense");
                      setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowUpCircle size={20} />
                    Chi
                  </button>
                </div>
              </div>

              {isLoadingThuChi ? (
                <div className="text-center py-8 text-gray-500">
                  Đang tải dữ liệu...
                </div>
              ) : paginatedThuChi.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có dữ liệu thu chi. Nhấn &quot;Thêm giao dịch&quot; để bắt đầu.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-275">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                          Mã
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                          Ngày
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                          Tên TK
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                          Đối tượng
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 whitespace-nowrap">
                          Nội dung
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 whitespace-nowrap min-w-35">
                          Phân loại
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                          Tổng thu
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                          Tổng chi
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedThuChi.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.code?.startsWith("PT")
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {item.code || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {item.date || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {item.accountName || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {item.entity || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {item.content || "-"}
                          </td>
                          <td className="px-4 py-4 min-w-35">
                            {item.category ? (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full whitespace-nowrap">
                                {item.category}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-right font-medium text-green-600">
                            {item.totalIncome > 0 ? `+${item.totalIncome.toLocaleString("vi-VN")}đ` : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-right font-medium text-red-600">
                            {item.totalExpense > 0 ? `-${item.totalExpense.toLocaleString("vi-VN")}đ` : "-"}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewThuChi(item)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Xem"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleEditThuChi(item)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Sửa"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteThuChi(item.id)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredThuChi.length)} / {filteredThuChi.length} giao dịch
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

      {/* Modal thêm thu chi */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${addModalType === "income" ? "text-green-600" : "text-red-600"}`}>
                {addModalType === "income" ? "Thêm khoản thu" : "Thêm khoản chi"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAddingThuChi}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Row 1: Ngày tháng, Tên TK */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng *
                  </label>
                  <input
                    type="date"
                    value={newThuChi.date || ""}
                    onChange={(e) => setNewThuChi({ ...newThuChi, date: e.target.value })}
                    disabled={isAddingThuChi}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên TK
                  </label>
                  <input
                    type="text"
                    value={accountSearch}
                    onChange={(e) => {
                      setAccountSearch(e.target.value);
                      setShowAccountDropdown(true);
                    }}
                    onFocus={() => setShowAccountDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAccountDropdown(false), 200)}
                    disabled={isAddingThuChi}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Tìm tài khoản..."
                  />
                  {showAccountDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {accounts.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          Đang tải...
                        </div>
                      ) : (
                        <>
                          {accounts
                            .filter((a) =>
                              a.accountNumber.toLowerCase().includes(accountSearch.toLowerCase())
                            )
                            .map((account) => (
                              <div
                                key={account.id}
                                onClick={() => {
                                  setNewThuChi({ ...newThuChi, accountName: account.accountNumber });
                                  setAccountSearch(account.accountNumber);
                                  setShowAccountDropdown(false);
                                }}
                                className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                              >
                                {account.accountNumber}
                              </div>
                            ))}
                          {accounts.filter((a) =>
                            a.accountNumber.toLowerCase().includes(accountSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                              Không tìm thấy
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Row 2: NCC NPL, Xưởng SX */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NCC NPL
                  </label>
                  <input
                    type="text"
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                    disabled={isAddingThuChi}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Tìm nhà cung cấp..."
                  />
                  {showSupplierDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {suppliers
                        .filter((s) =>
                          s.name.toLowerCase().includes(supplierSearch.toLowerCase())
                        )
                        .map((supplier) => (
                          <div
                            key={supplier.id}
                            onClick={() => {
                              setNewThuChi({ ...newThuChi, nccNpl: supplier.name });
                              setSupplierSearch(supplier.name);
                              setShowSupplierDropdown(false);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                          >
                            {supplier.name}
                          </div>
                        ))}
                      {suppliers.filter((s) =>
                        s.name.toLowerCase().includes(supplierSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          Không tìm thấy
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xưởng SX
                  </label>
                  <input
                    type="text"
                    value={workshopSearch}
                    onChange={(e) => {
                      setWorkshopSearch(e.target.value);
                      setShowWorkshopDropdown(true);
                    }}
                    onFocus={() => setShowWorkshopDropdown(true)}
                    onBlur={() => setTimeout(() => setShowWorkshopDropdown(false), 200)}
                    disabled={isAddingThuChi}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Tìm xưởng sản xuất..."
                  />
                  {showWorkshopDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {workshops
                        .filter((w) =>
                          w.name.toLowerCase().includes(workshopSearch.toLowerCase())
                        )
                        .map((workshop) => (
                          <div
                            key={workshop.id}
                            onClick={() => {
                              setNewThuChi({ ...newThuChi, workshop: workshop.name });
                              setWorkshopSearch(workshop.name);
                              setShowWorkshopDropdown(false);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                          >
                            {workshop.name}
                          </div>
                        ))}
                      {workshops.filter((w) =>
                        w.name.toLowerCase().includes(workshopSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          Không tìm thấy
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Row 4: Đối tượng, Phân loại */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đối tượng
                  </label>
                  <input
                    type="text"
                    value={newThuChi.entity || ""}
                    onChange={(e) => setNewThuChi({ ...newThuChi, entity: e.target.value })}
                    disabled={isAddingThuChi}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Nhập đối tượng"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {addModalType === "income" ? "Phân loại thu" : "Phân loại chi"}
                  </label>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    disabled={isAddingThuChi}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder={addModalType === "income" ? "Chọn phân loại thu..." : "Chọn phân loại chi..."}
                  />
                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {categories.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          Đang tải...
                        </div>
                      ) : (
                        <>
                          {categories
                            .filter((c) =>
                              // Lọc theo loại phiếu: Thu = "Phiếu thu", Chi = "Phiếu chi"
                              (addModalType === "income" ? c.loaiPhieu === "Phiếu thu" : c.loaiPhieu === "Phiếu chi") &&
                              c.noiDung.toLowerCase().includes(categorySearch.toLowerCase())
                            )
                            .map((cat) => (
                              <div
                                key={cat.id}
                                onClick={() => {
                                  setNewThuChi({ ...newThuChi, category: cat.noiDung });
                                  setCategorySearch(cat.noiDung);
                                  setShowCategoryDropdown(false);
                                }}
                                className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                              >
                                {cat.noiDung}
                              </div>
                            ))}
                          {categories.filter((c) =>
                            (addModalType === "income" ? c.loaiPhieu === "Phiếu thu" : c.loaiPhieu === "Phiếu chi") &&
                            c.noiDung.toLowerCase().includes(categorySearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                              Không tìm thấy
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Row 5: Nội dung */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung
                </label>
                <input
                  type="text"
                  value={newThuChi.content || ""}
                  onChange={(e) => setNewThuChi({ ...newThuChi, content: e.target.value })}
                  disabled={isAddingThuChi}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Nhập nội dung"
                />
              </div>
              {/* Row 6: Tổng thu hoặc Tổng chi (tùy thuộc vào loại) */}
              <div>
                {addModalType === "income" ? (
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      Tổng thu *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newThuChi.totalIncome || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setNewThuChi({ ...newThuChi, totalIncome: val ? Number(val) : 0, totalExpense: 0 });
                      }}
                      disabled={isAddingThuChi}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      placeholder="Nhập số tiền thu"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Tổng chi *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newThuChi.totalExpense || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setNewThuChi({ ...newThuChi, totalExpense: val ? Number(val) : 0, totalIncome: 0 });
                      }}
                      disabled={isAddingThuChi}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      placeholder="Nhập số tiền chi"
                    />
                  </div>
                )}
              </div>
              {/* Row 7: Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={newThuChi.note || ""}
                  onChange={(e) => setNewThuChi({ ...newThuChi, note: e.target.value })}
                  disabled={isAddingThuChi}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Ghi chú"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAddingThuChi}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddThuChi}
                disabled={isAddingThuChi}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                  addModalType === "income"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isAddingThuChi ? "Đang thêm..." : addModalType === "income" ? "Thêm khoản thu" : "Thêm khoản chi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Panel xem chi tiết thu chi */}
      {showViewModal && selectedThuChi && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowViewModal(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Chi tiết thu chi</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Amount Summary */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-600 mb-1">Tổng thu</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{(selectedThuChi.totalIncome || 0).toLocaleString("vi-VN")}đ
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm text-red-600 mb-1">Tổng chi</p>
                  <p className="text-2xl font-bold text-red-600">
                    -{(selectedThuChi.totalExpense || 0).toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Ngày</span>
                  <span className="text-gray-900 font-medium">{selectedThuChi.date || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Tên TK</span>
                  <span className="text-gray-900 font-medium">{selectedThuChi.accountName || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">NCC NPL</span>
                  <span className="text-gray-900 font-medium">{selectedThuChi.nccNpl || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Xưởng SX</span>
                  <span className="text-gray-900 font-medium">{selectedThuChi.workshop || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Đối tượng</span>
                  <span className="text-gray-900 font-medium">{selectedThuChi.entity || "-"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Phân loại</span>
                  {selectedThuChi.category ? (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {selectedThuChi.category}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="py-3 border-b border-gray-100">
                  <p className="text-gray-500 mb-2">Nội dung</p>
                  <p className="text-gray-900">{selectedThuChi.content || "-"}</p>
                </div>
                <div className="py-3">
                  <p className="text-gray-500 mb-2">Ghi chú</p>
                  <p className="text-gray-900">{selectedThuChi.note || "-"}</p>
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
                    handleEditThuChi(selectedThuChi);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Sửa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Slide Panel sửa thu chi */}
      {showEditThuChiModal && editingThuChi && (
        <Portal>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditThuChiModal(false);
              setEditingThuChi(null);
            }}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-[60] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Sửa thu chi</h3>
                <button
                  onClick={() => {
                    setShowEditThuChiModal(false);
                    setEditingThuChi(null);
                  }}
                  disabled={isUpdatingThuChi}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Row 1: Ngày tháng, Tên TK */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày tháng *
                    </label>
                    <input
                      type="date"
                      value={editingThuChi.date || ""}
                      onChange={(e) => setEditingThuChi({ ...editingThuChi, date: e.target.value })}
                      disabled={isUpdatingThuChi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên TK
                    </label>
                    <input
                      type="text"
                      value={editingThuChi.accountName || ""}
                      onChange={(e) => setEditingThuChi({ ...editingThuChi, accountName: e.target.value })}
                      disabled={isUpdatingThuChi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
                {/* Row 2: NCC NPL, Xưởng SX */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NCC NPL
                    </label>
                    <input
                      type="text"
                      value={editingThuChi.nccNpl || ""}
                      onChange={(e) => setEditingThuChi({ ...editingThuChi, nccNpl: e.target.value })}
                      disabled={isUpdatingThuChi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xưởng SX
                    </label>
                    <input
                      type="text"
                      value={editingThuChi.workshop || ""}
                      onChange={(e) => setEditingThuChi({ ...editingThuChi, workshop: e.target.value })}
                      disabled={isUpdatingThuChi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
                {/* Row 4: Đối tượng, Phân loại */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đối tượng
                    </label>
                    <input
                      type="text"
                      value={editingThuChi.entity || ""}
                      onChange={(e) => setEditingThuChi({ ...editingThuChi, entity: e.target.value })}
                      disabled={isUpdatingThuChi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingThuChi.totalIncome > 0 ? "Phân loại thu" : "Phân loại chi"}
                    </label>
                    <input
                      type="text"
                      value={editingThuChi.category || ""}
                      onChange={(e) => setEditingThuChi({ ...editingThuChi, category: e.target.value })}
                      disabled={isUpdatingThuChi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      placeholder={editingThuChi.totalIncome > 0 ? "Chọn phân loại thu..." : "Chọn phân loại chi..."}
                    />
                  </div>
                </div>
                {/* Row 5: Nội dung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung
                  </label>
                  <input
                    type="text"
                    value={editingThuChi.content || ""}
                    onChange={(e) => setEditingThuChi({ ...editingThuChi, content: e.target.value })}
                    disabled={isUpdatingThuChi}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                {/* Row 6: Tổng thu, Tổng chi */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tổng thu
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editingThuChi.totalIncome || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setEditingThuChi({ ...editingThuChi, totalIncome: val ? Number(val) : 0 });
                      }}
                      disabled={isUpdatingThuChi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tổng chi
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editingThuChi.totalExpense || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+/, "").replace(/\D/g, "");
                        setEditingThuChi({ ...editingThuChi, totalExpense: val ? Number(val) : 0 });
                      }}
                      disabled={isUpdatingThuChi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
                {/* Row 7: Ghi chú */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={editingThuChi.note || ""}
                    onChange={(e) => setEditingThuChi({ ...editingThuChi, note: e.target.value })}
                    disabled={isUpdatingThuChi}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowEditThuChiModal(false);
                    setEditingThuChi(null);
                  }}
                  disabled={isUpdatingThuChi}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveThuChi}
                  disabled={isUpdatingThuChi}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdatingThuChi ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa thu chi */}
      {showDeleteThuChiModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
              <button
                onClick={() => {
                  setShowDeleteThuChiModal(false);
                  setThuChiToDelete(null);
                }}
                disabled={isDeletingThuChi}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa thu chi này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteThuChiModal(false);
                  setThuChiToDelete(null);
                }}
                disabled={isDeletingThuChi}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteThuChi}
                disabled={isDeletingThuChi}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingThuChi ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
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
