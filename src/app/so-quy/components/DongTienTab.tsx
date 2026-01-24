"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { DongTien } from "@/lib/googleSheets";
import toast, { Toaster } from "react-hot-toast";

export default function DongTienTab() {
  const [dongTienList, setDongTienList] = useState<DongTien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhieuThuModal, setShowPhieuThuModal] = useState(false);
  const [showPhieuChiModal, setShowPhieuChiModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DongTien | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<DongTien | null>(null);

  // Dropdown options
  const [taiKhoanOptions, setTaiKhoanOptions] = useState<string[]>([]);
  const [phanLoaiOptions, setPhanLoaiOptions] = useState<string[]>([]);
  const [nccNPLOptions, setNccNPLOptions] = useState<string[]>([]);
  const [xuongSXOptions, setXuongSXOptions] = useState<string[]>([]);
  const [vanChuyenOptions, setVanChuyenOptions] = useState<string[]>([]);
  const [khachHangOptions, setKhachHangOptions] = useState<string[]>([]);

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
    });
    setEditingItem(null);
    setShowPhieuChiModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required dropdown fields
    if (
      !formData.tenTK ||
      !formData.nccNPL ||
      !formData.chiVanChuyen ||
      !formData.thuTienHang ||
      !formData.phanLoaiThuChi
    ) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
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

  const handleDelete = async (rowIndex: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dòng này?")) return;

    toast.promise(
      (async () => {
        const response = await fetch(`/api/dong-tien?rowIndex=${rowIndex}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          setDongTienList(result.data);
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
    });
  };

  const handleCloseModal = () => {
    setShowPhieuThuModal(false);
    setShowPhieuChiModal(false);
    resetForm();
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

  // Pagination logic
  const totalPages = Math.ceil(dongTienList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = dongTienList.slice(startIndex, endIndex);

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
                    className="hover:bg-gray-50 transition-colors"
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
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
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

            {/* Modal Body */}
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
                    NCC NPL <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phanLoaiThuChi: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn phân loại</option>
                    {phanLoaiOptions.map((option) => (
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
                    Chi vận chuyển <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
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
                    Thu tiền hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thu khác
                  </label>
                  <input
                    type="text"
                    value={formData.thuKhac}
                    onChange={(e) =>
                      setFormData({ ...formData, thuKhac: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền hoặc ghi chú"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi khác
                  </label>
                  <input
                    type="text"
                    value={formData.chiKhac}
                    onChange={(e) =>
                      setFormData({ ...formData, chiKhac: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền hoặc ghi chú"
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng thu
                  </label>
                  <input
                    type="text"
                    value={formData.tongThu}
                    onChange={(e) =>
                      setFormData({ ...formData, tongThu: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền hoặc ghi chú"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng chi
                  </label>
                  <input
                    type="text"
                    value={formData.tongChi}
                    onChange={(e) =>
                      setFormData({ ...formData, tongChi: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền hoặc ghi chú"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) =>
                    setFormData({ ...formData, ghiChu: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập ghi chú (nếu có)"
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

            {/* Modal Body */}
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
                    NCC NPL <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phanLoaiThuChi: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn phân loại</option>
                    {phanLoaiOptions.map((option) => (
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
                    Chi vận chuyển <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
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
                    Thu tiền hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thu khác
                  </label>
                  <input
                    type="text"
                    value={formData.thuKhac}
                    onChange={(e) =>
                      setFormData({ ...formData, thuKhac: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền hoặc ghi chú"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi khác
                  </label>
                  <input
                    type="text"
                    value={formData.chiKhac}
                    onChange={(e) =>
                      setFormData({ ...formData, chiKhac: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền hoặc ghi chú"
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng thu
                  </label>
                  <input
                    type="text"
                    value={formData.tongThu}
                    onChange={(e) =>
                      setFormData({ ...formData, tongThu: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền hoặc ghi chú"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng chi
                  </label>
                  <input
                    type="text"
                    value={formData.tongChi}
                    onChange={(e) =>
                      setFormData({ ...formData, tongChi: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền hoặc ghi chú"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) =>
                    setFormData({ ...formData, ghiChu: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập ghi chú (nếu có)"
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
                Chi tiết dòng tiền
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
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
    </div>
  );
}
