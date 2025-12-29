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
} from "lucide-react";
import { useState } from "react";
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
    customer: "Nguyễn Văn A",
    date: "2024-12-20",
    items: 3,
    total: 850000,
    status: "completed",
    paymentStatus: "paid",
  },
  {
    id: 2,
    code: "DH002",
    customer: "Công ty ABC",
    date: "2024-12-22",
    items: 15,
    total: 5200000,
    status: "processing",
    paymentStatus: "partial",
  },
  {
    id: 3,
    code: "DH003",
    customer: "Trần Thị B",
    date: "2024-12-23",
    items: 2,
    total: 450000,
    status: "pending",
    paymentStatus: "unpaid",
  },
  {
    id: 4,
    code: "DH004",
    customer: "Shop XYZ",
    date: "2024-12-24",
    items: 25,
    total: 8500000,
    status: "shipping",
    paymentStatus: "paid",
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
  const [activeTab, setActiveTab] = useState<
    "customers" | "orders" | "programs"
  >("customers");
  const [customers, setCustomers] = useState(initialCustomers);
  const [orders] = useState(initialOrders);
  const [programs, setPrograms] = useState(initialPrograms);
  const [searchTerm, setSearchTerm] = useState("");

  // Program modal states
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
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
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    type: "shop" as "npp" | "dealer" | "shop",
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
    type: "shop" as "npp" | "dealer" | "shop",
    cccd: "",
    phone: "",
    address: "",
    shippingInfo: "",
    birthday: "",
    notes: "",
    totalOrders: 0,
    totalSpent: 0,
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Program handlers
  const handleAddProgram = () => {
    if (newProgram.code && newProgram.discount) {
      setPrograms([
        ...programs,
        {
          id: Math.max(...programs.map((p) => p.id), 0) + 1,
          ...newProgram,
        },
      ]);
      setNewProgram({ code: "", discount: "", type: "percent" });
      setShowAddProgramModal(false);
    }
  };

  const handleEditProgram = (program: (typeof programs)[0]) => {
    setEditProgram({ ...program, type: program.type as "percent" | "fixed" });
    setShowEditProgramModal(true);
  };

  const handleSaveEditProgram = () => {
    if (editProgram.code && editProgram.discount) {
      setPrograms(
        programs.map((p) => (p.id === editProgram.id ? editProgram : p))
      );
      setShowEditProgramModal(false);
    }
  };

  const handleDeleteProgram = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa chương trình này?")) {
      setPrograms(programs.filter((p) => p.id !== id));
    }
  };

  // Customer handlers
  const handleAddCustomer = () => {
    if (newCustomer.name) {
      const newCode = `KH${String(customers.length + 1).padStart(3, "0")}`;
      setCustomers([
        ...customers,
        {
          id: Math.max(...customers.map((c) => c.id), 0) + 1,
          code: newCode,
          ...newCustomer,
          totalOrders: 0,
          totalSpent: 0,
        },
      ]);
      setNewCustomer({
        name: "",
        type: "shop",
        cccd: "",
        phone: "",
        address: "",
        shippingInfo: "",
        birthday: "",
        notes: "",
      });
      setShowAddCustomerModal(false);
    }
  };

  const handleEditCustomer = (customer: (typeof customers)[0]) => {
    setEditCustomer({
      ...customer,
      type: customer.type as "npp" | "dealer" | "shop",
    });
    setShowEditCustomerModal(true);
  };

  const handleSaveEditCustomer = () => {
    if (editCustomer.name) {
      setCustomers(
        customers.map((c) => (c.id === editCustomer.id ? editCustomer : c))
      );
      setShowEditCustomerModal(false);
    }
  };

  const handleDeleteCustomer = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa khách hàng này?")) {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  // Stats
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bán hàng</h1>
          <p className="text-gray-600 mt-1">
            Quản lý khách hàng và đơn hàng
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
          <Download size={20} />
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Khách hàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCustomers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <ShoppingCart className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Doanh thu</p>
              <p className="text-2xl font-bold text-purple-600">
                {(totalRevenue / 1000000).toFixed(1)}M
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
              onClick={() => setActiveTab("customers")}
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
              onClick={() => setActiveTab("orders")}
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
              onClick={() => setActiveTab("programs")}
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
                        Đơn hàng
                      </th>
                      <th className="px-3 py-3 text-right text-sm font-medium text-gray-500">
                        Tổng chi tiêu
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
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {customer.phone || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {customer.address || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-center text-gray-900">
                          {customer.totalOrders || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-right text-green-600 font-medium">
                          {customer.totalSpent > 0
                            ? `${customer.totalSpent.toLocaleString("vi-VN")}đ`
                            : "-"}
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
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Plus size={20} />
                  Tạo đơn hàng
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã ĐH
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Ngày đặt
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Số SP
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Tổng tiền
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thanh toán
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-blue-600">
                          {order.code}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {order.customer}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {new Date(order.date).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-sm text-center text-gray-900">
                          {order.items}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 font-medium">
                          {order.total.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-4 py-4 text-center">
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
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.paymentStatus === "paid"
                                ? "bg-green-100 text-green-700"
                                : order.paymentStatus === "partial"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {order.paymentStatus === "paid"
                              ? "Đã TT"
                              : order.paymentStatus === "partial"
                              ? "TT một phần"
                              : "Chưa TT"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
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

              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Chiết khấu %</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {programs.filter((p) => p.type === "percent").length}
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600">Chiết khấu cố định</p>
                    <p className="text-2xl font-bold text-green-700">
                      {programs.filter((p) => p.type === "fixed").length}
                    </p>
                  </div>
                </div>
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAddProgramModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md"
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProgram}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thêm
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
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEditProgram}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    Lưu thay đổi
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
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
                  Phân loại *
                </label>
                <select
                  value={newCustomer.type}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      type: e.target.value as "npp" | "dealer" | "shop",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddCustomer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thêm khách hàng
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
                          type: e.target.value as "npp" | "dealer" | "shop",
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
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
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </Portal>
    </div>
  );
}
