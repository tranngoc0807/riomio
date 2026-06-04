"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  Printer,
  Download,
} from "lucide-react";
import { DongTien } from "@/lib/googleSheets";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import ConfirmModal from "@/components/ConfirmModal";
import EditHistoryButton from "@/components/EditHistoryButton";
import { useCompanyConfig } from "@/context/CompanyConfigContext";

const formatNumberInput = (value: string): string => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumberInput = (value: string): string =>
  String(value ?? "").replace(/\D/g, "");

const docSoTienVN = (n: number): string => {
  if (!n || n <= 0) return "Không đồng";
  const dv = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  const readBlock = (num: number, fullForm: boolean): string => {
    const tram = Math.floor(num / 100);
    const chuc = Math.floor((num % 100) / 10);
    const dvi = num % 10;
    let s = "";
    if (fullForm || tram > 0) {
      s += dv[tram] + " trăm";
      if (chuc === 0 && dvi > 0) s += " linh";
    }
    if (chuc > 1) {
      s += " " + dv[chuc] + " mươi";
      if (dvi === 1) s += " mốt";
      else if (dvi === 5) s += " lăm";
      else if (dvi > 0) s += " " + dv[dvi];
    } else if (chuc === 1) {
      s += " mười";
      if (dvi === 5) s += " lăm";
      else if (dvi > 0) s += " " + dv[dvi];
    } else if (dvi > 0) {
      s += (fullForm || tram > 0 ? " " : "") + dv[dvi];
    }
    return s.trim();
  };

  const ty = Math.floor(n / 1_000_000_000);
  const trieu = Math.floor((n / 1_000_000) % 1000);
  const nghin = Math.floor((n / 1000) % 1000);
  const donVi = n % 1000;

  const parts: string[] = [];
  if (ty > 0) parts.push(readBlock(ty, false) + " tỷ");
  if (trieu > 0) parts.push(readBlock(trieu, ty > 0) + " triệu");
  if (nghin > 0) parts.push(readBlock(nghin, ty > 0 || trieu > 0) + " nghìn");
  if (donVi > 0)
    parts.push(readBlock(donVi, ty > 0 || trieu > 0 || nghin > 0));

  const result = parts.join(" ").replace(/\s+/g, " ").trim() + " đồng";
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const phieuThuChiPrintStyles = `
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,'Helvetica Neue',sans-serif;color:#111;padding:32px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .sheet{max-width:780px;margin:0 auto;border:1px solid #d1d5db;}
  .sheet table{width:100%;border-collapse:collapse;}
  .sheet td{border:1px solid #d1d5db;padding:8px 12px;vertical-align:middle;font-size:14px;}
  .header-row td{background:#fff;text-align:left;padding:14px 16px;}
  .logo{display:block;max-width:90px;max-height:90px;object-fit:contain;margin-bottom:8px;}
  .company-name{font-weight:700;font-size:16px;}
  .company-addr{font-size:13px;margin-top:2px;color:#1f2937;}
  .title-cell{text-align:center;font-size:22px;font-weight:700;letter-spacing:1px;padding:14px 12px;}
  .label{width:230px;color:#111;}
  .label-right{text-align:left;}
  .value-strong{font-weight:700;}
  .so-tien{font-weight:700;font-size:15px;}
  .viet-bang-chu{font-style:italic;}
  .signatures{margin-top:0;}
  .signatures td{height:120px;text-align:center;vertical-align:top;padding-top:10px;}
  .sig-title{font-weight:700;font-size:14px;}
  .sig-note{font-style:italic;font-size:12px;color:#374151;margin-top:2px;}
  @media print{body{padding:0;}}
`;

export default function DongTienTab() {
  const { config: companyConfig } = useCompanyConfig();
  const [dongTienList, setDongTienList] = useState<DongTien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhieuThuModal, setShowPhieuThuModal] = useState(false);
  const [showPhieuChiModal, setShowPhieuChiModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DongTien | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<DongTien | null>(null);
  const detailPrintRef = useRef<HTMLDivElement>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);

  // Dropdown options
  const [taiKhoanOptions, setTaiKhoanOptions] = useState<string[]>([]);
  const [phanLoaiOptions, setPhanLoaiOptions] = useState<{ loaiPhieu: string; noiDung: string }[]>([]);
  const [nccNPLOptions, setNccNPLOptions] = useState<string[]>([]);
  const [xuongSXOptions, setXuongSXOptions] = useState<string[]>([]);
  const [vanChuyenOptions, setVanChuyenOptions] = useState<string[]>([]);
  const [khachHangOptions, setKhachHangOptions] = useState<string[]>([]);
  const [nccHinhInOptions, setNccHinhInOptions] = useState<string[]>([]);
  const [caNhanToChucChoVayOptions, setCaNhanToChucChoVayOptions] = useState<
    string[]
  >([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Scroll state for sticky column border
  const [showBorder, setShowBorder] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    ngayThang: new Date().toISOString().split("T")[0],
    tenTK: "",
    nccNPL: "",
    xuongSX: "",
    chiVanChuyen: "",
    thuTienHang: "",
    thuKhac: "",
    chiKhac: "",
    maPhieuThu: "",
    maPhieuChi: "",
    doiTuong: "",
    noiDung: "",
    phanLoaiThuChi: "",
    tongThu: "",
    tongChi: "",
    ghiChu: "",
    nccHinhIn: "",
    caNhanToChucChoVay: "",
  });

  useEffect(() => {
    fetchDongTien();
    fetchDropdownOptions();
  }, []);

  const fetchDropdownOptions = async () => {
    try {
      const response = await fetch("/api/dong-tien-options");
      const result = await response.json();

      if (result.success) {
        setTaiKhoanOptions(result.data.taiKhoan);
        setPhanLoaiOptions(result.data.phanLoaiThuChi);
        setNccNPLOptions(result.data.nccNPL);
        setXuongSXOptions(result.data.xuongSX);
        setVanChuyenOptions(result.data.vanChuyen);
        setKhachHangOptions(result.data.khachHang);
        setNccHinhInOptions(result.data.nccHinhIn || []);
        setCaNhanToChucChoVayOptions(result.data.caNhanToChucChoVay || []);
      } else {
        toast.error(result.error || "Không thể tải tùy chọn dropdown");
      }
    } catch (err: any) {
      console.error("Error fetching dropdown options:", err);
      toast.error("Đã xảy ra lỗi khi tải tùy chọn");
    }
  };

  useEffect(() => {
    const checkScrollAndUpdateBorder = () => {
      const scrollContainer = document.querySelector(
        ".table-scroll-container",
      ) as HTMLElement;
      if (!scrollContainer) {
        setShowBorder(false);
        return;
      }

      const scrollLeft = scrollContainer.scrollLeft;
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;

      // Can scroll: table is wider than container
      const canScroll = scrollWidth > clientWidth;

      // At end: scrolled to the right end
      const isAtEnd = Math.abs(scrollWidth - clientWidth - scrollLeft) < 5;

      // Show border when can scroll AND NOT at end (meaning there's more content to scroll to)
      const shouldShowBorder = canScroll && !isAtEnd;

      setShowBorder(shouldShowBorder);
    };

    const handleScroll = () => {
      checkScrollAndUpdateBorder();
    };

    const handleResize = () => {
      checkScrollAndUpdateBorder();
    };

    // Check multiple times with increasing delays to ensure DOM is ready
    const timeoutIds = [
      setTimeout(checkScrollAndUpdateBorder, 100),
      setTimeout(checkScrollAndUpdateBorder, 300),
      setTimeout(checkScrollAndUpdateBorder, 500),
    ];

    const scrollContainer = document.querySelector(".table-scroll-container");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id));
        scrollContainer.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
      };
    }

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
    };
  }, [dongTienList]);

  const fetchDongTien = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/dong-tien");
      const result = await response.json();

      if (result.success) {
        setDongTienList(result.data);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu dòng tiền");
      }
    } catch (err: any) {
      console.error("Error fetching dong tien:", err);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const getNextMaPhieuThu = (): string => {
    const ptCodes = dongTienList
      .map(item => item.maPhieuThu)
      .filter(code => code && code.toUpperCase().startsWith('PT'))
      .map(code => {
        const match = code.match(/PT(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      });

    const maxNumber = ptCodes.length > 0 ? Math.max(...ptCodes) : 0;
    return `PT${String(maxNumber + 1).padStart(2, '0')}`;
  };

  const getNextMaPhieuChi = (): string => {
    const pcCodes = dongTienList
      .map(item => item.maPhieuChi)
      .filter(code => code && code.toUpperCase().startsWith('PC'))
      .map(code => {
        const match = code.match(/PC(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      });

    const maxNumber = pcCodes.length > 0 ? Math.max(...pcCodes) : 0;
    return `PC${String(maxNumber + 1).padStart(2, '0')}`;
  };

  const handleOpenPhieuThu = () => {
    const nextMa = getNextMaPhieuThu();
    setFormData({
      ngayThang: new Date().toISOString().split("T")[0],
      tenTK: "",
      nccNPL: "",
      xuongSX: "",
      chiVanChuyen: "",
      thuTienHang: "",
      thuKhac: "",
      chiKhac: "",
      maPhieuThu: nextMa,
      maPhieuChi: "",
      doiTuong: "",
      noiDung: "",
      phanLoaiThuChi: "",
      tongThu: "",
      tongChi: "",
      ghiChu: "",
      nccHinhIn: "",
      caNhanToChucChoVay: "",
    });
    setEditingItem(null);
    setShowPhieuThuModal(true);
  };

  const handleOpenPhieuChi = () => {
    const nextMa = getNextMaPhieuChi();
    setFormData({
      ngayThang: new Date().toISOString().split("T")[0],
      tenTK: "",
      nccNPL: "",
      xuongSX: "",
      chiVanChuyen: "",
      thuTienHang: "",
      thuKhac: "",
      chiKhac: "",
      maPhieuThu: "",
      maPhieuChi: nextMa,
      doiTuong: "",
      noiDung: "",
      phanLoaiThuChi: "",
      tongThu: "",
      tongChi: "",
      ghiChu: "",
      nccHinhIn: "",
      caNhanToChucChoVay: "",
    });
    setEditingItem(null);
    setShowPhieuChiModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required dropdown fields (only Tên TK and Phân loại thu chi are required)
    if (!formData.tenTK || !formData.phanLoaiThuChi) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc (Tên TK và Phân loại thu chi)");
      setIsLoading(false);
      return;
    }

    try {
      const url = "/api/dong-tien";
      const method = editingItem ? "PUT" : "POST";

      // Keep all fields as strings (including thu khac, chi khac, tong thu, tong chi)
      // Ensure only one of maPhieuThu or maPhieuChi is filled
      const payload = {
        ...formData,
        // If this is from Phiếu Thu modal, clear maPhieuChi
        maPhieuChi: showPhieuThuModal ? "" : formData.maPhieuChi,
        // If this is from Phiếu Chi modal, clear maPhieuThu
        maPhieuThu: showPhieuChiModal ? "" : formData.maPhieuThu,
      };

      const body = editingItem
        ? { ...payload, rowIndex: editingItem.rowIndex }
        : payload;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setDongTienList(result.data);
        handleCloseModal();
        toast.success(
          editingItem
            ? "Cập nhật dòng tiền thành công"
            : "Thêm dòng tiền thành công",
        );
      } else {
        toast.error(result.error || "Không thể lưu dòng tiền");
      }
    } catch (err: any) {
      console.error("Error saving dong tien:", err);
      toast.error("Đã xảy ra lỗi khi lưu dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (rowIndex: number) => {
    setDeletingRowIndex(rowIndex);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deletingRowIndex === null) return;

    toast.promise(
      (async () => {
        const response = await fetch(`/api/dong-tien?rowIndex=${deletingRowIndex}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          setDongTienList(result.data);
          setShowDeleteConfirm(false);
          setDeletingRowIndex(null);
          return result;
        } else {
          throw new Error(result.error || "Không thể xóa dòng tiền");
        }
      })(),
      {
        loading: "Đang xóa...",
        success: "Xóa dòng tiền thành công",
        error: (err) => err.message || "Đã xảy ra lỗi khi xóa dữ liệu",
      },
    );
  };

  const handleEdit = (item: DongTien) => {
    setEditingItem(item);
    setFormData({
      ngayThang: item.ngayThang,
      tenTK: item.tenTK,
      nccNPL: item.nccNPL,
      xuongSX: item.xuongSX,
      chiVanChuyen: item.chiVanChuyen,
      thuTienHang: item.thuTienHang,
      thuKhac: String(item.thuKhac || ""),
      chiKhac: String(item.chiKhac || ""),
      maPhieuThu: item.maPhieuThu || "",
      maPhieuChi: item.maPhieuChi || "",
      doiTuong: item.doiTuong,
      noiDung: item.noiDung,
      phanLoaiThuChi: item.phanLoaiThuChi,
      tongThu: String(item.tongThu || ""),
      tongChi: String(item.tongChi || ""),
      ghiChu: item.ghiChu,
      nccHinhIn: item.nccHinhIn || "",
      caNhanToChucChoVay: item.caNhanToChucChoVay || "",
    });
    // Open the appropriate modal based on which code exists
    if (item.maPhieuThu && item.maPhieuThu.toUpperCase().startsWith('PT')) {
      setShowPhieuThuModal(true);
    } else if (item.maPhieuChi && item.maPhieuChi.toUpperCase().startsWith('PC')) {
      setShowPhieuChiModal(true);
    } else {
      // Default to Phiếu Thu if unclear
      setShowPhieuThuModal(true);
    }
  };

  const handleView = (item: DongTien) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      ngayThang: new Date().toISOString().split("T")[0],
      tenTK: "",
      nccNPL: "",
      xuongSX: "",
      chiVanChuyen: "",
      thuTienHang: "",
      thuKhac: "",
      chiKhac: "",
      maPhieuThu: "",
      maPhieuChi: "",
      doiTuong: "",
      noiDung: "",
      phanLoaiThuChi: "",
      tongThu: "",
      tongChi: "",
      ghiChu: "",
      nccHinhIn: "",
      caNhanToChucChoVay: "",
    });
  };

  const handleCloseModal = () => {
    setShowPhieuThuModal(false);
    setShowPhieuChiModal(false);
    resetForm();
  };

  const buildPhieuThuChiHTML = (item: DongTien): string => {
    const fmt = (v: number) => (v || 0).toLocaleString("vi-VN");
    const isPhieuThu = !!item.maPhieuThu;
    const maPhieu = item.maPhieuThu || item.maPhieuChi || "";
    const tieuDe = isPhieuThu ? "PHIẾU THU" : "PHIẾU CHI";
    const labelNguoi = isPhieuThu
      ? "Họ và tên người nộp tiền:"
      : "Họ và tên người nhận tiền:";
    const labelLyDo = isPhieuThu ? "Lý do nộp:" : "Lý do chi:";
    const labelSig = isPhieuThu ? "Người nộp tiền" : "Người nhận tiền";
    const soTien = isPhieuThu ? item.tongThu : item.tongChi;
    const logoSrc =
      companyConfig.logo && companyConfig.logo.trim() !== ""
        ? companyConfig.logo
        : `${window.location.origin}/logo_riomio.jpg`;
    const companyName = (companyConfig.name || "").toUpperCase();
    const companyAddress = companyConfig.address || "";
    const nguoiNopNhan = item.doiTuong || item.thuTienHang || item.nccNPL || "";
    const lyDo = item.noiDung || "";

    return `
      <div class="sheet">
        <table>
          <tr class="header-row">
            <td colspan="4">
              <img src="${logoSrc}" class="logo" crossorigin="anonymous" />
              <div class="company-name">${companyName}</div>
              <div class="company-addr">${companyAddress}</div>
            </td>
          </tr>
          <tr><td colspan="4" class="title-cell">${tieuDe}</td></tr>
          <tr>
            <td class="label">Số phiếu:</td>
            <td class="value-strong">${maPhieu}</td>
            <td colspan="2">Quỹ: ${item.tenTK || ""}</td>
          </tr>
          <tr>
            <td class="label">Ngày tháng:</td>
            <td colspan="3">${item.ngayThang || ""}</td>
          </tr>
          <tr>
            <td class="label">${labelNguoi}</td>
            <td colspan="3" class="value-strong">${nguoiNopNhan}</td>
          </tr>
          <tr>
            <td class="label">Địa chỉ:</td>
            <td colspan="3"></td>
          </tr>
          <tr>
            <td class="label">${labelLyDo}</td>
            <td colspan="3">${lyDo}</td>
          </tr>
          <tr>
            <td class="label">Số tiền:</td>
            <td colspan="3" class="so-tien">${fmt(soTien)} đ</td>
          </tr>
          <tr>
            <td class="label">Viết bằng chữ:</td>
            <td colspan="3" class="viet-bang-chu">${docSoTienVN(soTien)}</td>
          </tr>
        </table>
        <table class="signatures">
          <tr>
            <td><div class="sig-title">Giám đốc</div><div class="sig-note">(Kí, họ tên)</div></td>
            <td><div class="sig-title">Kế toán trưởng</div><div class="sig-note">(Kí, họ tên)</div></td>
            <td><div class="sig-title">Thủ quỹ</div><div class="sig-note">(Kí, họ tên)</div></td>
            <td><div class="sig-title">${labelSig}</div><div class="sig-note">(Kí, họ tên)</div></td>
          </tr>
        </table>
      </div>
    `;
  };

  const handlePrintPhieu = (item: DongTien) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Không mở được cửa sổ in. Vui lòng cho phép popup.");
      return;
    }
    const maPhieu = item.maPhieuThu || item.maPhieuChi || "";
    const tieuDe = item.maPhieuThu ? "PHIẾU THU" : "PHIẾU CHI";
    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>${tieuDe} - ${maPhieu}</title>
       <style>${phieuThuChiPrintStyles}</style></head>
       <body>${buildPhieuThuChiHTML(item)}</body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };

  const handleDownloadPhieuJPG = async (item: DongTien) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.width = "860px";
    container.style.background = "#fff";
    container.innerHTML = `<style>${phieuThuChiPrintStyles}</style>${buildPhieuThuChiHTML(item)}`;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const maPhieu = item.maPhieuThu || item.maPhieuChi || "phieu";
      link.download = `${maPhieu}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (error) {
      console.error("Error exporting JPG:", error);
      toast.error("Lỗi khi xuất ảnh");
    } finally {
      document.body.removeChild(container);
    }
  };

  if (isLoading && dongTienList.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-gray-600">Đang tải dữ liệu dòng tiền...</span>
      </div>
    );
  }

  const totalThu = dongTienList.reduce((sum, item) => sum + item.tongThu, 0);
  const totalChi = dongTienList.reduce((sum, item) => sum + item.tongChi, 0);

  // Giao dịch mới thêm/cập nhật lên đầu: sắp theo rowIndex giảm dần
  // (dòng mới được thêm ở cuối Google Sheet → có rowIndex lớn hơn → hiển thị trên cùng)
  const sortedList = [...dongTienList].sort(
    (a, b) => (b.rowIndex || 0) - (a.rowIndex || 0),
  );

  // Pagination logic
  const totalPages = Math.ceil(sortedList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = sortedList.slice(startIndex, endIndex);

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const fmt = (v: number) => v.toLocaleString("vi-VN");
    const rows = sortedList.map((item, i) => `<tr>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.ngayThang}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.tenTK}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.doiTuong}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.phanLoaiThuChi}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;">${item.noiDung}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;color:green;">${item.tongThu ? fmt(item.tongThu) : "-"}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;color:red;">${item.tongChi ? fmt(item.tongChi) : "-"}</td>
    </tr>`).join("");
    const title = "Sổ quỹ - Dòng tiền";
    printWindow.document.write(`<html><head><title>${title}</title>
      <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; padding:30px; color:#333; } h1 { font-size:20px; margin-bottom:20px; text-align:center; } table { width:100%; border-collapse:collapse; font-size:11px; } th { padding:6px 8px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; } @media print { body { padding:15px; } }</style></head><body>
      <h1>${title.toUpperCase()}</h1>
      <table><thead><tr>
        <th style="text-align:center;width:35px;">STT</th><th>Ngày</th><th>Tên TK</th><th>Đối tượng</th><th>Phân loại</th><th>Nội dung</th><th style="text-align:right;">Tổng thu</th><th style="text-align:right;">Tổng chi</th>
      </tr></thead><tbody>${rows}
        <tr style="background:#f0f0f0;font-weight:600;">
          <td colspan="6" style="padding:5px 8px;border:1px solid #ddd;text-align:right;">Tổng cộng:</td>
          <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;color:green;">${fmt(totalThu)}</td>
          <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;color:red;">${fmt(totalChi)}</td>
        </tr>
      </tbody></table></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleExportExcel = () => {
    const sheetData = sortedList.map((item, i) => ({
      "STT": i + 1,
      "Ngày tháng": item.ngayThang,
      "Tên TK": item.tenTK,
      "NCC NPL": item.nccNPL,
      "Thu tiền hàng": item.thuTienHang,
      "Mã phiếu thu": item.maPhieuThu,
      "Mã phiếu chi": item.maPhieuChi,
      "Đối tượng": item.doiTuong,
      "Nội dung": item.noiDung,
      "Phân loại thu chi": item.phanLoaiThuChi,
      "Tổng thu": item.tongThu,
      "Tổng chi": item.tongChi,
      "Ghi chú": item.ghiChu,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dong tien");
    XLSX.writeFile(wb, "So_quy_dong_tien.xlsx");
  };

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Dòng tiền ({dongTienList.length} giao dịch)
          </h3>
          <div className="flex gap-4 mt-1">
            <p className="text-sm text-gray-600">
              Tổng thu:{" "}
              <span className="font-semibold text-green-600">
                {totalThu.toLocaleString()} đ
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Tổng chi:{" "}
              <span className="font-semibold text-red-600">
                {totalChi.toLocaleString()} đ
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Chênh lệch:{" "}
              <span
                className={`font-semibold ${totalThu - totalChi >= 0 ? "text-blue-600" : "text-red-600"}`}
              >
                {(totalThu - totalChi).toLocaleString()} đ
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EditHistoryButton
            tableKey="dong-tien"
            variant="labeled"
            title="Dòng tiền"
          />
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <FileDown size={16} />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button
            onClick={handleOpenPhieuThu}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            Phiếu Thu
          </button>
          <button
            onClick={handleOpenPhieuChi}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={20} />
            Phiếu Chi
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto table-scroll-container">
          <table className="w-full text-sm min-w-[1150px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  Ngày tháng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  Tên TK
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  NCC NPL
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  Thu tiền hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  Mã phiếu thu/chi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  Đối tượng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  Phân loại thu chi
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  Tổng thu
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  Tổng chi
                </th>
                <th
                  className={`px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap sticky right-0 bg-gray-50 z-10 ${showBorder ? "border-l border-gray-200 shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.1)]" : ""}`}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dongTienList.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Chưa có dữ liệu dòng tiền
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleView(item)}
                  >
                    <td className="px-4 py-3 text-gray-600">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {item.ngayThang}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{item.tenTK}</td>
                    <td className="px-4 py-3 text-gray-700">{item.nccNPL}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.thuTienHang}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const maPhieu = item.maPhieuThu || item.maPhieuChi;
                        if (!maPhieu) return <span className="text-gray-400">-</span>;

                        const isPT = maPhieu.toUpperCase().startsWith('PT');
                        const isPC = maPhieu.toUpperCase().startsWith('PC');

                        if (isPT) {
                          return (
                            <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                              {maPhieu}
                            </span>
                          );
                        } else if (isPC) {
                          return (
                            <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">
                              {maPhieu}
                            </span>
                          );
                        } else {
                          return <span className="text-gray-700">{maPhieu}</span>;
                        }
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.doiTuong}</td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {item.phanLoaiThuChi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {item.tongThu.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      {item.tongChi.toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-3 sticky right-0 bg-white z-10 ${showBorder ? "border-l border-gray-200 shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.1)]" : ""}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.rowIndex)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{startIndex + 1}</span> -{" "}
              <span className="font-medium">
                {Math.min(endIndex, dongTienList.length)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-medium">{dongTienList.length}</span> giao
              dịch
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Trước
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, current, and adjacent pages
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${
                        pageNum === currentPage
                          ? "bg-blue-600 text-white border-blue-600 font-semibold"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <span key={pageNum} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Sau
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Phiếu Thu */}
      {showPhieuThuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
              <h3 className="text-xl font-semibold text-green-800">
                {editingItem ? "Sửa phiếu thu" : "Tạo phiếu thu mới"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Phieu Thu */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng
                  </label>
                  <input
                    type="date"
                    value={formData.ngayThang}
                    onChange={(e) =>
                      setFormData({ ...formData, ngayThang: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên TK <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.tenTK}
                    onChange={(e) =>
                      setFormData({ ...formData, tenTK: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn tài khoản</option>
                    {taiKhoanOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xưởng SX
                  </label>
                  <select
                    value={formData.xuongSX}
                    onChange={(e) => {
                      const selectedXuong = e.target.value;
                      // Nếu chọn xưởng SX thì Đối tượng = tên xưởng đó
                      const doiTuong = selectedXuong || formData.doiTuong;
                      setFormData({
                        ...formData,
                        xuongSX: selectedXuong,
                        doiTuong: selectedXuong
                          ? selectedXuong
                          : formData.doiTuong,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn xưởng SX</option>
                    {xuongSXOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phân loại thu chi <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.phanLoaiThuChi}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({
                        ...formData,
                        phanLoaiThuChi: newValue,
                        // Clear Thu khác nếu không chọn "Thu khác"
                        thuKhac: newValue.toLowerCase().includes('thu khác') ? formData.thuKhac : "",
                        // Clear Chi khác nếu không chọn "Chi khác"
                        chiKhac: newValue.toLowerCase().includes('chi khác') ? formData.chiKhac : "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn phân loại</option>
                    {phanLoaiOptions
                      .filter((option) => option.loaiPhieu === "Phiếu thu")
                      .map((option) => (
                        <option key={option.noiDung} value={option.noiDung}>
                          {option.noiDung}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi vận chuyển
                  </label>
                  <select
                    value={formData.chiVanChuyen}
                    onChange={(e) =>
                      setFormData({ ...formData, chiVanChuyen: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn đối tác vận chuyển</option>
                    {vanChuyenOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thu tiền hàng
                  </label>
                  <select
                    value={formData.thuTienHang}
                    onChange={(e) =>
                      setFormData({ ...formData, thuTienHang: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn khách hàng</option>
                    {khachHangOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thu khác
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(formData.thuKhac)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      thuKhac: parseNumberInput(e.target.value),
                    })
                  }
                  disabled={!formData.phanLoaiThuChi.toLowerCase().includes('thu khác')}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                    formData.phanLoaiThuChi.toLowerCase().includes('thu khác')
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-100 cursor-not-allowed'
                  }`}
                  placeholder={
                    formData.phanLoaiThuChi.toLowerCase().includes('thu khác')
                      ? "Nhập số tiền"
                      : ""
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã phiếu thu
                  </label>
                  <input
                    type="text"
                    value={formData.maPhieuThu}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    placeholder="Tự động"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đối tượng
                  </label>
                  <input
                    type="text"
                    value={formData.doiTuong}
                    onChange={(e) => {
                      if (!formData.xuongSX) {
                        setFormData({ ...formData, doiTuong: e.target.value });
                      }
                    }}
                    readOnly={!!formData.xuongSX}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      formData.xuongSX
                        ? "bg-gray-100 cursor-not-allowed"
                        : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    }`}
                    placeholder={
                      formData.xuongSX
                        ? "Tự động từ Xưởng SX"
                        : "Nhập đối tượng"
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng thu
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(formData.tongThu)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tongThu: parseNumberInput(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số tiền"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhà cung cấp hình in
                  </label>
                  <select
                    value={formData.nccHinhIn}
                    onChange={(e) =>
                      setFormData({ ...formData, nccHinhIn: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Chọn NCC hình in</option>
                    {nccHinhInOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cá nhân/tổ chức cho vay
                  </label>
                  <select
                    value={formData.caNhanToChucChoVay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caNhanToChucChoVay: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Chọn cá nhân/tổ chức cho vay</option>
                    {caNhanToChucChoVayOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung
                </label>
                <textarea
                  value={formData.noiDung}
                  onChange={(e) =>
                    setFormData({ ...formData, noiDung: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập nội dung (nếu có)"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="animate-spin" size={16} />}
                  {editingItem ? "Cập nhật" : "Tạo phiếu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phiếu Chi */}
      {showPhieuChiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
              <h3 className="text-xl font-semibold text-red-800">
                {editingItem ? "Sửa phiếu chi" : "Tạo phiếu chi mới"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Phieu Chi */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tháng
                  </label>
                  <input
                    type="date"
                    value={formData.ngayThang}
                    onChange={(e) =>
                      setFormData({ ...formData, ngayThang: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên TK <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.tenTK}
                    onChange={(e) =>
                      setFormData({ ...formData, tenTK: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn tài khoản</option>
                    {taiKhoanOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NCC NPL
                  </label>
                  <select
                    value={formData.nccNPL}
                    onChange={(e) =>
                      setFormData({ ...formData, nccNPL: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn NCC NPL</option>
                    {nccNPLOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xưởng SX
                  </label>
                  <select
                    value={formData.xuongSX}
                    onChange={(e) => {
                      const selectedXuong = e.target.value;
                      setFormData({
                        ...formData,
                        xuongSX: selectedXuong,
                        doiTuong: selectedXuong
                          ? selectedXuong
                          : formData.doiTuong,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn xưởng SX</option>
                    {xuongSXOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phân loại thu chi <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.phanLoaiThuChi}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({
                        ...formData,
                        phanLoaiThuChi: newValue,
                        // Clear Thu khác nếu không chọn "Thu khác"
                        thuKhac: newValue.toLowerCase().includes('thu khác') ? formData.thuKhac : "",
                        // Clear Chi khác nếu không chọn "Chi khác"
                        chiKhac: newValue.toLowerCase().includes('chi khác') ? formData.chiKhac : "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn phân loại</option>
                    {phanLoaiOptions
                      .filter((option) => option.loaiPhieu === "Phiếu chi")
                      .map((option) => (
                        <option key={option.noiDung} value={option.noiDung}>
                          {option.noiDung}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi vận chuyển
                  </label>
                  <select
                    value={formData.chiVanChuyen}
                    onChange={(e) =>
                      setFormData({ ...formData, chiVanChuyen: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn đối tác vận chuyển</option>
                    {vanChuyenOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thu tiền hàng
                  </label>
                  <select
                    value={formData.thuTienHang}
                    onChange={(e) =>
                      setFormData({ ...formData, thuTienHang: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn khách hàng</option>
                    {khachHangOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chi khác
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(formData.chiKhac)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chiKhac: parseNumberInput(e.target.value),
                    })
                  }
                  disabled={!formData.phanLoaiThuChi.toLowerCase().includes('chi khác')}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                    formData.phanLoaiThuChi.toLowerCase().includes('chi khác')
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-100 cursor-not-allowed'
                  }`}
                  placeholder={
                    formData.phanLoaiThuChi.toLowerCase().includes('chi khác')
                      ? "Nhập số tiền"
                      : "Chỉ khi chọn 'Chi khác'"
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã phiếu chi
                  </label>
                  <input
                    type="text"
                    value={formData.maPhieuChi}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    placeholder="Tự động"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đối tượng
                  </label>
                  <input
                    type="text"
                    value={formData.doiTuong}
                    onChange={(e) => {
                      if (!formData.xuongSX) {
                        setFormData({ ...formData, doiTuong: e.target.value });
                      }
                    }}
                    readOnly={!!formData.xuongSX}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      formData.xuongSX
                        ? "bg-gray-100 cursor-not-allowed"
                        : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    }`}
                    placeholder={
                      formData.xuongSX
                        ? "Tự động từ Xưởng SX"
                        : "Nhập đối tượng"
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng chi
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(formData.tongChi)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tongChi: parseNumberInput(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số tiền"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhà cung cấp hình in
                  </label>
                  <select
                    value={formData.nccHinhIn}
                    onChange={(e) =>
                      setFormData({ ...formData, nccHinhIn: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Chọn NCC hình in</option>
                    {nccHinhInOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cá nhân/tổ chức cho vay
                  </label>
                  <select
                    value={formData.caNhanToChucChoVay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caNhanToChucChoVay: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Chọn cá nhân/tổ chức cho vay</option>
                    {caNhanToChucChoVayOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung
                </label>
                <textarea
                  value={formData.noiDung}
                  onChange={(e) =>
                    setFormData({ ...formData, noiDung: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập nội dung (nếu có)"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="animate-spin" size={16} />}
                  {editingItem ? "Cập nhật" : "Tạo phiếu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {viewingItem.maPhieuThu ? "Phiếu thu" : "Phiếu chi"} -{" "}
                {viewingItem.maPhieuThu || viewingItem.maPhieuChi}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintPhieu(viewingItem)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Printer size={16} />
                  In
                </button>
                <button
                  onClick={() => handleDownloadPhieuJPG(viewingItem)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Tải JPG
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div ref={detailPrintRef} className="p-6 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Ngày tháng
                  </label>
                  <p className="text-base text-gray-900">
                    {viewingItem.ngayThang}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tên TK
                  </label>
                  <p className="text-base text-gray-900">{viewingItem.tenTK}</p>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    NCC NPL
                  </label>
                  <p className="text-base text-gray-900">
                    {viewingItem.nccNPL}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Xưởng SX
                  </label>
                  <p className="text-base text-gray-900">
                    {viewingItem.xuongSX}
                  </p>
                </div>
              </div>

              {/* Chi phí */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Chi vận chuyển
                  </label>
                  <p className="text-base text-gray-900">
                    {viewingItem.chiVanChuyen}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Thu tiền hàng
                  </label>
                  <p className="text-base text-gray-900">
                    {viewingItem.thuTienHang}
                  </p>
                </div>
              </div>

              {/* Thu chi khác */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Thu khác
                  </label>
                  <p className="text-base font-semibold text-green-600">
                    {viewingItem.thuKhac > 0
                      ? viewingItem.thuKhac.toLocaleString() + " đ"
                      : "-"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Chi khác
                  </label>
                  <p className="text-base font-semibold text-red-600">
                    {viewingItem.chiKhac > 0
                      ? viewingItem.chiKhac.toLocaleString() + " đ"
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Mã phiếu thu/chi */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Mã phiếu thu
                  </label>
                  {viewingItem.maPhieuThu ? (
                    <span className={`inline-block px-3 py-1.5 rounded text-sm ${
                      viewingItem.maPhieuThu.toUpperCase().startsWith('PT')
                        ? 'bg-green-100 text-green-700'
                        : viewingItem.maPhieuThu.toUpperCase().startsWith('PC')
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {viewingItem.maPhieuThu}
                    </span>
                  ) : (
                    <p className="text-base text-gray-400">-</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Mã phiếu chi
                  </label>
                  {viewingItem.maPhieuChi ? (
                    <span className={`inline-block px-3 py-1.5 rounded text-sm ${
                      viewingItem.maPhieuChi.toUpperCase().startsWith('PT')
                        ? 'bg-green-100 text-green-700'
                        : viewingItem.maPhieuChi.toUpperCase().startsWith('PC')
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {viewingItem.maPhieuChi}
                    </span>
                  ) : (
                    <p className="text-base text-gray-400">-</p>
                  )}
                </div>
              </div>

              {/* Đối tượng và Nội dung */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Đối tượng
                  </label>
                  <p className="text-base text-gray-900">
                    {viewingItem.doiTuong || "-"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phân loại thu chi
                  </label>
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700">
                    {viewingItem.phanLoaiThuChi}
                  </span>
                </div>
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nội dung
                </label>
                <p className="text-base text-gray-900">
                  {viewingItem.noiDung || "-"}
                </p>
              </div>

              {/* Tổng thu chi */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div className="bg-green-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Tổng thu
                  </label>
                  <p className="text-2xl font-bold text-green-600">
                    {viewingItem.tongThu.toLocaleString()} đ
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Tổng chi
                  </label>
                  <p className="text-2xl font-bold text-red-600">
                    {viewingItem.tongChi.toLocaleString()} đ
                  </p>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Ghi chú
                </label>
                <p className="text-base text-gray-900 whitespace-pre-wrap">
                  {viewingItem.ghiChu || "-"}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingRowIndex(null);
        }}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa dòng tiền này?"
        confirmText="Xóa"
        type="danger"
      />
    </div>
  );
}
