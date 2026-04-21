"use client";

import {
  Loader2,
  X,
  Search,
  Printer,
  Download,
  ChevronDown,
  Plus,
  Trash2,
  ArrowLeft,
  RotateCcw,
  FileDown,
  FileSpreadsheet,
  Pencil,
  Copy,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { useAuth } from "@/context/AuthContext";
import type { XuatKhoNPL } from "@/lib/googleSheets";
import * as XLSX from "xlsx";

// Fixed options for Loại chi phí
const LOAI_CHI_PHI_OPTIONS = [
  "CP QLDN",
  "Giá thành",
  "CP bán hàng",
  "CP rủi ro SX",
];

// Interface for selected NPL in the form
interface SelectedNPL {
  id: string;
  existingId?: number;
  maNPL: string;
  dvt: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  loaiChiPhi: string;
  tonThucTe: number;
  ghiChu: string;
}

// Convert dd/mm/yyyy or similar date string to yyyy-mm-dd for date input
const toISODate = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split(/[/\-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (y.length === 4) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return "";
};

// Interface for grouped phieu xuat kho
interface GroupedPhieuXuat {
  maPhieu: string;
  ngayThang: string;
  nguoiNhap: string;
  noiDung: string;
  maSP: string;
  lenhSX: string;
  xuongSX: string;
  items: XuatKhoNPL[];
  totalItems: number;
  totalThanhTien: number;
}

// Helper function to get cached profile
const getCachedProfileName = (): string => {
  try {
    const cached = localStorage.getItem("riomio_profile_cache");
    if (cached) {
      const { profile } = JSON.parse(cached);
      return profile?.full_name || profile?.email || "";
    }
  } catch (e) {
    console.warn("Error reading cached profile:", e);
  }
  return "";
};

// View types
type ViewType = "list" | "detail";

export default function XuatKhoNPLTab() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<XuatKhoNPL[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // View state - "list" or "detail"
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [viewGroupedPhieu, setViewGroupedPhieu] =
    useState<GroupedPhieuXuat | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] =
    useState<XuatKhoNPL | null>(null);

  // Edit item state
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<XuatKhoNPL | null>(null);
  const [editForm, setEditForm] = useState({ soLuong: 0, donGia: 0, loaiChiPhi: "", ghiChu: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isAppendingMode, setIsAppendingMode] = useState(false);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [phieuToDelete, setPhieuToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Form states
  const [formMaPhieu, setFormMaPhieu] = useState("");
  const [formNgayThang, setFormNgayThang] = useState(new Date().toISOString().split("T")[0]);
  const [formNguoiNhap, setFormNguoiNhap] = useState("");
  const [formNoiDung, setFormNoiDung] = useState("");
  const [formMaSP, setFormMaSP] = useState("");
  const [formLenhSX, setFormLenhSX] = useState("");
  const [formXuongSX, setFormXuongSX] = useState("");
  const [selectedNPLs, setSelectedNPLs] = useState<SelectedNPL[]>([]);

  // Return form states (Phiếu hoàn NPL)
  const [returnFormMaPhieu, setReturnFormMaPhieu] = useState("");
  const [returnFormNgayThang, setReturnFormNgayThang] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [returnFormNguoiNhap, setReturnFormNguoiNhap] = useState("");
  const [returnFormNoiDung, setReturnFormNoiDung] = useState("");
  const [returnFormMaSP, setReturnFormMaSP] = useState("");
  const [returnFormLenhSX, setReturnFormLenhSX] = useState("");
  const [returnFormXuongSX, setReturnFormXuongSX] = useState("");
  const [returnSelectedNPLs, setReturnSelectedNPLs] = useState<SelectedNPL[]>(
    [],
  );

  // Return NPL search
  const [returnNplSearchTerm, setReturnNplSearchTerm] = useState("");
  const [showReturnNPLDropdown, setShowReturnNPLDropdown] = useState(false);
  const returnNplDropdownRef = useRef<HTMLDivElement>(null);

  // NPL search
  const [nplSearchTerm, setNplSearchTerm] = useState("");
  const [showNPLDropdown, setShowNPLDropdown] = useState(false);
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const nplDropdownRef = useRef<HTMLDivElement>(null);

  // Products and Xuong data
  const [productsData, setProductsData] = useState<any[]>([]);
  const [showMaSPDropdown, setShowMaSPDropdown] = useState(false);
  const [maSPSearchTerm, setMaSPSearchTerm] = useState("");
  const maSPDropdownRef = useRef<HTMLDivElement>(null);

  // Danh sách xưởng sản xuất - lấy từ API
  const [xuongSXList, setXuongSXList] = useState<any[]>([]);
  const [showXuongDropdown, setShowXuongDropdown] = useState(false);
  const [showReturnXuongDropdown, setShowReturnXuongDropdown] = useState(false);
  const xuongDropdownRef = useRef<HTMLDivElement>(null);
  const returnXuongDropdownRef = useRef<HTMLDivElement>(null);

  // Tồn kho NPL - để lookup tồn cuối khi chọn mã NPL
  const [tonKhoNPLData, setTonKhoNPLData] = useState<any[]>([]);

  // Filter materials
  const filteredMaterials = materialsData.filter((m) =>
    (m.code && m.code.toLowerCase().includes(nplSearchTerm.toLowerCase())) ||
    (m.name && m.name.toLowerCase().includes(nplSearchTerm.toLowerCase()))
  );

  // Filter materials for return
  const filteredReturnMaterials = materialsData.filter((m) =>
    (m.code &&
      m.code.toLowerCase().includes(returnNplSearchTerm.toLowerCase())) ||
    (m.name &&
      m.name.toLowerCase().includes(returnNplSearchTerm.toLowerCase()))
  );

  // Filter products - từ sheet "Mã SP" (maSP, tenSP)
  const filteredProducts = productsData.filter((p) =>
    (p.maSP && p.maSP.toLowerCase().includes(maSPSearchTerm.toLowerCase())) ||
    (p.tenSP && p.tenSP.toLowerCase().includes(maSPSearchTerm.toLowerCase()))
  );

  // Group phieu xuat kho by maPhieu
  const groupedPhieuXuat: GroupedPhieuXuat[] = useMemo(() => {
    const groups: Record<string, GroupedPhieuXuat> = {};

    data.forEach((item) => {
      if (!groups[item.maPhieu]) {
        groups[item.maPhieu] = {
          maPhieu: item.maPhieu,
          ngayThang: item.ngayThang,
          nguoiNhap: item.nguoiNhap,
          noiDung: item.noiDung,
          maSP: item.maSP,
          lenhSX: item.lenhSX,
          xuongSX: item.xuongSX,
          items: [],
          totalItems: 0,
          totalThanhTien: 0,
        };
      }
      groups[item.maPhieu].items.push(item);
      groups[item.maPhieu].totalItems += item.soLuong || 0;
      groups[item.maPhieu].totalThanhTien += item.thanhTien || 0;
    });

    // Sắp xếp theo ngày mới nhất lên trước
    return Object.values(groups).sort((a, b) => {
      const parseDate = (d: string) => {
        if (!d) return 0;
        // DD/MM/YYYY
        if (d.includes('/')) {
          const [dd, mm, yyyy] = d.split('/');
          return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0;
        }
        // YYYY-MM-DD
        return new Date(d).getTime() || 0;
      };
      return parseDate(b.ngayThang) - parseDate(a.ngayThang);
    });
  }, [data]);

  // Sync view state with URL params - URL is the single source of truth
  useEffect(() => {
    const phieuParam = searchParams.get("phieu");

    if (phieuParam && groupedPhieuXuat.length > 0) {
      // URL has phieu param - show detail view
      const foundGroup = groupedPhieuXuat.find((g) => g.maPhieu === phieuParam);
      if (foundGroup) {
        setViewGroupedPhieu(foundGroup);
        setCurrentView("detail");
      }
    } else if (!phieuParam) {
      // No phieu param - show list view
      setCurrentView("list");
      setViewGroupedPhieu(null);
      setSelectedItemDetail(null);
    }
  }, [searchParams, groupedPhieuXuat]);

  // Filtered grouped phieu
  const filteredGroupedPhieu = groupedPhieuXuat.filter(
    (g) =>
      g.maPhieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.xuongSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.items.some((item) =>
        item.maNPL.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  useEffect(() => {
    fetchData();
    fetchMaterials();
    fetchProducts();
    fetchXuongSX();
    fetchTonKhoNPL();
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nplDropdownRef.current &&
        !nplDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNPLDropdown(false);
      }
      if (
        maSPDropdownRef.current &&
        !maSPDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMaSPDropdown(false);
      }
      if (
        returnNplDropdownRef.current &&
        !returnNplDropdownRef.current.contains(event.target as Node)
      ) {
        setShowReturnNPLDropdown(false);
      }
      if (
        xuongDropdownRef.current &&
        !xuongDropdownRef.current.contains(event.target as Node)
      ) {
        setShowXuongDropdown(false);
      }
      if (
        returnXuongDropdownRef.current &&
        !returnXuongDropdownRef.current.contains(event.target as Node)
      ) {
        setShowReturnXuongDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/xuat-kho-npl", { cache: "no-store" });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải danh sách xuất kho NPL");
      }
    } catch (error) {
      console.error("Error fetching xuat kho NPL:", error);
      toast.error("Lỗi khi tải danh sách xuất kho NPL");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      const result = await response.json();
      if (result.success) {
        setMaterialsData(result.data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      // Lấy danh sách Mã SP từ sheet "Mã SP"
      const response = await fetch("/api/ma-sp");
      const result = await response.json();
      if (result.success) {
        setProductsData(result.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchXuongSX = async () => {
    try {
      const response = await fetch("/api/xuong-san-xuat");
      const result = await response.json();
      if (result.success) {
        setXuongSXList(result.data);
      }
    } catch (error) {
      console.error("Error fetching xuong san xuat:", error);
    }
  };

  // Fetch tồn kho NPL để lookup tồn cuối khi chọn mã NPL
  const fetchTonKhoNPL = async () => {
    try {
      const response = await fetch("/api/ton-kho-npl");
      const result = await response.json();
      console.log("fetchTonKhoNPL - result:", result.success, "count:", result.data?.tonKhoThang?.length);
      if (result.success && result.data?.tonKhoThang) {
        setTonKhoNPLData(result.data.tonKhoThang);
        console.log("fetchTonKhoNPL - sample data:", result.data.tonKhoThang.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching ton kho NPL:", error);
    }
  };

  // Helper function to get tồn cuối by mã NPL đầy đủ
  // Sheet "Tồn kho NPL kho công ty" có maNPL đầy đủ như "TM22 Túi zip chip, áo lá"
  // Material từ dropdown: material.name = "TM22 Túi zip chip, áo lá" (dùng để match)
  const getTonCuoiByMaNPL = (maNPLFull: string): number => {
    if (!maNPLFull) return 0;
    const searchKey = maNPLFull.trim().toLowerCase();
    const item = tonKhoNPLData.find(
      (t) => t.maNPL && t.maNPL.trim().toLowerCase() === searchKey
    );
    console.log("getTonCuoiByMaNPL - searching:", searchKey, "found:", item?.maNPL, "tonCuoi:", item?.tonCuoi);
    return item ? item.tonCuoi : 0;
  };

  const generateNextMaPhieu = (prefix: string = "PXKNPL"): string => {
    const relevantData = data.filter((item) =>
      item.maPhieu.startsWith(prefix),
    );
    if (relevantData.length === 0) {
      return `${prefix}001`;
    }

    const codeNumbers = relevantData
      .map((item) => {
        const regex = new RegExp(`${prefix}(\\d+)`, "i");
        const match = item.maPhieu.match(regex);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNumber = Math.max(...codeNumbers, 0);
    return `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
  };

  const handleOpenAddModal = () => {
    const nextCode = generateNextMaPhieu("PXKNPL");
    setFormMaPhieu(nextCode);
    setFormNgayThang(new Date().toISOString().split("T")[0]);
    setFormNguoiNhap(profile?.full_name || profile?.email || getCachedProfileName() || "");
    setFormNoiDung("");
    setFormMaSP("");
    setFormLenhSX("");
    setFormXuongSX("");
    setSelectedNPLs([]);
    setIsAppendingMode(false);
    setIsCopyMode(false);
    setShowAddModal(true);
  };

  const handleCopyPhieu = (group: GroupedPhieuXuat) => {
    const nextCode = generateNextMaPhieu("PXKNPL");
    setFormMaPhieu(nextCode);
    setFormNgayThang(toISODate(group.ngayThang) || new Date().toISOString().split("T")[0]);
    setFormNguoiNhap(group.nguoiNhap || "");
    setFormNoiDung(group.noiDung || "");
    setFormMaSP(group.maSP || "");
    setFormLenhSX(group.lenhSX || "");
    setFormXuongSX(group.xuongSX || "");
    setSelectedNPLs(
      group.items.map((item, i) => ({
        id: `copy-${Date.now()}-${i}`,
        maNPL: item.maNPL,
        dvt: item.dvt || "",
        soLuong: item.soLuong,
        donGia: item.donGia,
        thanhTien: item.thanhTien,
        loaiChiPhi: item.loaiChiPhi || "",
        tonThucTe: item.tonThucTe || 0,
        ghiChu: item.ghiChu || "",
      })),
    );
    setIsAppendingMode(false);
    setIsCopyMode(true);
    setShowAddModal(true);
  };

  const handleOpenAppendMode = (group?: GroupedPhieuXuat) => {
    const target = group || viewGroupedPhieu;
    if (!target) return;
    setFormMaPhieu(target.maPhieu);
    setFormNgayThang(toISODate(target.ngayThang));
    setFormNguoiNhap(target.nguoiNhap || "");
    setFormNoiDung(target.noiDung || "");
    setFormMaSP(target.maSP || "");
    setFormLenhSX(target.lenhSX || "");
    setFormXuongSX(target.xuongSX || "");
    setSelectedNPLs(
      target.items.map((item) => ({
        id: `existing-${item.id}`,
        existingId: item.id,
        maNPL: item.maNPL,
        dvt: item.dvt || "",
        soLuong: item.soLuong,
        donGia: item.donGia,
        thanhTien: item.thanhTien,
        loaiChiPhi: item.loaiChiPhi || "",
        tonThucTe: item.tonThucTe || 0,
        ghiChu: item.ghiChu || "",
      })),
    );
    setIsAppendingMode(true);
    setIsCopyMode(false);
    setShowAddModal(true);
  };

  const handleOpenReturnModal = () => {
    const nextCode = generateNextMaPhieu("PHNPL");
    setReturnFormMaPhieu(nextCode);
    setReturnFormNgayThang(new Date().toISOString().split("T")[0]);
    setReturnFormNguoiNhap(
      profile?.full_name || profile?.email || getCachedProfileName() || "",
    );
    setReturnFormNoiDung("Hoàn NPL");
    setReturnFormMaSP(viewGroupedPhieu?.maSP || "");
    setReturnFormLenhSX(viewGroupedPhieu?.lenhSX || "");
    setReturnFormXuongSX(viewGroupedPhieu?.xuongSX || "");
    setReturnSelectedNPLs([]);
    setShowReturnModal(true);
  };

  const handleAddNPLToList = (material: any) => {
    console.log("handleAddNPLToList - material:", material);
    console.log("handleAddNPLToList - tonKhoNPLData loaded:", tonKhoNPLData.length, "items");

    // Lấy đơn giá có thuế từ material
    const donGia = material.priceWithTax || material.priceBeforeTax || 0;

    // Lấy tồn cuối từ tồn kho NPL - dùng material.name (tên đầy đủ) để match với sheet
    // material.name = "TM22 Túi zip chip, áo lá" khớp với maNPL trong sheet "Tồn kho NPL kho công ty"
    const tonCuoi = getTonCuoiByMaNPL(material.name);
    console.log("handleAddNPLToList - tonCuoi result:", tonCuoi);

    const newNPL: SelectedNPL = {
      id: `${material.code}-${Date.now()}`,
      maNPL: material.code,
      dvt: material.unit || "",
      soLuong: 1,
      donGia: donGia,
      thanhTien: donGia * 1, // số lượng mặc định = 1
      loaiChiPhi: "",
      tonThucTe: tonCuoi,
      ghiChu: "",
    };

    setSelectedNPLs([...selectedNPLs, newNPL]);
    setNplSearchTerm("");
    setShowNPLDropdown(false);
  };

  const handleRemoveNPLFromList = (id: string) => {
    setSelectedNPLs(selectedNPLs.filter((n) => n.id !== id));
  };

  const handleAddReturnNPLToList = (material: any) => {
    console.log("handleAddReturnNPLToList - material:", material);
    const donGia = material.priceWithTax || material.priceBeforeTax || 0;

    // Lấy tồn cuối từ tồn kho NPL - dùng material.name (tên đầy đủ) để match
    const tonCuoi = getTonCuoiByMaNPL(material.name);
    console.log("handleAddReturnNPLToList - tonCuoi result:", tonCuoi);

    const newNPL: SelectedNPL = {
      id: `${material.code}-${Date.now()}`,
      maNPL: material.code,
      dvt: material.unit || "",
      soLuong: 1,
      donGia: donGia,
      thanhTien: donGia * 1,
      loaiChiPhi: "",
      tonThucTe: tonCuoi,
      ghiChu: "",
    };

    setReturnSelectedNPLs([...returnSelectedNPLs, newNPL]);
    setReturnNplSearchTerm("");
    setShowReturnNPLDropdown(false);
  };

  const handleRemoveReturnNPLFromList = (id: string) => {
    setReturnSelectedNPLs(returnSelectedNPLs.filter((n) => n.id !== id));
  };

  const handleUpdateReturnNPL = (
    id: string,
    field: keyof SelectedNPL,
    value: any,
  ) => {
    setReturnSelectedNPLs(
      returnSelectedNPLs.map((n) => {
        if (n.id !== id) return n;

        const updated = { ...n, [field]: value };

        if (field === "soLuong" || field === "donGia") {
          updated.thanhTien = updated.soLuong * updated.donGia;
        }

        return updated;
      }),
    );
  };

  const calculateReturnTotalThanhTien = () => {
    return returnSelectedNPLs.reduce((sum, n) => sum + n.thanhTien, 0);
  };

  const handleUpdateNPL = (
    id: string,
    field: keyof SelectedNPL,
    value: any
  ) => {
    setSelectedNPLs(
      selectedNPLs.map((n) => {
        if (n.id !== id) return n;

        const updated = { ...n, [field]: value };

        if (field === "soLuong" || field === "donGia") {
          updated.thanhTien = updated.soLuong * updated.donGia;
        }

        return updated;
      })
    );
  };

  const calculateTotalThanhTien = () => {
    return selectedNPLs.reduce((sum, n) => sum + n.thanhTien, 0);
  };

  const handleAddPhieuXuat = async () => {
    if (!formMaPhieu || !formNgayThang) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (selectedNPLs.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 mã NPL");
      return;
    }

    try {
      setIsAdding(true);

      for (const npl of selectedNPLs) {
        if (npl.existingId) {
          try {
            const response = await fetch("/api/xuat-kho-npl/update", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: npl.existingId,
                soLuong: npl.soLuong,
                donGia: npl.donGia,
                loaiChiPhi: npl.loaiChiPhi,
                ghiChu: npl.ghiChu,
              }),
            });
            const result = await response.json();
            if (!result.success) {
              console.error("Update failed:", result);
              toast.error(`Lỗi cập nhật ${npl.maNPL}: ${result.error || "unknown"}`);
            }
          } catch (err: any) {
            console.error("Update request failed:", err);
            toast.error(`Lỗi cập nhật ${npl.maNPL}: ${err?.message || "network"}`);
          }
          continue;
        }

        const phieuData = {
          maPhieu: formMaPhieu,
          ngayThang: formNgayThang,
          nguoiNhap: formNguoiNhap,
          noiDung: formNoiDung,
          maSP: formMaSP,
          lenhSX: formLenhSX,
          xuongSX: formXuongSX,
          maNPL: npl.maNPL,
          dvt: npl.dvt,
          soLuong: npl.soLuong,
          donGia: npl.donGia,
          thanhTien: npl.thanhTien,
          loaiChiPhi: npl.loaiChiPhi,
          tonThucTe: npl.tonThucTe,
          ghiChu: npl.ghiChu,
        };

        const response = await fetch("/api/xuat-kho-npl/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(phieuData),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(`Lỗi khi thêm mã NPL ${npl.maNPL}`);
        }
      }

      await fetchData();
      setShowAddModal(false);
      const newCount = selectedNPLs.filter((n) => !n.existingId).length;
      const updateCount = selectedNPLs.filter((n) => n.existingId).length;
      toast.success(
        isAppendingMode
          ? `Đã lưu phiếu ${formMaPhieu} (${updateCount} cập nhật, ${newCount} thêm mới)`
          : isCopyMode
            ? `Sao chép sang phiếu ${formMaPhieu} thành công (${selectedNPLs.length} mã NPL)`
            : `Thêm phiếu xuất kho ${formMaPhieu} thành công (${selectedNPLs.length} mã NPL)`
      );
      setIsAppendingMode(false);
      setIsCopyMode(false);
    } catch (error) {
      console.error("Error adding phieu xuat:", error);
      toast.error("Lỗi khi thêm phiếu xuất kho");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddPhieuHoan = async () => {
    if (!returnFormMaPhieu || !returnFormNgayThang) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (returnSelectedNPLs.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 mã NPL");
      return;
    }

    try {
      setIsAdding(true);

      for (const npl of returnSelectedNPLs) {
        const phieuData = {
          maPhieu: returnFormMaPhieu,
          ngayThang: returnFormNgayThang,
          nguoiNhap: returnFormNguoiNhap,
          noiDung: returnFormNoiDung,
          maSP: returnFormMaSP,
          lenhSX: returnFormLenhSX,
          xuongSX: returnFormXuongSX,
          maNPL: npl.maNPL,
          dvt: npl.dvt,
          soLuong: -Math.abs(npl.soLuong), // Số lượng âm để hoàn kho
          donGia: npl.donGia,
          thanhTien: -Math.abs(npl.thanhTien), // Thành tiền âm
          loaiChiPhi: npl.loaiChiPhi,
          tonThucTe: npl.tonThucTe,
          ghiChu: npl.ghiChu,
        };

        const response = await fetch("/api/xuat-kho-npl/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(phieuData),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(`Lỗi khi thêm mã NPL ${npl.maNPL}`);
        }
      }

      await fetchData();
      setShowReturnModal(false);
      toast.success(
        `Tạo phiếu hoàn NPL ${returnFormMaPhieu} thành công (${returnSelectedNPLs.length} mã NPL)`,
      );
    } catch (error) {
      console.error("Error adding phieu hoan:", error);
      toast.error("Lỗi khi tạo phiếu hoàn NPL");
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewGrouped = (group: GroupedPhieuXuat) => {
    // Only update URL, let useEffect handle state changes
    const params = new URLSearchParams(searchParams.toString());
    params.set("phieu", group.maPhieu);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleBackToList = () => {
    // Only update URL, let useEffect handle state changes
    const params = new URLSearchParams(searchParams.toString());
    params.delete("phieu");
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  };

  const handleDeleteGrouped = (maPhieu: string) => {
    setPhieuToDelete(maPhieu);
    setShowDeleteModal(true);
  };

  const confirmDeleteGrouped = async () => {
    if (!phieuToDelete) return;

    try {
      setIsDeleting(true);

      // Xoá toàn bộ các dòng của phiếu trong 1 batchUpdate ở server
      // để tránh tình trạng row index bị shift giữa các request.
      const response = await fetch(
        `/api/xuat-kho-npl/delete-phieu?maPhieu=${encodeURIComponent(phieuToDelete)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Lỗi khi xóa phiếu xuất kho");
        return;
      }

      await fetchData();
      setShowDeleteModal(false);
      setPhieuToDelete(null);

      // If we deleted the current viewed phieu, go back to list
      if (viewGroupedPhieu?.maPhieu === phieuToDelete) {
        handleBackToList();
      }

      toast.success(
        `Xóa phiếu xuất kho ${phieuToDelete} thành công (${result.deletedCount} mã NPL)`
      );
    } catch (error) {
      console.error("Error deleting phieu xuat:", error);
      toast.error("Lỗi khi xóa phiếu xuất kho");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteItemModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/xuat-kho-npl/delete?id=${itemToDelete}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        await fetchData();

        if (selectedItemDetail?.id.toString() === itemToDelete) {
          setSelectedItemDetail(null);
        }

        // Update viewGroupedPhieu if it's open
        if (viewGroupedPhieu) {
          const updatedItems = viewGroupedPhieu.items.filter(
            (item) => item.id.toString() !== itemToDelete,
          );
          if (updatedItems.length === 0) {
            handleBackToList();
          } else {
            // Update the viewGroupedPhieu with remaining items
            const updatedGroup = {
              ...viewGroupedPhieu,
              items: updatedItems,
              totalItems: updatedItems.reduce(
                (sum, item) => sum + (item.soLuong || 0),
                0,
              ),
              totalThanhTien: updatedItems.reduce(
                (sum, item) => sum + (item.thanhTien || 0),
                0,
              ),
            };
            setViewGroupedPhieu(updatedGroup);
          }
        }

        setShowDeleteItemModal(false);
        setItemToDelete(null);
        toast.success("Xóa mã NPL thành công");
      } else {
        toast.error("Lỗi khi xóa mã NPL");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Lỗi khi xóa mã NPL");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadJPG = async () => {
    if (!printRef.current || !viewGroupedPhieu) return;

    setIsExporting(true);
    setShowPrintDropdown(false);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `PhieuXuatKho_${viewGroupedPhieu.maPhieu}_${new Date().toISOString().split("T")[0]}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (error) {
      console.error("Error exporting to JPG:", error);
      toast.error("Lỗi khi xuất ảnh");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setShowPrintDropdown(false);

    const printContent = printRef.current;
    if (!printContent || !viewGroupedPhieu) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Phiếu xuất kho - ${viewGroupedPhieu.maPhieu}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Calculate totals
  const totalThanhTien = filteredGroupedPhieu.reduce(
    (sum, group) => sum + group.totalThanhTien,
    0
  );

  // Edit item
  const handleOpenEditItem = (item: XuatKhoNPL) => {
    setEditingItem(item);
    setEditForm({ soLuong: item.soLuong, donGia: item.donGia, loaiChiPhi: item.loaiChiPhi, ghiChu: item.ghiChu });
    setShowEditItemModal(true);
  };

  const handleSaveEditItem = async () => {
    if (!editingItem) return;
    try {
      setIsSavingEdit(true);
      const response = await fetch("/api/xuat-kho-npl/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingItem.id, ...editForm }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật thành công");
        setShowEditItemModal(false);
        setEditingItem(null);
        fetchData();
      } else {
        toast.error(result.error || "Không thể cập nhật");
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Export danh sách PDF
  const handleExportListPDF = () => {
    if (filteredGroupedPhieu.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = filteredGroupedPhieu.map((g, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-weight:600;color:#2563eb;">${g.maPhieu}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${g.ngayThang}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${g.maSP || "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${g.xuongSX || "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${g.totalItems}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;color:green;font-weight:600;">${fmt(g.totalThanhTien)}</td>
    </tr>`).join("");
    printWindow.document.write(`<html><head><title>Danh sách phiếu xuất kho NPL</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:20px; text-align:center; } table { width:100%; border-collapse:collapse; font-size:12px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>DANH SÁCH PHIẾU XUẤT KHO NPL</h1>
      <table><thead><tr><th style="width:30px;">STT</th><th>Mã phiếu</th><th>Ngày</th><th>Mã SP</th><th>Xưởng SX</th><th>Số NPL</th><th style="text-align:right;">Thành tiền</th></tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;"><td colspan="6" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng:</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;color:green;">${fmt(totalThanhTien)}</td></tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleExportListExcel = () => {
    if (filteredGroupedPhieu.length === 0) return;
    const sheetData = filteredGroupedPhieu.map((g, i) => ({
      "STT": i + 1, "Mã phiếu": g.maPhieu, "Ngày tháng": g.ngayThang,
      "Mã SP": g.maSP, "Lệnh SX": g.lenhSX, "Xưởng SX": g.xuongSX,
      "Nội dung": g.noiDung, "Số NPL": g.totalItems, "Thành tiền": g.totalThanhTien,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Xuat kho NPL");
    XLSX.writeFile(wb, "Xuat_kho_NPL.xlsx");
  };

  // Export chi tiết 1 phiếu
  const handleExportDetailPDF = (phieu: GroupedPhieuXuat | null) => {
    if (!phieu) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = phieu.items.map((item, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.maNPL}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.dvt || "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${fmt(item.soLuong)}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">${item.donGia > 0 ? fmt(item.donGia) : "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;font-weight:600;">${item.thanhTien > 0 ? fmt(item.thanhTien) : "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.loaiChiPhi || "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.ghiChu || "-"}</td>
    </tr>`).join("");
    const title = `Phiếu xuất kho NPL - ${phieu.maPhieu}`;
    printWindow.document.write(`<html><head><title>${title}</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:5px; text-align:center; } .info { text-align:center; color:#666; margin-bottom:15px; font-size:13px; } table { width:100%; border-collapse:collapse; font-size:12px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>${title.toUpperCase()}</h1>
      <p class="info">Ngày: ${phieu.ngayThang} | Mã SP: ${phieu.maSP || "-"} | Xưởng: ${phieu.xuongSX || "-"}</p>
      <table><thead><tr><th style="width:30px;">STT</th><th>Mã NPL</th><th>ĐVT</th><th style="text-align:right;">SL</th><th style="text-align:right;">Đơn giá</th><th style="text-align:right;">Thành tiền</th><th>Loại CP</th><th>Ghi chú</th></tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;"><td colspan="5" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng:</td><td style="padding:5px 8px;border:1px solid #ddd;text-align:right;color:green;">${fmt(phieu.totalThanhTien)}</td><td colspan="2"></td></tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleExportDetailExcel = (phieu: GroupedPhieuXuat | null) => {
    if (!phieu) return;
    const sheetData = phieu.items.map((item, i) => ({
      "STT": i + 1, "Mã NPL": item.maNPL, "ĐVT": item.dvt, "SL": item.soLuong,
      "Đơn giá": item.donGia, "Thành tiền": item.thanhTien, "Loại CP": item.loaiChiPhi, "Ghi chú": item.ghiChu,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi tiet");
    XLSX.writeFile(wb, `${phieu.maPhieu}.xlsx`);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            Danh sách phiếu xuất kho NPL ({filteredGroupedPhieu.length})
          </h3>
          <div className="flex-1 max-w-md relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportListPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"><FileDown size={14} /> PDF</button>
          <button onClick={handleExportListExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"><FileSpreadsheet size={14} /> Excel</button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Tạo phiếu xuất kho
          </button>
        </div>
      </div>

      {/* Table - Grouped */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : filteredGroupedPhieu.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không có dữ liệu xuất kho NPL
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-3 text-left font-medium text-gray-500">Mã phiếu</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Ngày</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Lệnh SX</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Xưởng SX</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Số mã NPL</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500">Tổng SL</th>
                <th className="px-3 py-3 text-right font-medium text-gray-500">Tổng tiền</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500">Người nhập</th>
                <th className="px-3 py-3 text-center font-medium text-gray-500 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGroupedPhieu.map((group) => (
                <tr
                  key={group.maPhieu}
                  className="hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleViewGrouped(group)}
                >
                  <td className="px-3 py-3 font-medium text-blue-600">{group.maPhieu}</td>
                  <td className="px-3 py-3 text-gray-600">{group.ngayThang}</td>
                  <td className="px-3 py-3 text-gray-600">{group.lenhSX || "-"}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-[120px] truncate" title={group.xuongSX}>
                    {group.xuongSX || "-"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {group.items.length}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-gray-900">
                    {group.totalItems > 0 ? group.totalItems.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-red-600">
                    {group.totalThanhTien > 0 ? group.totalThanhTien.toLocaleString("vi-VN") + "đ" : "-"}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{group.nguoiNhap || "-"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAppendMode(group);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Sửa"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPhieu(group);
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="Sao chép phiếu"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGrouped(group.maPhieu);
                        }}
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
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={6} className="px-3 py-3 text-right">Tổng cộng:</td>
                <td className="px-3 py-3 text-right text-red-600">
                  {totalThanhTien.toLocaleString("vi-VN")}đ
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal thêm phiếu xuất kho */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setShowAddModal(false); }} />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isAdding && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-70 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-700 font-medium">
                  {isAppendingMode ? "Đang thêm NPL vào phiếu..." : "Đang tạo phiếu xuất kho..."}
                </p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {isAppendingMode ? "Thêm NPL vào phiếu" : isCopyMode ? "Sao chép phiếu xuất kho" : "Tạo phiếu xuất kho mới"}
                </h3>
                <p className="text-sm text-gray-500">Mã phiếu: {formMaPhieu}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAdding}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Form Info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
                  <input
                    type="text"
                    value={formMaPhieu}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tháng</label>
                  <input
                    type="date"
                    value={formNgayThang}
                    onChange={(e) => setFormNgayThang(e.target.value)}
                    readOnly={isAppendingMode}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${isAppendingMode ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:ring-2 focus:ring-blue-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người nhập</label>
                  <input
                    type="text"
                    value={formNguoiNhap}
                    onChange={(e) => setFormNguoiNhap(e.target.value)}
                    readOnly={isAppendingMode}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${isAppendingMode ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:ring-2 focus:ring-blue-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <input
                    type="text"
                    value={formNoiDung}
                    onChange={(e) => setFormNoiDung(e.target.value)}
                    placeholder="Xuất NPL..."
                    readOnly={isAppendingMode}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${isAppendingMode ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:ring-2 focus:ring-blue-500"}`}
                  />
                </div>
              </div>

              {/* Second row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Mã SP - Dropdown with search */}
                <div className="relative" ref={maSPDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã SP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formMaSP}
                      onChange={(e) => {
                        if (isAppendingMode) return;
                        setFormMaSP(e.target.value);
                        setMaSPSearchTerm(e.target.value);
                        setShowMaSPDropdown(true);
                      }}
                      onFocus={() => { if (!isAppendingMode) setShowMaSPDropdown(true); }}
                      readOnly={isAppendingMode}
                      placeholder="Chọn mã sản phẩm..."
                      className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm ${isAppendingMode ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:ring-2 focus:ring-blue-500"}`}
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  {showMaSPDropdown && !isAppendingMode && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy</div>
                      ) : (
                        filteredProducts.slice(0, 50).map((product) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              setFormMaSP(product.maSP);
                              // Tự động tạo lệnh SX từ mã SP + ngày tháng
                              const date = new Date(formNgayThang);
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = String(date.getFullYear()).slice(-2);
                              const lenhSX = `${product.maSP} ${day}/${month}/${year}`;
                              setFormLenhSX(lenhSX);
                              setShowMaSPDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-blue-600">{product.maSP}</div>
                            {product.tenSP && <div className="text-xs text-gray-600">{product.tenSP}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Lệnh SX */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lệnh SX</label>
                  <input
                    type="text"
                    value={formLenhSX}
                    onChange={(e) => setFormLenhSX(e.target.value)}
                    placeholder="Lệnh sản xuất..."
                    readOnly={isAppendingMode}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${isAppendingMode ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:ring-2 focus:ring-blue-500"}`}
                  />
                </div>

                {/* Xưởng SX - Search */}
                <div className="relative" ref={xuongDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xưởng SX</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formXuongSX}
                      onChange={(e) => {
                        if (isAppendingMode) return;
                        setFormXuongSX(e.target.value);
                        setShowXuongDropdown(true);
                      }}
                      onFocus={() => { if (!isAppendingMode) setShowXuongDropdown(true); }}
                      readOnly={isAppendingMode}
                      placeholder="Chọn xưởng sản xuất..."
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${isAppendingMode ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:ring-2 focus:ring-blue-500"}`}
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  {showXuongDropdown && !isAppendingMode && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {xuongSXList
                        .filter((x) => x.name.toLowerCase().includes(formXuongSX.toLowerCase()))
                        .map((xuong) => (
                          <button
                            key={xuong.id}
                            type="button"
                            onClick={() => {
                              setFormXuongSX(xuong.name);
                              setShowXuongDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                          >
                            {xuong.name}
                          </button>
                        ))}
                      {xuongSXList.filter((x) => x.name.toLowerCase().includes(formXuongSX.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Add NPL Section */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                <div className="relative" ref={nplDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thêm mã NPL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nplSearchTerm}
                      onChange={(e) => {
                        setNplSearchTerm(e.target.value);
                        setShowNPLDropdown(true);
                      }}
                      onFocus={() => setShowNPLDropdown(true)}
                      placeholder="Tìm mã NPL..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  {showNPLDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMaterials.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Không tìm thấy</div>
                      ) : (
                        filteredMaterials.slice(0, 50).map((material) => (
                          <div
                            key={material.id}
                            onClick={() => handleAddNPLToList(material)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-blue-600">{material.code}</div>
                            <div className="text-xs text-gray-600">{material.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              ĐVT: {material.unit || "-"} | Giá: {material.priceWithTax ? material.priceWithTax.toLocaleString("vi-VN") + "đ" : "-"}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected NPLs Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã NPL ({selectedNPLs.length})
                  </h4>
                </div>
                {selectedNPLs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có mã NPL nào. Tìm và thêm mã NPL ở trên.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">STT</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mã NPL</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">ĐVT</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">SL</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Đơn giá</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-yellow-100">Thành tiền</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Loại CP</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">Tồn TT</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ghi chú</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedNPLs.map((npl, index) => (
                          <tr key={npl.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-3 py-2 text-sm font-medium text-blue-600">{npl.maNPL}</td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.dvt}
                                onChange={(e) => handleUpdateNPL(npl.id, "dvt", e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.soLuong || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  handleUpdateNPL(npl.id, "soLuong", parseInt(value) || 0);
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.donGia || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  handleUpdateNPL(npl.id, "donGia", parseInt(value) || 0);
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium bg-yellow-50">
                              {npl.thanhTien.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={npl.loaiChiPhi}
                                onChange={(e) => handleUpdateNPL(npl.id, "loaiChiPhi", e.target.value)}
                                className="w-40 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                              >
                                <option value="">-- Chọn loại CP --</option>
                                {LOAI_CHI_PHI_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.tonThucTe || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "");
                                  handleUpdateNPL(npl.id, "tonThucTe", parseInt(value) || 0);
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.ghiChu}
                                onChange={(e) => handleUpdateNPL(npl.id, "ghiChu", e.target.value)}
                                placeholder="Ghi chú"
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleRemoveNPLFromList(npl.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-sm font-medium text-right">Tổng thành tiền:</td>
                          <td className="px-3 py-2 text-sm text-right font-semibold text-red-600">
                            {calculateTotalThanhTien().toLocaleString("vi-VN")}đ
                          </td>
                          <td colSpan={4}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isAdding}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddPhieuXuat}
                disabled={isAdding || selectedNPLs.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAppendingMode ? "Đang thêm..." : "Đang tạo..."}
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    {isAppendingMode
                      ? `Thêm vào phiếu (${selectedNPLs.length} mã NPL)`
                      : isCopyMode
                        ? `Xác nhận sao chép (${selectedNPLs.length} mã NPL)`
                        : `Tạo phiếu xuất kho (${selectedNPLs.length} mã NPL)`}
                  </>
                )}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Detail View - Full page overlay */}
      {currentView === "detail" && viewGroupedPhieu && (
        <Portal>
          <div className="fixed top-0 right-0 bottom-0 left-64 z-40 bg-gray-50 overflow-y-auto">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4">
              {/* Back button on top */}
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 -ml-2 px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mb-3"
              >
                <ArrowLeft size={28} />
              </button>
              {/* Title and action button below */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Chi tiết phiếu xuất kho
                  </h3>
                  <p className="text-sm text-gray-500">
                    {viewGroupedPhieu.maPhieu}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleExportDetailPDF(viewGroupedPhieu)} className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"><FileDown size={16} /> PDF</button>
                  <button onClick={() => handleExportDetailExcel(viewGroupedPhieu)} className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"><FileSpreadsheet size={16} /> Excel</button>
                  <div className="relative">
                    <button
                      onClick={() => setShowPrintDropdown(!showPrintDropdown)}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xuất...
                        </>
                      ) : (
                        <>
                          <Printer size={18} />
                          In / Tải xuống
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                    {showPrintDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowPrintDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <button
                            onClick={handleDownloadJPG}
                            className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
                          >
                            <Download size={18} className="text-green-600" />
                            <span>Tải xuống JPG</span>
                          </button>
                          <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-b-lg border-t border-gray-100"
                          >
                            <Printer size={18} className="text-blue-600" />
                            <span>In qua máy in</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenAppendMode()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Plus size={20} />
                    Thêm NPL
                  </button>
                  <button
                    onClick={handleOpenReturnModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium"
                  >
                    <RotateCcw size={20} />
                    Phiếu hoàn NPL
                  </button>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="p-8">
              {/* Header Info */}
              <div className="grid grid-cols-4 gap-6 mb-6 p-5 bg-white rounded-xl shadow-sm">
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    Mã phiếu:
                  </span>
                  <p className="font-semibold text-blue-600 text-lg">
                    {viewGroupedPhieu.maPhieu}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    Ngày tháng:
                  </span>
                  <p className="font-medium text-lg">
                    {viewGroupedPhieu.ngayThang}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    Người nhập:
                  </span>
                  <p className="font-medium text-lg">
                    {viewGroupedPhieu.nguoiNhap || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    Nội dung:
                  </span>
                  <p className="font-medium text-lg">
                    {viewGroupedPhieu.noiDung || "-"}
                  </p>
                </div>
              </div>

              {/* Production Info */}
              <div className="grid grid-cols-3 gap-6 mb-6 p-5 bg-white rounded-xl shadow-sm">
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    Mã SP:
                  </span>
                  <p className="font-medium text-lg">
                    {viewGroupedPhieu.maSP || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    Lệnh SX:
                  </span>
                  <p className="font-medium text-lg">
                    {viewGroupedPhieu.lenhSX || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block mb-1">
                    Xưởng SX:
                  </span>
                  <p className="font-medium text-lg">
                    {viewGroupedPhieu.xuongSX || "-"}
                  </p>
                </div>
              </div>

              {/* NPL Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-yellow-50 px-5 py-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 text-lg">
                    Danh sách mã NPL ({viewGroupedPhieu.items.length})
                    <span className="ml-3 text-blue-600 font-medium">
                      - Tổng SL:{" "}
                      {viewGroupedPhieu.totalItems.toLocaleString("vi-VN")}
                    </span>
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-4 text-left text-sm font-medium text-gray-500 w-16">
                          STT
                        </th>
                        <th className="px-5 py-4 text-left text-sm font-medium text-gray-500">
                          Mã NPL
                        </th>
                        <th className="px-5 py-4 text-center text-sm font-medium text-gray-500 w-28">
                          ĐVT
                        </th>
                        <th className="px-5 py-4 text-right text-sm font-medium text-gray-500 w-28">
                          SL
                        </th>
                        <th className="px-5 py-4 text-right text-sm font-medium text-gray-500 w-36">
                          Đơn giá
                        </th>
                        <th className="px-5 py-4 text-right text-sm font-medium text-gray-500 bg-yellow-100 w-40">
                          Thành tiền
                        </th>
                        <th className="px-5 py-4 text-left text-sm font-medium text-gray-500">
                          Loại CP
                        </th>
                        <th className="px-5 py-4 text-center text-sm font-medium text-gray-500 w-24">
                          Tồn TT
                        </th>
                        <th className="px-5 py-4 text-left text-sm font-medium text-gray-500">
                          Ghi chú
                        </th>
                        <th className="px-5 py-4 text-center text-sm font-medium text-gray-500 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewGroupedPhieu.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`cursor-pointer transition-colors ${selectedItemDetail?.id === item.id ? "bg-blue-100" : "hover:bg-gray-50"}`}
                          onClick={() =>
                            setSelectedItemDetail(
                              selectedItemDetail?.id === item.id ? null : item,
                            )
                          }
                        >
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-blue-600">
                            {item.maNPL}
                          </td>
                          <td className="px-5 py-4 text-sm text-center">
                            {item.dvt || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-right font-medium">
                            {item.soLuong.toLocaleString("vi-VN")}
                          </td>
                          <td className="px-5 py-4 text-sm text-right">
                            {item.donGia > 0
                              ? item.donGia.toLocaleString("vi-VN")
                              : "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-right font-semibold bg-yellow-50">
                            {item.thanhTien > 0
                              ? item.thanhTien.toLocaleString("vi-VN")
                              : "-"}
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {item.loaiChiPhi || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-center">
                            {item.tonThucTe.toLocaleString("vi-VN")}
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {item.ghiChu || "-"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id.toString()); }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-4 text-sm font-semibold text-right"
                        >
                          Tổng thành tiền:
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-red-600 text-lg">
                          {viewGroupedPhieu.totalThanhTien.toLocaleString(
                            "vi-VN",
                          )}
                          đ
                        </td>
                        <td colSpan={4}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Chi tiết item được chọn */}
              {selectedItemDetail && (
                <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="font-semibold text-blue-800 text-xl">
                      Chi tiết mã NPL
                    </h4>
                    <button
                      onClick={() => setSelectedItemDetail(null)}
                      className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Mã NPL
                      </span>
                      <p className="font-semibold text-blue-600 text-lg">
                        {selectedItemDetail.maNPL}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Đơn vị tính
                      </span>
                      <p className="font-medium text-lg">
                        {selectedItemDetail.dvt || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Số lượng
                      </span>
                      <p className="font-medium text-lg">
                        {selectedItemDetail.soLuong?.toLocaleString("vi-VN") ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Đơn giá
                      </span>
                      <p className="font-medium text-lg">
                        {selectedItemDetail.donGia > 0
                          ? selectedItemDetail.donGia.toLocaleString(
                              "vi-VN",
                            ) + "đ"
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Thành tiền
                      </span>
                      <p className="font-bold text-red-600 text-lg">
                        {selectedItemDetail.thanhTien > 0
                          ? selectedItemDetail.thanhTien.toLocaleString("vi-VN") +
                            "đ"
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Loại chi phí
                      </span>
                      <p className="font-medium text-lg">
                        {selectedItemDetail.loaiChiPhi || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Tồn thực tế
                      </span>
                      <p className="font-medium text-lg">
                        {selectedItemDetail.tonThucTe?.toLocaleString("vi-VN") ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Ghi chú
                      </span>
                      <p className="font-medium text-lg">
                        {selectedItemDetail.ghiChu || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Printable content - Hidden but used for export */}
            <div className="absolute left-[-9999px] top-0">
              <div
                ref={printRef}
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  padding: "15mm",
                  backgroundColor: "#fff",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ef4444 50%, #000 50%)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>CÔNG TY CỔ PHẦN RIOMIO</div>
                      <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>B12 T17 Nguyễn Sơn Hà, KĐT Văn Quán, Phúc La, Hà Đông, Hà Nội</div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0", textTransform: "uppercase" }}>PHIẾU XUẤT KHO NGUYÊN PHỤ LIỆU</h2>
                </div>

                {/* Info Row */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "12px" }}>
                  <div>
                    <span style={{ fontWeight: "600" }}>Mã phiếu: </span>
                    <span>{viewGroupedPhieu.maPhieu}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: "600" }}>Ngày XK: </span>
                    <span>{viewGroupedPhieu.ngayThang}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: "600" }}>Xưởng sản xuất: </span>
                    <span>{viewGroupedPhieu.xuongSX || "-"}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: "600" }}>Xưởng may Chi Thu</span>
                  </div>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#86BC42" }}>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: "bold", width: "40px" }}>STT</th>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "left", fontWeight: "bold" }}>Mã nguyên phụ liệu</th>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: "bold", width: "60px" }}>ĐVT</th>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: "bold", width: "80px" }}>Số lượng</th>
                      <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: "bold", width: "120px" }}>Mã SP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewGroupedPhieu.items.map((item, index) => (
                      <tr key={item.id}>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{index + 1}</td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}>{item.maNPL}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{item.dvt || "-"}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{item.soLuong.toLocaleString("vi-VN")}</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{viewGroupedPhieu.maSP || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa item NPL */}
      {showEditItemModal && editingItem && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-lg font-semibold">Sửa mã NPL</h3>
                  <p className="text-sm text-gray-500">{editingItem.maNPL}</p>
                </div>
                <button onClick={() => setShowEditItemModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                  <input type="number" value={editForm.soLuong} onChange={(e) => setEditForm({ ...editForm, soLuong: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá</label>
                  <input type="number" value={editForm.donGia} onChange={(e) => setEditForm({ ...editForm, donGia: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-500">Thành tiền: </span>
                  <span className="font-semibold text-green-600">{(editForm.soLuong * editForm.donGia).toLocaleString("vi-VN")}đ</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại chi phí</label>
                  <select value={editForm.loaiChiPhi} onChange={(e) => setEditForm({ ...editForm, loaiChiPhi: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Chọn loại chi phí</option>
                    <option value="CP QLDN">CP QLDN</option>
                    <option value="Giá thành">Giá thành</option>
                    <option value="CP bán hàng">CP bán hàng</option>
                    <option value="CP rủi ro SX">CP rủi ro SX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <input type="text" value={editForm.ghiChu} onChange={(e) => setEditForm({ ...editForm, ghiChu: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button onClick={() => setShowEditItemModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                  <button onClick={handleSaveEditItem} disabled={isSavingEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    {isSavingEdit && <Loader2 className="animate-spin" size={16} />}
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa phiếu */}
      {showDeleteModal && phieuToDelete && (
        <Portal>
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">
                  Xác nhận xóa phiếu xuất kho
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPhieuToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-700 mb-2">
                Bạn có chắc chắn muốn xóa phiếu xuất kho{" "}
                <span className="font-semibold text-blue-600">
                  {phieuToDelete}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPhieuToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteGrouped}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal phiếu hoàn NPL */}
      {showReturnModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => {
              setShowReturnModal(false);
            }}
          />
          <div className="fixed inset-4 lg:inset-8 z-60 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isAdding && (
              <div className="fixed inset-4 lg:inset-8 bg-white/80 z-70 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                <p className="text-gray-700 font-medium">
                  Đang tạo phiếu hoàn NPL...
                </p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Tạo phiếu hoàn NPL
                </h3>
                <p className="text-sm text-gray-500">
                  Mã phiếu: {returnFormMaPhieu}
                </p>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                disabled={isAdding}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Form Info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã phiếu
                  </label>
                  <input
                    type="text"
                    value={returnFormMaPhieu}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng
                  </label>
                  <input
                    type="date"
                    value={returnFormNgayThang}
                    onChange={(e) => setReturnFormNgayThang(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người hoàn
                  </label>
                  <input
                    type="text"
                    value={returnFormNguoiNhap}
                    onChange={(e) => setReturnFormNguoiNhap(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung
                  </label>
                  <input
                    type="text"
                    value={returnFormNoiDung}
                    onChange={(e) => setReturnFormNoiDung(e.target.value)}
                    placeholder="Hoàn NPL..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              {/* Second row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã SP
                  </label>
                  <input
                    type="text"
                    value={returnFormMaSP}
                    onChange={(e) => setReturnFormMaSP(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lệnh SX
                  </label>
                  <input
                    type="text"
                    value={returnFormLenhSX}
                    onChange={(e) => setReturnFormLenhSX(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div className="relative" ref={returnXuongDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xưởng SX
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={returnFormXuongSX}
                      onChange={(e) => {
                        setReturnFormXuongSX(e.target.value);
                        setShowReturnXuongDropdown(true);
                      }}
                      onFocus={() => setShowReturnXuongDropdown(true)}
                      placeholder="Chọn xưởng sản xuất..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  {showReturnXuongDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {xuongSXList
                        .filter((x) => x.name.toLowerCase().includes(returnFormXuongSX.toLowerCase()))
                        .map((xuong) => (
                          <button
                            key={xuong.id}
                            type="button"
                            onClick={() => {
                              setReturnFormXuongSX(xuong.name);
                              setShowReturnXuongDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 border-b border-gray-100 last:border-0"
                          >
                            {xuong.name}
                          </button>
                        ))}
                      {xuongSXList.filter((x) => x.name.toLowerCase().includes(returnFormXuongSX.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Add NPL Section */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                <div className="relative" ref={returnNplDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thêm mã NPL cần hoàn
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={returnNplSearchTerm}
                      onChange={(e) => {
                        setReturnNplSearchTerm(e.target.value);
                        setShowReturnNPLDropdown(true);
                      }}
                      onFocus={() => setShowReturnNPLDropdown(true)}
                      placeholder="Tìm mã NPL..."
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <Search
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                  {showReturnNPLDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredReturnMaterials.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Không tìm thấy
                        </div>
                      ) : (
                        filteredReturnMaterials.slice(0, 50).map((material) => (
                          <div
                            key={material.id}
                            onClick={() => handleAddReturnNPLToList(material)}
                            className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-purple-600">
                              {material.code}
                            </div>
                            <div className="text-xs text-gray-600">
                              {material.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ĐVT: {material.unit || "-"} | Giá:{" "}
                              {material.priceWithTax
                                ? material.priceWithTax.toLocaleString(
                                    "vi-VN",
                                  ) + "đ"
                                : "-"}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected NPLs Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Danh sách mã NPL cần hoàn ({returnSelectedNPLs.length})
                  </h4>
                </div>
                {returnSelectedNPLs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có mã NPL nào. Tìm và thêm mã NPL cần hoàn ở trên.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">
                            STT
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Mã NPL
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">
                            ĐVT
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-24">
                            SL hoàn
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                            Đơn giá
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 bg-purple-100">
                            Thành tiền
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Loại CP
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Ghi chú
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {returnSelectedNPLs.map((npl, index) => (
                          <tr key={npl.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-purple-600">
                              {npl.maNPL}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.dvt}
                                onChange={(e) =>
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "dvt",
                                    e.target.value,
                                  )
                                }
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.soLuong || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "soLuong",
                                    parseInt(value) || 0,
                                  );
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={npl.donGia || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "donGia",
                                    parseInt(value) || 0,
                                  );
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium bg-purple-50">
                              {npl.thanhTien.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={npl.loaiChiPhi}
                                onChange={(e) =>
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "loaiChiPhi",
                                    e.target.value,
                                  )
                                }
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                              >
                                <option value="">-- Chọn --</option>
                                {LOAI_CHI_PHI_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={npl.ghiChu}
                                onChange={(e) =>
                                  handleUpdateReturnNPL(
                                    npl.id,
                                    "ghiChu",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ghi chú"
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() =>
                                  handleRemoveReturnNPLFromList(npl.id)
                                }
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-2 text-sm font-medium text-right"
                          >
                            Tổng thành tiền hoàn:
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-semibold text-purple-600">
                            {calculateReturnTotalThanhTien().toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowReturnModal(false)}
                disabled={isAdding}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddPhieuHoan}
                disabled={isAdding || returnSelectedNPLs.length === 0}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <RotateCcw size={18} />
                    Tạo phiếu hoàn NPL ({returnSelectedNPLs.length} mã NPL)
                  </>
                )}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xác nhận xóa item */}
      {showDeleteItemModal && itemToDelete && (
        <Portal>
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">
                  Xác nhận xóa mã NPL
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteItemModal(false);
                    setItemToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-700 mb-2">
                Bạn có chắc chắn muốn xóa mã NPL này khỏi phiếu xuất kho?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteItemModal(false);
                    setItemToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteItem}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
