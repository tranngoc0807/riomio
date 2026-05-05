"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Package, Loader2, AlertCircle, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, Search, ChevronDown, FileDown, FileSpreadsheet, Printer, Download, ShoppingCart } from "lucide-react";
import { TonKhoSP, TonDauSP, XuatKhoSP, Customer, SanPhamCatalog, TonKhoItem, NhapKhoSP } from "@/lib/googleSheets";
import DatePicker from "@/components/DatePicker";
import Portal from "@/components/Portal";
import PrintDownloadButton from "@/components/PrintDownloadButton";
import toast, { Toaster } from "react-hot-toast";
import html2canvas from "html2canvas";
import { useAuth } from "@/context/AuthContext";
import { useCompanyConfig } from "@/context/CompanyConfigContext";
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
  const { config: companyConfig } = useCompanyConfig();
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

  // Search for Tồn kho hàng hóa
  const [searchTonKho, setSearchTonKho] = useState("");

  // Search for Xuất kho
  const [searchXuatKho, setSearchXuatKho] = useState("");

  // Search for Nhập kho
  const [searchNhapKho, setSearchNhapKho] = useState("");

  // Dropdown states for add form
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Refs for dropdowns
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // View phiếu xuất kho detail
  const [viewPhieuXuatKho, setViewPhieuXuatKho] = useState<{ maPXK: string; items: XuatKhoSP[] } | null>(null);
  const phieuXuatKhoPrintRef = useRef<HTMLDivElement>(null);

  // View phiếu nhập kho detail
  const [viewPhieuNhapKho, setViewPhieuNhapKho] = useState<{ maPNK: string; items: NhapKhoSP[] } | null>(null);
  const phieuNhapKhoPrintRef = useRef<HTMLDivElement>(null);

  // Modal states for Xuất kho
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editXuatKhoGroup, setEditXuatKhoGroup] = useState<{ maPXK: string; items: XuatKhoSP[] } | null>(null);
  const [editXuatKhoItems, setEditXuatKhoItems] = useState<XuatKhoSP[]>([]);
  const [deletedXuatKhoIds, setDeletedXuatKhoIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Modal states for Nhập kho
  const [showAddNhapKhoModal, setShowAddNhapKhoModal] = useState(false);
  const [showEditNhapKhoModal, setShowEditNhapKhoModal] = useState(false);
  const [editNhapKhoGroup, setEditNhapKhoGroup] = useState<{ maPNK: string; items: NhapKhoSP[] } | null>(null);
  const [editNhapKhoItems, setEditNhapKhoItems] = useState<NhapKhoSP[]>([]);
  const [deletedNhapKhoIds, setDeletedNhapKhoIds] = useState<number[]>([]);

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
  const [productLines, setProductLines] = useState<ProductLine[]>([]);

  // Form state for adding nhập kho
  const [newNhapKhoPhieu, setNewNhapKhoPhieu] = useState({
    maPNK: "",
    ngayNhap: currentDate.toISOString().split('T')[0],
  });
  const [nhapKhoProductLines, setNhapKhoProductLines] = useState<NhapKhoProductLine[]>([]);


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
        setProductDropdownOpen(false);
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

  // Filter tồn kho theo mã SP
  const filteredTonKho = tonKhoList.filter((item) =>
    item.code.toLowerCase().includes(searchTonKho.toLowerCase().trim()),
  );

  // Pagination calculations
  const totalPagesBang1 = Math.ceil(filteredTonKho.length / itemsPerPage);
  const startIndexBang1 = (currentPageBang1 - 1) * itemsPerPage;
  const endIndexBang1 = startIndexBang1 + itemsPerPage;
  const currentItemsBang1 = filteredTonKho.slice(startIndexBang1, endIndexBang1);

  const totalPagesBang2 = Math.ceil(tonDauList.length / itemsPerPage);
  const startIndexBang2 = (currentPageBang2 - 1) * itemsPerPage;
  const endIndexBang2 = startIndexBang2 + itemsPerPage;
  const currentItemsBang2 = tonDauList.slice(startIndexBang2, endIndexBang2);

  // Group xuất kho by maPXK
  const groupedXuatKho = (() => {
    const map = new Map<string, XuatKhoSP[]>();
    filteredXuatKho.forEach((item) => {
      const key = item.maPXK;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).map(([maPXK, items]) => ({ maPXK, items }));
  })();

  const totalPagesXuatKho = Math.ceil(groupedXuatKho.length / itemsPerPage);
  const startIndexXuatKho = (currentPageXuatKho - 1) * itemsPerPage;
  const endIndexXuatKho = startIndexXuatKho + itemsPerPage;
  const currentGroupsXuatKho = groupedXuatKho.slice(startIndexXuatKho, endIndexXuatKho);

  // Group nhập kho by maPNK
  const groupedNhapKho = (() => {
    const map = new Map<string, NhapKhoSP[]>();
    filteredNhapKho.forEach((item) => {
      const key = item.maPNK;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).map(([maPNK, items]) => ({ maPNK, items }));
  })();

  const totalPagesNhapKho = Math.ceil(groupedNhapKho.length / itemsPerPage);
  const startIndexNhapKho = (currentPageNhapKho - 1) * itemsPerPage;
  const endIndexNhapKho = startIndexNhapKho + itemsPerPage;
  const currentGroupsNhapKho = groupedNhapKho.slice(startIndexNhapKho, endIndexNhapKho);

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

  // ===== In / Tải JPG mẫu phiếu nhập kho hàng hóa (có logo + header công ty) =====
  const phieuNhapKhoPrintStyles = `
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Arial,'Helvetica Neue',sans-serif;color:#222;padding:24px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .sheet{max-width:900px;margin:0 auto;}
    .company{display:flex;align-items:center;gap:14px;margin-bottom:14px;}
    .company .logo{width:64px;height:64px;object-fit:contain;}
    .company-name{font-size:16px;font-weight:700;color:#16a34a;letter-spacing:0.3px;}
    .company-addr{font-size:12px;color:#374151;margin-top:2px;}
    .title{font-size:20px;font-weight:800;text-align:center;margin:8px 0 16px;letter-spacing:0.5px;}
    .meta{font-size:13px;margin-bottom:12px;}
    .meta-row{display:flex;gap:40px;padding:4px 0;}
    .meta-row > div{flex:1;}
    .label{color:#6b7280;margin-right:6px;font-weight:600;}
    .blue{color:#2563eb;font-weight:700;}
    table.items{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;}
    table.items th,table.items td{border:1px solid #9ca3af;padding:6px 8px;}
    table.items th{background:#86efac;font-weight:700;text-align:center;color:#111;}
    table.items td{vertical-align:middle;}
    table.items td.c{text-align:center;}
    table.items td.r{text-align:right;}
    table.items tr.total-row td{background:#f3f4f6;}
    @media print{body{padding:0;}}
  `;

  const buildPhieuNhapKhoHTML = (phieu: { maPNK: string; items: NhapKhoSP[] }): string => {
    const fmt = (v: number) => (v || 0).toLocaleString("vi-VN");
    // Logo local ở /public/logo_riomio.jpg — dùng absolute URL để cả cửa sổ in
    // lẫn html2canvas (render offscreen) đều tải được.
    const logoSrc = `${window.location.origin}/logo_riomio.jpg`;
    const companyName = (companyConfig.name || "").toUpperCase();
    const companyAddress = companyConfig.address || "";
    const ngayNhap = phieu.items[0]?.ngayNhap || "";
    const totalSL = phieu.items.reduce((s, i) => s + (i.soLuong || 0), 0);

    const rows = phieu.items.map((item, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${item.maSP || ""}</td>
        <td class="c">${fmt(item.soLuong)}</td>
        <td class="c">${item.ghiChu || ""}</td>
        <td></td>
      </tr>`).join("");

    return `
      <div class="sheet">
        <div class="company">
          ${logoSrc ? `<img src="${logoSrc}" class="logo" crossorigin="anonymous" />` : ""}
          <div class="company-info">
            <div class="company-name">${companyName}</div>
            <div class="company-addr">${companyAddress}</div>
          </div>
        </div>

        <h1 class="title">PHIẾU NHẬP KHO HÀNG HÓA</h1>

        <div class="meta">
          <div class="meta-row">
            <div><span class="label">Mã PNK:</span> <b class="blue">${phieu.maPNK}</b></div>
            <div><span class="label">Ngày NK:</span> <b>${ngayNhap}</b></div>
          </div>
          <div class="meta-row">
            <div><span class="label">Tổng SL:</span> <b>${fmt(totalSL)}</b></div>
            <div></div>
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th style="width:50px;">STT</th>
              <th>Mã SP</th>
              <th style="width:90px;">Số lượng</th>
              <th style="width:200px;">Xưởng SX/Khách hàng</th>
              <th style="width:160px;">Vị trí để hàng</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  const handlePrintPhieuNhapKho = (phieu: { maPNK: string; items: NhapKhoSP[] } | null) => {
    if (!phieu) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Không mở được cửa sổ in. Vui lòng cho phép popup.");
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Phiếu nhập kho - ${phieu.maPNK}</title>
      <style>${phieuNhapKhoPrintStyles}</style></head><body>${buildPhieuNhapKhoHTML(phieu)}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };

  const handleDownloadPhieuNhapKhoJPG = async (phieu: { maPNK: string; items: NhapKhoSP[] } | null) => {
    if (!phieu) return;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.width = "960px";
    container.style.background = "#fff";
    container.innerHTML = `<style>${phieuNhapKhoPrintStyles}</style>${buildPhieuNhapKhoHTML(phieu)}`;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `PhieuNhapKho_${phieu.maPNK}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (error) {
      console.error("Error exporting JPG:", error);
      toast.error("Lỗi khi xuất ảnh");
    } finally {
      document.body.removeChild(container);
    }
  };

  // Remove product line
  const removeProductLine = (index: number) => {
    setProductLines(productLines.filter((_, i) => i !== index));
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

  // Add product to list - if exists, increment quantity; else append new line
  const handleAddProductToList = (productFullCode: string) => {
    setProductLines((prev) => {
      const existingIndex = prev.findIndex((p) => p.maSP === productFullCode);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          soLuong: updated[existingIndex].soLuong + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          maSP: productFullCode,
          soLuong: 1,
          tonKho: getTonKhoByMaSP(productFullCode),
        },
      ];
    });
    setProductDropdownOpen(false);
    setProductSearch("");
  };

  // Handle add phieu xuat kho
  const handleAddPhieu = async () => {
    if (!newPhieu.maPXK) {
      toast.error("Vui lòng nhập mã PXK");
      return;
    }
    if (productLines.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
      return;
    }
    if (productLines.some(p => !p.maSP)) {
      toast.error("Vui lòng nhập đầy đủ mã sản phẩm");
      return;
    }
    if (productLines.some(p => !p.soLuong || p.soLuong < 1)) {
      toast.error("Số lượng phải lớn hơn 0");
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

  // Handle edit xuất kho - pass whole group
  const handleEditXuatKho = (group: { maPXK: string; items: XuatKhoSP[] }) => {
    setEditXuatKhoGroup(group);
    setEditXuatKhoItems(group.items.map((i) => ({ ...i })));
    setDeletedXuatKhoIds([]);
    setShowEditModal(true);
  };

  // Handle save edit xuất kho - update all items then delete removed
  const handleSaveEdit = async () => {
    if (!editXuatKhoGroup) return;

    setSaving(true);
    try {
      // Update existing items first
      for (const item of editXuatKhoItems) {
        const response = await fetch("/api/xuat-kho-sp/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            maPXK: item.maPXK,
            ngayThang: item.ngayThang,
            maSP: item.maSP,
            soLuong: item.soLuong,
            maDonHang: item.maDonHang,
            khachHang: item.khachHang,
            userThucHien: item.userThucHien,
          }),
        });
        const result = await response.json();
        if (!result.success) {
          toast.error(result.error || `Lỗi cập nhật ${item.maSP}`);
          return;
        }
      }

      // Delete removed items (highest ID first to avoid row shift)
      const sortedDeleteIds = [...deletedXuatKhoIds].sort((a, b) => b - a);
      for (const id of sortedDeleteIds) {
        const response = await fetch(`/api/xuat-kho-sp/delete?id=${id}`, { method: "DELETE" });
        const result = await response.json();
        if (!result.success) {
          toast.error(result.error || "Lỗi khi xóa sản phẩm");
          return;
        }
      }

      toast.success("Cập nhật phiếu xuất kho thành công");
      setShowEditModal(false);
      setEditXuatKhoGroup(null);
      fetchTonKho();
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

  // Remove nhập kho product line
  const removeNhapKhoProductLine = (index: number) => {
    setNhapKhoProductLines(nhapKhoProductLines.filter((_, i) => i !== index));
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

  // Click a product in dropdown → append as new line (OrdersTab-style auto-add)
  const handleAddNhapKhoProductToList = (productFullCode: string) => {
    if (nhapKhoProductLines.some((l) => l.maSP === productFullCode)) {
      toast.error("Sản phẩm đã có trong danh sách");
      return;
    }
    setNhapKhoProductLines([
      ...nhapKhoProductLines,
      {
        maSP: productFullCode,
        soLuong: 1,
        ghiChu: "",
        tonCuoi: getTonKhoByMaSP(productFullCode),
      },
    ]);
    setNhapKhoProductSearch("");
    setNhapKhoProductDropdownIndex(null);
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
    if (nhapKhoProductLines.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
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

  // Handle edit nhập kho - pass whole group
  const handleEditNhapKho = (group: { maPNK: string; items: NhapKhoSP[] }) => {
    setEditNhapKhoGroup(group);
    setEditNhapKhoItems(group.items.map((i) => ({ ...i })));
    setDeletedNhapKhoIds([]);
    setNhapKhoProductSearch("");
    setShowEditNhapKhoModal(true);
  };

  // Append a new product row to edit list (id=0 marks it as new → will be created on save)
  const handleAddProductToEditList = (productFullCode: string) => {
    if (!editNhapKhoGroup) return;
    if (editNhapKhoItems.some((it) => it.maSP === productFullCode)) {
      toast.error("Sản phẩm đã có trong phiếu");
      return;
    }
    const ngayNhap = editNhapKhoItems[0]?.ngayNhap || new Date().toISOString().split("T")[0];
    const newItem: NhapKhoSP = {
      id: 0,
      maPNK: editNhapKhoGroup.maPNK,
      ngayNhap,
      maSP: productFullCode,
      soLuong: 1,
      ghiChu: "",
      tonCuoi: getTonKhoByMaSP(productFullCode),
    };
    setEditNhapKhoItems((prev) => [...prev, newItem]);
    setNhapKhoProductSearch("");
    setNhapKhoProductDropdownIndex(null);
  };

  // Handle save edit nhập kho - update existing, add new, delete removed
  const handleSaveEditNhapKho = async () => {
    if (!editNhapKhoGroup) return;

    setSaving(true);
    try {
      // 1. Update existing items (id > 0)
      for (const item of editNhapKhoItems.filter((i) => i.id > 0)) {
        const response = await fetch("/api/nhap-kho-sp/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            maPNK: item.maPNK,
            ngayNhap: item.ngayNhap,
            maSP: item.maSP,
            soLuong: item.soLuong,
            ghiChu: item.ghiChu,
          }),
        });
        const result = await response.json();
        if (!result.success) {
          toast.error(result.error || `Lỗi cập nhật ${item.maSP}`);
          return;
        }
      }

      // 2. Add new items (id === 0) to this phieu
      const newItems = editNhapKhoItems.filter((i) => i.id === 0);
      if (newItems.length > 0) {
        const response = await fetch("/api/nhap-kho-sp/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maPNK: editNhapKhoGroup.maPNK,
            ngayNhap: newItems[0].ngayNhap,
            products: newItems.map((it) => ({
              maSP: it.maSP,
              soLuong: it.soLuong,
              ghiChu: it.ghiChu,
              tonCuoi: it.tonCuoi,
            })),
          }),
        });
        const result = await response.json();
        if (!result.success) {
          toast.error(result.error || "Lỗi khi thêm sản phẩm mới");
          return;
        }
      }

      // 3. Delete removed items (highest ID first to avoid row shift)
      const sortedDeleteIds = [...deletedNhapKhoIds].sort((a, b) => b - a);
      for (const id of sortedDeleteIds) {
        const response = await fetch(`/api/nhap-kho-sp/delete?id=${id}`, { method: "DELETE" });
        const result = await response.json();
        if (!result.success) {
          toast.error(result.error || "Lỗi khi xóa sản phẩm");
          return;
        }
      }

      toast.success("Cập nhật phiếu nhập kho thành công");
      setShowEditNhapKhoModal(false);
      setEditNhapKhoGroup(null);
      fetchNhapKho();
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
    setNhapKhoProductLines([]);
    setNhapKhoProductSearch("");
  };

  // Open add nhập kho modal
  const openAddNhapKhoModal = () => {
    setNewNhapKhoPhieu({
      maPNK: generateNextMaPNK(),
      ngayNhap: currentDate.toISOString().split('T')[0],
    });
    setNhapKhoProductLines([]);
    setNhapKhoProductSearch("");
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
    setProductLines([]);
    setProductSearch("");
    setCustomerSearch("");
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
    setProductLines([]);
    setProductSearch("");
    setCustomerSearch("");
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
                <h4 className="font-semibold text-white">Tồn kho hàng hóa ({filteredTonKho.length} sản phẩm)</h4>
                <div className="flex items-center gap-2">
                  <DatePicker value={thangNam} onChange={setThangNam} type="month" className="bg-white/20 text-white placeholder-white/70 border-none outline-none px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer min-w-45" />
                  <button onClick={() => fetchTonKho(true, "ton-kho")} className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">Xác nhận</button>
                  <button onClick={handleExportTonKhoPDF} className="flex items-center gap-1 bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"><FileDown size={14} /> PDF</button>
                  <button onClick={handleExportTonKhoExcel} className="flex items-center gap-1 bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"><FileSpreadsheet size={14} /> Excel</button>
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm theo mã SP..."
                  value={searchTonKho}
                  onChange={(e) => { setSearchTonKho(e.target.value); setCurrentPageBang1(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                <h4 className="font-semibold text-white">Bảng kê xuất kho SP ({groupedXuatKho.length} phiếu)</h4>
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
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Số SP</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tổng SL</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã đơn hàng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Khách hàng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentGroupsXuatKho.length === 0 ? (
                    <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-500">Không có dữ liệu xuất kho</td></tr>
                  ) : (
                    currentGroupsXuatKho.map((group, groupIndex) => {
                      const totalSL = group.items.reduce((sum, i) => sum + i.soLuong, 0);
                      const first = group.items[0];
                      const maDonHang = group.items.find((i) => i.maDonHang)?.maDonHang || "";
                      const khachHang = group.items.find((i) => i.khachHang)?.khachHang || "";
                      const userThucHien = group.items.find((i) => i.userThucHien)?.userThucHien || "";
                      return (
                        <tr
                          key={group.maPXK}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setViewPhieuXuatKho(group)}
                        >
                          <td className="px-3 py-3 text-gray-600">{startIndexXuatKho + groupIndex + 1}</td>
                          <td className="px-3 py-3 font-medium text-orange-600">{group.maPXK}</td>
                          <td className="px-3 py-3 text-gray-700">{first.ngayThang}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">{group.items.length}</span>
                          </td>
                          <td className="px-3 py-3 text-center font-medium text-gray-900">{totalSL.toLocaleString()}</td>
                          <td className="px-3 py-3 text-gray-700">{maDonHang}</td>
                          <td className="px-3 py-3 text-gray-700">{khachHang}</td>
                          <td className="px-3 py-3 text-gray-700">{userThucHien}</td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEditXuatKho(group)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteXuatKho(first)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
                <h4 className="font-semibold text-white">Bảng kê nhập kho SP ({groupedNhapKho.length} phiếu)</h4>
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
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Số SP</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tổng SL</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ghi chú</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentGroupsNhapKho.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">Không có dữ liệu nhập kho</td></tr>
                  ) : (
                    currentGroupsNhapKho.map((group, groupIndex) => {
                      const totalSL = group.items.reduce((sum, i) => sum + i.soLuong, 0);
                      const first = group.items[0];
                      const ghiChu = group.items.find((i) => i.ghiChu)?.ghiChu || "";
                      return (
                        <tr
                          key={group.maPNK}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setViewPhieuNhapKho(group)}
                        >
                          <td className="px-3 py-3 text-gray-600">{startIndexNhapKho + groupIndex + 1}</td>
                          <td className="px-3 py-3 font-medium text-purple-600">{group.maPNK}</td>
                          <td className="px-3 py-3 text-gray-700">{first.ngayNhap}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{group.items.length}</span>
                          </td>
                          <td className="px-3 py-3 text-center font-medium text-gray-900">{totalSL.toLocaleString()}</td>
                          <td className="px-3 py-3 text-gray-700">{ghiChu}</td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEditNhapKho(group)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteNhapKho(first)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { if (!saving) { setShowAddModal(false); resetAddForm(); } }} />
          <div className="fixed inset-4 lg:inset-8 z-[60] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {saving && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-[70] flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-orange-600 mb-4" />
                <p className="text-gray-700 font-medium">Đang tạo phiếu xuất...</p>
                <p className="text-gray-500 text-sm mt-1">Vui lòng đợi trong giây lát</p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Thêm phiếu xuất kho</h3>
                <p className="text-sm text-gray-500">Mã PXK: {newPhieu.maPXK}</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetAddForm(); }}
                disabled={saving}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Phiếu Info */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã PXK</label>
                  <input
                    type="text"
                    value={newPhieu.maPXK}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
                  <input
                    type="date"
                    value={newPhieu.ngayThang}
                    onChange={(e) => setNewPhieu({ ...newPhieu, ngayThang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                  <input
                    type="text"
                    value={newPhieu.maDonHang}
                    onChange={(e) => setNewPhieu({ ...newPhieu, maDonHang: e.target.value })}
                    placeholder="Nhập mã đơn hàng..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="relative" ref={customerDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setCustomerDropdownOpen(true)}
                      placeholder="Tìm khách hàng..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <ChevronDown
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                  {customerDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy</div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.rowIndex}
                            onClick={() => {
                              setNewPhieu({ ...newPhieu, khachHang: customer.name });
                              setCustomerSearch(customer.name);
                              setCustomerDropdownOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-orange-50 cursor-pointer flex justify-between items-center text-sm"
                          >
                            <span>{customer.name}</span>
                            {customer.category && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {customer.category}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User thực hiện</label>
                  <input
                    type="text"
                    value={newPhieu.userThucHien || "Đang tải..."}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              {/* Add Product Section */}
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="relative" ref={productDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thêm sản phẩm</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductDropdownOpen(true);
                      }}
                      onFocus={() => setProductDropdownOpen(true)}
                      placeholder="Tìm theo mã SP đầy đủ..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                  {productDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy sản phẩm</div>
                      ) : (
                        filteredProducts.slice(0, 50).map((product) => {
                          const ton = getTonKhoByMaSP(product.name);
                          return (
                            <div
                              key={product.id}
                              onClick={() => handleAddProductToList(product.name)}
                              className="px-3 py-2 hover:bg-orange-50 cursor-pointer flex justify-between items-center"
                            >
                              <span className="font-medium text-sm text-orange-600">{product.name}</span>
                              <span className="text-xs text-gray-500">Tồn: {ton.toLocaleString()}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Products List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">Danh sách sản phẩm xuất ({productLines.length})</h4>
                </div>
                {productLines.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Chưa có sản phẩm nào. Tìm và thêm sản phẩm ở trên.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP đầy đủ</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-28">Số lượng</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Tồn kho</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {productLines.map((line, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-3 py-2 text-sm font-medium text-orange-600">{line.maSP}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={line.soLuong}
                                onChange={(e) => updateProductLine(index, "soLuong", parseInt(e.target.value) || 0)}
                                min="1"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center mx-auto block"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-right text-gray-600">{line.tonKho.toLocaleString()}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => removeProductLine(index)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowAddModal(false); resetAddForm(); }}
                  disabled={saving}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddPhieu}
                  disabled={saving || productLines.length === 0}
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  <Plus size={18} />
                  {saving ? "Đang lưu..." : `Thêm phiếu xuất (${productLines.length} SP)`}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa phiếu xuất kho */}
      {showEditModal && editXuatKhoGroup && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa phiếu xuất kho</h3>
                <p className="text-sm text-gray-500">Mã PXK: {editXuatKhoGroup.maPXK}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Phiếu info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Mã PXK</label>
                  <input type="text" value={editXuatKhoGroup.maPXK} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Ngày tháng</label>
                  <input type="text" value={editXuatKhoItems[0]?.ngayThang || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Mã đơn hàng</label>
                  <input type="text" value={editXuatKhoItems.find((i) => i.maDonHang)?.maDonHang || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Khách hàng</label>
                  <input type="text" value={editXuatKhoItems.find((i) => i.khachHang)?.khachHang || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm" />
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">Danh sách sản phẩm ({editXuatKhoItems.length})</h4>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-10"></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">Số lượng</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {editXuatKhoItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => {
                              setDeletedXuatKhoIds((prev) => [...prev, item.id]);
                              setEditXuatKhoItems((prev) => prev.filter((p) => p.id !== item.id));
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Xóa sản phẩm"
                          >
                            <X size={16} />
                          </button>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{item.maSP}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.soLuong}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setEditXuatKhoItems((prev) =>
                                prev.map((p) => p.id === item.id ? { ...p, soLuong: val } : p)
                              );
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                          />
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${item.tonKho < 0 ? "text-red-600" : item.tonKho === 0 ? "text-gray-500" : "text-green-600"}`}>{item.tonKho.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setShowEditModal(false)} disabled={saving} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50">Hủy</button>
              <button onClick={handleSaveEdit} disabled={saving} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Edit size={18} />Lưu thay đổi</>}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal thêm phiếu nhập kho - full-screen OrdersTab style */}
      {showAddNhapKhoModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => !saving && setShowAddNhapKhoModal(false)}
          />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Thêm phiếu nhập kho</h3>
                <p className="text-sm text-gray-500">Mã PNK: {newNhapKhoPhieu.maPNK}</p>
              </div>
              <button
                onClick={() => setShowAddNhapKhoModal(false)}
                disabled={saving}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Phiếu info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã PNK</label>
                  <input
                    type="text"
                    value={newNhapKhoPhieu.maPNK}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nhập</label>
                  <input
                    type="date"
                    value={newNhapKhoPhieu.ngayNhap}
                    onChange={(e) => setNewNhapKhoPhieu({ ...newNhapKhoPhieu, ngayNhap: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              {/* Add Product Section - click product → auto-add to list */}
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="relative" ref={nhapKhoProductDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thêm sản phẩm</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nhapKhoProductSearch}
                      onChange={(e) => {
                        setNhapKhoProductSearch(e.target.value);
                        setNhapKhoProductDropdownIndex(0);
                      }}
                      onFocus={() => setNhapKhoProductDropdownIndex(0)}
                      placeholder="Tìm theo mã SP đầy đủ..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  {nhapKhoProductDropdownIndex === 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredNhapKhoProducts.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy sản phẩm</div>
                      ) : (
                        filteredNhapKhoProducts.slice(0, 50).map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleAddNhapKhoProductToList(product.name)}
                            className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                          >
                            <span className="font-medium text-purple-700">{product.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">Danh sách sản phẩm ({nhapKhoProductLines.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 w-10"></th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">Số lượng</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Tồn cuối</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {nhapKhoProductLines.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                            Chưa có sản phẩm nào. Tìm và chọn SP ở khung phía trên để thêm.
                          </td>
                        </tr>
                      )}
                      {nhapKhoProductLines.map((line, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeNhapKhoProductLine(index)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <X size={16} />
                            </button>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{line.maSP}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={line.soLuong}
                              onChange={(e) => updateNhapKhoProductLine(index, "soLuong", parseInt(e.target.value) || 0)}
                              min="1"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={line.ghiChu}
                              onChange={(e) => updateNhapKhoProductLine(index, "ghiChu", e.target.value)}
                              placeholder="Ghi chú..."
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className={`px-3 py-2 text-right font-medium ${line.tonCuoi < 0 ? "text-red-600" : line.tonCuoi === 0 ? "text-gray-500" : "text-green-600"}`}>
                            {line.tonCuoi.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddNhapKhoModal(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleAddNhapKhoPhieu}
                disabled={saving || nhapKhoProductLines.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {saving ? "Đang lưu..." : `Thêm phiếu (${nhapKhoProductLines.length})`}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa phiếu nhập kho - full-screen OrdersTab style với dropdown thêm SP */}
      {showEditNhapKhoModal && editNhapKhoGroup && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => !saving && setShowEditNhapKhoModal(false)} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa phiếu nhập kho</h3>
                <p className="text-sm text-gray-500">Mã PNK: {editNhapKhoGroup.maPNK}</p>
              </div>
              <button onClick={() => setShowEditNhapKhoModal(false)} disabled={saving} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Mã PNK</label>
                  <input type="text" value={editNhapKhoGroup.maPNK} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Ngày nhập</label>
                  <input type="text" value={editNhapKhoItems[0]?.ngayNhap || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Ghi chú</label>
                  <input type="text" value={editNhapKhoItems.find((i) => i.ghiChu)?.ghiChu || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm" />
                </div>
              </div>

              {/* Add Product Section - click product → auto-add to list */}
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="relative" ref={nhapKhoProductDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thêm sản phẩm vào phiếu</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nhapKhoProductSearch}
                      onChange={(e) => {
                        setNhapKhoProductSearch(e.target.value);
                        setNhapKhoProductDropdownIndex(0);
                      }}
                      onFocus={() => setNhapKhoProductDropdownIndex(0)}
                      placeholder="Tìm theo mã SP đầy đủ..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  {nhapKhoProductDropdownIndex === 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredNhapKhoProducts.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy sản phẩm</div>
                      ) : (
                        filteredNhapKhoProducts.slice(0, 50).map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleAddProductToEditList(product.name)}
                            className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                          >
                            <span className="font-medium text-purple-700">{product.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">Danh sách sản phẩm ({editNhapKhoItems.length})</h4>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-10"></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">Số lượng</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tồn cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {editNhapKhoItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                          Phiếu không có sản phẩm. Dùng khung phía trên để thêm SP vào phiếu.
                        </td>
                      </tr>
                    )}
                    {editNhapKhoItems.map((item, index) => {
                      const isNew = item.id === 0;
                      const rowKey = isNew ? `new-${index}` : `db-${item.id}`;
                      return (
                        <tr key={rowKey} className={`hover:bg-gray-50 ${isNew ? "bg-green-50/40" : ""}`}>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => {
                                if (!isNew) {
                                  setDeletedNhapKhoIds((prev) => [...prev, item.id]);
                                }
                                setEditNhapKhoItems((prev) => prev.filter((_, i) => i !== index));
                              }}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <X size={16} />
                            </button>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{index + 1}{isNew ? " *" : ""}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{item.maSP}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.soLuong}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setEditNhapKhoItems((prev) =>
                                  prev.map((p, i) => (i === index ? { ...p, soLuong: val } : p))
                                );
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.ghiChu || ""}
                              onChange={(e) => {
                                setEditNhapKhoItems((prev) =>
                                  prev.map((p, i) => (i === index ? { ...p, ghiChu: e.target.value } : p))
                                );
                              }}
                              placeholder="Ghi chú..."
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className={`px-3 py-2 text-right font-medium ${item.tonCuoi < 0 ? "text-red-600" : item.tonCuoi === 0 ? "text-gray-500" : "text-green-600"}`}>{item.tonCuoi.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setShowEditNhapKhoModal(false)} disabled={saving} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50">Hủy</button>
              <button onClick={handleSaveEditNhapKho} disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Edit size={18} />Lưu thay đổi</>}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal chi tiết phiếu nhập kho */}
      {viewPhieuNhapKho && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setViewPhieuNhapKho(null)}
          />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết phiếu nhập kho</h3>
                <p className="text-sm text-gray-500">Mã PNK: {viewPhieuNhapKho.maPNK}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPhieuNhapKhoJPG(viewPhieuNhapKho)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium"
                  title="Tải xuống ảnh JPG"
                >
                  <Download size={16} /> Tải JPG
                </button>
                <button
                  onClick={() => handlePrintPhieuNhapKho(viewPhieuNhapKho)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
                  title="In phiếu nhập kho"
                >
                  <Printer size={16} /> In
                </button>
                <button
                  onClick={() => setViewPhieuNhapKho(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div ref={phieuNhapKhoPrintRef} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Mã PNK:</span>
                  <p className="font-medium text-purple-600">{viewPhieuNhapKho.maPNK}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ngày nhập:</span>
                  <p className="font-medium">{viewPhieuNhapKho.items[0]?.ngayNhap}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ghi chú:</span>
                  <p className="font-medium">{viewPhieuNhapKho.items.find((i) => i.ghiChu)?.ghiChu || "-"}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách sản phẩm ({viewPhieuNhapKho.items.length}) - Tổng: {viewPhieuNhapKho.items.reduce((s, i) => s + i.soLuong, 0).toLocaleString()} SP
                  </h4>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-12">STT</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Số lượng</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tồn cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {viewPhieuNhapKho.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600">{index + 1}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{item.maSP}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{item.soLuong.toLocaleString()}</td>
                        <td className="px-4 py-2 text-gray-700">{item.ghiChu || "-"}</td>
                        <td className={`px-4 py-2 text-right font-medium ${item.tonCuoi < 0 ? "text-red-600" : item.tonCuoi === 0 ? "text-gray-500" : "text-green-600"}`}>
                          {item.tonCuoi.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-sm font-medium text-right">Tổng:</td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-purple-600">
                        {viewPhieuNhapKho.items.reduce((s, i) => s + i.soLuong, 0).toLocaleString()}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal chi tiết phiếu xuất kho */}
      {viewPhieuXuatKho && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setViewPhieuXuatKho(null)}
          />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết phiếu xuất kho</h3>
                <p className="text-sm text-gray-500">Mã PXK: {viewPhieuXuatKho.maPXK}</p>
              </div>
              <div className="flex items-center gap-2">
                <PrintDownloadButton
                  targetRef={phieuXuatKhoPrintRef}
                  fileName={`PhieuXuatKho_${viewPhieuXuatKho.maPXK}`}
                  title={`Phiếu xuất kho - ${viewPhieuXuatKho.maPXK}`}
                />
                <button
                  onClick={() => setViewPhieuXuatKho(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Phiếu Info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Mã PXK:</span>
                  <p className="font-medium text-orange-600">{viewPhieuXuatKho.maPXK}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ngày tháng:</span>
                  <p className="font-medium">{viewPhieuXuatKho.items[0]?.ngayThang}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Khách hàng:</span>
                  <p className="font-medium">{viewPhieuXuatKho.items[0]?.khachHang || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">User thực hiện:</span>
                  <p className="font-medium">{viewPhieuXuatKho.items[0]?.userThucHien || "-"}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách sản phẩm ({viewPhieuXuatKho.items.length}) - Tổng: {viewPhieuXuatKho.items.reduce((s, i) => s + i.soLuong, 0).toLocaleString()} SP
                  </h4>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-12">STT</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Số lượng</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mã đơn hàng</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[...viewPhieuXuatKho.items]
                      .sort((a, b) => b.tonKho - a.tonKho)
                      .map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-600">{index + 1}</td>
                          <td className="px-4 py-2 font-medium text-gray-900">{item.maSP}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{item.soLuong.toLocaleString()}</td>
                          <td className="px-4 py-2 text-gray-700">{item.maDonHang || "-"}</td>
                          <td className={`px-4 py-2 text-right font-medium ${item.tonKho < 0 ? "text-red-600" : item.tonKho === 0 ? "text-gray-500" : "text-green-600"}`}>
                            {item.tonKho.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-sm font-medium text-right">Tổng:</td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-orange-600">
                        {viewPhieuXuatKho.items.reduce((s, i) => s + i.soLuong, 0).toLocaleString()}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Hidden print template — chỉ dùng cho html2canvas / window.print */}
          <div
            ref={phieuXuatKhoPrintRef}
            style={{
              position: "absolute",
              left: "-10000px",
              top: 0,
              width: "800px",
              padding: "30px",
              background: "#fff",
              fontFamily: "Arial, sans-serif",
              color: "#000",
            }}
          >
            {/* Header công ty */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <img
                src="/logo_riomio.jpg"
                alt="Riomio"
                style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }}
              />
              <div>
                <div style={{ fontSize: "16px", fontWeight: "bold" }}>CÔNG TY CỔ PHẦN RIOMIO</div>
                <div style={{ fontSize: "12px" }}>
                  B12 TT7 Nguyễn Sơn Hà, KĐT Văn Quán, Phúc La, Hà Đông, Hà Nội
                </div>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: "center", margin: "12px 0 20px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>PHIẾU XUẤT KHO</h1>
            </div>

            {/* Info: 2 cột */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              <div>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ color: "#555" }}>Mã PXK: </span>
                  <span style={{ fontWeight: "bold" }}>{viewPhieuXuatKho.maPXK}</span>
                </div>
                <div>
                  <span style={{ color: "#555" }}>Ngày tháng: </span>
                  <span style={{ fontWeight: "500" }}>{viewPhieuXuatKho.items[0]?.ngayThang}</span>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ color: "#555" }}>Khách hàng: </span>
                  <span style={{ fontWeight: "bold" }}>{viewPhieuXuatKho.items[0]?.khachHang || "-"}</span>
                </div>
                <div>
                  <span style={{ color: "#555" }}>User thực hiện: </span>
                  <span style={{ fontWeight: "500" }}>{viewPhieuXuatKho.items[0]?.userThucHien || "-"}</span>
                </div>
              </div>
            </div>

            {/* Bảng sản phẩm */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                marginBottom: "30px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#fed7aa" }}>
                  <th style={{ border: "1px solid #555", padding: "8px", width: "50px", textAlign: "center" }}>STT</th>
                  <th style={{ border: "1px solid #555", padding: "8px", textAlign: "center" }}>Mã SP</th>
                  <th style={{ border: "1px solid #555", padding: "8px", width: "90px", textAlign: "center" }}>Số lượng</th>
                  <th style={{ border: "1px solid #555", padding: "8px", textAlign: "center" }}>Mã đơn hàng</th>
                  <th style={{ border: "1px solid #555", padding: "8px", width: "90px", textAlign: "center" }}>Tồn kho</th>
                </tr>
              </thead>
              <tbody>
                {[...viewPhieuXuatKho.items]
                  .sort((a, b) => b.tonKho - a.tonKho)
                  .map((item, index) => (
                    <tr key={item.id}>
                      <td style={{ border: "1px solid #555", padding: "8px", textAlign: "center" }}>{index + 1}</td>
                      <td style={{ border: "1px solid #555", padding: "8px" }}>{item.maSP}</td>
                      <td style={{ border: "1px solid #555", padding: "8px", textAlign: "right" }}>
                        {item.soLuong.toLocaleString("vi-VN")}
                      </td>
                      <td style={{ border: "1px solid #555", padding: "8px" }}>{item.maDonHang || ""}</td>
                      <td style={{ border: "1px solid #555", padding: "8px", textAlign: "right" }}>
                        {item.tonKho.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ border: "1px solid #555", padding: "8px", textAlign: "right", fontWeight: "bold" }}>Tổng:</td>
                  <td style={{ border: "1px solid #555", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                    {viewPhieuXuatKho.items.reduce((s, i) => s + i.soLuong, 0).toLocaleString("vi-VN")}
                  </td>
                  <td colSpan={2} style={{ border: "1px solid #555", padding: "8px" }}></td>
                </tr>
              </tfoot>
            </table>

            {/* Chữ ký */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "12px",
                marginTop: "40px",
                textAlign: "center",
                color: "#dc2626",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              <div>Người bán hàng</div>
              <div>Thủ kho</div>
              <div>Kế toán</div>
              <div>Người mua hàng</div>
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
