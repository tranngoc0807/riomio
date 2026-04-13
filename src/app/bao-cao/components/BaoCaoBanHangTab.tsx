"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  User,
  Package,
  Loader2,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

// Portal component for modals
const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

type SubTabType = "theo-thang" | "theo-khach-hang" | "theo-nhan-vien" | "theo-san-pham";

interface BaoCaoBanHangTheoThangRow {
  rowIndex: number;
  thang: number;
  nam: number;
  doanhThu: number;
  tienVon: number;
  loiNhuan: number;
}

interface BaoCaoBanHangTheoThangData {
  rows: BaoCaoBanHangTheoThangRow[];
}

interface BaoCaoSanPhamRow {
  tenSanPham: string;
  soLuongBan: number;
  doanhThu: number;
  loiNhuanGop: number;
}

interface BaoCaoSanPhamData {
  rows: BaoCaoSanPhamRow[];
}

interface BaoCaoNhanVienTheoThangRow {
  stt: number;
  nhanVien: string;
  doanhThu: number;
  loiNhuanGop: number;
}

interface BaoCaoNhanVienTheoNamRow {
  stt: number;
  nhanVien: string;
  doanhThuNam: number;
  loiNhuanNam: number;
}

interface BaoCaoNhanVienData {
  theoThang: {
    rows: BaoCaoNhanVienTheoThangRow[];
    thangBaoCao: string;
    tongDoanhThu: number;
    tongLoiNhuan: number;
  };
  theoNam: {
    rows: BaoCaoNhanVienTheoNamRow[];
    namBaoCao: string;
    tongDoanhThu: number;
    tongLoiNhuan: number;
  };
}

interface BaoCaoKhachHangTheoThangRow {
  stt: number;
  khachHang: string;
  doanhThu: number;
  loiNhuanGop: number;
}

interface BaoCaoKhachHangTheoNamRow {
  stt: number;
  khachHang: string;
  doanhThuNam: number;
  loiNhuanNam: number;
}

interface BaoCaoKhachHangData {
  theoThang: {
    rows: BaoCaoKhachHangTheoThangRow[];
    thangBaoCao: string;
    tongDoanhThu: number;
    tongLoiNhuan: number;
  };
  theoNam: {
    rows: BaoCaoKhachHangTheoNamRow[];
    namBaoCao: string;
    tongDoanhThu: number;
    tongLoiNhuan: number;
  };
}

const SUB_TABS = [
  { id: "theo-thang" as SubTabType, label: "Báo cáo bán hàng theo tháng", icon: Calendar },
  { id: "theo-khach-hang" as SubTabType, label: "Báo cáo bán hàng theo khách hàng", icon: Users },
  { id: "theo-nhan-vien" as SubTabType, label: "Báo cáo bán hàng theo nhân viên", icon: User },
  { id: "theo-san-pham" as SubTabType, label: "Báo cáo bán hàng theo sản phẩm", icon: Package },
];

// Generate months options
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// Generate years options (from 2020 to current year + 1)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);

export default function BaoCaoBanHangTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("theo-thang");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BaoCaoBanHangTheoThangData | null>(null);
  const [sanPhamData, setSanPhamData] = useState<BaoCaoSanPhamData | null>(null);
  const [nhanVienData, setNhanVienData] = useState<BaoCaoNhanVienData | null>(null);
  const [khachHangData, setKhachHangData] = useState<BaoCaoKhachHangData | null>(null);

  // Date selectors for khach hang report
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedNam, setSelectedNam] = useState<number>(currentYear);

  // Date selectors for nhan vien report
  const [nvSelectedMonth, setNvSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [nvSelectedYear, setNvSelectedYear] = useState<number>(currentYear);
  const [nvSelectedNam, setNvSelectedNam] = useState<number>(currentYear);

  // CRUD states for "theo-thang"
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRow, setEditingRow] = useState<BaoCaoBanHangTheoThangRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<BaoCaoBanHangTheoThangRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    thang: new Date().getMonth() + 1,
    nam: currentYear,
    doanhThu: 0,
    tienVon: 0,
    loiNhuan: 0,
  });

  // Lấy dữ liệu khi component mount hoặc khi tab thay đổi
  useEffect(() => {
    if (activeSubTab === "theo-thang") {
      fetchData();
    } else if (activeSubTab === "theo-san-pham") {
      fetchSanPhamData();
    } else if (activeSubTab === "theo-nhan-vien") {
      fetchNhanVienData();
    } else if (activeSubTab === "theo-khach-hang") {
      fetchKhachHangData();
    }
  }, [activeSubTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/ban-hang-theo-thang");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchSanPhamData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/san-pham");
      const result = await response.json();

      if (result.success) {
        // Sort: mã có số lượng bán > 0 lên đầu, từ lớn xuống bé
        const sortedRows = [...(result.data.rows || [])].sort((a: BaoCaoSanPhamRow, b: BaoCaoSanPhamRow) => {
          const aHas = a.soLuongBan > 0 ? 1 : 0;
          const bHas = b.soLuongBan > 0 ? 1 : 0;
          if (bHas !== aHas) return bHas - aHas;
          return b.soLuongBan - a.soLuongBan;
        });
        setSanPhamData({ ...result.data, rows: sortedRows });
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching san pham data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVienData = async (thang?: string, nam?: string) => {
    try {
      setLoading(true);
      let url = "/api/bao-cao/nhan-vien";
      const params = new URLSearchParams();
      if (thang) params.append("thang", thang);
      if (nam) params.append("nam", nam);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        // Sort: doanh thu lớn nhất lên đầu
        if (result.data.theoThang?.rows) {
          result.data.theoThang.rows.sort((a: BaoCaoNhanVienTheoThangRow, b: BaoCaoNhanVienTheoThangRow) => b.doanhThu - a.doanhThu);
        }
        if (result.data.theoNam?.rows) {
          result.data.theoNam.rows.sort((a: BaoCaoNhanVienTheoNamRow, b: BaoCaoNhanVienTheoNamRow) => b.doanhThuNam - a.doanhThuNam);
        }
        setNhanVienData(result.data);
        // Update selected values from response
        if (result.data.theoThang?.thangBaoCao) {
          const parts = result.data.theoThang.thangBaoCao.split("/");
          if (parts.length === 2) {
            setNvSelectedMonth(parseInt(parts[0]) || 1);
            setNvSelectedYear(parseInt(parts[1]) || currentYear);
          }
        }
        if (result.data.theoNam?.namBaoCao) {
          setNvSelectedNam(parseInt(result.data.theoNam.namBaoCao) || currentYear);
        }
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching nhan vien data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchKhachHangData = async (thang?: string, nam?: string) => {
    try {
      setLoading(true);
      let url = "/api/bao-cao/khach-hang";
      const params = new URLSearchParams();
      if (thang) params.append("thang", thang);
      if (nam) params.append("nam", nam);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        // Sort: doanh thu lớn nhất lên đầu
        if (result.data.theoThang?.rows) {
          result.data.theoThang.rows.sort((a: BaoCaoKhachHangTheoThangRow, b: BaoCaoKhachHangTheoThangRow) => b.doanhThu - a.doanhThu);
        }
        if (result.data.theoNam?.rows) {
          result.data.theoNam.rows.sort((a: BaoCaoKhachHangTheoNamRow, b: BaoCaoKhachHangTheoNamRow) => b.doanhThuNam - a.doanhThuNam);
        }
        setKhachHangData(result.data);
        // Update selected values from response
        if (result.data.theoThang?.thangBaoCao) {
          const parts = result.data.theoThang.thangBaoCao.split("/");
          if (parts.length === 2) {
            setSelectedMonth(parseInt(parts[0]) || 1);
            setSelectedYear(parseInt(parts[1]) || currentYear);
          }
        }
        if (result.data.theoNam?.namBaoCao) {
          setSelectedNam(parseInt(result.data.theoNam.namBaoCao) || currentYear);
        }
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching khach hang data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleThangChange = () => {
    const thang = `${selectedMonth}/${selectedYear}`;
    fetchKhachHangData(thang, undefined);
  };

  const handleNamChange = () => {
    fetchKhachHangData(undefined, selectedNam.toString());
  };

  const handleNvThangChange = () => {
    const thang = `${nvSelectedMonth}/${nvSelectedYear}`;
    fetchNhanVienData(thang, undefined);
  };

  const handleNvNamChange = () => {
    fetchNhanVienData(undefined, nvSelectedNam.toString());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      thang: new Date().getMonth() + 1,
      nam: currentYear,
      doanhThu: 0,
      tienVon: 0,
      loiNhuan: 0,
    });
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModal = (row: BaoCaoBanHangTheoThangRow) => {
    setEditingRow(row);
    setFormData({
      thang: row.thang,
      nam: row.nam,
      doanhThu: row.doanhThu,
      tienVon: row.tienVon,
      loiNhuan: row.loiNhuan,
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (row: BaoCaoBanHangTheoThangRow) => {
    setDeletingRow(row);
    setShowDeleteModal(true);
  };

  // Handle add
  const handleAdd = async () => {
    if (!formData.thang || !formData.nam) {
      toast.error("Vui lòng nhập tháng và năm");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/bao-cao/ban-hang-theo-thang/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Thêm thành công");
        setShowAddModal(false);
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi thêm");
      }
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Lỗi khi thêm");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingRow || !formData.thang || !formData.nam) {
      toast.error("Vui lòng nhập tháng và năm");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/bao-cao/ban-hang-theo-thang/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: editingRow.rowIndex,
          ...formData,
        }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Cập nhật thành công");
        setShowEditModal(false);
        setEditingRow(null);
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi cập nhật");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingRow) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/bao-cao/ban-hang-theo-thang/delete?rowIndex=${deletingRow.rowIndex}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (result.success) {
        toast.success("Xóa thành công");
        setShowDeleteModal(false);
        setDeletingRow(null);
        fetchData();
      } else {
        toast.error(result.error || "Lỗi khi xóa");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Lỗi khi xóa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let title = "";
    let tableHTML = "";

    if (activeSubTab === "theo-thang" && data) {
      title = "Báo cáo bán hàng theo tháng";
      const rows = data.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.thang}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.nam}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.doanhThu)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.tienVon)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:600;${row.loiNhuan > 0 ? "color:green;" : row.loiNhuan < 0 ? "color:red;" : ""}">${formatCurrency(row.loiNhuan)}</td>
      </tr>`).join("");
      tableHTML = `<table><thead><tr>
        <th style="text-align:center;">Tháng</th><th style="text-align:center;">Năm</th>
        <th style="text-align:right;">Doanh thu</th><th style="text-align:right;">Tiền vốn</th>
        <th style="text-align:right;">Lợi nhuận</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
    } else if (activeSubTab === "theo-khach-hang" && khachHangData) {
      title = "Báo cáo bán hàng theo khách hàng";
      const rows1 = khachHangData.theoThang.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.stt}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;">${row.khachHang}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.doanhThu)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;${row.loiNhuanGop > 0 ? "color:green;" : row.loiNhuanGop < 0 ? "color:red;" : ""}">${formatCurrency(row.loiNhuanGop)}</td>
      </tr>`).join("");
      const rows2 = khachHangData.theoNam.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.stt}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;">${row.khachHang}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.doanhThuNam)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;${row.loiNhuanNam > 0 ? "color:green;" : row.loiNhuanNam < 0 ? "color:red;" : ""}">${formatCurrency(row.loiNhuanNam)}</td>
      </tr>`).join("");
      tableHTML = `
        <h2 style="font-size:16px;margin-bottom:10px;">Theo tháng ${khachHangData.theoThang.thangBaoCao}</h2>
        <table><thead><tr>
          <th style="text-align:center;width:50px;">STT</th><th style="text-align:left;">Khách hàng</th>
          <th style="text-align:right;">Doanh thu</th><th style="text-align:right;">Lợi nhuận gộp</th>
        </tr></thead><tbody>${rows1}
          <tr style="background:#fef9c3;font-weight:600;">
            <td colspan="2" style="padding:6px 10px;border:1px solid #ddd;text-align:right;">TỔNG CỘNG</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:blue;">${formatCurrency(khachHangData.theoThang.tongDoanhThu)}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:green;">${formatCurrency(khachHangData.theoThang.tongLoiNhuan)}</td>
          </tr>
        </tbody></table>
        <br/><h2 style="font-size:16px;margin-bottom:10px;">Theo năm ${khachHangData.theoNam.namBaoCao}</h2>
        <table><thead><tr>
          <th style="text-align:center;width:50px;">STT</th><th style="text-align:left;">Khách hàng</th>
          <th style="text-align:right;">Doanh thu năm</th><th style="text-align:right;">Lợi nhuận năm</th>
        </tr></thead><tbody>${rows2}
          <tr style="background:#fef9c3;font-weight:600;">
            <td colspan="2" style="padding:6px 10px;border:1px solid #ddd;text-align:right;">TỔNG CỘNG</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:blue;">${formatCurrency(khachHangData.theoNam.tongDoanhThu)}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:green;">${formatCurrency(khachHangData.theoNam.tongLoiNhuan)}</td>
          </tr>
        </tbody></table>`;
    } else if (activeSubTab === "theo-nhan-vien" && nhanVienData) {
      title = "Báo cáo bán hàng theo nhân viên";
      const rows1 = nhanVienData.theoThang.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.stt}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;">${row.nhanVien}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.doanhThu)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;${row.loiNhuanGop > 0 ? "color:green;" : row.loiNhuanGop < 0 ? "color:red;" : ""}">${formatCurrency(row.loiNhuanGop)}</td>
      </tr>`).join("");
      const rows2 = nhanVienData.theoNam.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${row.stt}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;">${row.nhanVien}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.doanhThuNam)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;${row.loiNhuanNam > 0 ? "color:green;" : row.loiNhuanNam < 0 ? "color:red;" : ""}">${formatCurrency(row.loiNhuanNam)}</td>
      </tr>`).join("");
      tableHTML = `
        <h2 style="font-size:16px;margin-bottom:10px;">Theo tháng ${nhanVienData.theoThang.thangBaoCao}</h2>
        <table><thead><tr>
          <th style="text-align:center;width:50px;">STT</th><th style="text-align:left;">Nhân viên</th>
          <th style="text-align:right;">Doanh thu</th><th style="text-align:right;">Lợi nhuận gộp</th>
        </tr></thead><tbody>${rows1}
          <tr style="background:#fef9c3;font-weight:600;">
            <td colspan="2" style="padding:6px 10px;border:1px solid #ddd;text-align:right;">TỔNG CỘNG</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:blue;">${formatCurrency(nhanVienData.theoThang.tongDoanhThu)}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:green;">${formatCurrency(nhanVienData.theoThang.tongLoiNhuan)}</td>
          </tr>
        </tbody></table>
        <br/><h2 style="font-size:16px;margin-bottom:10px;">Theo năm ${nhanVienData.theoNam.namBaoCao}</h2>
        <table><thead><tr>
          <th style="text-align:center;width:50px;">STT</th><th style="text-align:left;">Nhân viên</th>
          <th style="text-align:right;">Doanh thu năm</th><th style="text-align:right;">Lợi nhuận năm</th>
        </tr></thead><tbody>${rows2}
          <tr style="background:#fef9c3;font-weight:600;">
            <td colspan="2" style="padding:6px 10px;border:1px solid #ddd;text-align:right;">TỔNG CỘNG</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:blue;">${formatCurrency(nhanVienData.theoNam.tongDoanhThu)}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:green;">${formatCurrency(nhanVienData.theoNam.tongLoiNhuan)}</td>
          </tr>
        </tbody></table>`;
    } else if (activeSubTab === "theo-san-pham" && sanPhamData) {
      title = "Báo cáo doanh thu theo sản phẩm";
      const rows = sanPhamData.rows.map((row) => `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd;">${row.tenSanPham}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${row.soLuongBan}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${formatCurrency(row.doanhThu)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:600;${row.loiNhuanGop > 0 ? "color:green;" : row.loiNhuanGop < 0 ? "color:red;" : ""}">${formatCurrency(row.loiNhuanGop)}</td>
      </tr>`).join("");
      tableHTML = `<table><thead><tr>
        <th style="text-align:left;">Tên sản phẩm</th><th style="text-align:right;">Số lượng bán</th>
        <th style="text-align:right;">Doanh thu</th><th style="text-align:right;">Lợi nhuận gộp</th>
      </tr></thead><tbody>${rows}</tbody></table>`;
    } else {
      return;
    }

    printWindow.document.write(`<html><head><title>${title}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial,sans-serif; padding:30px; color:#333; }
        h1 { font-size:20px; margin-bottom:20px; text-align:center; }
        h2 { font-size:16px; margin:15px 0 10px; }
        table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:10px; }
        th { padding:8px 10px; border:1px solid #ddd; background:#f5f5f5; font-weight:600; }
        @media print { body { padding:15px; } }
      </style></head><body>
      <h1>${title.toUpperCase()}</h1>
      ${tableHTML}
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div>
      {/* Sub-tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div>
        {activeSubTab === "theo-thang" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : data ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo bán hàng theo tháng
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                    >
                      <FileDown size={16} />
                      Xuất PDF
                    </button>
                    <button
                      onClick={openAddModal}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={18} />
                      Thêm mới
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tháng
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Năm
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doanh thu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiền vốn
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lợi nhuận
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                            {row.thang}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                            {row.nam}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.doanhThu)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.tienVon)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.loiNhuan > 0 ? "text-green-600" : row.loiNhuan < 0 ? "text-red-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.loiNhuan)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(row)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Sửa"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(row)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
              <Portal>
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                      <h3 className="text-lg font-semibold">Thêm báo cáo mới</h3>
                      <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="px-6 py-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tháng *</label>
                          <select
                            value={formData.thang}
                            onChange={(e) => setFormData({ ...formData, thang: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Năm *</label>
                          <select
                            value={formData.nam}
                            onChange={(e) => setFormData({ ...formData, nam: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {YEARS.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doanh thu</label>
                        <input
                          type="number"
                          value={formData.doanhThu || ""}
                          onChange={(e) => setFormData({ ...formData, doanhThu: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiền vốn</label>
                        <input
                          type="number"
                          value={formData.tienVon || ""}
                          onChange={(e) => setFormData({ ...formData, tienVon: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lợi nhuận</label>
                        <input
                          type="number"
                          value={formData.loiNhuan || ""}
                          onChange={(e) => setFormData({ ...formData, loiNhuan: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleAdd}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>
              </Portal>
            )}

            {/* Edit Modal */}
            {showEditModal && editingRow && (
              <Portal>
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                      <h3 className="text-lg font-semibold">Sửa báo cáo</h3>
                      <button onClick={() => { setShowEditModal(false); setEditingRow(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="px-6 py-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tháng *</label>
                          <select
                            value={formData.thang}
                            onChange={(e) => setFormData({ ...formData, thang: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Năm *</label>
                          <select
                            value={formData.nam}
                            onChange={(e) => setFormData({ ...formData, nam: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {YEARS.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doanh thu</label>
                        <input
                          type="number"
                          value={formData.doanhThu || ""}
                          onChange={(e) => setFormData({ ...formData, doanhThu: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiền vốn</label>
                        <input
                          type="number"
                          value={formData.tienVon || ""}
                          onChange={(e) => setFormData({ ...formData, tienVon: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lợi nhuận</label>
                        <input
                          type="number"
                          value={formData.loiNhuan || ""}
                          onChange={(e) => setFormData({ ...formData, loiNhuan: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                      <button
                        onClick={() => { setShowEditModal(false); setEditingRow(null); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Cập nhật
                      </button>
                    </div>
                  </div>
                </div>
              </Portal>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingRow && (
              <Portal>
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                      <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
                      <button onClick={() => { setShowDeleteModal(false); setDeletingRow(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="px-6 py-4">
                      <p className="text-gray-600">
                        Bạn có chắc chắn muốn xóa báo cáo này?
                      </p>
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm"><strong>Tháng:</strong> {deletingRow.thang}</p>
                        <p className="text-sm"><strong>Năm:</strong> {deletingRow.nam}</p>
                        <p className="text-sm"><strong>Doanh thu:</strong> {formatCurrency(deletingRow.doanhThu)}</p>
                        <p className="text-sm"><strong>Lợi nhuận:</strong> {formatCurrency(deletingRow.loiNhuan)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                      <button
                        onClick={() => { setShowDeleteModal(false); setDeletingRow(null); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </Portal>
            )}
          </div>
        )}

        {activeSubTab === "theo-khach-hang" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : khachHangData ? (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                  >
                    <FileDown size={16} />
                    Xuất PDF
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bảng 1: Báo cáo theo tháng */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b bg-blue-50">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        Báo cáo mua hàng theo tháng
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {MONTHS.map((m) => (
                            <option key={m} value={m}>Tháng {m}</option>
                          ))}
                        </select>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleThangChange}
                          disabled={loading}
                          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          title="Tải dữ liệu"
                        >
                          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Tháng báo cáo: <span className="font-medium text-blue-600">{khachHangData.theoThang.thangBaoCao}</span>
                    </p>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-center font-medium text-gray-600 w-12">STT</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Khách hàng</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Doanh thu</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Lợi nhuận gộp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {khachHangData.theoThang.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-center text-gray-600">{row.stt}</td>
                            <td className="px-3 py-2 text-gray-900">{row.khachHang}</td>
                            <td className="px-3 py-2 text-right text-gray-900">
                              {formatCurrency(row.doanhThu)}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${
                              row.loiNhuanGop > 0 ? "text-green-600" : row.loiNhuanGop < 0 ? "text-red-600" : "text-gray-900"
                            }`}>
                              {formatCurrency(row.loiNhuanGop)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-yellow-50 font-semibold sticky bottom-0">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-right">TỔNG CỘNG</td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            {formatCurrency(khachHangData.theoThang.tongDoanhThu)}
                          </td>
                          <td className="px-3 py-2 text-right text-green-600">
                            {formatCurrency(khachHangData.theoThang.tongLoiNhuan)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Bảng 2: Báo cáo theo năm */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b bg-purple-50">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        Báo cáo mua hàng theo năm
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedNam}
                          onChange={(e) => setSelectedNam(parseInt(e.target.value))}
                          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleNamChange}
                          disabled={loading}
                          className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          title="Tải dữ liệu"
                        >
                          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Năm báo cáo: <span className="font-medium text-purple-600">{khachHangData.theoNam.namBaoCao}</span>
                    </p>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-center font-medium text-gray-600 w-12">STT</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Khách hàng</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Doanh thu năm</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Lợi nhuận năm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {khachHangData.theoNam.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-center text-gray-600">{row.stt}</td>
                            <td className="px-3 py-2 text-gray-900">{row.khachHang}</td>
                            <td className="px-3 py-2 text-right text-gray-900">
                              {formatCurrency(row.doanhThuNam)}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${
                              row.loiNhuanNam > 0 ? "text-green-600" : row.loiNhuanNam < 0 ? "text-red-600" : "text-gray-900"
                            }`}>
                              {formatCurrency(row.loiNhuanNam)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-yellow-50 font-semibold sticky bottom-0">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-right">TỔNG CỘNG</td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            {formatCurrency(khachHangData.theoNam.tongDoanhThu)}
                          </td>
                          <td className="px-3 py-2 text-right text-green-600">
                            {formatCurrency(khachHangData.theoNam.tongLoiNhuan)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "theo-nhan-vien" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : nhanVienData ? (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                  >
                    <FileDown size={16} />
                    Xuất PDF
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bảng 1: Báo cáo theo tháng */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b bg-blue-50">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        Báo cáo bán hàng theo tháng
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={nvSelectedMonth}
                          onChange={(e) => setNvSelectedMonth(parseInt(e.target.value))}
                          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {MONTHS.map((m) => (
                            <option key={m} value={m}>Tháng {m}</option>
                          ))}
                        </select>
                        <select
                          value={nvSelectedYear}
                          onChange={(e) => setNvSelectedYear(parseInt(e.target.value))}
                          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleNvThangChange}
                          disabled={loading}
                          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          title="Tải dữ liệu"
                        >
                          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Tháng báo cáo: <span className="font-medium text-blue-600">{nhanVienData.theoThang.thangBaoCao}</span>
                    </p>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-center font-medium text-gray-600 w-12">STT</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Nhân viên</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Doanh thu</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Lợi nhuận gộp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {nhanVienData.theoThang.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-center text-gray-600">{row.stt}</td>
                            <td className="px-3 py-2 text-gray-900">{row.nhanVien}</td>
                            <td className="px-3 py-2 text-right text-gray-900">
                              {formatCurrency(row.doanhThu)}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${
                              row.loiNhuanGop > 0 ? "text-green-600" : row.loiNhuanGop < 0 ? "text-red-600" : "text-gray-900"
                            }`}>
                              {formatCurrency(row.loiNhuanGop)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-yellow-50 font-semibold sticky bottom-0">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-right">TỔNG CỘNG</td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            {formatCurrency(nhanVienData.theoThang.tongDoanhThu)}
                          </td>
                          <td className="px-3 py-2 text-right text-green-600">
                            {formatCurrency(nhanVienData.theoThang.tongLoiNhuan)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Bảng 2: Báo cáo theo năm */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b bg-purple-50">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        Báo cáo bán hàng theo năm
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={nvSelectedNam}
                          onChange={(e) => setNvSelectedNam(parseInt(e.target.value))}
                          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleNvNamChange}
                          disabled={loading}
                          className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          title="Tải dữ liệu"
                        >
                          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Năm báo cáo: <span className="font-medium text-purple-600">{nhanVienData.theoNam.namBaoCao}</span>
                    </p>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-center font-medium text-gray-600 w-12">STT</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Nhân viên</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Doanh thu năm</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">Lợi nhuận năm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {nhanVienData.theoNam.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-center text-gray-600">{row.stt}</td>
                            <td className="px-3 py-2 text-gray-900">{row.nhanVien}</td>
                            <td className="px-3 py-2 text-right text-gray-900">
                              {formatCurrency(row.doanhThuNam)}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${
                              row.loiNhuanNam > 0 ? "text-green-600" : row.loiNhuanNam < 0 ? "text-red-600" : "text-gray-900"
                            }`}>
                              {formatCurrency(row.loiNhuanNam)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-yellow-50 font-semibold sticky bottom-0">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-right">TỔNG CỘNG</td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            {formatCurrency(nhanVienData.theoNam.tongDoanhThu)}
                          </td>
                          <td className="px-3 py-2 text-right text-green-600">
                            {formatCurrency(nhanVienData.theoNam.tongLoiNhuan)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "theo-san-pham" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : sanPhamData ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo doanh thu theo sản phẩm
                  </h3>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                  >
                    <FileDown size={16} />
                    Xuất PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng bán
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doanh thu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lợi nhuận góp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sanPhamData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.tenSanPham}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {row.soLuongBan}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.doanhThu)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.loiNhuanGop > 0 ? "text-green-600" : row.loiNhuanGop < 0 ? "text-red-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.loiNhuanGop)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
