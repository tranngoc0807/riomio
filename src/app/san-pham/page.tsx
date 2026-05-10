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
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Portal from "@/components/Portal";
import ImagePickerModal from "@/components/ImagePickerModal";
import toast, { Toaster } from "react-hot-toast";
import QuanLyKhoTab from "./components/QuanLyKhoTab";
import ConfirmModal from "@/components/ConfirmModal";

// Types - khớp với Google Sheets PhatTrienSanPham
interface SanPham {
  id: number;
  code: string; // Mã SP (Cột A)
  name: string; // Tên SP (Cột B)
  size: string; // Size (Cột C)
  mainFabric: string; // Vải chính (Cột D)
  accentFabric: string; // Vải phối (Cột E)
  otherMaterials: string; // Phụ liệu khác (Cột F)
  productionOrder: string; // Lệnh SX (Cột G)
  workshop: string; // Xưởng SX (Cột H)
  mainFabricQuota: string; // ĐM Vải chính (Cột I)
  accentFabricQuota1: string; // ĐM Vải phối 1 (Cột J)
  accentFabricQuota2: string; // ĐM Vải phối 2 (Cột K)
  materialsQuota1: string; // ĐM Phụ liệu 1 (Cột L)
  materialsQuota2: string; // ĐM Phụ liệu 2 (Cột M)
  accessoriesQuota: string; // ĐM Phụ kiện (Cột N)
  otherQuota: string; // ĐM Khác (Cột O)
  plannedQuantity: number; // Số lượng kế hoạch (Cột P)
  cutQuantity: number; // Số lượng cắt (Cột Q)
  warehouseQuantity: number; // Số lượng nhập kho (Cột R)
  developmentStage: string; // Công đoạn phát triển (Cột S)
  productionStage: string; // Công đoạn sản xuất (Cột T)
  image: string; // Hình ảnh (Cột U)
}

// Types - khớp với Google Sheets sheet "SanPham"
// A=STT, B=Mã SP, C=Hình in, D=Size, E=Màu sắc, F=Mã SP đầy đủ (formula), G=Hình ảnh,
// H=Giá sỉ, I=Giá lẻ, J=Dòng size, K=Tồn kho
interface SanPhamCatalog {
  id: number;
  code: string; // B - Mã SP
  printPattern: string; // C - Hình in
  size: string; // D - Size
  color: string; // E - Màu sắc
  name: string; // F - Mã SP đầy đủ
  image: string; // G - Hình ảnh
  wholesalePrice: number; // H - Giá sỉ
  retailPrice: number; // I - Giá lẻ
  sizeChart: string; // J - Dòng size
  tonKho: number; // K - Tồn kho
  // legacy fields kept for backward compat
  costPrice: number;
  mainFabric: string;
  accentFabric: string;
  otherMaterials: string;
  mainFabricQuota: string;
  accentFabricQuota: string;
  materialsQuota: string;
  accessoriesQuota: string;
  otherQuota: string;
  plannedQuantity: number;
  cutQuantity: number;
  warehouseQuantity: number;
  finalStatus: string;
  nplSyncStatus: string;
  productionStatus: string;
  warehouseEntry: string;
}

// Xưởng sản xuất sẽ được load từ API

// Size options
const sizeOptions = [
  "1/2-6/7",
  "2/3-5/6",
  "2/3-6/7",
  "2/3-7/8",
  "2/3-8/9",
  "2/3-9/10",
  "2/3-10/11",
  "2/3-11/12",
  "2/3-12/13",
  "2/3-13/14",
  "2/3-14/15",
  "3/4-5/6",
  "3/4-6/7",
  "3/4-7/8",
  "3/4-8/9",
  "3/4-9/10",
  "3/4-10/11",
  "3/4-11/12",
  "3/4-12/13",
  "4/5-10/11",
  "4/5-11/12",
  "4/5-12/13",
  "5/6-10/11",
  "5/6-11/12",
  "5/6-12/13",
  "5/6-13/14",
  "6/7-10/11",
  "6/7-11/12",
  "6/7-12/13",
  "6/7-13/14",
  "7/8-10/11",
  "7/8-11/12",
  "7/8-12/13",
  "7/8-13/14",
  "8/9-11/12",
  "8/9-12/13",
  "8/9-13/14",
  "8/9-14/14",
  "10/11-13/14",
  "11/12-15/16",
  "XS-L",
  "S-XL",
  "M-XL",
  "L-XL",
  "S-L",
  "1 size",
  "0/1-7/8",
];

// Công đoạn sản xuất options
const productionStageOptions = [
  "Phát triển",
  "Mẫu đạt",
  "Huỷ mẫu",
  "Lệnh sản xuất",
  "Đồng bộ NPL",
  "Đang sản xuất",
  "Nhập kho 1 phần",
  "Nhập kho toàn bộ",
];

// Trạng thái sản xuất (deprecated - không dùng nữa)
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

  // Sub-tabs của Quản lý kho - khi có các param này thì tự động chuyển sang tab quan-ly-kho
  const quanLyKhoSubTabs = ["ton-kho", "ton-dau", "xuat-kho", "nhap-kho"];
  const isQuanLyKhoSubTab = tabParam && quanLyKhoSubTabs.includes(tabParam);

  const getInitialMainTab = ():
    | "phat-trien"
    | "danh-muc"
    | "quan-ly-kho"
    | "dieu-chinh-gia-von" => {
    if (isQuanLyKhoSubTab || tabParam === "quan-ly-kho") return "quan-ly-kho";
    if (tabParam === "phat-trien") return "phat-trien";
    if (tabParam === "dieu-chinh-gia-von") return "dieu-chinh-gia-von";
    return "danh-muc";
  };

  const [activeTab, setActiveTab] = useState<
    "phat-trien" | "danh-muc" | "quan-ly-kho" | "dieu-chinh-gia-von"
  >(getInitialMainTab);

  // Handle tab change with URL update
  const handleTabChange = (
    tab: "phat-trien" | "danh-muc" | "quan-ly-kho" | "dieu-chinh-gia-von",
  ) => {
    setActiveTab(tab);
    // Khi chuyển sang quan-ly-kho, giữ nguyên sub-tab nếu đang có
    if (tab === "quan-ly-kho" && isQuanLyKhoSubTab) {
      return; // Không thay đổi URL vì đã có sub-tab
    }
    router.push(`/san-pham?tab=${tab}`, { scroll: false });
  };

  // Sync tab state when URL param changes (browser back/forward)
  useEffect(() => {
    const isSubTab = tabParam && quanLyKhoSubTabs.includes(tabParam);
    let newTab:
      | "phat-trien"
      | "danh-muc"
      | "quan-ly-kho"
      | "dieu-chinh-gia-von";
    if (isSubTab || tabParam === "quan-ly-kho") newTab = "quan-ly-kho";
    else if (tabParam === "phat-trien") newTab = "phat-trien";
    else if (tabParam === "dieu-chinh-gia-von") newTab = "dieu-chinh-gia-von";
    else newTab = "danh-muc";
    setActiveTab(newTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Delete confirmation state for PhatTrienSanPham
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null,
  );

  // Image picker state
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<
    "newProduct" | "editProduct" | "newCatalog" | "editCatalog"
  >("newProduct");

  // ======== DANH MỤC SẢN PHẨM STATE ========
  const [catalogProducts, setCatalogProducts] = useState<SanPhamCatalog[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("");
  const [catalogSortOption, setCatalogSortOption] = useState("default");
  const [catalogCurrentPage, setCatalogCurrentPage] = useState(1);

  const [showCatalogAddModal, setShowCatalogAddModal] = useState(false);
  const [showCatalogViewModal, setShowCatalogViewModal] = useState(false);
  const [showCatalogEditModal, setShowCatalogEditModal] = useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] =
    useState<SanPhamCatalog | null>(null);
  const [catalogSaving, setCatalogSaving] = useState(false);

  const [newCatalogProduct, setNewCatalogProduct] = useState<
    Partial<SanPhamCatalog>
  >({
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

  const [editCatalogProduct, setEditCatalogProduct] =
    useState<SanPhamCatalog | null>(null);

  // Mã SP list dùng cho dropdown trong modal Add Catalog
  // Lấy từ sheet "Mã SP" (RIOMIO_SAN_XUAT) — A:Mã SP, B:Tên SP, C:Size, D:Xưởng SX, E:Giá sỉ, F:Giá lẻ, G:Hình ảnh
  type MaSPListItem = {
    code: string;
    name: string;
    size: string;
    color: string;
    workshop: string;
    wholesalePrice: number;
    retailPrice: number;
    image: string;
    sizeChart: string;
    tonKho: number;
  };
  const [maSPList, setMaSPList] = useState<MaSPListItem[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [showMaSPDropdown, setShowMaSPDropdown] = useState(false);
  const [maSPSearch, setMaSPSearch] = useState("");
  const maSPDropdownRef = useRef<HTMLDivElement>(null);

  // Delete confirmation state for CatalogProduct
  const [showCatalogDeleteConfirm, setShowCatalogDeleteConfirm] =
    useState(false);
  const [deletingCatalogProductId, setDeletingCatalogProductId] = useState<
    number | null
  >(null);

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

  // Fetch danh sách Mã SP cho dropdown khi mở modal Add Catalog
  useEffect(() => {
    if (!showCatalogAddModal || maSPList.length > 0) return;
    (async () => {
      try {
        const res = await fetch("/api/ma-sp-list");
        const result = await res.json();
        if (result.success) {
          setMaSPList(result.data);
          setColorOptions(result.colors || []);
          setSizeOptions(result.sizes || []);
        }
      } catch (err) {
        console.error("Error loading Mã SP list:", err);
      }
    })();
  }, [showCatalogAddModal, maSPList.length]);

  // Close Mã SP dropdown when clicking outside
  useEffect(() => {
    if (!showMaSPDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        maSPDropdownRef.current &&
        !maSPDropdownRef.current.contains(e.target as Node)
      ) {
        setShowMaSPDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMaSPDropdown]);

  // Reset maSPSearch khi đóng modal Add Catalog
  useEffect(() => {
    if (!showCatalogAddModal) {
      setMaSPSearch("");
      setShowMaSPDropdown(false);
    }
  }, [showCatalogAddModal]);

  // Auto-compute Mã SP đầy đủ = code + hình in + size + màu
  useEffect(() => {
    const parts = [
      newCatalogProduct.code || "",
      newCatalogProduct.printPattern || "",
      newCatalogProduct.size || "",
      newCatalogProduct.color || "",
    ]
      .filter(Boolean)
      .join(" ");
    if (parts !== (newCatalogProduct.name || "")) {
      setNewCatalogProduct((prev) => ({ ...prev, name: parts }));
    }
  }, [
    newCatalogProduct.code,
    newCatalogProduct.printPattern,
    newCatalogProduct.size,
    newCatalogProduct.color,
    newCatalogProduct.name,
  ]);

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
    .filter(
      (p) =>
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.workshop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.productionStage || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (p.developmentStage || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
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

  const handleDeleteProduct = (id: number) => {
    setDeletingProductId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (deletingProductId === null) return;

    try {
      const response = await fetch(
        `/api/san-pham/delete?id=${deletingProductId}`,
        {
          method: "DELETE",
        },
      );
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
    } finally {
      setShowDeleteConfirm(false);
      setDeletingProductId(null);
    }
  };

  // Helper functions để đóng modal và refresh data
  const closeAddModal = () => {
    setShowAddModal(false);
    fetchProducts();
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditProduct(null);
    fetchProducts();
  };

  const fetchProductInfoByCode = async (code: string) => {
    if (!code || code.trim() === "") return;

    setIsAutoFilling(true);
    try {
      const response = await fetch(
        `/api/san-pham/get-info-by-code?code=${encodeURIComponent(code)}`,
      );
      const data = await response.json();

      if (data.success && data.data) {
        setNewProduct((prev) => ({
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
        closeAddModal(); // Đóng modal và refresh data
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
        closeEditModal(); // Đóng modal và refresh data
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
  const inProductionCount = products.filter(
    (p) =>
      (p.productionStage || "").toLowerCase().includes("đang sản xuất") ||
      (p.developmentStage || "").toLowerCase().includes("đang phát triển"),
  ).length;
  const completedCount = products.filter((p) =>
    (p.productionStage || "").toLowerCase().includes("hoàn thành"),
  ).length;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("hoàn thành")) return "bg-green-100 text-green-700";
    if (s.includes("đang sản xuất") || s.includes("đang phát triển"))
      return "bg-blue-100 text-blue-700";
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
    .filter((p) => {
      const q = catalogSearchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.printPattern.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q)
      );
    })
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

  const catalogTotalPages = Math.ceil(
    filteredCatalogProducts.length / itemsPerPage,
  );
  const catalogStartIndex = (catalogCurrentPage - 1) * itemsPerPage;
  const catalogEndIndex = catalogStartIndex + itemsPerPage;
  const paginatedCatalogProducts = filteredCatalogProducts.slice(
    catalogStartIndex,
    catalogEndIndex,
  );

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

  const handleDeleteCatalogProduct = (id: number) => {
    setDeletingCatalogProductId(id);
    setShowCatalogDeleteConfirm(true);
  };

  const confirmDeleteCatalogProduct = async () => {
    if (deletingCatalogProductId === null) return;

    try {
      const response = await fetch(
        `/api/san-pham-catalog/delete?id=${deletingCatalogProductId}`,
        {
          method: "DELETE",
        },
      );
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
    } finally {
      setShowCatalogDeleteConfirm(false);
      setDeletingCatalogProductId(null);
    }
  };

  const handleAddCatalogProduct = async () => {
    if (!newCatalogProduct.code) {
      toast.error("Vui lòng điền Mã SP");
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
          code: "",
          printPattern: "",
          size: "",
          color: "",
          name: "",
          image: "",
          wholesalePrice: 0,
          retailPrice: 0,
          sizeChart: "",
          tonKho: 0,
        });
        setMaSPSearch("");
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
  const catalogTotalValue = catalogProducts.reduce(
    (sum, p) => sum + (p.retailPrice || 0),
    0,
  );

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
          <p className="text-gray-500 mt-1">
            Quản lý danh mục và phát triển sản phẩm
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      {/* <div className="border-b border-gray-200">
        <nav className="flex gap-4">
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
        </nav>
      </div> */}

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
                  <p className="text-2xl font-bold text-gray-900">
                    {totalProducts}
                  </p>
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
                  <p className="text-2xl font-bold text-blue-600">
                    {inProductionCount}
                  </p>
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
                  <p className="text-2xl font-bold text-green-600">
                    {completedCount}
                  </p>
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
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Tìm kiếm mã SP, tên, xưởng SX, trạng thái..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="relative">
                    <ArrowUpDown
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
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
                  <span className="ml-2 text-gray-500">
                    Đang tải dữ liệu...
                  </span>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            STT
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Mã SP
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">
                            Tên sản phẩm
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Size
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Vải chính
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Tình trạng SX
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Xưởng SX
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedProducts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-3 py-8 text-center text-gray-500"
                            >
                              {searchTerm
                                ? "Không tìm thấy sản phẩm phù hợp"
                                : "Chưa có dữ liệu sản phẩm"}
                            </td>
                          </tr>
                        ) : (
                          paginatedProducts.map((product, index) => (
                            <tr
                              key={product.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleViewProduct(product)}
                            >
                              <td className="px-3 py-3 text-sm text-gray-500">
                                {startIndex + index + 1}
                              </td>
                              <td className="px-3 py-3">
                                <span className="text-sm font-medium text-purple-600">
                                  {product.code || "-"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-900">
                                {product.name || "-"}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {product.size || "-"}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {product.mainFabric || "-"}
                              </td>
                              <td className="px-3 py-3">
                                {product.productionStage ? (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.productionStage)}`}
                                  >
                                    {product.productionStage}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {product.workshop || "-"}
                              </td>
                              <td
                                className="px-3 py-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                    title="Sửa"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteProduct(product.id)
                                    }
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
                      Hiển thị{" "}
                      {filteredProducts.length > 0 ? startIndex + 1 : 0}-
                      {Math.min(endIndex, filteredProducts.length)} /{" "}
                      {filteredProducts.length} sản phẩm
                      {searchTerm && ` (lọc từ ${products.length} sản phẩm)`}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                          ).map((page) => {
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1)
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
                              return (
                                <span key={page} className="px-1 text-gray-400">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
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
                  <p className="text-2xl font-bold text-gray-900">
                    {catalogTotalProducts}
                  </p>
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
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(catalogTotalValue)}
                  </p>
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
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Tìm theo Mã SP, Hình in, Size, Màu sắc..."
                      value={catalogSearchTerm}
                      onChange={(e) =>
                        handleCatalogSearchChange(e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="relative">
                    <ArrowUpDown
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
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
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus size={20} />
                  Thêm sản phẩm
                </button>
              </div>

              {/* Loading state */}
              {catalogLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">
                    Đang tải dữ liệu...
                  </span>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            STT
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Hình ảnh
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Mã SP
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Hình in
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Size
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Màu sắc
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">
                            Mã SP đầy đủ
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Giá sỉ
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Giá lẻ
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Dòng size
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Tồn kho
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedCatalogProducts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={11}
                              className="px-3 py-8 text-center text-gray-500"
                            >
                              {catalogSearchTerm
                                ? "Không tìm thấy sản phẩm phù hợp"
                                : "Chưa có dữ liệu sản phẩm"}
                            </td>
                          </tr>
                        ) : (
                          paginatedCatalogProducts.map((product, index) => (
                            <tr
                              key={product.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleViewCatalogProduct(product)}
                            >
                              <td className="px-3 py-3 text-sm text-gray-500">
                                {catalogStartIndex + index + 1}
                              </td>
                              <td className="px-3 py-3">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                    <ImageIcon
                                      size={16}
                                      className="text-gray-400"
                                    />
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-3 text-sm font-medium text-blue-600">
                                {product.code || "-"}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {product.printPattern || "-"}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {product.size || "-"}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {product.color || "-"}
                              </td>
                              <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                {product.name || "-"}
                              </td>
                              <td className="px-3 py-3 text-sm text-right text-gray-600">
                                {formatPrice(product.wholesalePrice)}
                              </td>
                              <td className="px-3 py-3 text-sm text-right font-medium text-green-600">
                                {formatPrice(product.retailPrice)}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {product.sizeChart || "-"}
                              </td>
                              <td
                                className={`px-3 py-3 text-sm text-right font-medium ${product.tonKho > 0 ? "text-gray-900" : "text-gray-400"}`}
                              >
                                {product.tonKho
                                  ? product.tonKho.toLocaleString("vi-VN")
                                  : "0"}
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
                      Hiển thị{" "}
                      {filteredCatalogProducts.length > 0
                        ? catalogStartIndex + 1
                        : 0}
                      -
                      {Math.min(
                        catalogEndIndex,
                        filteredCatalogProducts.length,
                      )}{" "}
                      / {filteredCatalogProducts.length} sản phẩm
                      {catalogSearchTerm &&
                        ` (lọc từ ${catalogProducts.length} sản phẩm)`}
                    </div>

                    {catalogTotalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCatalogCurrentPage((prev) =>
                              Math.max(prev - 1, 1),
                            )
                          }
                          disabled={catalogCurrentPage === 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: catalogTotalPages },
                            (_, i) => i + 1,
                          ).map((page) => {
                            if (
                              page === 1 ||
                              page === catalogTotalPages ||
                              (page >= catalogCurrentPage - 1 &&
                                page <= catalogCurrentPage + 1)
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
                              return (
                                <span key={page} className="px-1 text-gray-400">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() =>
                            setCatalogCurrentPage((prev) =>
                              Math.min(prev + 1, catalogTotalPages),
                            )
                          }
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
            onClick={closeAddModal}
          />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm sản phẩm mới
                </h3>
                <p className="text-sm text-gray-500">Phát triển sản phẩm</p>
              </div>
              <button
                onClick={closeAddModal}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã SP *
                    </label>
                    <input
                      type="text"
                      value={newProduct.code || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      onBlur={(e) => fetchProductInfoByCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: RM001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <select
                      value={newProduct.size || ""}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, size: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Chọn size --</option>
                      {sizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name || ""}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vải chính
                    </label>
                    <input
                      type="text"
                      value={newProduct.mainFabric || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          mainFabric: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: Jeans cotton"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vải phối
                    </label>
                    <input
                      type="text"
                      value={newProduct.accentFabric || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          accentFabric: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: Thun"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phụ liệu khác
                  </label>
                  <input
                    type="text"
                    value={newProduct.otherMaterials || ""}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        otherMaterials: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="VD: Khóa, nút, chỉ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lệnh SX
                    </label>
                    <input
                      type="text"
                      value={newProduct.productionOrder || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          productionOrder: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: LSX001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xưởng SX
                    </label>
                    <input
                      type="text"
                      value={newProduct.workshop || ""}
                      readOnly
                      placeholder="Tự động điền theo mã SP"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tự động lấy từ bảng &quot;Đơn giá gia công&quot;
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Định mức nguyên vật liệu
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM Vải chính
                      </label>
                      <input
                        type="text"
                        value={newProduct.mainFabricQuota || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            mainFabricQuota: e.target.value,
                          })
                        }
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 1.5m"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM Vải phối 1
                      </label>
                      <input
                        type="text"
                        value={newProduct.accentFabricQuota1 || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            accentFabricQuota1: e.target.value,
                          })
                        }
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 0.5m"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM Vải phối 2
                      </label>
                      <input
                        type="text"
                        value={newProduct.accentFabricQuota2 || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            accentFabricQuota2: e.target.value,
                          })
                        }
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 0.3m"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM Phụ liệu 1
                      </label>
                      <input
                        type="text"
                        value={newProduct.materialsQuota1 || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            materialsQuota1: e.target.value,
                          })
                        }
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 2 nút"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM Phụ liệu 2
                      </label>
                      <input
                        type="text"
                        value={newProduct.materialsQuota2 || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            materialsQuota2: e.target.value,
                          })
                        }
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 1 khóa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM Phụ kiện
                      </label>
                      <input
                        type="text"
                        value={newProduct.accessoriesQuota || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            accessoriesQuota: e.target.value,
                          })
                        }
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 1 nhãn"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ĐM Khác
                    </label>
                    <input
                      type="text"
                      value={newProduct.otherQuota || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          otherQuota: e.target.value,
                        })
                      }
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                      placeholder="Nhập định mức khác"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Số lượng
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng kế hoạch
                      </label>
                      <input
                        type="number"
                        value={newProduct.plannedQuantity || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            plannedQuantity: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng cắt
                      </label>
                      <input
                        type="number"
                        value={newProduct.cutQuantity || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            cutQuantity: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-100 cursor-not-allowed"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng nhập kho
                    </label>
                    <input
                      type="number"
                      value={newProduct.warehouseQuantity || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          warehouseQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Công đoạn
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Công đoạn phát triển
                      </label>
                      <input
                        type="text"
                        value={newProduct.developmentStage || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            developmentStage: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập công đoạn"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Công đoạn sản xuất
                      </label>
                      <select
                        value={newProduct.productionStage || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            productionStage: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Chọn công đoạn --</option>
                        {productionStageOptions.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hình ảnh
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProduct.image || ""}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, image: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Nhập URL hình ảnh"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePickerTarget("newProduct");
                        setShowImagePicker(true);
                      }}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm font-medium whitespace-nowrap"
                    >
                      <ImageIcon size={16} />
                      Chọn ảnh
                    </button>
                  </div>
                  {newProduct.image && (
                    <div className="mt-2">
                      <img
                        src={newProduct.image}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={closeAddModal}
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
            onClick={closeViewModal}
          />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <div>
                <p className="text-purple-100 text-sm">Chi tiết sản phẩm</p>
                <h3 className="text-xl font-bold text-white">
                  {selectedProduct.code || selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Thông tin cơ bản
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mã SP:</span>
                      <span className="font-medium text-purple-600">
                        {selectedProduct.code || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tên SP:</span>
                      <span className="font-medium">
                        {selectedProduct.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">
                        {selectedProduct.size || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-900 mb-3">
                    Nguyên vật liệu
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vải chính:</span>
                      <span className="font-medium">
                        {selectedProduct.mainFabric || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vải phối:</span>
                      <span className="font-medium">
                        {selectedProduct.accentFabric || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phụ liệu khác:</span>
                      <span className="font-medium">
                        {selectedProduct.otherMaterials || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">
                    Thông tin sản xuất
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lệnh SX:</span>
                      <span className="font-medium">
                        {selectedProduct.productionOrder || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Xưởng SX:</span>
                      <span className="font-medium">
                        {selectedProduct.workshop || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Công đoạn phát triển:
                      </span>
                      <span className="font-medium">
                        {selectedProduct.developmentStage || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Công đoạn sản xuất:</span>
                      <span className="font-medium">
                        {selectedProduct.productionStage || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={closeViewModal}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedProduct(null);
                    handleEditProduct(selectedProduct);
                  }}
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
            onClick={closeEditModal}
          />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chỉnh sửa sản phẩm
                </h3>
                <p className="text-sm text-gray-500">Mã: {editProduct.code}</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã SP
                    </label>
                    <input
                      type="text"
                      value={editProduct.code}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <select
                      value={editProduct.size}
                      onChange={(e) =>
                        setEditProduct({ ...editProduct, size: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Chọn size --</option>
                      {sizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vải chính
                    </label>
                    <input
                      type="text"
                      value={editProduct.mainFabric}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          mainFabric: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vải phối
                    </label>
                    <input
                      type="text"
                      value={editProduct.accentFabric}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          accentFabric: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phụ liệu khác
                  </label>
                  <input
                    type="text"
                    value={editProduct.otherMaterials}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        otherMaterials: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lệnh SX
                    </label>
                    <input
                      type="text"
                      value={editProduct.productionOrder}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          productionOrder: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xưởng SX
                    </label>
                    <input
                      type="text"
                      value={editProduct.workshop}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          workshop: e.target.value,
                        })
                      }
                      placeholder="VD: Xưởng may 365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Công đoạn phát triển
                    </label>
                    <input
                      type="text"
                      value={editProduct.developmentStage}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          developmentStage: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Công đoạn sản xuất
                    </label>
                    <select
                      value={editProduct.productionStage}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          productionStage: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Chọn công đoạn --</option>
                      {productionStageOptions.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={closeEditModal}
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Thêm sản phẩm mới
                </h3>
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      STT{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        (tự tăng)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={catalogProducts.length + 1}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã SP đầy đủ{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        (tự ghép)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={newCatalogProduct.name || ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-700"
                      placeholder="Sẽ tự sinh khi điền các trường dưới..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative" ref={maSPDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã SP <span className="text-red-500">*</span>{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        ({maSPList.length} mã)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={newCatalogProduct.code || maSPSearch}
                      onChange={(e) => {
                        const typed = e.target.value;
                        const norm = typed.toLowerCase().replace(/\s+/g, "");
                        setMaSPSearch(typed);
                        setShowMaSPDropdown(true);

                        const exact = maSPList.find(
                          (m) =>
                            m.code.toLowerCase().replace(/\s+/g, "") === norm,
                        );
                        console.log(
                          "[Mã SP onChange] typed:",
                          typed,
                          "norm:",
                          norm,
                          "exact:",
                          exact,
                          "list size:",
                          maSPList.length,
                        );
                        if (exact) {
                          setNewCatalogProduct((prev) => ({
                            ...prev,
                            code: exact.code,
                            wholesalePrice: exact.wholesalePrice,
                            retailPrice: exact.retailPrice,
                            image: exact.image,
                            sizeChart: exact.sizeChart,
                            tonKho: exact.tonKho || 0,
                          }));
                          setMaSPSearch("");
                        } else {
                          setNewCatalogProduct((prev) => ({
                            ...prev,
                            code: "",
                            wholesalePrice: 0,
                            retailPrice: 0,
                            image: "",
                            sizeChart: "",
                            tonKho: 0,
                          }));
                        }
                      }}
                      onBlur={() => {
                        // Khi rời input, thử match lại lần nữa (delay để dropdown click có cơ hội fire trước)
                        setTimeout(() => {
                          const typed = (
                            newCatalogProduct.code || maSPSearch
                          ).toString();
                          if (!typed.trim() || newCatalogProduct.code) return;
                          const norm = typed.toLowerCase().replace(/\s+/g, "");
                          const exact = maSPList.find(
                            (m) =>
                              m.code.toLowerCase().replace(/\s+/g, "") === norm,
                          );
                          console.log(
                            "[Mã SP onBlur] typed:",
                            typed,
                            "found:",
                            exact?.code,
                            "list size:",
                            maSPList.length,
                          );
                          if (exact) {
                            setNewCatalogProduct((prev) => ({
                              ...prev,
                              code: exact.code,
                              wholesalePrice: exact.wholesalePrice,
                              retailPrice: exact.retailPrice,
                              image: exact.image,
                              sizeChart: exact.sizeChart,
                              tonKho: exact.tonKho || 0,
                            }));
                            setMaSPSearch("");
                          }
                        }, 200);
                      }}
                      onFocus={() => setShowMaSPDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Tìm/chọn Mã SP..."
                    />
                    {showMaSPDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {maSPList.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Đang tải hoặc không có dữ liệu...
                          </div>
                        ) : (
                          maSPList
                            .filter((m) => {
                              const q = (
                                maSPSearch ||
                                newCatalogProduct.code ||
                                ""
                              )
                                .toLowerCase()
                                .trim();
                              if (!q) return true;
                              return (
                                m.code.toLowerCase().includes(q) ||
                                m.name.toLowerCase().includes(q)
                              );
                            })
                            .slice(0, 80)
                            .map((m) => (
                              <div
                                key={m.code}
                                onClick={() => {
                                  setNewCatalogProduct({
                                    ...newCatalogProduct,
                                    code: m.code,
                                    wholesalePrice: m.wholesalePrice,
                                    retailPrice: m.retailPrice,
                                    image: m.image,
                                    sizeChart: m.sizeChart,
                                    tonKho: m.tonKho || 0,
                                  });
                                  setMaSPSearch("");
                                  setShowMaSPDropdown(false);
                                }}
                                className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-0"
                              >
                                <div className="font-medium text-sm text-purple-700">
                                  {m.code}
                                </div>
                                {m.name && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {m.name}
                                  </div>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    )}
                    {newCatalogProduct.code ? (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Đã chọn: <b>{newCatalogProduct.code}</b>
                      </div>
                    ) : maSPSearch.trim() ? (
                      <div className="text-xs text-orange-600 mt-1">
                        Chưa chọn mã — click vào item trong dropdown phía trên
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hình in
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newCatalogProduct.printPattern || ""}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        setNewCatalogProduct({
                          ...newCatalogProduct,
                          printPattern: digitsOnly,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: 676"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        ({sizeOptions.length} lựa chọn)
                      </span>
                    </label>
                    <select
                      value={newCatalogProduct.size || ""}
                      onChange={(e) =>
                        setNewCatalogProduct({
                          ...newCatalogProduct,
                          size: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="">-- Chọn size --</option>
                      {sizeOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Màu sắc{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        ({colorOptions.length} lựa chọn)
                      </span>
                    </label>
                    <select
                      value={newCatalogProduct.color || ""}
                      onChange={(e) =>
                        setNewCatalogProduct({
                          ...newCatalogProduct,
                          color: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="">-- Chọn màu --</option>
                      {colorOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hình ảnh{" "}
                    <span className="text-xs text-gray-500 font-normal">
                      (tự lấy theo Mã SP)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newCatalogProduct.image || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-600"
                    placeholder="Chọn Mã SP để tự điền..."
                  />
                  {newCatalogProduct.image && (
                    <div className="mt-2">
                      <img
                        src={newCatalogProduct.image}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá sỉ{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        (tự lấy theo Mã SP)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={
                        newCatalogProduct.wholesalePrice
                          ? newCatalogProduct.wholesalePrice.toLocaleString(
                              "vi-VN",
                            )
                          : ""
                      }
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-700"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá lẻ{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        (tự lấy theo Mã SP)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={
                        newCatalogProduct.retailPrice
                          ? newCatalogProduct.retailPrice.toLocaleString(
                              "vi-VN",
                            )
                          : ""
                      }
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-700"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dòng size{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        (tự lấy theo Mã SP)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={newCatalogProduct.sizeChart || ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-700"
                      placeholder="Chọn Mã SP để tự điền..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tồn kho{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        (lấy từ sheet Tồn kho SP)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={(newCatalogProduct.tonKho ?? 0).toLocaleString(
                        "vi-VN",
                      )}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-700"
                      placeholder="0"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 italic pt-2">
                  Cột "Mã SP đầy đủ" do công thức trên Google Sheet tự sinh,
                  không cần điền.
                </p>
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
                  {catalogSaving && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
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
            onClick={() => {
              setShowCatalogViewModal(false);
              setSelectedCatalogProduct(null);
            }}
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
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div>
                  <p className="text-purple-100 text-sm">Chi tiết sản phẩm</p>
                  <h3 className="text-xl font-bold text-white">
                    {selectedCatalogProduct.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCatalogViewModal(false);
                  setSelectedCatalogProduct(null);
                }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Thông tin cơ bản
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mã SP:</span>
                      <span className="font-medium">
                        {selectedCatalogProduct.code || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hình in:</span>
                      <span className="font-medium">
                        {selectedCatalogProduct.printPattern || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">
                        {selectedCatalogProduct.size || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Màu sắc:</span>
                      <span className="font-medium">
                        {selectedCatalogProduct.color || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dòng size:</span>
                      <span className="font-medium">
                        {selectedCatalogProduct.sizeChart || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tồn kho:</span>
                      <span className="font-medium">
                        {selectedCatalogProduct.tonKho?.toLocaleString(
                          "vi-VN",
                        ) ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Giá cả */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-3">
                    Giá cả
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 mb-1">Giá sỉ</p>
                      <p className="font-bold text-blue-600 text-lg">
                        {formatPrice(selectedCatalogProduct.wholesalePrice)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 mb-1">Giá lẻ</p>
                      <p className="font-bold text-green-600 text-lg">
                        {formatPrice(selectedCatalogProduct.retailPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCatalogViewModal(false);
                    setSelectedCatalogProduct(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleDeleteCatalogProduct(selectedCatalogProduct.id);
                    setShowCatalogViewModal(false);
                    setSelectedCatalogProduct(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Xóa sản phẩm
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
            onClick={() => {
              setShowCatalogEditModal(false);
              setEditCatalogProduct(null);
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-[60] flex flex-col border-l border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chỉnh sửa sản phẩm
                </h3>
                <p className="text-sm text-gray-500">
                  {editCatalogProduct.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCatalogEditModal(false);
                  setEditCatalogProduct(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Thông tin cơ bản
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên sản phẩm *
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.name}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bảng size
                        </label>
                        <input
                          type="text"
                          value={editCatalogProduct.sizeChart}
                          onChange={(e) =>
                            setEditCatalogProduct({
                              ...editCatalogProduct,
                              sizeChart: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Màu sắc
                        </label>
                        <input
                          type="text"
                          value={editCatalogProduct.color}
                          onChange={(e) =>
                            setEditCatalogProduct({
                              ...editCatalogProduct,
                              color: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link hình ảnh
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editCatalogProduct.image}
                          onChange={(e) =>
                            setEditCatalogProduct({
                              ...editCatalogProduct,
                              image: e.target.value,
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePickerTarget("editCatalog");
                            setShowImagePicker(true);
                          }}
                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm font-medium whitespace-nowrap"
                        >
                          <ImageIcon size={16} />
                          Chọn ảnh
                        </button>
                      </div>
                      {editCatalogProduct.image && (
                        <div className="mt-2">
                          <img
                            src={editCatalogProduct.image}
                            alt="Preview"
                            className="h-20 w-20 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Giá cả */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Giá cả
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá bán lẻ
                      </label>
                      <input
                        type="number"
                        value={editCatalogProduct.retailPrice}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            retailPrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá bán sỉ
                      </label>
                      <input
                        type="number"
                        value={editCatalogProduct.wholesalePrice}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            wholesalePrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá vốn
                      </label>
                      <input
                        type="number"
                        value={editCatalogProduct.costPrice}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            costPrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Nguyên vật liệu */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Nguyên vật liệu
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vải chính
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.mainFabric}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            mainFabric: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vải phối
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.accentFabric}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            accentFabric: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phụ liệu khác
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.otherMaterials}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            otherMaterials: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Định mức */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Định mức
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM vải chính
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.mainFabricQuota}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            mainFabricQuota: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM vải phối
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.accentFabricQuota}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            accentFabricQuota: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM phụ liệu
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.materialsQuota}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            materialsQuota: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM phụ kiện
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.accessoriesQuota}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            accessoriesQuota: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ĐM khác
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.otherQuota}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            otherQuota: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Số lượng */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Số lượng
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SL kế hoạch
                      </label>
                      <input
                        type="number"
                        value={editCatalogProduct.plannedQuantity}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            plannedQuantity: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SL cắt
                      </label>
                      <input
                        type="number"
                        value={editCatalogProduct.cutQuantity}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            cutQuantity: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SL nhập kho
                      </label>
                      <input
                        type="number"
                        value={editCatalogProduct.warehouseQuantity}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            warehouseQuantity: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Trạng thái */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Trạng thái
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CĐ Final
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.finalStatus}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            finalStatus: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CĐ đồng bộ NPL
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.nplSyncStatus}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            nplSyncStatus: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CĐ sản xuất
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.productionStatus}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            productionStatus: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nhập kho
                      </label>
                      <input
                        type="text"
                        value={editCatalogProduct.warehouseEntry}
                        onChange={(e) =>
                          setEditCatalogProduct({
                            ...editCatalogProduct,
                            warehouseEntry: e.target.value,
                          })
                        }
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
                  onClick={() => {
                    setShowCatalogEditModal(false);
                    setEditCatalogProduct(null);
                  }}
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
                  {catalogSaving && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
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
                <h2 className="text-xl font-semibold text-gray-900">
                  Điều chỉnh giá vốn
                </h2>
                <p className="text-sm text-gray-500">
                  Cập nhật và điều chỉnh giá vốn sản phẩm
                </p>
              </div>
            </div>

            {/* Coming soon placeholder */}
            <div className="text-center py-16">
              <DollarSign className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Đang phát triển
              </h3>
              <p className="text-gray-500">
                Tính năng điều chỉnh giá vốn đang được xây dựng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingProductId(null);
        }}
        onConfirm={confirmDeleteProduct}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa sản phẩm này?"
        confirmText="Xóa"
        type="danger"
      />

      {/* Delete Catalog Product Confirmation Modal */}
      <ConfirmModal
        isOpen={showCatalogDeleteConfirm}
        onClose={() => {
          setShowCatalogDeleteConfirm(false);
          setDeletingCatalogProductId(null);
        }}
        onConfirm={confirmDeleteCatalogProduct}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa sản phẩm này?"
        confirmText="Xóa"
        type="danger"
      />

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(url) => {
          if (imagePickerTarget === "newProduct") {
            setNewProduct({ ...newProduct, image: url });
          } else if (imagePickerTarget === "editProduct" && editProduct) {
            setEditProduct({ ...editProduct, image: url });
          } else if (imagePickerTarget === "newCatalog") {
            setNewCatalogProduct({ ...newCatalogProduct, image: url });
          } else if (
            imagePickerTarget === "editCatalog" &&
            editCatalogProduct
          ) {
            setEditCatalogProduct({ ...editCatalogProduct, image: url });
          }
        }}
        currentImage={
          imagePickerTarget === "newProduct"
            ? newProduct.image
            : imagePickerTarget === "editProduct"
              ? editProduct?.image
              : imagePickerTarget === "newCatalog"
                ? newCatalogProduct.image
                : editCatalogProduct?.image
        }
      />
    </div>
  );
}
