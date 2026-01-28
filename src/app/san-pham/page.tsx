"use client";

import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  List,
  ShoppingBag,
  Image as ImageIcon,
  Warehouse,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Portal from "@/components/Portal";
import toast, { Toaster } from "react-hot-toast";
import QuanLyKhoTab from "./components/QuanLyKhoTab";

// Types - khớp với Google Sheets PhatTrienSanPham
interface SanPham {
  id: number;
  code: string;                  // Mã SP (Cột A)
  name: string;                  // Tên SP (Cột B)
  size: string;                  // Size (Cột C)
  mainFabric: string;            // Vải chính (Cột D)
  accentFabric: string;          // Vải phối (Cột E)
  otherMaterials: string;        // Phụ liệu khác (Cột F)
  productionOrder: string;       // Lệnh SX (Cột G)
  workshop: string;              // Xưởng SX (Cột H)
  mainFabricQuota: string;       // ĐM Vải chính (Cột I)
  accentFabricQuota1: string;    // ĐM Vải phối 1 (Cột J)
  accentFabricQuota2: string;    // ĐM Vải phối 2 (Cột K)
  materialsQuota1: string;       // ĐM Phụ liệu 1 (Cột L)
  materialsQuota2: string;       // ĐM Phụ liệu 2 (Cột M)
  accessoriesQuota: string;      // ĐM Phụ kiện (Cột N)
  otherQuota: string;            // ĐM Khác (Cột O)
  plannedQuantity: number;       // Số lượng kế hoạch (Cột P)
  cutQuantity: number;           // Số lượng cắt (Cột Q)
  warehouseQuantity: number;     // Số lượng nhập kho (Cột R)
  developmentStage: string;      // Công đoạn phát triển (Cột S)
  productionStage: string;       // Công đoạn sản xuất (Cột T)
  image: string;                 // Hình ảnh (Cột U)
}

// Types - khớp với Google Sheets SanPham (Danh mục sản phẩm)
interface SanPhamCatalog {
  id: number;
  name: string;              // Tên SP (B)
  sizeChart: string;         // Bảng size sản xuất (C)
  image: string;             // Hình ảnh (D)
  color: string;             // Màu sắc sản xuất (E)
  retailPrice: number;       // Giá bán lẻ (F)
  wholesalePrice: number;    // Giá bán sỉ (G)
  costPrice: number;         // Giá vốn (H)
  mainFabric: string;        // Vải chính (I)
  accentFabric: string;      // Vải phối (J)
  otherMaterials: string;    // Phụ liệu khác (K)
  mainFabricQuota: string;   // Định mức vải chính (L)
  accentFabricQuota: string; // Định mức vải phối 1 (M)
  materialsQuota: string;    // Định mức phụ liệu 2 (N)
  accessoriesQuota: string;  // Định mức phụ kiện (O)
  otherQuota: string;        // Định mức khác (P)
  plannedQuantity: number;   // Số lượng kế hoạch (Q)
  cutQuantity: number;       // Số lượng cắt (R)
  warehouseQuantity: number; // Số lượng nhập kho (S)
  finalStatus: string;       // CĐ Final (T)
  nplSyncStatus: string;     // CĐ đồng bộ NPL (U)
  productionStatus: string;  // CĐ sản xuất (V)
  warehouseEntry: string;    // Nhập kho (W)
}

// Xưởng sản xuất có sẵn
const workshopOptions = [
  "Xưởng may Chị Thu",
  "Xưởng chị Hoa - Gia Lâm",
  "Xưởng chú Tuyển",
  "Ms Liễu TQ",
  "Xưởng Minh Tâm",
  "Xưởng Hồng Phát",
];

// Trạng thái sản xuất
const productionStatusOptions = [
  "Chờ phát triển",
  "Đang phát triển",
  "Hoàn thành mẫu",
  "Sẵn sàng sản xuất",
  "Đang sản xuất",
  "Đã hoàn thành",
  "Tạm dừng",
];

// Format giá tiền
const formatPrice = (price: number) => {
  if (!price) return "-";
  return price.toLocaleString("vi-VN") + "đ";
};

export default function SanPhamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state - read from URL param
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"phat-trien" | "danh-muc" | "quan-ly-kho" | "dieu-chinh-gia-von">(
    tabParam === "danh-muc"
      ? "danh-muc"
      : tabParam === "quan-ly-kho"
      ? "quan-ly-kho"
      : tabParam === "dieu-chinh-gia-von"
      ? "dieu-chinh-gia-von"
      : "phat-trien"
  );

  // Handle tab change with URL update
  const handleTabChange = (tab: "phat-trien" | "danh-muc" | "quan-ly-kho" | "dieu-chinh-gia-von") => {
    setActiveTab(tab);
    router.push(`/san-pham?tab=${tab}`, { scroll: false });
  };

  // Sync tab state when URL param changes (browser back/forward)
  useEffect(() => {
    const newTab =
      tabParam === "danh-muc"
        ? "danh-muc"
        : tabParam === "quan-ly-kho"
        ? "quan-ly-kho"
        : tabParam === "dieu-chinh-gia-von"
        ? "dieu-chinh-gia-von"
        : "phat-trien";
    setActiveTab(newTab);
  }, [tabParam]);

  // ======== PHÁT TRIỂN SẢN PHẨM STATE ========
  const [products, setProducts] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SanPham | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [newProduct, setNewProduct] = useState<Partial<SanPham>>({
    code: "",
    name: "",
    size: "",
    mainFabric: "",
    accentFabric: "",
    otherMaterials: "",
    productionOrder: "",
    workshop: "",
    mainFabricQuota: "",
    accentFabricQuota1: "",
    accentFabricQuota2: "",
    materialsQuota1: "",
    materialsQuota2: "",
    accessoriesQuota: "",
    otherQuota: "",
    plannedQuantity: 0,
    cutQuantity: 0,
    warehouseQuantity: 0,
    developmentStage: "",
    productionStage: "",
    image: "",
  });

  const [editProduct, setEditProduct] = useState<SanPham | null>(null);

  // ======== DANH MỤC SẢN PHẨM STATE ========
  const [catalogProducts, setCatalogProducts] = useState<SanPhamCatalog[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("");
  const [catalogSortOption, setCatalogSortOption] = useState("default");
  const [catalogCurrentPage, setCatalogCurrentPage] = useState(1);

  const [showCatalogAddModal, setShowCatalogAddModal] = useState(false);
  const [showCatalogViewModal, setShowCatalogViewModal] = useState(false);
  const [showCatalogEditModal, setShowCatalogEditModal] = useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<SanPhamCatalog | null>(null);
  const [catalogSaving, setCatalogSaving] = useState(false);

  const [newCatalogProduct, setNewCatalogProduct] = useState<Partial<SanPhamCatalog>>({
    name: "",
    sizeChart: "",
    image: "",
    color: "",
    retailPrice: 0,
    wholesalePrice: 0,
    costPrice: 0,
    mainFabric: "",
    accentFabric: "",
    otherMaterials: "",
    mainFabricQuota: "",
    accentFabricQuota: "",
    materialsQuota: "",
    accessoriesQuota: "",
    otherQuota: "",
    plannedQuantity: 0,
    cutQuantity: 0,
    warehouseQuantity: 0,
    finalStatus: "",
    nplSyncStatus: "",
    productionStatus: "",
    warehouseEntry: "",
  });

  const [editCatalogProduct, setEditCatalogProduct] = useState<SanPhamCatalog | null>(null);

  // ======== PHÁT TRIỂN SẢN PHẨM FUNCTIONS ========
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/san-pham");
      const result = await response.json();

      if (result.success) {
        setProducts(result.data);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu sản phẩm");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCatalogProducts();
  }, []);

  useEffect(() => {
    if (showEditModal || showCatalogEditModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showEditModal, showCatalogEditModal]);

  const filteredProducts = products
    .filter(p =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.workshop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.productionStage || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.developmentStage || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name, "vi");
        case "name_desc":
          return b.name.localeCompare(a.name, "vi");
        case "code_asc":
          return a.code.localeCompare(b.code, "vi");
        case "code_desc":
          return b.code.localeCompare(a.code, "vi");
        case "id_asc":
          return a.id - b.id;
        case "id_desc":
          return b.id - a.id;
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleViewProduct = (product: SanPham) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: SanPham) => {
    setEditProduct({ ...product });
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        const response = await fetch(`/api/san-pham/delete?id=${id}`, {
          method: "DELETE",
        });
        const result = await response.json();

        if (result.success) {
          toast.success("Đã xóa sản phẩm thành công");
          fetchProducts();
        } else {
          toast.error(result.error || "Không thể xóa sản phẩm");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Lỗi kết nối server");
      }
    }
  };

  const fetchProductInfoByCode = async (code: string) => {
    if (!code || code.trim() === "") return;

    setIsAutoFilling(true);
    try {
      const response = await fetch(`/api/san-pham/get-info-by-code?code=${encodeURIComponent(code)}`);
      const data = await response.json();

      if (data.success && data.data) {
        setNewProduct(prev => ({
          ...prev,
          workshop: data.data.workshop,
          mainFabricQuota: data.data.mainFabricQuota,
          accentFabricQuota1: data.data.accentFabricQuota1,
          accentFabricQuota2: data.data.accentFabricQuota2,
          materialsQuota1: data.data.materialsQuota1,
          materialsQuota2: data.data.materialsQuota2,
          accessoriesQuota: data.data.accessoriesQuota,
          otherQuota: data.data.otherQuota,
          plannedQuantity: data.data.plannedQuantity,
          cutQuantity: data.data.cutQuantity,
        }));
      }
    } catch (error) {
      console.error("Error fetching product info:", error);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.code && !newProduct.name) {
      toast.error("Vui lòng điền Mã SP hoặc Tên SP");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/san-pham/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Đã thêm sản phẩm thành công");
        setShowAddModal(false);
        setNewProduct({
          code: "",
          name: "",
          size: "",
          mainFabric: "",
          accentFabric: "",
          otherMaterials: "",
          productionOrder: "",
          workshop: "",
          mainFabricQuota: "",
          accentFabricQuota1: "",
          accentFabricQuota2: "",
          materialsQuota1: "",
          materialsQuota2: "",
          accessoriesQuota: "",
          otherQuota: "",
          plannedQuantity: 0,
          cutQuantity: 0,
          warehouseQuantity: 0,
          developmentStage: "",
          productionStage: "",
          image: "",
        });
        fetchProducts();
      } else {
        toast.error(result.error || "Không thể thêm sản phẩm");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;

    try {
      setSaving(true);
      const response = await fetch("/api/san-pham/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProduct),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Đã cập nhật sản phẩm thành công");
        setShowEditModal(false);
        setEditProduct(null);
        fetchProducts();
      } else {
        toast.error(result.error || "Không thể cập nhật sản phẩm");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  // Stats for PhatTrienSanPham
  const totalProducts = products.length;
  const inProductionCount = products.filter(p =>
    (p.productionStage || "").toLowerCase().includes("đang sản xuất") ||
    (p.developmentStage || "").toLowerCase().includes("đang phát triển")
  ).length;
  const completedCount = products.filter(p =>
    (p.productionStage || "").toLowerCase().includes("hoàn thành")
  ).length;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("hoàn thành")) return "bg-green-100 text-green-700";
    if (s.includes("đang sản xuất") || s.includes("đang phát triển")) return "bg-blue-100 text-blue-700";
    if (s.includes("sẵn sàng")) return "bg-purple-100 text-purple-700";
    if (s.includes("tạm dừng")) return "bg-red-100 text-red-700";
    if (s.includes("chờ")) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  // ======== DANH MỤC SẢN PHẨM FUNCTIONS ========
  const fetchCatalogProducts = async () => {
    try {
      setCatalogLoading(true);
      const response = await fetch("/api/san-pham-catalog");
      const result = await response.json();

      if (result.success) {
        setCatalogProducts(result.data);
      } else {
        toast.error(result.error || "Không thể tải danh mục sản phẩm");
      }
    } catch (error) {
      console.error("Error fetching catalog products:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setCatalogLoading(false);
    }
  };

  const filteredCatalogProducts = catalogProducts
    .filter(p =>
      p.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
      p.color.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
      p.mainFabric.toLowerCase().includes(catalogSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (catalogSortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name, "vi");
        case "name_desc":
          return b.name.localeCompare(a.name, "vi");
        case "price_asc":
          return a.retailPrice - b.retailPrice;
        case "price_desc":
          return b.retailPrice - a.retailPrice;
        case "id_asc":
          return a.id - b.id;
        case "id_desc":
          return b.id - a.id;
        default:
          return 0;
      }
    });

  const catalogTotalPages = Math.ceil(filteredCatalogProducts.length / itemsPerPage);
  const catalogStartIndex = (catalogCurrentPage - 1) * itemsPerPage;
  const catalogEndIndex = catalogStartIndex + itemsPerPage;
  const paginatedCatalogProducts = filteredCatalogProducts.slice(catalogStartIndex, catalogEndIndex);

  const handleCatalogSearchChange = (value: string) => {
    setCatalogSearchTerm(value);
    setCatalogCurrentPage(1);
  };

  const handleViewCatalogProduct = (product: SanPhamCatalog) => {
    setSelectedCatalogProduct(product);
    setShowCatalogViewModal(true);
  };

  const handleEditCatalogProduct = (product: SanPhamCatalog) => {
    setEditCatalogProduct({ ...product });
    setShowCatalogEditModal(true);
  };

  const handleDeleteCatalogProduct = async (id: number) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        const response = await fetch(`/api/san-pham-catalog/delete?id=${id}`, {
          method: "DELETE",
        });
        const result = await response.json();

        if (result.success) {
          toast.success("Đã xóa sản phẩm thành công");
          fetchCatalogProducts();
        } else {
          toast.error(result.error || "Không thể xóa sản phẩm");
        }
      } catch (error) {
        console.error("Error deleting catalog product:", error);
        toast.error("Lỗi kết nối server");
      }
    }
  };

  const handleAddCatalogProduct = async () => {
    if (!newCatalogProduct.name) {
      toast.error("Vui lòng điền Tên sản phẩm");
      return;
    }

    try {
      setCatalogSaving(true);
      const response = await fetch("/api/san-pham-catalog/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCatalogProduct),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Đã thêm sản phẩm thành công");
        setShowCatalogAddModal(false);
        setNewCatalogProduct({
          name: "",
          sizeChart: "",
          image: "",
          color: "",
          retailPrice: 0,
          wholesalePrice: 0,
          costPrice: 0,
          mainFabric: "",
          accentFabric: "",
          otherMaterials: "",
          mainFabricQuota: "",
          accentFabricQuota: "",
          materialsQuota: "",
          accessoriesQuota: "",
          otherQuota: "",
          plannedQuantity: 0,
          cutQuantity: 0,
          warehouseQuantity: 0,
          finalStatus: "",
          nplSyncStatus: "",
          productionStatus: "",
          warehouseEntry: "",
        });
        fetchCatalogProducts();
      } else {
        toast.error(result.error || "Không thể thêm sản phẩm");
      }
    } catch (error) {
      console.error("Error adding catalog product:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setCatalogSaving(false);
    }
  };

  const handleSaveCatalogEdit = async () => {
    if (!editCatalogProduct) return;

    try {
      setCatalogSaving(true);
      const response = await fetch("/api/san-pham-catalog/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCatalogProduct),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Đã cập nhật sản phẩm thành công");
        setShowCatalogEditModal(false);
        setEditCatalogProduct(null);
        fetchCatalogProducts();
      } else {
        toast.error(result.error || "Không thể cập nhật sản phẩm");
      }
    } catch (error) {
      console.error("Error updating catalog product:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setCatalogSaving(false);
    }
  };

  // Stats for Catalog
  const catalogTotalProducts = catalogProducts.length;
  const catalogTotalValue = catalogProducts.reduce((sum, p) => sum + (p.retailPrice || 0), 0);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-purple-600" />
            Quản lý sản phẩm
          </h1>
          <p className="text-gray-500 mt-1">Quản lý danh mục và phát triển sản phẩm</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => handleTabChange("phat-trien")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "phat-trien"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <List size={18} />
            Phát triển sản phẩm
          </button>
          <button
            onClick={() => handleTabChange("danh-muc")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "danh-muc"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <ShoppingBag size={18} />
            Danh mục sản phẩm
          </button>
          <button
            onClick={() => handleTabChange("quan-ly-kho")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "quan-ly-kho"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Warehouse size={18} />
            Quản lý kho
          </button>
          <button
            onClick={() => handleTabChange("dieu-chinh-gia-von")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "dieu-chinh-gia-von"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <DollarSign size={18} />
            Điều chỉnh giá vốn
          </button>
        </nav>
      </div>

      {/* ======== TAB: PHÁT TRIỂN SẢN PHẨM ======== */}
      {activeTab === "phat-trien" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Package className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đang phát triển/SX</p>
                  <p className="text-2xl font-bold text-blue-600">{inProductionCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Package className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đã hoàn thành</p>
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              {/* Search & Actions */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm mã SP, tên, xưởng SX, trạng thái..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={sortOption}
                      onChange={(e) => {
                        setSortOption(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm min-w-[180px]"
                    >
                      <option value="default">Mặc định</option>
                      <option value="name_asc">Tên A → Z</option>
                      <option value="name_desc">Tên Z → A</option>
                      <option value="code_asc">Mã SP A → Z</option>
                      <option value="code_desc">Mã SP Z → A</option>
                      <option value="id_asc">Cũ nhất trước</option>
                      <option value="id_desc">Mới nhất trước</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm sản phẩm
                </button>
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã SP</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">Tên sản phẩm</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vải chính</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tình trạng SX</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Xưởng SX</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedProducts.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                              {searchTerm ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có dữ liệu sản phẩm"}
                            </td>
                          </tr>
                        ) : (
                          paginatedProducts.map((product, index) => (
                            <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewProduct(product)}>
                              <td className="px-3 py-3 text-sm text-gray-500">{startIndex + index + 1}</td>
                              <td className="px-3 py-3">
                                <span className="text-sm font-medium text-purple-600">{product.code || "-"}</span>
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-900">{product.name || "-"}</td>
                              <td className="px-3 py-3 text-sm text-gray-600">{product.size || "-"}</td>
                              <td className="px-3 py-3 text-sm text-gray-600">{product.mainFabric || "-"}</td>
                              <td className="px-3 py-3">
                                {product.productionStage ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.productionStage)}`}>
                                    {product.productionStage}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">{product.workshop || "-"}</td>
                              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                    title="Sửa"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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

                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Hiển thị {filteredProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length} sản phẩm
                      {searchTerm && ` (lọc từ ${products.length} sản phẩm)`}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`min-w-[36px] h-9 rounded-lg font-medium transition-colors ${
                                    currentPage === page
                                      ? "bg-purple-600 text-white"
                                      : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return <span key={page} className="px-1 text-gray-400">...</span>;
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ======== TAB: DANH MỤC SẢN PHẨM ======== */}
      {activeTab === "danh-muc" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <ShoppingBag className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold text-gray-900">{catalogTotalProducts}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Package className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng giá trị (giá lẻ)</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(catalogTotalValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              {/* Search & Actions */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm tên SP, màu sắc, vải chính..."
                      value={catalogSearchTerm}
                      onChange={(e) => handleCatalogSearchChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={catalogSortOption}
                      onChange={(e) => {
                        setCatalogSortOption(e.target.value);
                        setCatalogCurrentPage(1);
                      }}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm min-w-[180px]"
                    >
                      <option value="default">Mặc định</option>
                      <option value="name_asc">Tên A → Z</option>
                      <option value="name_desc">Tên Z → A</option>
                      <option value="price_asc">Giá thấp → cao</option>
                      <option value="price_desc">Giá cao → thấp</option>
                      <option value="id_asc">Cũ nhất trước</option>
                      <option value="id_desc">Mới nhất trước</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setShowCatalogAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm sản phẩm
                </button>
              </div>

              {/* Loading state */}
              {catalogLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">Tên SP</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bảng size</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Màu sắc</th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Giá lẻ</th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Giá sỉ</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedCatalogProducts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                              {catalogSearchTerm ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có dữ liệu sản phẩm"}
                            </td>
                          </tr>
                        ) : (
                          paginatedCatalogProducts.map((product, index) => (
                            <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewCatalogProduct(product)}>
                              <td className="px-3 py-3 text-sm text-gray-500">{catalogStartIndex + index + 1}</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-10 h-10 rounded object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                      <ImageIcon size={16} className="text-gray-400" />
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-gray-900">{product.name || "-"}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">{product.sizeChart || "-"}</td>
                              <td className="px-3 py-3 text-sm text-gray-600">{product.color || "-"}</td>
                              <td className="px-3 py-3 text-sm text-right font-medium text-green-600">{formatPrice(product.retailPrice)}</td>
                              <td className="px-3 py-3 text-sm text-right text-gray-600">{formatPrice(product.wholesalePrice)}</td>
                              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleEditCatalogProduct(product)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                    title="Sửa"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCatalogProduct(product.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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

                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Hiển thị {filteredCatalogProducts.length > 0 ? catalogStartIndex + 1 : 0}-{Math.min(catalogEndIndex, filteredCatalogProducts.length)} / {filteredCatalogProducts.length} sản phẩm
                      {catalogSearchTerm && ` (lọc từ ${catalogProducts.length} sản phẩm)`}
                    </div>

                    {catalogTotalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCatalogCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={catalogCurrentPage === 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: catalogTotalPages }, (_, i) => i + 1).map(page => {
                            if (
                              page === 1 ||
                              page === catalogTotalPages ||
                              (page >= catalogCurrentPage - 1 && page <= catalogCurrentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCatalogCurrentPage(page)}
                                  className={`min-w-[36px] h-9 rounded-lg font-medium transition-colors ${
                                    catalogCurrentPage === page
                                      ? "bg-purple-600 text-white"
                                      : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            } else if (
                              page === catalogCurrentPage - 2 ||
                              page === catalogCurrentPage + 2
                            ) {
                              return <span key={page} className="px-1 text-gray-400">...</span>;
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() => setCatalogCurrentPage(prev => Math.min(prev + 1, catalogTotalPages))}
                          disabled={catalogCurrentPage === catalogTotalPages}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ======== MODALS PHÁT TRIỂN SẢN PHẨM ======== */}
      {/* Modal thêm sản phẩm phát triển */}
      {showAddModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm sản phẩm mới</h3>
                <p className="text-sm text-gray-500">Phát triển sản phẩm</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isAutoFilling && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Đang tải thông tin tự động...
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP *</label>
                    <input
                      type="text"
                      value={newProduct.code || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value.toUpperCase() })}
                      onBlur={(e) => fetchProductInfoByCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: RM001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input
                      type="text"
                      value={newProduct.size || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: 6/7-10/11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={newProduct.name || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vải chính</label>
                    <input
                      type="text"
                      value={newProduct.mainFabric || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, mainFabric: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: Jeans cotton"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vải phối</label>
                    <input
                      type="text"
                      value={newProduct.accentFabric || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, accentFabric: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: Thun"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phụ liệu khác</label>
                  <input
                    type="text"
                    value={newProduct.otherMaterials || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, otherMaterials: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="VD: Khóa, nút, chỉ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lệnh SX</label>
                    <input
                      type="text"
                      value={newProduct.productionOrder || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, productionOrder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: LSX001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                    <select
                      value={newProduct.workshop || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, workshop: e.target.value })}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                    >
                      <option value="">-- Chọn xưởng --</option>
                      {workshopOptions.map(ws => (
                        <option key={ws} value={ws}>{ws}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Định mức nguyên vật liệu</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải chính</label>
                      <input
                        type="text"
                        value={newProduct.mainFabricQuota || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, mainFabricQuota: e.target.value })}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 1.5m"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải phối 1</label>
                      <input
                        type="text"
                        value={newProduct.accentFabricQuota1 || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, accentFabricQuota1: e.target.value })}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 0.5m"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Vải phối 2</label>
                      <input
                        type="text"
                        value={newProduct.accentFabricQuota2 || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, accentFabricQuota2: e.target.value })}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 0.3m"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ liệu 1</label>
                      <input
                        type="text"
                        value={newProduct.materialsQuota1 || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, materialsQuota1: e.target.value })}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 2 nút"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ liệu 2</label>
                      <input
                        type="text"
                        value={newProduct.materialsQuota2 || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, materialsQuota2: e.target.value })}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 1 khóa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Phụ kiện</label>
                      <input
                        type="text"
                        value={newProduct.accessoriesQuota || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, accessoriesQuota: e.target.value })}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 1 nhãn"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ĐM Khác</label>
                    <input
                      type="text"
                      value={newProduct.otherQuota || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, otherQuota: e.target.value })}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                      placeholder="Nhập định mức khác"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng kế hoạch</label>
                      <input
                        type="number"
                        value={newProduct.plannedQuantity || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, plannedQuantity: parseInt(e.target.value) || 0 })}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng cắt</label>
                      <input
                        type="number"
                        value={newProduct.cutQuantity || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, cutQuantity: parseInt(e.target.value) || 0 })}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng nhập kho</label>
                    <input
                      type="number"
                      value={newProduct.warehouseQuantity || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, warehouseQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Công đoạn</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn phát triển</label>
                      <input
                        type="text"
                        value={newProduct.developmentStage || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, developmentStage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập công đoạn"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn sản xuất</label>
                      <input
                        type="text"
                        value={newProduct.productionStage || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, productionStage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập công đoạn"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                  <input
                    type="text"
                    value={newProduct.image || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Nhập URL hình ảnh"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : "Thêm sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem chi tiết sản phẩm phát triển */}
      {showViewModal && selectedProduct && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => { setShowViewModal(false); setSelectedProduct(null); }}
          />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <div>
                <p className="text-purple-100 text-sm">Chi tiết sản phẩm</p>
                <h3 className="text-xl font-bold text-white">{selectedProduct.code || selectedProduct.name}</h3>
              </div>
              <button
                onClick={() => { setShowViewModal(false); setSelectedProduct(null); }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mã SP:</span>
                      <span className="font-medium text-purple-600">{selectedProduct.code || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tên SP:</span>
                      <span className="font-medium">{selectedProduct.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">{selectedProduct.size || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-900 mb-3">Nguyên vật liệu</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vải chính:</span>
                      <span className="font-medium">{selectedProduct.mainFabric || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vải phối:</span>
                      <span className="font-medium">{selectedProduct.accentFabric || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phụ liệu khác:</span>
                      <span className="font-medium">{selectedProduct.otherMaterials || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Thông tin sản xuất</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lệnh SX:</span>
                      <span className="font-medium">{selectedProduct.productionOrder || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Xưởng SX:</span>
                      <span className="font-medium">{selectedProduct.workshop || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Công đoạn phát triển:</span>
                      <span className="font-medium">{selectedProduct.developmentStage || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Công đoạn sản xuất:</span>
                      <span className="font-medium">{selectedProduct.productionStage || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowViewModal(false); setSelectedProduct(null); }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => { setShowViewModal(false); handleEditProduct(selectedProduct); }}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Slide Panel sửa sản phẩm phát triển */}
      {showEditModal && editProduct && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => { setShowEditModal(false); setEditProduct(null); }}
          />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa sản phẩm</h3>
                <p className="text-sm text-gray-500">Mã: {editProduct.code}</p>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditProduct(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                    <input
                      type="text"
                      value={editProduct.code}
                      onChange={(e) => setEditProduct({ ...editProduct, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input
                      type="text"
                      value={editProduct.size}
                      onChange={(e) => setEditProduct({ ...editProduct, size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vải chính</label>
                    <input
                      type="text"
                      value={editProduct.mainFabric}
                      onChange={(e) => setEditProduct({ ...editProduct, mainFabric: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vải phối</label>
                    <input
                      type="text"
                      value={editProduct.accentFabric}
                      onChange={(e) => setEditProduct({ ...editProduct, accentFabric: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phụ liệu khác</label>
                  <input
                    type="text"
                    value={editProduct.otherMaterials}
                    onChange={(e) => setEditProduct({ ...editProduct, otherMaterials: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lệnh SX</label>
                    <input
                      type="text"
                      value={editProduct.productionOrder}
                      onChange={(e) => setEditProduct({ ...editProduct, productionOrder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                    <select
                      value={editProduct.workshop}
                      onChange={(e) => setEditProduct({ ...editProduct, workshop: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Chọn xưởng --</option>
                      {workshopOptions.map(ws => (
                        <option key={ws} value={ws}>{ws}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn phát triển</label>
                    <input
                      type="text"
                      value={editProduct.developmentStage}
                      onChange={(e) => setEditProduct({ ...editProduct, developmentStage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn sản xuất</label>
                    <input
                      type="text"
                      value={editProduct.productionStage}
                      onChange={(e) => setEditProduct({ ...editProduct, productionStage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowEditModal(false); setEditProduct(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ======== MODALS DANH MỤC SẢN PHẨM ======== */}
      {/* Modal thêm sản phẩm danh mục */}
      {showCatalogAddModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowCatalogAddModal(false)}
          />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm sản phẩm mới</h3>
                <p className="text-sm text-gray-500">Danh mục sản phẩm</p>
              </div>
              <button
                onClick={() => setShowCatalogAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                      <input
                        type="text"
                        value={newCatalogProduct.name || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập tên sản phẩm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bảng size</label>
                        <input
                          type="text"
                          value={newCatalogProduct.sizeChart || ""}
                          onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, sizeChart: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="VD: S, M, L, XL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                        <input
                          type="text"
                          value={newCatalogProduct.color || ""}
                          onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, color: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="VD: Đỏ, Xanh, Trắng"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link hình ảnh</label>
                      <input
                        type="text"
                        value={newCatalogProduct.image || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, image: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Giá cả */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Giá cả</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán lẻ</label>
                      <input
                        type="number"
                        value={newCatalogProduct.retailPrice || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, retailPrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán sỉ</label>
                      <input
                        type="number"
                        value={newCatalogProduct.wholesalePrice || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, wholesalePrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn</label>
                      <input
                        type="number"
                        value={newCatalogProduct.costPrice || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, costPrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Nguyên vật liệu */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Nguyên vật liệu</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vải chính</label>
                      <input
                        type="text"
                        value={newCatalogProduct.mainFabric || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, mainFabric: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vải phối</label>
                      <input
                        type="text"
                        value={newCatalogProduct.accentFabric || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, accentFabric: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phụ liệu khác</label>
                      <input
                        type="text"
                        value={newCatalogProduct.otherMaterials || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, otherMaterials: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Định mức */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM vải chính</label>
                      <input
                        type="text"
                        value={newCatalogProduct.mainFabricQuota || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, mainFabricQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM vải phối</label>
                      <input
                        type="text"
                        value={newCatalogProduct.accentFabricQuota || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, accentFabricQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM phụ liệu</label>
                      <input
                        type="text"
                        value={newCatalogProduct.materialsQuota || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, materialsQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM phụ kiện</label>
                      <input
                        type="text"
                        value={newCatalogProduct.accessoriesQuota || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, accessoriesQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM khác</label>
                      <input
                        type="text"
                        value={newCatalogProduct.otherQuota || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, otherQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Số lượng */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL kế hoạch</label>
                      <input
                        type="number"
                        value={newCatalogProduct.plannedQuantity || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, plannedQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL cắt</label>
                      <input
                        type="number"
                        value={newCatalogProduct.cutQuantity || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, cutQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL nhập kho</label>
                      <input
                        type="number"
                        value={newCatalogProduct.warehouseQuantity || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, warehouseQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Trạng thái */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Trạng thái</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CĐ Final</label>
                      <input
                        type="text"
                        value={newCatalogProduct.finalStatus || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, finalStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CĐ đồng bộ NPL</label>
                      <input
                        type="text"
                        value={newCatalogProduct.nplSyncStatus || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, nplSyncStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CĐ sản xuất</label>
                      <input
                        type="text"
                        value={newCatalogProduct.productionStatus || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, productionStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nhập kho</label>
                      <input
                        type="text"
                        value={newCatalogProduct.warehouseEntry || ""}
                        onChange={(e) => setNewCatalogProduct({ ...newCatalogProduct, warehouseEntry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCatalogAddModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={catalogSaving}
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddCatalogProduct}
                  disabled={catalogSaving}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {catalogSaving && <Loader2 size={18} className="animate-spin" />}
                  {catalogSaving ? "Đang lưu..." : "Thêm sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem chi tiết sản phẩm danh mục */}
      {showCatalogViewModal && selectedCatalogProduct && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => { setShowCatalogViewModal(false); setSelectedCatalogProduct(null); }}
          />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="flex items-center gap-4">
                {selectedCatalogProduct.image && (
                  <img
                    src={selectedCatalogProduct.image}
                    alt={selectedCatalogProduct.name}
                    className="w-14 h-14 rounded-lg object-cover border-2 border-white/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <p className="text-purple-100 text-sm">Chi tiết sản phẩm</p>
                  <h3 className="text-xl font-bold text-white">{selectedCatalogProduct.name}</h3>
                </div>
              </div>
              <button
                onClick={() => { setShowCatalogViewModal(false); setSelectedCatalogProduct(null); }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tên SP:</span>
                      <span className="font-medium">{selectedCatalogProduct.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bảng size:</span>
                      <span className="font-medium">{selectedCatalogProduct.sizeChart || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Màu sắc:</span>
                      <span className="font-medium">{selectedCatalogProduct.color || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Giá cả */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-3">Giá cả</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 mb-1">Giá lẻ</p>
                      <p className="font-bold text-green-600 text-lg">{formatPrice(selectedCatalogProduct.retailPrice)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 mb-1">Giá sỉ</p>
                      <p className="font-bold text-blue-600 text-lg">{formatPrice(selectedCatalogProduct.wholesalePrice)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 mb-1">Giá vốn</p>
                      <p className="font-bold text-orange-600 text-lg">{formatPrice(selectedCatalogProduct.costPrice)}</p>
                    </div>
                  </div>
                </div>

                {/* Nguyên vật liệu */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-900 mb-3">Nguyên vật liệu</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vải chính:</span>
                      <span className="font-medium">{selectedCatalogProduct.mainFabric || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vải phối:</span>
                      <span className="font-medium">{selectedCatalogProduct.accentFabric || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phụ liệu khác:</span>
                      <span className="font-medium">{selectedCatalogProduct.otherMaterials || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Định mức */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ĐM vải chính:</span>
                      <span className="font-medium">{selectedCatalogProduct.mainFabricQuota || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ĐM vải phối:</span>
                      <span className="font-medium">{selectedCatalogProduct.accentFabricQuota || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ĐM phụ liệu:</span>
                      <span className="font-medium">{selectedCatalogProduct.materialsQuota || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ĐM phụ kiện:</span>
                      <span className="font-medium">{selectedCatalogProduct.accessoriesQuota || "-"}</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-500">ĐM khác:</span>
                      <span className="font-medium">{selectedCatalogProduct.otherQuota || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Số lượng */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm text-center">
                    <div>
                      <p className="text-gray-500 mb-1">SL kế hoạch</p>
                      <p className="font-bold text-purple-600 text-lg">{selectedCatalogProduct.plannedQuantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">SL cắt</p>
                      <p className="font-bold text-blue-600 text-lg">{selectedCatalogProduct.cutQuantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">SL nhập kho</p>
                      <p className="font-bold text-green-600 text-lg">{selectedCatalogProduct.warehouseQuantity || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Trạng thái</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">CĐ Final:</span>
                      <span className="font-medium">{selectedCatalogProduct.finalStatus || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CĐ đồng bộ NPL:</span>
                      <span className="font-medium">{selectedCatalogProduct.nplSyncStatus || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CĐ sản xuất:</span>
                      <span className="font-medium">{selectedCatalogProduct.productionStatus || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nhập kho:</span>
                      <span className="font-medium">{selectedCatalogProduct.warehouseEntry || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCatalogViewModal(false); setSelectedCatalogProduct(null); }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => { setShowCatalogViewModal(false); handleEditCatalogProduct(selectedCatalogProduct); }}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Slide Panel sửa sản phẩm danh mục */}
      {showCatalogEditModal && editCatalogProduct && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => { setShowCatalogEditModal(false); setEditCatalogProduct(null); }}
          />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa sản phẩm</h3>
                <p className="text-sm text-gray-500">{editCatalogProduct.name}</p>
              </div>
              <button
                onClick={() => { setShowCatalogEditModal(false); setEditCatalogProduct(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                      <input
                        type="text"
                        value={editCatalogProduct.name}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bảng size</label>
                        <input
                          type="text"
                          value={editCatalogProduct.sizeChart}
                          onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, sizeChart: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                        <input
                          type="text"
                          value={editCatalogProduct.color}
                          onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, color: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link hình ảnh</label>
                      <input
                        type="text"
                        value={editCatalogProduct.image}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, image: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Giá cả */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Giá cả</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán lẻ</label>
                      <input
                        type="number"
                        value={editCatalogProduct.retailPrice}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, retailPrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán sỉ</label>
                      <input
                        type="number"
                        value={editCatalogProduct.wholesalePrice}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, wholesalePrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn</label>
                      <input
                        type="number"
                        value={editCatalogProduct.costPrice}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, costPrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Nguyên vật liệu */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Nguyên vật liệu</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vải chính</label>
                      <input
                        type="text"
                        value={editCatalogProduct.mainFabric}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, mainFabric: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vải phối</label>
                      <input
                        type="text"
                        value={editCatalogProduct.accentFabric}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, accentFabric: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phụ liệu khác</label>
                      <input
                        type="text"
                        value={editCatalogProduct.otherMaterials}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, otherMaterials: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Định mức */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Định mức</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM vải chính</label>
                      <input
                        type="text"
                        value={editCatalogProduct.mainFabricQuota}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, mainFabricQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM vải phối</label>
                      <input
                        type="text"
                        value={editCatalogProduct.accentFabricQuota}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, accentFabricQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM phụ liệu</label>
                      <input
                        type="text"
                        value={editCatalogProduct.materialsQuota}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, materialsQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM phụ kiện</label>
                      <input
                        type="text"
                        value={editCatalogProduct.accessoriesQuota}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, accessoriesQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ĐM khác</label>
                      <input
                        type="text"
                        value={editCatalogProduct.otherQuota}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, otherQuota: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Số lượng */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Số lượng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL kế hoạch</label>
                      <input
                        type="number"
                        value={editCatalogProduct.plannedQuantity}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, plannedQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL cắt</label>
                      <input
                        type="number"
                        value={editCatalogProduct.cutQuantity}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, cutQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SL nhập kho</label>
                      <input
                        type="number"
                        value={editCatalogProduct.warehouseQuantity}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, warehouseQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Trạng thái */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Trạng thái</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CĐ Final</label>
                      <input
                        type="text"
                        value={editCatalogProduct.finalStatus}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, finalStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CĐ đồng bộ NPL</label>
                      <input
                        type="text"
                        value={editCatalogProduct.nplSyncStatus}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, nplSyncStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CĐ sản xuất</label>
                      <input
                        type="text"
                        value={editCatalogProduct.productionStatus}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, productionStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nhập kho</label>
                      <input
                        type="text"
                        value={editCatalogProduct.warehouseEntry}
                        onChange={(e) => setEditCatalogProduct({ ...editCatalogProduct, warehouseEntry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCatalogEditModal(false); setEditCatalogProduct(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                  disabled={catalogSaving}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveCatalogEdit}
                  disabled={catalogSaving}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {catalogSaving && <Loader2 size={18} className="animate-spin" />}
                  {catalogSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ======== TAB: QUẢN LÝ KHO ======== */}
      {activeTab === "quan-ly-kho" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <QuanLyKhoTab />
          </div>
        </div>
      )}

      {/* ======== TAB: ĐIỀU CHỈNH GIÁ VỐN ======== */}
      {activeTab === "dieu-chinh-gia-von" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Điều chỉnh giá vốn</h2>
                <p className="text-sm text-gray-500">Cập nhật và điều chỉnh giá vốn sản phẩm</p>
              </div>
            </div>

            {/* Coming soon placeholder */}
            <div className="text-center py-16">
              <DollarSign className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang phát triển</h3>
              <p className="text-gray-500">Tính năng điều chỉnh giá vốn đang được xây dựng</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
