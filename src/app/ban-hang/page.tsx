"use client";

import {
  ShoppingCart,
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Download,
  TrendingUp,
  Tag,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Portal from "@/components/Portal";

// Dữ liệu khách hàng mẫu
const initialCustomers = [
  {
    id: 1,
    code: "KH001",
    name: "Riokids",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 2,
    code: "KH002",
    name: "NPP Ninh Bình Anh Thơ",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 3,
    code: "KH003",
    name: "NPP Chị Yên Sơn La",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 4,
    code: "KH004",
    name: "NPP Thái Bình Anh Quý",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 5,
    code: "KH005",
    name: "NPP Lai Châu Chị Thanh",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 6,
    code: "KH006",
    name: "Chị Dung - Bình Tân, TP.Hồ Chí Minh",
    type: "dealer",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 7,
    code: "KH007",
    name: "Hà Nội Chị Hà",
    type: "dealer",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 8,
    code: "KH008",
    name: "Chị Nga Chùa Bộc",
    type: "shop",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 9,
    code: "KH009",
    name: "Litibaby Nga Sơn - Thanh Hóa",
    type: "shop",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 10,
    code: "KH010",
    name: "Diệp Jenny",
    type: "dealer",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 11,
    code: "KH011",
    name: "Mr Quyết Hoàng Mai",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 12,
    code: "KH012",
    name: "Tỉn kids",
    type: "shop",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 13,
    code: "KH013",
    name: "NPP Phú Thọ Chị Phượng",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 14,
    code: "KH014",
    name: "NPP Hải Dương Chị Loan",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 15,
    code: "KH015",
    name: "NPP Chị Hằng Vĩnh Phúc",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 16,
    code: "KH016",
    name: "Siêu thị May 10 Hưng Hà",
    type: "shop",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 17,
    code: "KH017",
    name: "NPP Chị Thành Hưng Yên",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 18,
    code: "KH018",
    name: "NPP Chị Tú Nghệ An",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 19,
    code: "KH019",
    name: "NPP Anh Tú Thường Tín",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 20,
    code: "KH020",
    name: "NPP Hoàn Linh Hà Nam",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 21,
    code: "KH021",
    name: "NPP Ánh Dương Hà Tĩnh",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 22,
    code: "KH022",
    name: "NPP Đức Thiên Nghệ An",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 23,
    code: "KH023",
    name: "NPP Chị Tám Chương Mỹ",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 24,
    code: "KH024",
    name: "NPP Hải Dương Chị Vân",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 25,
    code: "KH025",
    name: "Đơn mẫu - NPP Lai Châu - Chị Thanh",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 26,
    code: "KH026",
    name: "Đơn mẫu - NPP Sơn La - Chị Yên",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 27,
    code: "KH027",
    name: "Đơn mẫu - NPP Hải Dương - Chị Loan",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 28,
    code: "KH028",
    name: "Đơn mẫu - NPP Ninh Bình - Anh Thơ",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 29,
    code: "KH029",
    name: "Đơn mẫu - NPP Hưng Yên - Chị Thành",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 30,
    code: "KH030",
    name: "Đơn mẫu - NPP Thường Tín - Anh Tú",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 31,
    code: "KH031",
    name: "Đơn mẫu - NPP Hà Nam - Hoàn Linh",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 32,
    code: "KH032",
    name: "Đơn mẫu - NPP Chương Mỹ - Chị Tám",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 33,
    code: "KH033",
    name: "Đơn mẫu - NPP Nghệ An - Anh Đức Thiên",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 34,
    code: "KH034",
    name: "Đơn mẫu - NPP Thái Bình - Anh Quý",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 35,
    code: "KH035",
    name: "Đơn mẫu - NPP Phú Thọ - Chị Phượng",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 36,
    code: "KH036",
    name: "Đơn mẫu - NPP Hà Tĩnh - Chị Ánh Dương",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 37,
    code: "KH037",
    name: "Đơn mẫu - NPP Hà Tĩnh - Chị Ánh Dương",
    type: "npp",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: 38,
    code: "KH038",
    name: "Em Trang Khểnh - Thái Nguyên",
    type: "dealer",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  },
];

// Dữ liệu đơn hàng mẫu
const initialOrders = [
  {
    id: 1,
    code: "DH001",
    date: "2024-12-20",
    customer: "Nguyễn Văn A",
    productCode: "SP001",
    image: "",
    items: 3,
    productPrice: 300000,
    subtotal: 900000,
    salesProgram: "NPP-SP25",
    discount: "16%",
    priceAfterDiscount: 252000,
    subtotalAfterDiscount: 756000,
    paymentDiscount: "5%",
    total: 850000,
    salesUser: "Admin",
    status: "completed",
    notes: "",
  },
  {
    id: 2,
    code: "DH002",
    date: "2024-12-22",
    customer: "Công ty ABC",
    productCode: "SP002",
    image: "",
    items: 15,
    productPrice: 400000,
    subtotal: 6000000,
    salesProgram: "NPP-SP24",
    discount: "22%",
    priceAfterDiscount: 312000,
    subtotalAfterDiscount: 4680000,
    paymentDiscount: "10%",
    total: 5200000,
    salesUser: "User1",
    status: "processing",
    notes: "Giao gấp",
  },
  {
    id: 3,
    code: "DH003",
    date: "2024-12-23",
    customer: "Trần Thị B",
    productCode: "SP003",
    image: "",
    items: 2,
    productPrice: 250000,
    subtotal: 500000,
    salesProgram: "",
    discount: "",
    priceAfterDiscount: 0,
    subtotalAfterDiscount: 0,
    paymentDiscount: "",
    total: 450000,
    salesUser: "",
    status: "pending",
    notes: "",
  },
  {
    id: 4,
    code: "DH004",
    date: "2024-12-24",
    customer: "Shop XYZ",
    productCode: "SP004",
    image: "",
    items: 25,
    productPrice: 350000,
    subtotal: 8750000,
    salesProgram: "Rio",
    discount: "20%",
    priceAfterDiscount: 280000,
    subtotalAfterDiscount: 7000000,
    paymentDiscount: "",
    total: 8500000,
    salesUser: "Admin",
    status: "shipping",
    notes: "Khách VIP",
  },
];

// Dữ liệu chương trình bán hàng
const initialPrograms = [
  { id: 1, code: "NPP-SP25", discount: "16%", type: "percent" },
  { id: 2, code: "NPP-SP24", discount: "22%", type: "percent" },
  { id: 3, code: "NPP-Mẫu", discount: "26%", type: "percent" },
  { id: 4, code: "Rio", discount: "20%", type: "percent" },
  { id: 5, code: "Funny 1", discount: "25.000", type: "fixed" },
  { id: 6, code: "Funny 2", discount: "16%", type: "percent" },
  { id: 7, code: "Shop8", discount: "8.000", type: "fixed" },
  { id: 8, code: "Shop10", discount: "10.000", type: "fixed" },
  { id: 9, code: "Shop15", discount: "15.000", type: "fixed" },
  { id: 10, code: "KMT6 3", discount: "100%", type: "percent" },
  { id: 11, code: "KMT6 7", discount: "100%", type: "percent" },
  { id: 12, code: "Kai14", discount: "14%", type: "percent" },
  { id: 13, code: "Shop2%", discount: "2%", type: "percent" },
  { id: 14, code: "Shop3%", discount: "3%", type: "percent" },
  { id: 15, code: "Doclap25-3", discount: "19%", type: "percent" },
];

export default function BanHang() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get tab from URL or default to "customers"
  const tabFromUrl =
    (searchParams.get("tab") as "customers" | "orders" | "programs") ||
    "customers";
  const [activeTab, setActiveTab] = useState<
    "customers" | "orders" | "programs"
  >(tabFromUrl);
  const [customers, setCustomers] = useState(initialCustomers);
  const [orders, setOrders] = useState(initialOrders);
  const [programs, setPrograms] = useState(initialPrograms);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [isUpdatingProgram, setIsUpdatingProgram] = useState(false);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Order modal states
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showDeleteOrderModal, setShowDeleteOrderModal] = useState(false);
  const [showViewOrderModal, setShowViewOrderModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{
    id: number;
    code: string;
  } | null>(null);
  const [viewOrder, setViewOrder] = useState<(typeof orders)[0] | null>(null);
  const [newOrder, setNewOrder] = useState({
    code: "",
    date: new Date().toISOString().split("T")[0],
    customer: "",
    productCode: "",
    image: "",
    items: 0,
    productPrice: 0,
    subtotal: 0,
    salesProgram: "",
    discount: "",
    priceAfterDiscount: 0,
    subtotalAfterDiscount: 0,
    paymentDiscount: "",
    total: 0,
    salesUser: "",
    status: "pending" as "completed" | "processing" | "pending" | "shipping",
    notes: "",
  });
  const [editOrder, setEditOrder] = useState({
    id: 0,
    code: "",
    date: "",
    customer: "",
    productCode: "",
    image: "",
    items: 0,
    productPrice: 0,
    subtotal: 0,
    salesProgram: "",
    discount: "",
    priceAfterDiscount: 0,
    subtotalAfterDiscount: 0,
    paymentDiscount: "",
    total: 0,
    salesUser: "",
    status: "pending" as "completed" | "processing" | "pending" | "shipping",
    notes: "",
  });

  // Dropdown data for order form
  const [customersList, setCustomersList] = useState<Array<{ id: number; name: string }>>([]);
  const [programsList, setProgramsList] = useState<Array<{ id: number; code: string; discount: string }>>([]);
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(false);

  // Program modal states
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [showDeleteProgramModal, setShowDeleteProgramModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<{
    id: number;
    code: string;
  } | null>(null);
  const [newProgram, setNewProgram] = useState({
    code: "",
    discount: "",
    type: "percent" as "percent" | "fixed",
  });
  const [editProgram, setEditProgram] = useState({
    id: 0,
    code: "",
    discount: "",
    type: "percent" as "percent" | "fixed",
  });

  // Customer modal states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showDeleteCustomerModal, setShowDeleteCustomerModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    type: "" as "npp" | "dealer" | "shop" | "",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
  });
  const [editCustomer, setEditCustomer] = useState({
    id: 0,
    code: "",
    name: "",
    type: "" as "npp" | "dealer" | "shop" | "",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  });

  // Sync activeTab with URL on mount and when URL changes
  useEffect(() => {
    const tabFromUrl =
      (searchParams.get("tab") as "customers" | "orders" | "programs") ||
      "customers";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Fetch customers from Google Sheets when customers tab is active
  useEffect(() => {
    if (activeTab === "customers") {
      fetchCustomers();
    }
  }, [activeTab]);

  // Fetch programs from Google Sheets when programs tab is active
  useEffect(() => {
    if (activeTab === "programs") {
      fetchPrograms();
    }
  }, [activeTab]);

  // Fetch orders from Google Sheets when orders tab is active
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  // Update URL when tab changes
  const handleTabChange = (tabId: "customers" | "orders" | "programs") => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const response = await fetch("/api/customers");
      const result = await response.json();
      if (result.success) {
        // Map Google Sheets data to component format
        const mappedCustomers = result.data.map((customer: any) => ({
          id: customer.id,
          code: `KH${String(customer.id).padStart(3, "0")}`,
          name: customer.name,
          type:
            customer.category === "NPP"
              ? "npp"
              : customer.category === "Đại lý"
              ? "dealer"
              : customer.category === "Shop"
              ? "shop"
              : "",
          cccd: "",
          phone: customer.phone || "",
          address: customer.address || "",
          shippingInfo: "",
          birthday: "",
          notes: "",
          totalOrders: 0,
          totalSpent: 0,
        }));
        setCustomers(mappedCustomers);
      } else {
        console.error("Failed to fetch customers:", result.error);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      setIsLoadingPrograms(true);
      const response = await fetch("/api/programs");
      const result = await response.json();
      if (result.success) {
        setPrograms(result.data);
      } else {
        console.error("Failed to fetch programs:", result.error);
        toast.error("Không thể tải danh sách chương trình");
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Lỗi khi tải danh sách chương trình");
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await fetch("/api/orders");
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      } else {
        console.error("Failed to fetch orders:", result.error);
        toast.error("Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Lỗi khi tải danh sách đơn hàng");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      setIsLoadingDropdownData(true);
      // Fetch customers and programs in parallel
      const [customersRes, programsRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/programs"),
      ]);

      const customersResult = await customersRes.json();
      const programsResult = await programsRes.json();

      if (customersResult.success) {
        setCustomersList(customersResult.data.map((c: any) => ({ id: c.id, name: c.name })));
      }

      if (programsResult.success) {
        setProgramsList(programsResult.data.map((p: any) => ({ id: p.id, code: p.code, discount: p.discount })));
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    } finally {
      setIsLoadingDropdownData(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Program handlers
  const handleAddProgram = async () => {
    if (newProgram.code && newProgram.discount) {
      setIsAddingProgram(true);
      try {
        const newId = Math.max(...programs.map((p) => p.id), 0) + 1;

        const response = await fetch("/api/programs/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: newId,
            code: newProgram.code,
            discount: newProgram.discount,
            type: newProgram.type,
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success("Thêm chương trình thành công!");
          setNewProgram({ code: "", discount: "", type: "percent" });
          setShowAddProgramModal(false);
          fetchPrograms(); // Reload programs
        } else {
          toast.error("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error adding program:", error);
        toast.error("Không thể thêm chương trình");
      } finally {
        setIsAddingProgram(false);
      }
    }
  };

  const handleEditProgram = (program: (typeof programs)[0]) => {
    setEditProgram({ ...program, type: program.type as "percent" | "fixed" });
    setShowEditProgramModal(true);
  };

  const handleSaveEditProgram = async () => {
    if (editProgram.code && editProgram.discount) {
      setIsUpdatingProgram(true);
      try {
        const response = await fetch("/api/programs/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editProgram.id,
            code: editProgram.code,
            discount: editProgram.discount,
            type: editProgram.type,
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success("Cập nhật chương trình thành công!");
          setShowEditProgramModal(false);
          fetchPrograms(); // Reload programs
        } else {
          toast.error("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error updating program:", error);
        toast.error("Không thể cập nhật chương trình");
      } finally {
        setIsUpdatingProgram(false);
      }
    }
  };

  const handleDeleteProgram = (id: number) => {
    const program = programs.find((p) => p.id === id);
    if (program) {
      setProgramToDelete({ id: program.id, code: program.code });
      setShowDeleteProgramModal(true);
    }
  };

  const confirmDeleteProgram = async () => {
    if (!programToDelete) return;

    setIsDeletingProgram(true);
    try {
      const response = await fetch(
        `/api/programs/delete?id=${programToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Đã xóa chương trình!");
        setShowDeleteProgramModal(false);
        setProgramToDelete(null);
        fetchPrograms(); // Reload programs
      } else {
        toast.error("Lỗi: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error("Không thể xóa chương trình");
    } finally {
      setIsDeletingProgram(false);
    }
  };

  // Order handlers
  const handleAddOrder = async () => {
    if (newOrder.code && newOrder.customer) {
      setIsAddingOrder(true);
      try {
        const response = await fetch("/api/orders/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newOrder,
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success("Thêm đơn hàng thành công!");
          setNewOrder({
            code: "",
            date: new Date().toISOString().split("T")[0],
            customer: "",
            productCode: "",
            image: "",
            items: 0,
            productPrice: 0,
            subtotal: 0,
            salesProgram: "",
            discount: "",
            priceAfterDiscount: 0,
            subtotalAfterDiscount: 0,
            paymentDiscount: "",
            total: 0,
            salesUser: "",
            status: "pending",
            notes: "",
          });
          setShowAddOrderModal(false);
          fetchOrders();
        } else {
          toast.error("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error adding order:", error);
        toast.error("Không thể thêm đơn hàng");
      } finally {
        setIsAddingOrder(false);
      }
    }
  };

  const handleEditOrder = (order: (typeof orders)[0]) => {
    setEditOrder({
      ...order,
      status: order.status as "completed" | "processing" | "pending" | "shipping",
    });
    fetchDropdownData();
    setShowEditOrderModal(true);
  };

  const handleSaveEditOrder = async () => {
    if (editOrder.code && editOrder.customer) {
      setIsUpdatingOrder(true);
      try {
        const response = await fetch("/api/orders/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editOrder,
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success("Cập nhật đơn hàng thành công!");
          setShowEditOrderModal(false);
          fetchOrders();
        } else {
          toast.error("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("Không thể cập nhật đơn hàng");
      } finally {
        setIsUpdatingOrder(false);
      }
    }
  };

  const handleDeleteOrder = (id: number) => {
    const order = orders.find((o) => o.id === id);
    if (order) {
      setOrderToDelete({ id: order.id, code: order.code });
      setShowDeleteOrderModal(true);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    setIsDeletingOrder(true);
    try {
      const response = await fetch(
        `/api/orders/delete?id=${orderToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Đã xóa đơn hàng!");
        setShowDeleteOrderModal(false);
        setOrderToDelete(null);
        fetchOrders(); // Reload orders
      } else {
        toast.error("Lỗi: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Không thể xóa đơn hàng");
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // Customer handlers
  const handleAddCustomer = async () => {
    if (newCustomer.name) {
      setIsAddingCustomer(true);
      try {
        const newId = Math.max(...customers.map((c) => c.id), 0) + 1;
        const categoryMapping: Record<string, string> = {
          npp: "NPP",
          dealer: "Đại lý",
          shop: "Shop",
        };

        const response = await fetch("/api/customers/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: newId,
            name: newCustomer.name,
            category: categoryMapping[newCustomer.type] || "",
            phone: newCustomer.phone,
            address: newCustomer.address,
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success("Thêm khách hàng thành công!");
          setNewCustomer({
            name: "",
            type: "",
            cccd: "",
            phone: "",
            address: "",
            shippingInfo: "",
            birthday: "",
            notes: "",
          });
          setShowAddCustomerModal(false);
          fetchCustomers(); // Reload customers
        } else {
          toast.error("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error adding customer:", error);
        toast.error("Không thể thêm khách hàng");
      } finally {
        setIsAddingCustomer(false);
      }
    }
  };

  const handleEditCustomer = (customer: (typeof customers)[0]) => {
    setEditCustomer({
      ...customer,
      type: customer.type as "npp" | "dealer" | "shop",
    });
    setShowEditCustomerModal(true);
  };

  const handleSaveEditCustomer = async () => {
    if (editCustomer.name) {
      setIsUpdatingCustomer(true);
      try {
        const categoryMapping: Record<string, string> = {
          npp: "NPP",
          dealer: "Đại lý",
          shop: "Shop",
        };

        const response = await fetch("/api/customers/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editCustomer.id,
            name: editCustomer.name,
            category: categoryMapping[editCustomer.type] || "",
            phone: editCustomer.phone,
            address: editCustomer.address,
          }),
        });

        const result = await response.json();
        if (result.success) {
          toast.success("Cập nhật khách hàng thành công!");
          setShowEditCustomerModal(false);
          fetchCustomers(); // Reload customers
        } else {
          toast.error("Lỗi: " + result.error);
        }
      } catch (error) {
        console.error("Error updating customer:", error);
        toast.error("Không thể cập nhật khách hàng");
      } finally {
        setIsUpdatingCustomer(false);
      }
    }
  };

  const handleDeleteCustomer = (id: number) => {
    setCustomerToDelete(id);
    setShowDeleteCustomerModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (customerToDelete === null) return;

    setIsDeletingCustomer(true);
    try {
      const response = await fetch(
        `/api/customers/delete?id=${customerToDelete}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Xóa khách hàng thành công!");
        setShowDeleteCustomerModal(false);
        setCustomerToDelete(null);
        fetchCustomers(); // Reload customers
      } else {
        toast.error("Lỗi: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Không thể xóa khách hàng");
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={32} />
            Bán hàng
          </h1>
          <p className="text-gray-600 mt-1 mb-5">
            Quản lý khách hàng và đơn hàng
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => handleTabChange("customers")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "customers"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={20} />
                Khách hàng
              </div>
            </button>
            <button
              onClick={() => handleTabChange("orders")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "orders"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} />
                Đơn hàng
              </div>
            </button>
            <button
              onClick={() => handleTabChange("programs")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "programs"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag size={20} />
                Chương trình bán hàng
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Khách hàng */}
          {activeTab === "customers" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm khách hàng
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 w-12">
                        STT
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 min-w-[200px]">
                        Khách hàng
                      </th>
                      <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">
                        Phân loại
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">
                        SĐT
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500">
                        Địa chỉ
                      </th>
                      <th className="px-3 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCustomers.map((customer, index) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-center text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 font-medium">
                          {customer.name}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {customer.type ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                customer.type === "npp"
                                  ? "bg-purple-100 text-purple-700"
                                  : customer.type === "dealer"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {customer.type === "npp"
                                ? "NPP"
                                : customer.type === "dealer"
                                ? "Đại lý"
                                : "Shop"}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {customer.phone || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {customer.address || "-"}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
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

          {/* Tab: Đơn hàng */}
          {activeTab === "orders" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đơn hàng..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => {
                    fetchDropdownData();
                    setShowAddOrderModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Tạo đơn hàng
                </button>
              </div>

              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Chưa có đơn hàng nào</p>
                  <p className="text-sm mt-1">Nhấn &quot;Tạo đơn hàng&quot; để bắt đầu</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[120px]">
                        Mã ĐH
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[110px]">
                        Ngày Đặt
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[180px]">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[130px]">
                        Mã SP
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[100px]">
                        Hình ảnh
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 min-w-[80px]">
                        SL
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 min-w-[120px]">
                        Giá Sỉ
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 min-w-[130px]">
                        Tiền Hàng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[120px]">
                        CT BH
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[100px]">
                        CK
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 min-w-[150px]">
                        Giá sau CK
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 min-w-[160px]">
                        Tiền sau CK
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[110px]">
                        CK TT
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 min-w-[130px]">
                        Khách trả
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[120px]">
                        User BH
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 min-w-[120px]">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 min-w-[150px]">
                        Ghi chú
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 sticky right-0 bg-gray-50 min-w-[140px] shadow-[-4px_0_8px_rgba(0,0,0,0.12)">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="group hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 min-w-[120px]">
                          {order.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[110px]">
                          {order.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 min-w-[180px]">
                          {order.customer}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[130px]">
                          {order.productCode || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[100px]">
                          {order.image || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 min-w-[80px]">
                          {order.items}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 min-w-[120px]">
                          {order.productPrice ? order.productPrice.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 min-w-[130px]">
                          {order.subtotal ? order.subtotal.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[120px]">
                          {order.salesProgram || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[100px]">
                          {order.discount || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 min-w-[150px]">
                          {order.priceAfterDiscount ? order.priceAfterDiscount.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 min-w-[160px]">
                          {order.subtotalAfterDiscount ? order.subtotalAfterDiscount.toLocaleString("vi-VN") : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[110px]">
                          {order.paymentDiscount || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium min-w-[130px]">
                          {order.total.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[120px]">
                          {order.salesUser || "-"}
                        </td>
                        <td className="px-4 py-3 text-center min-w-[120px]">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : order.status === "processing"
                                ? "bg-blue-100 text-blue-700"
                                : order.status === "shipping"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {order.status === "completed"
                              ? "Hoàn thành"
                              : order.status === "processing"
                              ? "Đang xử lý"
                              : order.status === "shipping"
                              ? "Đang giao"
                              : "Chờ xử lý"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 min-w-[150px]">
                          {order.notes || "-"}
                        </td>
                        <td className="px-4 py-3 sticky right-0 bg-white group-hover:bg-gray-50 min-w-[140px] shadow-[-4px_0_8px_rgba(0,0,0,0.12)">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setViewOrder(order);
                                setShowViewOrderModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditOrder(order)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
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

          {/* Tab: Chương trình bán hàng */}
          {activeTab === "programs" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chương trình..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddProgramModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm chương trình
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-16">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã chương trình
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Chiết khấu
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Loại
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {programs
                      .filter((p) =>
                        p.code.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((program, index) => (
                        <tr key={program.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-center text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-blue-600">
                            {program.code}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                program.type === "percent"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {program.type === "fixed"
                                ? `${program.discount}đ`
                                : program.discount}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                program.type === "percent"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {program.type === "percent"
                                ? "Phần trăm"
                                : "Cố định"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditProgram(program)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Sửa"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteProgram(program.id)}
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
        </div>
      </div>

      {/* Modal thêm chương trình bán hàng */}
      {showAddProgramModal && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddProgramModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Thêm chương trình bán hàng
              </h3>
              <button
                onClick={() => setShowAddProgramModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã chương trình *
                </label>
                <input
                  type="text"
                  value={newProgram.code}
                  onChange={(e) =>
                    setNewProgram({ ...newProgram, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: NPP-SP25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại chiết khấu *
                </label>
                <select
                  value={newProgram.type}
                  onChange={(e) =>
                    setNewProgram({
                      ...newProgram,
                      type: e.target.value as "percent" | "fixed",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Cố định (VNĐ)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiết khấu *
                </label>
                <input
                  type="text"
                  value={newProgram.discount}
                  onChange={(e) =>
                    setNewProgram({ ...newProgram, discount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    newProgram.type === "percent" ? "VD: 16%" : "VD: 25.000"
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddProgramModal(false)}
                disabled={isAddingProgram}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProgram}
                disabled={isAddingProgram}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingProgram ? (
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

      {/* Slide Panel sửa chương trình bán hàng - từ bên phải */}
      <Portal>
        {showEditProgramModal && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setShowEditProgramModal(false)}
            />
            <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sửa chương trình bán hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Mã: {editProgram.code}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditProgramModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-5">
                  {/* Mã chương trình */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mã chương trình *
                    </label>
                    <input
                      type="text"
                      value={editProgram.code}
                      onChange={(e) =>
                        setEditProgram({ ...editProgram, code: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Loại chiết khấu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Loại chiết khấu *
                    </label>
                    <select
                      value={editProgram.type}
                      onChange={(e) =>
                        setEditProgram({
                          ...editProgram,
                          type: e.target.value as "percent" | "fixed",
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="percent">Phần trăm (%)</option>
                      <option value="fixed">Cố định (VNĐ)</option>
                    </select>
                  </div>

                  {/* Chiết khấu */}
                  <div
                    className={`rounded-lg p-4 ${
                      editProgram.type === "percent"
                        ? "bg-blue-50"
                        : "bg-green-50"
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Chiết khấu *
                    </label>
                    <input
                      type="text"
                      value={editProgram.discount}
                      onChange={(e) =>
                        setEditProgram({
                          ...editProgram,
                          discount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      placeholder={
                        editProgram.type === "percent"
                          ? "VD: 16%"
                          : "VD: 25.000"
                      }
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {editProgram.type === "percent"
                        ? "Nhập phần trăm chiết khấu (VD: 16%, 22%)"
                        : "Nhập số tiền chiết khấu cố định (VD: 25.000, 8.000)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditProgramModal(false)}
                    disabled={isUpdatingProgram}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEditProgram}
                    disabled={isUpdatingProgram}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingProgram ? (
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
          </>
        )}
      </Portal>

      {/* Modal thêm khách hàng */}
      {showAddCustomerModal && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddCustomerModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thêm khách hàng mới</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khách hàng *
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phân loại
                </label>
                <select
                  value={newCustomer.type}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      type: e.target.value as "npp" | "dealer" | "shop" | "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  <option value="npp">NPP</option>
                  <option value="dealer">Đại lý</option>
                  <option value="shop">Shop</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập SĐT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CCCD/MST
                  </label>
                  <input
                    type="text"
                    value={newCustomer.cccd}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, cccd: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập CCCD/MST"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thông tin gửi hàng
                </label>
                <input
                  type="text"
                  value={newCustomer.shippingInfo}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      shippingInfo: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập thông tin gửi hàng"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sinh nhật
                  </label>
                  <input
                    type="date"
                    value={newCustomer.birthday}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        birthday: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={newCustomer.notes}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                disabled={isAddingCustomer}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={isAddingCustomer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingCustomer ? (
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
                  "Thêm khách hàng"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Panel sửa khách hàng */}
      <Portal>
        {showEditCustomerModal && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setShowEditCustomerModal(false)}
            />
            <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chỉnh sửa khách hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Mã: {editCustomer.code}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditCustomerModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tên khách hàng *
                    </label>
                    <input
                      type="text"
                      value={editCustomer.name}
                      onChange={(e) =>
                        setEditCustomer({
                          ...editCustomer,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phân loại
                    </label>
                    <select
                      value={editCustomer.type}
                      onChange={(e) =>
                        setEditCustomer({
                          ...editCustomer,
                          type: e.target.value as
                            | "npp"
                            | "dealer"
                            | "shop"
                            | "",
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-</option>
                      <option value="npp">NPP</option>
                      <option value="dealer">Đại lý</option>
                      <option value="shop">Shop</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        value={editCustomer.phone}
                        onChange={(e) =>
                          setEditCustomer({
                            ...editCustomer,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        CCCD/MST
                      </label>
                      <input
                        type="text"
                        value={editCustomer.cccd}
                        onChange={(e) =>
                          setEditCustomer({
                            ...editCustomer,
                            cccd: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={editCustomer.address}
                      onChange={(e) =>
                        setEditCustomer({
                          ...editCustomer,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Thông tin gửi hàng
                    </label>
                    <input
                      type="text"
                      value={editCustomer.shippingInfo}
                      onChange={(e) =>
                        setEditCustomer({
                          ...editCustomer,
                          shippingInfo: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Sinh nhật
                      </label>
                      <input
                        type="date"
                        value={editCustomer.birthday}
                        onChange={(e) =>
                          setEditCustomer({
                            ...editCustomer,
                            birthday: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Ghi chú
                      </label>
                      <input
                        type="text"
                        value={editCustomer.notes}
                        onChange={(e) =>
                          setEditCustomer({
                            ...editCustomer,
                            notes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Thông tin đơn hàng (chỉ xem) */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">
                      Thống kê
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Tổng đơn hàng</p>
                        <p className="text-lg font-bold text-gray-900">
                          {editCustomer.totalOrders}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tổng chi tiêu</p>
                        <p className="text-lg font-bold text-green-600">
                          {editCustomer.totalSpent > 0
                            ? `${editCustomer.totalSpent.toLocaleString(
                                "vi-VN"
                              )}đ`
                            : "0đ"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditCustomerModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEditCustomer}
                    disabled={isUpdatingCustomer}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingCustomer ? (
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
          </>
        )}
      </Portal>

      {/* Modal xác nhận xóa khách hàng */}
      {showDeleteCustomerModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Xác nhận xóa
              </h3>
              <button
                onClick={() => {
                  setShowDeleteCustomerModal(false);
                  setCustomerToDelete(null);
                }}
                disabled={isDeletingCustomer}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteCustomerModal(false);
                  setCustomerToDelete(null);
                }}
                disabled={isDeletingCustomer}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteCustomer}
                disabled={isDeletingCustomer}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingCustomer ? (
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

      {/* Modal xác nhận xóa chương trình */}
      {showDeleteProgramModal && programToDelete && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa chương trình</h3>
              <button
                onClick={() => {
                  setShowDeleteProgramModal(false);
                  setProgramToDelete(null);
                }}
                disabled={isDeletingProgram}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-700 mb-2">
              Bạn có chắc chắn muốn xóa chương trình <span className="font-semibold text-blue-600">{programToDelete.code}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteProgramModal(false);
                  setProgramToDelete(null);
                }}
                disabled={isDeletingProgram}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteProgram}
                disabled={isDeletingProgram}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingProgram ? (
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

      {/* Modal xem chi tiết đơn hàng */}
      {showViewOrderModal && viewOrder && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-blue-600">Chi tiết đơn hàng</h3>
              <button
                onClick={() => {
                  setShowViewOrderModal(false);
                  setViewOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Mã đơn hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã đơn hàng
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.code}
                </div>
              </div>

              {/* Ngày đặt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đặt
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.date}
                </div>
              </div>

              {/* Khách hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.customer}
                </div>
              </div>

              {/* Mã sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã sản phẩm
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.productCode || "-"}
                </div>
              </div>

              {/* Hình ảnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 truncate">
                  {viewOrder.image || "-"}
                </div>
              </div>

              {/* Số lượng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.items}
                </div>
              </div>

              {/* Giá sỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá sỉ
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.productPrice.toLocaleString("vi-VN")}
                </div>
              </div>

              {/* Tiền hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiền hàng
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.subtotal.toLocaleString("vi-VN")}
                </div>
              </div>

              {/* Chương trình BH */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chương trình bán hàng
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.salesProgram || "-"}
                </div>
              </div>

              {/* Chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiết khấu
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.discount || "-"}
                </div>
              </div>

              {/* Đơn giá sau chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn giá sau chiết khấu
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.priceAfterDiscount.toLocaleString("vi-VN")}
                </div>
              </div>

              {/* Tiền hàng sau chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiền hàng sau chiết khấu
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.subtotalAfterDiscount.toLocaleString("vi-VN")}
                </div>
              </div>

              {/* CK thanh toán */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CK thanh toán
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.paymentDiscount || "-"}
                </div>
              </div>

              {/* Khách phải trả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách phải trả
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold">
                  {viewOrder.total.toLocaleString("vi-VN")}
                </div>
              </div>

              {/* User bán hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User bán hàng
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {viewOrder.salesUser || "-"}
                </div>
              </div>

              {/* Tình trạng đơn hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tình trạng đơn hàng
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    viewOrder.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : viewOrder.status === "processing"
                      ? "bg-blue-100 text-blue-800"
                      : viewOrder.status === "shipping"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {viewOrder.status === "completed"
                      ? "Hoàn thành"
                      : viewOrder.status === "processing"
                      ? "Đang xử lý"
                      : viewOrder.status === "shipping"
                      ? "Đang giao"
                      : "Chờ xử lý"}
                  </span>
                </div>
              </div>

              {/* Ghi chú */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[80px]">
                  {viewOrder.notes || "-"}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewOrderModal(false);
                  setViewOrder(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa đơn hàng */}
      {showDeleteOrderModal && orderToDelete && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa đơn hàng</h3>
              <button
                onClick={() => {
                  setShowDeleteOrderModal(false);
                  setOrderToDelete(null);
                }}
                disabled={isDeletingOrder}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-700 mb-2">
              Bạn có chắc chắn muốn xóa đơn hàng <span className="font-semibold text-blue-600">{orderToDelete.code}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteOrderModal(false);
                  setOrderToDelete(null);
                }}
                disabled={isDeletingOrder}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteOrder}
                disabled={isDeletingOrder}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingOrder ? (
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

      {/* Modal thêm đơn hàng */}
      {showAddOrderModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-blue-600">Thêm đơn hàng mới</h3>
              <button
                onClick={() => {
                  setShowAddOrderModal(false);
                  setNewOrder({
                    code: "",
                    date: new Date().toISOString().split("T")[0],
                    customer: "",
                    productCode: "",
                    image: "",
                    items: 0,
                    productPrice: 0,
                    subtotal: 0,
                    salesProgram: "",
                    discount: "",
                    priceAfterDiscount: 0,
                    subtotalAfterDiscount: 0,
                    paymentDiscount: "",
                    total: 0,
                    salesUser: "",
                    status: "pending",
                    notes: "",
                  });
                }}
                disabled={isAddingOrder}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Mã đơn hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã đơn hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrder.code}
                  onChange={(e) => setNewOrder({ ...newOrder, code: e.target.value })}
                  placeholder="VD: DH001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Ngày đặt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đặt
                </label>
                <input
                  type="date"
                  value={newOrder.date}
                  onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Khách hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={newOrder.customer}
                  onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoadingDropdownData}
                >
                  <option value="">
                    {isLoadingDropdownData ? "Đang tải..." : "-- Chọn khách hàng --"}
                  </option>
                  {customersList.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mã sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã sản phẩm
                </label>
                <input
                  type="text"
                  value={newOrder.productCode}
                  onChange={(e) => setNewOrder({ ...newOrder, productCode: e.target.value })}
                  placeholder="VD: SP001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Hình ảnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh (URL)
                </label>
                <input
                  type="text"
                  value={newOrder.image}
                  onChange={(e) => setNewOrder({ ...newOrder, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Số lượng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  value={newOrder.items}
                  onChange={(e) => setNewOrder({ ...newOrder, items: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Giá sỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá sỉ
                </label>
                <input
                  type="number"
                  value={newOrder.productPrice}
                  onChange={(e) => setNewOrder({ ...newOrder, productPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tiền hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiền hàng
                </label>
                <input
                  type="number"
                  value={newOrder.subtotal}
                  onChange={(e) => setNewOrder({ ...newOrder, subtotal: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Chương trình BH */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chương trình bán hàng
                </label>
                <select
                  value={newOrder.salesProgram}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    const selectedProgram = programsList.find(p => p.code === selectedCode);
                    setNewOrder({
                      ...newOrder,
                      salesProgram: selectedCode,
                      discount: selectedProgram ? selectedProgram.discount : ""
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoadingDropdownData}
                >
                  <option value="">
                    {isLoadingDropdownData ? "Đang tải..." : "-- Chọn chương trình --"}
                  </option>
                  {programsList.map((program) => (
                    <option key={program.id} value={program.code}>
                      {program.code} ({program.discount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiết khấu
                </label>
                <input
                  type="text"
                  value={newOrder.discount}
                  onChange={(e) => setNewOrder({ ...newOrder, discount: e.target.value })}
                  placeholder="VD: 10%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Đơn giá sau chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn giá sau chiết khấu
                </label>
                <input
                  type="number"
                  value={newOrder.priceAfterDiscount}
                  onChange={(e) => setNewOrder({ ...newOrder, priceAfterDiscount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tiền hàng sau chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiền hàng sau chiết khấu
                </label>
                <input
                  type="number"
                  value={newOrder.subtotalAfterDiscount}
                  onChange={(e) => setNewOrder({ ...newOrder, subtotalAfterDiscount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* CK thanh toán */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CK thanh toán
                </label>
                <input
                  type="text"
                  value={newOrder.paymentDiscount}
                  onChange={(e) => setNewOrder({ ...newOrder, paymentDiscount: e.target.value })}
                  placeholder="VD: 5%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Khách phải trả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách phải trả
                </label>
                <input
                  type="number"
                  value={newOrder.total}
                  onChange={(e) => setNewOrder({ ...newOrder, total: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* User bán hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User bán hàng
                </label>
                <input
                  type="text"
                  value={newOrder.salesUser}
                  onChange={(e) => setNewOrder({ ...newOrder, salesUser: e.target.value })}
                  placeholder="Tên nhân viên"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tình trạng đơn hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tình trạng đơn hàng
                </label>
                <select
                  value={newOrder.status}
                  onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value as "completed" | "processing" | "pending" | "shipping" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="shipping">Đang giao</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>

              {/* Ghi chú */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddOrderModal(false);
                  setNewOrder({
                    code: "",
                    date: new Date().toISOString().split("T")[0],
                    customer: "",
                    productCode: "",
                    image: "",
                    items: 0,
                    productPrice: 0,
                    subtotal: 0,
                    salesProgram: "",
                    discount: "",
                    priceAfterDiscount: 0,
                    subtotalAfterDiscount: 0,
                    paymentDiscount: "",
                    total: 0,
                    salesUser: "",
                    status: "pending",
                    notes: "",
                  });
                }}
                disabled={isAddingOrder}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleAddOrder}
                disabled={isAddingOrder || !newOrder.code || !newOrder.customer}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingOrder ? (
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
                  "Thêm đơn hàng"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa đơn hàng */}
      {showEditOrderModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-blue-600">Chỉnh sửa đơn hàng</h3>
              <button
                onClick={() => setShowEditOrderModal(false)}
                disabled={isUpdatingOrder}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Mã đơn hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã đơn hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editOrder.code}
                  onChange={(e) => setEditOrder({ ...editOrder, code: e.target.value })}
                  placeholder="VD: DH001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Ngày đặt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày đặt
                </label>
                <input
                  type="date"
                  value={editOrder.date}
                  onChange={(e) => setEditOrder({ ...editOrder, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Khách hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={editOrder.customer}
                  onChange={(e) => setEditOrder({ ...editOrder, customer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoadingDropdownData}
                >
                  <option value="">
                    {isLoadingDropdownData ? "Đang tải..." : "-- Chọn khách hàng --"}
                  </option>
                  {customersList.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mã sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã sản phẩm
                </label>
                <input
                  type="text"
                  value={editOrder.productCode}
                  onChange={(e) => setEditOrder({ ...editOrder, productCode: e.target.value })}
                  placeholder="VD: SP001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Hình ảnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh (URL)
                </label>
                <input
                  type="text"
                  value={editOrder.image}
                  onChange={(e) => setEditOrder({ ...editOrder, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Số lượng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  value={editOrder.items}
                  onChange={(e) => setEditOrder({ ...editOrder, items: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Giá sỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá sỉ
                </label>
                <input
                  type="number"
                  value={editOrder.productPrice}
                  onChange={(e) => setEditOrder({ ...editOrder, productPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tiền hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiền hàng
                </label>
                <input
                  type="number"
                  value={editOrder.subtotal}
                  onChange={(e) => setEditOrder({ ...editOrder, subtotal: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Chương trình BH */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chương trình bán hàng
                </label>
                <select
                  value={editOrder.salesProgram}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    const selectedProgram = programsList.find(p => p.code === selectedCode);
                    setEditOrder({
                      ...editOrder,
                      salesProgram: selectedCode,
                      discount: selectedProgram ? selectedProgram.discount : ""
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoadingDropdownData}
                >
                  <option value="">
                    {isLoadingDropdownData ? "Đang tải..." : "-- Chọn chương trình --"}
                  </option>
                  {programsList.map((program) => (
                    <option key={program.id} value={program.code}>
                      {program.code} ({program.discount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiết khấu
                </label>
                <input
                  type="text"
                  value={editOrder.discount}
                  onChange={(e) => setEditOrder({ ...editOrder, discount: e.target.value })}
                  placeholder="VD: 10%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Đơn giá sau chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn giá sau chiết khấu
                </label>
                <input
                  type="number"
                  value={editOrder.priceAfterDiscount}
                  onChange={(e) => setEditOrder({ ...editOrder, priceAfterDiscount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tiền hàng sau chiết khấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiền hàng sau chiết khấu
                </label>
                <input
                  type="number"
                  value={editOrder.subtotalAfterDiscount}
                  onChange={(e) => setEditOrder({ ...editOrder, subtotalAfterDiscount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* CK thanh toán */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CK thanh toán
                </label>
                <input
                  type="text"
                  value={editOrder.paymentDiscount}
                  onChange={(e) => setEditOrder({ ...editOrder, paymentDiscount: e.target.value })}
                  placeholder="VD: 5%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Khách phải trả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách phải trả
                </label>
                <input
                  type="number"
                  value={editOrder.total}
                  onChange={(e) => setEditOrder({ ...editOrder, total: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* User bán hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User bán hàng
                </label>
                <input
                  type="text"
                  value={editOrder.salesUser}
                  onChange={(e) => setEditOrder({ ...editOrder, salesUser: e.target.value })}
                  placeholder="Tên nhân viên"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tình trạng đơn hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tình trạng đơn hàng
                </label>
                <select
                  value={editOrder.status}
                  onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value as "completed" | "processing" | "pending" | "shipping" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="shipping">Đang giao</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>

              {/* Ghi chú */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={editOrder.notes}
                  onChange={(e) => setEditOrder({ ...editOrder, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditOrderModal(false)}
                disabled={isUpdatingOrder}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditOrder}
                disabled={isUpdatingOrder || !editOrder.code || !editOrder.customer}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingOrder ? (
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
    </div>
  );
}
