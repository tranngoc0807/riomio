"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Package, Loader2, AlertCircle, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, Search, ChevronDown, FileDown, FileSpreadsheet } from "lucide-react";
import { TonKhoSP, TonDauSP, XuatKhoSP, Customer, SanPhamCatalog, TonKhoItem, NhapKhoSP } from "@/lib/googleSheets";
import DatePicker from "@/components/DatePicker";
import Portal from "@/components/Portal";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";

type TabType = "ton-kho" | "ton-dau" | "xuat-kho" | "nhap-kho";
const VALID_TABS: TabType[] = ["ton-kho", "ton-dau", "xuat-kho", "nhap-kho"];

interface ProductLine {
  maSP: string;
  soLuong: number;
  tonKho: number;
}

interface NhapKhoProductLine {
  maSP: string;
  soLuong: number;
  ghiChu: string;
  tonCuoi: number;
}

export default function QuanLyKhoTab() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tonKhoList, setTonKhoList] = useState<TonKhoSP[]>([]);
  const [tonDauList, setTonDauList] = useState<TonDauSP[]>([]);
  const [xuatKhoList, setXuatKhoList] = useState<XuatKhoSP[]>([]);
  const [nhapKhoList, setNhapKhoList] = useState<NhapKhoSP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data for dropdowns
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<SanPhamCatalog[]>([]);
  const [tonKhoSPList, setTonKhoSPList] = useState<TonKhoItem[]>([]); // Tồn kho từ sheet "Tồn kho SP"

  // Tab state - read from URL params, default to "ton-kho"
  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam as TabType)) {
      return tabParam as TabType;
    }
    return "ton-kho";
  };
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Pagination
  const [currentPageBang1, setCurrentPageBang1] = useState(1);
  const [currentPageBang2, setCurrentPageBang2] = useState(1);
  const [currentPageXuatKho, setCurrentPageXuatKho] = useState(1);
  const [currentPageNhapKho, setCurrentPageNhapKho] = useState(1);
  const itemsPerPage = 100;

  // Date filters
  const currentDate = new Date();
  const [thangNam, setThangNam] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [denNgay, setDenNgay] = useState<string>(
    currentDate.toISOString().split('T')[0]
  );

  // Search for Xuất kho
  const [searchXuatKho, setSearchXuatKho] = useState("");

  // Search for Nhập kho
  const [searchNhapKho, setSearchNhapKho] = useState("");

  // Dropdown states for add form
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productDropdownIndex, setProductDropdownIndex] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  // Refs for dropdowns
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Modal states for Xuất kho
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedXuatKho, setSelectedXuatKho] = useState<XuatKhoSP | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal states for Nhập kho
  const [showAddNhapKhoModal, setShowAddNhapKhoModal] = useState(false);
  const [showEditNhapKhoModal, setShowEditNhapKhoModal] = useState(false);
  const [selectedNhapKho, setSelectedNhapKho] = useState<NhapKhoSP | null>(null);

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<"xuat-kho" | "nhap-kho" | null>(null);
  const [itemToDelete, setItemToDelete] = useState<XuatKhoSP | NhapKhoSP | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state for adding
  const [newPhieu, setNewPhieu] = useState({
    maPXK: "",
    ngayThang: currentDate.toISOString().split('T')[0],
    maDonHang: "",
    khachHang: "",
    userThucHien: "",
  });
  const [productLines, setProductLines] = useState<ProductLine[]>([{ maSP: "", soLuong: 1, tonKho: 0 }]);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    maPXK: "",
    ngayThang: "",
    maSP: "",
    soLuong: 0,
    maDonHang: "",
    khachHang: "",
    userThucHien: "",
  });

  // Form state for adding nhập kho
  const [newNhapKhoPhieu, setNewNhapKhoPhieu] = useState({
    maPNK: "",
    ngayNhap: currentDate.toISOString().split('T')[0],
  });
  const [nhapKhoProductLines, setNhapKhoProductLines] = useState<NhapKhoProductLine[]>([{ maSP: "", soLuong: 1, ghiChu: "", tonCuoi: 0 }]);

  // Form state for editing nhập kho
  const [editNhapKhoForm, setEditNhapKhoForm] = useState({
    maPNK: "",
    ngayNhap: "",
    maSP: "",
    soLuong: 0,
    ghiChu: "",
  });

  // Dropdown states for nhập kho add form
  const [nhapKhoProductDropdownIndex, setNhapKhoProductDropdownIndex] = useState<number | null>(null);
  const [nhapKhoProductSearch, setNhapKhoProductSearch] = useState("");
  const nhapKhoProductDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTonKho();
    fetchDropdownData();
    fetchNhapKho();
  }, []);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setCustomerDropdownOpen(false);
        setCustomerSearch("");
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setProductDropdownIndex(null);
        setProductSearch("");
      }
      if (nhapKhoProductDropdownRef.current && !nhapKhoProductDropdownRef.current.contains(event.target as Node)) {
        setNhapKhoProductDropdownIndex(null);
        setNhapKhoProductSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [customersRes, productsRes, tonKhoRes] = await Promise.all([
        fetch("/api/khach-hang"),
        fetch("/api/san-pham-catalog"),
        fetch("/api/ton-kho"), // Tồn kho từ sheet "Tồn kho SP"
      ]);

      const [customersData, productsData, tonKhoData] = await Promise.all([
        customersRes.json(),
        productsRes.json(),
        tonKhoRes.json(),
      ]);

      if (customersData.success) setCustomers(customersData.data);
      if (productsData.success) setProducts(productsData.data);
      if (tonKhoData.success) {
        console.log("fetchDropdownData - tonKhoData:", tonKhoData.data?.length, "items");
        console.log("fetchDropdownData - first 5:", tonKhoData.data?.slice(0, 5));
        setTonKhoSPList(tonKhoData.data);
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  // Generate next maPXK
  const generateNextMaPXK = (): string => {
    if (xuatKhoList.length === 0) return "PXK01";

    // Find the highest number in existing maPXK
    const numbers = xuatKhoList
      .map(item => {
        const match = item.maPXK.match(/PXK(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `PXK${String(maxNum + 1).padStart(2, '0')}`;
  };

  // Generate next maPNK
  const generateNextMaPNK = (): string => {
    if (nhapKhoList.length === 0) return "PNK01";

    // Find the highest number in existing maPNK
    const numbers = nhapKhoList
      .map(item => {
        const match = item.maPNK.match(/PNK(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `PNK${String(maxNum + 1).padStart(2, '0')}`;
  };

  // Fetch nhập kho data
  const fetchNhapKho = async () => {
    try {
      const response = await fetch("/api/nhap-kho-sp");
      const result = await response.json();

      if (result.success) {
        // Sắp xếp theo ngày nhập mới nhất lên trước
        const parseDate = (d: string) => {
          if (!d) return 0;
          if (d.includes('/')) {
            const [dd, mm, yyyy] = d.split('/');
            return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0;
          }
          return new Date(d).getTime() || 0;
        };
        setNhapKhoList([...result.data].sort((a: NhapKhoSP, b: NhapKhoSP) => parseDate(b.ngayNhap) - parseDate(a.ngayNhap)));
      } else {
        console.error("Error fetching nhập kho:", result.error);
      }
    } catch (err) {
      console.error("Error fetching nhập kho:", err);
    }
  };

  // Get tonKho by maSP - lấy từ sheet "Tồn kho SP" (TonKhoItem.maSp và TonKhoItem.tonCuoi)
  const getTonKhoByMaSP = (maSP: string): number => {
    const searchKey = maSP.trim().toLowerCase();
    console.log("getTonKhoByMaSP - Looking for:", searchKey);
    console.log("getTonKhoByMaSP - tonKhoSPList length:", tonKhoSPList.length);
    console.log("getTonKhoByMaSP - first 5 items:", tonKhoSPList.slice(0, 5).map(i => ({ maSp: i.maSp, tonCuoi: i.tonCuoi })));

    const tonKhoItem = tonKhoSPList.find(item => item.maSp.trim().toLowerCase() === searchKey);
    console.log("getTonKhoByMaSP - Found item:", tonKhoItem);

    return tonKhoItem ? tonKhoItem.tonCuoi : 0;
  };

  // Filter functions for dropdowns
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Products filter - using `name` field which is "Mã SP đầy đủ" (e.g., "RAD1337 Đỏ BB")
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const fetchTonKho = async (updateFilters: boolean = false, tabType?: "ton-kho" | "ton-dau" | "xuat-kho") => {
    setIsLoading(true);
    setError(null);

    try {
      let response;

      if (updateFilters && tabType !== "xuat-kho") {
        const body: any = {};
        if (tabType === "ton-kho") {
          body.thangNam = thangNam;
        } else if (tabType === "ton-dau") {
          body.denNgay = denNgay;
        }

        response = await fetch("/api/ton-kho-sp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        response = await fetch("/api/ton-kho-sp");
      }

      const result = await response.json();

      if (result.success) {
        setTonKhoList(result.data.tonKho);
        setTonDauList(result.data.tonDau);
        // Sắp xếp theo ngày mới nhất lên trước
        const parseDateXK = (d: string) => {
          if (!d) return 0;
          if (d.includes('/')) {
            const [dd, mm, yyyy] = d.split('/');
            return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0;
          }
          return new Date(d).getTime() || 0;
        };
        setXuatKhoList([...(result.data.xuatKho || [])].sort((a: XuatKhoSP, b: XuatKhoSP) => parseDateXK(b.ngayThang) - parseDateXK(a.ngayThang)));
      } else {
        setError(result.error || "Không thể tải dữ liệu tồn kho");
      }
    } catch (err: any) {
      console.error("Error fetching ton kho:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter xuất kho by search
  const filteredXuatKho = xuatKhoList.filter((item) =>
    item.maPXK.toLowerCase().includes(searchXuatKho.toLowerCase()) ||
    item.maSP.toLowerCase().includes(searchXuatKho.toLowerCase()) ||
    item.maDonHang.toLowerCase().includes(searchXuatKho.toLowerCase()) ||
    item.khachHang.toLowerCase().includes(searchXuatKho.toLowerCase())
  );

  // Filter nhập kho by search
  const filteredNhapKho = nhapKhoList.filter((item) =>
    item.maPNK.toLowerCase().includes(searchNhapKho.toLowerCase()) ||
    item.maSP.toLowerCase().includes(searchNhapKho.toLowerCase()) ||
    item.ghiChu.toLowerCase().includes(searchNhapKho.toLowerCase())
  );

  // Pagination calculations
  const totalPagesBang1 = Math.ceil(tonKhoList.length / itemsPerPage);
  const startIndexBang1 = (currentPageBang1 - 1) * itemsPerPage;
  const endIndexBang1 = startIndexBang1 + itemsPerPage;
  const currentItemsBang1 = tonKhoList.slice(startIndexBang1, endIndexBang1);

  const totalPagesBang2 = Math.ceil(tonDauList.length / itemsPerPage);
  const startIndexBang2 = (currentPageBang2 - 1) * itemsPerPage;
  const endIndexBang2 = startIndexBang2 + itemsPerPage;
  const currentItemsBang2 = tonDauList.slice(startIndexBang2, endIndexBang2);

  const totalPagesXuatKho = Math.ceil(filteredXuatKho.length / itemsPerPage);
  const startIndexXuatKho = (currentPageXuatKho - 1) * itemsPerPage;
  const endIndexXuatKho = startIndexXuatKho + itemsPerPage;
  const currentItemsXuatKho = filteredXuatKho.slice(startIndexXuatKho, endIndexXuatKho);

  const totalPagesNhapKho = Math.ceil(filteredNhapKho.length / itemsPerPage);
  const startIndexNhapKho = (currentPageNhapKho - 1) * itemsPerPage;
  const endIndexNhapKho = startIndexNhapKho + itemsPerPage;
  const currentItemsNhapKho = filteredNhapKho.slice(startIndexNhapKho, endIndexNhapKho);

  // Export tồn kho PDF
  const handleExportTonKhoPDF = () => {
    if (tonKhoList.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = tonKhoList.map((item, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.code}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(item.nhapDauKy)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(item.nhapTrongKy)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(item.xuatTrongKy)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;font-weight:600;${item.tonCuoiKy < 0 ? "color:red;" : ""}">${fmt(item.tonCuoiKy)}</td>
    </tr>`).join("");
    const title = `Tồn kho hàng hóa - ${thangNam}`;
    printWindow.document.write(`<html><head><title>${title}</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:20px; text-align:center; } table { width:100%; border-collapse:collapse; font-size:12px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>${title.toUpperCase()}</h1>
      <table><thead><tr><th style="width:35px;">STT</th><th>Mã SP</th><th style="text-align:right;">Nhập đầu</th><th style="text-align:right;">Nhập trong kỳ</th><th style="text-align:right;">Xuất</th><th style="text-align:right;">Tồn cuối</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  // Export tồn kho Excel
  const handleExportTonKhoExcel = () => {
    if (tonKhoList.length === 0) return;
    const sheetData = tonKhoList.map((item, i) => ({
      "STT": i + 1, "Mã SP": item.code, "Nhập đầu": item.nhapDauKy,
      "Nhập trong kỳ": item.nhapTrongKy, "Xuất": item.xuatTrongKy, "Tồn cuối": item.tonCuoiKy,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ton kho");
    XLSX.writeFile(wb, `Ton_kho_hang_hoa_${thangNam}.xlsx`);
  };

  // Add product line
  const addProductLine = () => {
    setProductLines([...productLines, { maSP: "", soLuong: 1, tonKho: 0 }]);
  };

  // Remove product line
  const removeProductLine = (index: number) => {
    if (productLines.length > 1) {
      setProductLines(productLines.filter((_, i) => i !== index));
    }
  };

  // Update product line
  const updateProductLine = (index: number, field: keyof ProductLine, value: string | number) => {
    const updated = [...productLines];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-update tonKho when maSP changes
    if (field === "maSP") {
      updated[index].tonKho = getTonKhoByMaSP(value as string);
    }

    setProductLines(updated);
  };

  // Select product from dropdown (using "Mã SP đầy đủ" from Danh mục SP)
  const handleSelectProduct = (index: number, productFullCode: string) => {
    const updated = [...productLines];
    updated[index] = {
      ...updated[index],
      maSP: productFullCode,
      tonKho: getTonKhoByMaSP(productFullCode),
    };
    setProductLines(updated);
    setProductDropdownIndex(null);
    setProductSearch("");
  };

  // Handle add phieu xuat kho
  const handleAddPhieu = async () => {
    if (!newPhieu.maPXK) {
      toast.error("Vui lòng nhập mã PXK");
      return;
    }
    if (productLines.some(p => !p.maSP)) {
      toast.error("Vui lòng nhập đầy đủ mã sản phẩm");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/xuat-kho-sp/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPhieu,
          products: productLines,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Thêm phiếu xuất kho thành công");
        setShowAddModal(false);
        resetAddForm();
        fetchTonKho();
      } else {
        toast.error(result.error || "Không thể thêm phiếu xuất kho");
      }
    } catch (error) {
      console.error("Error adding phieu:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEditXuatKho = (item: XuatKhoSP) => {
    setSelectedXuatKho(item);
    setEditForm({
      maPXK: item.maPXK,
      ngayThang: item.ngayThang,
      maSP: item.maSP,
      soLuong: item.soLuong,
      maDonHang: item.maDonHang,
      khachHang: item.khachHang,
      userThucHien: item.userThucHien,
    });
    setShowEditModal(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedXuatKho) return;

    setSaving(true);
    try {
      const response = await fetch("/api/xuat-kho-sp/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedXuatKho.id,
          ...editForm,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật thành công");
        setShowEditModal(false);
        setSelectedXuatKho(null);
        fetchTonKho();
      } else {
        toast.error(result.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete - open confirmation modal
  const handleDeleteXuatKho = (item: XuatKhoSP) => {
    setItemToDelete(item);
    setDeleteType("xuat-kho");
    setShowDeleteModal(true);
  };

  // ===================== NHẬP KHO FUNCTIONS =====================

  // Add nhập kho product line
  const addNhapKhoProductLine = () => {
    setNhapKhoProductLines([...nhapKhoProductLines, { maSP: "", soLuong: 1, ghiChu: "", tonCuoi: 0 }]);
  };

  // Remove nhập kho product line
  const removeNhapKhoProductLine = (index: number) => {
    if (nhapKhoProductLines.length > 1) {
      setNhapKhoProductLines(nhapKhoProductLines.filter((_, i) => i !== index));
    }
  };

  // Update nhập kho product line
  const updateNhapKhoProductLine = (index: number, field: keyof NhapKhoProductLine, value: string | number) => {
    const updated = [...nhapKhoProductLines];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-update tonCuoi when maSP changes
    if (field === "maSP") {
      updated[index].tonCuoi = getTonKhoByMaSP(value as string);
    }

    setNhapKhoProductLines(updated);
  };

  // Select product for nhập kho
  const handleSelectNhapKhoProduct = (index: number, productFullCode: string) => {
    const updated = [...nhapKhoProductLines];
    updated[index] = {
      ...updated[index],
      maSP: productFullCode,
      tonCuoi: getTonKhoByMaSP(productFullCode),
    };
    setNhapKhoProductLines(updated);
    setNhapKhoProductDropdownIndex(null);
    setNhapKhoProductSearch("");
  };

  // Filter products for nhập kho dropdown
  const filteredNhapKhoProducts = products.filter(p =>
    p.name.toLowerCase().includes(nhapKhoProductSearch.toLowerCase())
  );

  // Handle add phiếu nhập kho
  const handleAddNhapKhoPhieu = async () => {
    if (!newNhapKhoPhieu.maPNK) {
      toast.error("Vui lòng nhập mã PNK");
      return;
    }
    if (nhapKhoProductLines.some(p => !p.maSP)) {
      toast.error("Vui lòng nhập đầy đủ mã sản phẩm");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/nhap-kho-sp/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newNhapKhoPhieu,
          products: nhapKhoProductLines,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Thêm phiếu nhập kho thành công");
        setShowAddNhapKhoModal(false);
        resetNhapKhoAddForm();
        fetchNhapKho();
      } else {
        toast.error(result.error || "Không thể thêm phiếu nhập kho");
      }
    } catch (error) {
      console.error("Error adding nhập kho:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit nhập kho
  const handleEditNhapKho = (item: NhapKhoSP) => {
    setSelectedNhapKho(item);
    setEditNhapKhoForm({
      maPNK: item.maPNK,
      ngayNhap: item.ngayNhap,
      maSP: item.maSP,
      soLuong: item.soLuong,
      ghiChu: item.ghiChu,
    });
    setShowEditNhapKhoModal(true);
  };

  // Handle save edit nhập kho
  const handleSaveEditNhapKho = async () => {
    if (!selectedNhapKho) return;

    setSaving(true);
    try {
      const response = await fetch("/api/nhap-kho-sp/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedNhapKho.id,
          ...editNhapKhoForm,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật thành công");
        setShowEditNhapKhoModal(false);
        setSelectedNhapKho(null);
        fetchNhapKho();
      } else {
        toast.error(result.error || "Không thể cập nhật");
      }
    } catch (error) {
      console.error("Error updating nhập kho:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete nhập kho - open confirmation modal
  const handleDeleteNhapKho = (item: NhapKhoSP) => {
    setItemToDelete(item);
    setDeleteType("nhap-kho");
    setShowDeleteModal(true);
  };

  // Confirm delete - actual deletion
  const confirmDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    // Debug logging
    console.log("=== DELETE DEBUG ===");
    console.log("deleteType:", deleteType);
    console.log("itemToDelete:", itemToDelete);
    console.log("itemToDelete.id (row number to delete):", itemToDelete.id);

    setDeleting(true);
    try {
      const endpoint = deleteType === "xuat-kho"
        ? `/api/xuat-kho-sp/delete?id=${itemToDelete.id}`
        : `/api/nhap-kho-sp/delete?id=${itemToDelete.id}`;

      console.log("DELETE endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Đã xóa thành công");
        if (deleteType === "xuat-kho") {
          fetchTonKho();
        } else {
          fetchNhapKho();
        }
        setShowDeleteModal(false);
        setItemToDelete(null);
        setDeleteType(null);
      } else {
        toast.error(result.error || "Không thể xóa");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleteType(null);
  };

  // Reset nhập kho add form
  const resetNhapKhoAddForm = () => {
    setNewNhapKhoPhieu({
      maPNK: generateNextMaPNK(),
      ngayNhap: currentDate.toISOString().split('T')[0],
    });
    setNhapKhoProductLines([{ maSP: "", soLuong: 1, ghiChu: "", tonCuoi: 0 }]);
  };

  // Open add nhập kho modal
  const openAddNhapKhoModal = () => {
    setNewNhapKhoPhieu({
      maPNK: generateNextMaPNK(),
      ngayNhap: currentDate.toISOString().split('T')[0],
    });
    setNhapKhoProductLines([{ maSP: "", soLuong: 1, ghiChu: "", tonCuoi: 0 }]);
    setShowAddNhapKhoModal(true);
  };

  // Reset add form
  const resetAddForm = () => {
    setNewPhieu({
      maPXK: generateNextMaPXK(),
      ngayThang: currentDate.toISOString().split('T')[0],
      maDonHang: "",
      khachHang: "",
      userThucHien: profile?.full_name || "",
    });
    setProductLines([{ maSP: "", soLuong: 1, tonKho: 0 }]);
  };

  // Open add modal with auto-filled data
  const openAddModal = () => {
    setNewPhieu({
      maPXK: generateNextMaPXK(),
      ngayThang: currentDate.toISOString().split('T')[0],
      maDonHang: "",
      khachHang: "",
      userThucHien: profile?.full_name || "",
    });
    setProductLines([{ maSP: "", soLuong: 1, tonKho: 0 }]);
    setShowAddModal(true);
  };

  const PaginationControls = ({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 7;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (currentPage <= 3) {
          pages.push(2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-center px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
            <ChevronLeft size={16} />Trước
          </button>
          {getPageNumbers().map((page, index) => {
            if (page === '...') return <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">...</span>;
            const pageNum = page as number;
            return (
              <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`px-3 py-1.5 rounded-lg border transition-colors ${pageNum === currentPage ? 'bg-blue-600 text-white border-blue-600 font-semibold' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                {pageNum}
              </button>
            );
          })}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
            Sau<ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-gray-600">Đang tải dữ liệu tồn kho...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
        <div>
          <h3 className="text-red-900 font-semibold mb-1">Lỗi</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => handleTabChange("ton-kho")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "ton-kho" ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"}`}
          >
            <Package size={18} />Tồn kho hàng hóa
          </button>
          <button
            onClick={() => handleTabChange("ton-dau")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "ton-dau" ? "text-green-600 border-green-600 bg-green-50/50" : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"}`}
          >
            <Package size={18} />Tồn đầu đến ngày
          </button>
          <button
            onClick={() => handleTabChange("xuat-kho")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "xuat-kho" ? "text-orange-600 border-orange-600 bg-orange-50/50" : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"}`}
          >
            <Package size={18} />Xuất kho SP
          </button>
          <button
            onClick={() => handleTabChange("nhap-kho")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "nhap-kho" ? "text-purple-600 border-purple-600 bg-purple-50/50" : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"}`}
          >
            <Package size={18} />Nhập kho SP
          </button>
        </div>
      </div>

      <div>
        {/* Bảng 1: Tồn kho theo tháng */}
        {activeTab === "ton-kho" && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">Tồn kho hàng hóa ({tonKhoList.length} sản phẩm)</h4>
                <div className="flex items-center gap-2">
                  <DatePicker value={thangNam} onChange={setThangNam} type="month" className="bg-white/20 text-white placeholder-white/70 border-none outline-none px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer min-w-45" />
                  <button onClick={() => fetchTonKho(true, "ton-kho")} className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">Xác nhận</button>
                  <button onClick={handleExportTonKhoPDF} className="flex items-center gap-1 bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"><FileDown size={14} /> PDF</button>
                  <button onClick={handleExportTonKhoExcel} className="flex items-center gap-1 bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"><FileSpreadsheet size={14} /> Excel</button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[150px]">Mã SP</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Nhập đầu</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Nhập trong kỳ</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Xuất</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tồn cuối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItemsBang1.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">Không có dữ liệu tồn kho</td></tr>
                  ) : (
                    currentItemsBang1.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 text-gray-600">{startIndexBang1 + index + 1}</td>
                        <td className="px-3 py-3 font-medium text-gray-900">{item.code}</td>
                        <td className="px-3 py-3 text-right text-gray-700">{item.nhapDauKy.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-gray-700">{item.nhapTrongKy.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-gray-700">{item.xuatTrongKy.toLocaleString()}</td>
                        <td className={`px-3 py-3 text-right ${item.tonCuoiKy < 0 ? "text-red-600 font-semibold" : item.tonCuoiKy === 0 ? "text-gray-500" : "text-gray-900"}`}>{item.tonCuoiKy.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={currentPageBang1} totalPages={totalPagesBang1} onPageChange={setCurrentPageBang1} />
          </div>
        )}

        {/* Bảng 2: Tồn đầu đến ngày */}
        {activeTab === "ton-dau" && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">Tồn đầu đến ngày ({tonDauList.length} sản phẩm)</h4>
                <div className="flex items-center gap-2">
                  <DatePicker value={denNgay} onChange={setDenNgay} type="date" className="bg-white/20 text-white placeholder-white/70 border-none outline-none px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer min-w-45" />
                  <button onClick={() => fetchTonKho(true, "ton-dau")} className="bg-white text-green-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors">Xác nhận</button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[150px]">Mã SP</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tồn đầu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItemsBang2.length === 0 ? (
                    <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-500">Không có dữ liệu tồn đầu</td></tr>
                  ) : (
                    currentItemsBang2.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 text-gray-600">{startIndexBang2 + index + 1}</td>
                        <td className="px-3 py-3 font-medium text-gray-900">{item.code}</td>
                        <td className="px-3 py-3 text-right text-gray-900">{item.tonDau.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={currentPageBang2} totalPages={totalPagesBang2} onPageChange={setCurrentPageBang2} />
          </div>
        )}

        {/* Bảng 3: Xuất kho SP */}
        {activeTab === "xuat-kho" && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">Bảng kê xuất kho SP ({filteredXuatKho.length} dòng)</h4>
                <button onClick={openAddModal} className="bg-white text-orange-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors flex items-center gap-2">
                  <Plus size={16} />Thêm phiếu xuất
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm theo mã PXK, mã SP, mã đơn hàng, khách hàng..."
                  value={searchXuatKho}
                  onChange={(e) => { setSearchXuatKho(e.target.value); setCurrentPageXuatKho(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã PXK</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày tháng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã SP</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Số lượng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã đơn hàng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Khách hàng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tồn kho</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItemsXuatKho.length === 0 ? (
                    <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-500">Không có dữ liệu xuất kho</td></tr>
                  ) : (
                    currentItemsXuatKho.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 text-gray-600">{startIndexXuatKho + index + 1}</td>
                        <td className="px-3 py-3 font-medium text-orange-600">{item.maPXK}</td>
                        <td className="px-3 py-3 text-gray-700">{item.ngayThang}</td>
                        <td className="px-3 py-3 font-medium text-gray-900">{item.maSP}</td>
                        <td className="px-3 py-3 text-right text-gray-700">{item.soLuong.toLocaleString()}</td>
                        <td className="px-3 py-3 text-gray-700">{item.maDonHang}</td>
                        <td className="px-3 py-3 text-gray-700">{item.khachHang}</td>
                        <td className="px-3 py-3 text-gray-700">{item.userThucHien}</td>
                        <td className={`px-3 py-3 text-right font-medium ${item.tonKho < 0 ? "text-red-600" : item.tonKho === 0 ? "text-gray-500" : "text-green-600"}`}>{item.tonKho.toLocaleString()}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEditXuatKho(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteXuatKho(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={currentPageXuatKho} totalPages={totalPagesXuatKho} onPageChange={setCurrentPageXuatKho} />
          </div>
        )}

        {/* Bảng 4: Nhập kho SP */}
        {activeTab === "nhap-kho" && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">Bảng kê nhập kho SP ({filteredNhapKho.length} dòng)</h4>
                <button onClick={openAddNhapKhoModal} className="bg-white text-purple-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors flex items-center gap-2">
                  <Plus size={16} />Thêm phiếu nhập
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm theo mã PNK, mã SP, ghi chú..."
                  value={searchNhapKho}
                  onChange={(e) => { setSearchNhapKho(e.target.value); setCurrentPageNhapKho(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã PNK</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày nhập</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã SP</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Số lượng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ghi chú</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tồn cuối</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItemsNhapKho.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-500">Không có dữ liệu nhập kho</td></tr>
                  ) : (
                    currentItemsNhapKho.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 text-gray-600">{startIndexNhapKho + index + 1}</td>
                        <td className="px-3 py-3 font-medium text-purple-600">{item.maPNK}</td>
                        <td className="px-3 py-3 text-gray-700">{item.ngayNhap}</td>
                        <td className="px-3 py-3 font-medium text-gray-900">{item.maSP}</td>
                        <td className="px-3 py-3 text-right text-gray-700">{item.soLuong.toLocaleString()}</td>
                        <td className="px-3 py-3 text-gray-700">{item.ghiChu}</td>
                        <td className={`px-3 py-3 text-right font-medium ${item.tonCuoi < 0 ? "text-red-600" : item.tonCuoi === 0 ? "text-gray-500" : "text-green-600"}`}>{item.tonCuoi.toLocaleString()}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEditNhapKho(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteNhapKho(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={currentPageNhapKho} totalPages={totalPagesNhapKho} onPageChange={setCurrentPageNhapKho} />
          </div>
        )}
      </div>

      {/* Modal thêm phiếu xuất kho */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowAddModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Thêm phiếu xuất kho</h3>
                <p className="text-orange-100 text-sm">Có thể thêm nhiều sản phẩm trong 1 phiếu</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã PXK * (tự động)</label>
                    <input type="text" value={newPhieu.maPXK} onChange={(e) => setNewPhieu({ ...newPhieu, maPXK: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
                    <input type="date" value={newPhieu.ngayThang} onChange={(e) => setNewPhieu({ ...newPhieu, ngayThang: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Mã đơn hàng - Text input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                    <input
                      type="text"
                      value={newPhieu.maDonHang}
                      onChange={(e) => setNewPhieu({ ...newPhieu, maDonHang: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Nhập mã đơn hàng..."
                    />
                  </div>

                  {/* Khách hàng - Searchable dropdown */}
                  <div className="relative" ref={customerDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                    <button
                      type="button"
                      onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-orange-500"
                    >
                      <span className={newPhieu.khachHang ? "text-gray-900" : "text-gray-500"}>
                        {newPhieu.khachHang || "Chọn khách hàng..."}
                      </span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${customerDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {customerDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              placeholder="Tìm khách hàng..."
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        <ul className="max-h-48 overflow-y-auto">
                          {filteredCustomers.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy</li>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <li
                                key={customer.rowIndex}
                                onClick={() => {
                                  setNewPhieu({ ...newPhieu, khachHang: customer.name });
                                  setCustomerDropdownOpen(false);
                                  setCustomerSearch("");
                                }}
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-orange-50 ${newPhieu.khachHang === customer.name ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-700"}`}
                              >
                                {customer.name}
                                {customer.category && <span className="ml-2 text-gray-400">({customer.category})</span>}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User thực hiện (tự động)</label>
                  <input type="text" value={newPhieu.userThucHien} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50" readOnly />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Danh sách sản phẩm xuất</h4>
                    <button onClick={addProductLine} className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
                      <Plus size={16} />Thêm dòng
                    </button>
                  </div>

                  <div className="space-y-3">
                    {productLines.map((line, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        {/* Mã SP đầy đủ - Searchable dropdown */}
                        <div className="flex-1 relative" ref={productDropdownIndex === index ? productDropdownRef : null}>
                          <label className="block text-xs text-gray-500 mb-1">Mã SP đầy đủ *</label>
                          <button
                            type="button"
                            onClick={() => {
                              setProductDropdownIndex(productDropdownIndex === index ? null : index);
                              setProductSearch("");
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-orange-500 text-sm"
                          >
                            <span className={line.maSP ? "text-gray-900" : "text-gray-500"}>
                              {line.maSP || "Chọn mã SP đầy đủ..."}
                            </span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${productDropdownIndex === index ? "rotate-180" : ""}`} />
                          </button>
                          {productDropdownIndex === index && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                              <div className="p-2 border-b border-gray-200">
                                <div className="relative">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Tìm mã SP đầy đủ..."
                                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <ul className="max-h-40 overflow-y-auto">
                                {filteredProducts.length === 0 ? (
                                  <li className="px-4 py-2 text-sm text-gray-500 text-center">Không tìm thấy</li>
                                ) : (
                                  filteredProducts.slice(0, 50).map((product) => (
                                    <li
                                      key={product.id}
                                      onClick={() => handleSelectProduct(index, product.name)}
                                      className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-orange-50 ${line.maSP === product.name ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-700"}`}
                                    >
                                      <span className="font-medium">{product.name}</span>
                                    </li>
                                  ))
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="w-24">
                          <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
                          <input type="number" value={line.soLuong} onChange={(e) => updateProductLine(index, "soLuong", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" min="1" />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs text-gray-500 mb-1">Tồn kho</label>
                          <input type="text" value={line.tonKho.toLocaleString()} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600" readOnly />
                        </div>
                        {productLines.length > 1 && (
                          <button onClick={() => removeProductLine(index)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5"><Trash2 size={18} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium" disabled={saving}>Hủy</button>
                <button onClick={handleAddPhieu} disabled={saving} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : "Thêm phiếu xuất"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa */}
      {showEditModal && selectedXuatKho && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowEditModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sửa dòng xuất kho</h3>
                <p className="text-sm text-gray-500">{selectedXuatKho.maSP}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã PXK</label>
                    <input type="text" value={editForm.maPXK} onChange={(e) => setEditForm({ ...editForm, maPXK: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
                    <input type="text" value={editForm.ngayThang} onChange={(e) => setEditForm({ ...editForm, ngayThang: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                    <input type="text" value={editForm.maSP} onChange={(e) => setEditForm({ ...editForm, maSP: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                    <input type="number" value={editForm.soLuong} onChange={(e) => setEditForm({ ...editForm, soLuong: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                  <input type="text" value={editForm.maDonHang} onChange={(e) => setEditForm({ ...editForm, maDonHang: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                  <input type="text" value={editForm.khachHang} onChange={(e) => setEditForm({ ...editForm, khachHang: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User thực hiện</label>
                  <input type="text" value={editForm.userThucHien} onChange={(e) => setEditForm({ ...editForm, userThucHien: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium" disabled={saving}>Hủy</button>
                <button onClick={handleSaveEdit} disabled={saving} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal thêm phiếu nhập kho */}
      {showAddNhapKhoModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowAddNhapKhoModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Thêm phiếu nhập kho</h3>
                <p className="text-purple-100 text-sm">Có thể thêm nhiều sản phẩm trong 1 phiếu</p>
              </div>
              <button onClick={() => setShowAddNhapKhoModal(false)} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã PNK * (tự động)</label>
                    <input type="text" value={newNhapKhoPhieu.maPNK} onChange={(e) => setNewNhapKhoPhieu({ ...newNhapKhoPhieu, maPNK: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nhập</label>
                    <input type="date" value={newNhapKhoPhieu.ngayNhap} onChange={(e) => setNewNhapKhoPhieu({ ...newNhapKhoPhieu, ngayNhap: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Danh sách sản phẩm nhập</h4>
                    <button onClick={addNhapKhoProductLine} className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1">
                      <Plus size={16} />Thêm dòng
                    </button>
                  </div>

                  <div className="space-y-3">
                    {nhapKhoProductLines.map((line, index) => (
                      <div key={index} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                        {/* Mã SP đầy đủ - Searchable dropdown */}
                        <div className="flex-1 relative" ref={nhapKhoProductDropdownIndex === index ? nhapKhoProductDropdownRef : null}>
                          <label className="block text-xs text-gray-500 mb-1">Mã SP đầy đủ *</label>
                          <button
                            type="button"
                            onClick={() => {
                              setNhapKhoProductDropdownIndex(nhapKhoProductDropdownIndex === index ? null : index);
                              setNhapKhoProductSearch("");
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <span className={line.maSP ? "text-gray-900" : "text-gray-500"}>
                              {line.maSP || "Chọn mã SP đầy đủ..."}
                            </span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${nhapKhoProductDropdownIndex === index ? "rotate-180" : ""}`} />
                          </button>
                          {nhapKhoProductDropdownIndex === index && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                              <div className="p-2 border-b border-gray-200">
                                <div className="relative">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={nhapKhoProductSearch}
                                    onChange={(e) => setNhapKhoProductSearch(e.target.value)}
                                    placeholder="Tìm mã SP đầy đủ..."
                                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <ul className="max-h-40 overflow-y-auto">
                                {filteredNhapKhoProducts.length === 0 ? (
                                  <li className="px-4 py-2 text-sm text-gray-500 text-center">Không tìm thấy</li>
                                ) : (
                                  filteredNhapKhoProducts.slice(0, 50).map((product) => (
                                    <li
                                      key={product.id}
                                      onClick={() => handleSelectNhapKhoProduct(index, product.name)}
                                      className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-purple-50 ${line.maSP === product.name ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-700"}`}
                                    >
                                      <span className="font-medium">{product.name}</span>
                                    </li>
                                  ))
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="w-24">
                          <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
                          <input type="number" value={line.soLuong} onChange={(e) => updateNhapKhoProductLine(index, "soLuong", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" min="1" />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
                          <input type="text" value={line.ghiChu} onChange={(e) => updateNhapKhoProductLine(index, "ghiChu", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" placeholder="Ghi chú..." />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs text-gray-500 mb-1">Tồn cuối</label>
                          <input type="text" value={line.tonCuoi.toLocaleString()} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600" readOnly />
                        </div>
                        {nhapKhoProductLines.length > 1 && (
                          <button onClick={() => removeNhapKhoProductLine(index)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5"><Trash2 size={18} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button onClick={() => setShowAddNhapKhoModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium" disabled={saving}>Hủy</button>
                <button onClick={handleAddNhapKhoPhieu} disabled={saving} className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : "Thêm phiếu nhập"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa nhập kho */}
      {showEditNhapKhoModal && selectedNhapKho && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowEditNhapKhoModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-[60] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sửa dòng nhập kho</h3>
                <p className="text-sm text-gray-500">{selectedNhapKho.maSP}</p>
              </div>
              <button onClick={() => setShowEditNhapKhoModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã PNK</label>
                    <input type="text" value={editNhapKhoForm.maPNK} onChange={(e) => setEditNhapKhoForm({ ...editNhapKhoForm, maPNK: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nhập</label>
                    <input type="text" value={editNhapKhoForm.ngayNhap} onChange={(e) => setEditNhapKhoForm({ ...editNhapKhoForm, ngayNhap: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                    <input type="text" value={editNhapKhoForm.maSP} onChange={(e) => setEditNhapKhoForm({ ...editNhapKhoForm, maSP: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                    <input type="number" value={editNhapKhoForm.soLuong} onChange={(e) => setEditNhapKhoForm({ ...editNhapKhoForm, soLuong: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <input type="text" value={editNhapKhoForm.ghiChu} onChange={(e) => setEditNhapKhoForm({ ...editNhapKhoForm, ghiChu: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button onClick={() => setShowEditNhapKhoModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium" disabled={saving}>Hủy</button>
                <button onClick={handleSaveEditNhapKho} disabled={saving} className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa */}
      {showDeleteModal && itemToDelete && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={cancelDelete}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Xác nhận xóa</h3>
                <p className="text-gray-600 text-center mb-2">
                  Bạn có chắc muốn xóa dòng {deleteType === "xuat-kho" ? "xuất" : "nhập"} kho?
                </p>
                <div className="bg-gray-100 rounded-lg p-3 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Mã SP:</span>
                    <span className="font-semibold text-gray-900">{(itemToDelete as any).maSP}</span>
                  </div>
                  {deleteType === "nhap-kho" && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Mã PNK:</span>
                      <span className="font-medium text-purple-600">{(itemToDelete as any).maPNK}</span>
                    </div>
                  )}
                  {deleteType === "xuat-kho" && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Mã PXK:</span>
                      <span className="font-medium text-orange-600">{(itemToDelete as any).maPXK}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-t border-gray-200 mt-1 pt-1">
                    <span className="text-gray-500">Row số (Sheet):</span>
                    <span className="font-mono text-red-600">{itemToDelete.id}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {deleting && <Loader2 size={18} className="animate-spin" />}
                  {deleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
