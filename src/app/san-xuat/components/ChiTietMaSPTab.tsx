"use client";

import { Loader2, Package, ChevronDown, Pencil, X } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface ChiTietMaSP {
  maSP: string;
  tenSP: string;
  bangSizeSanXuat: string;
  hinhAnh: string;
  mauSacSanXuat: string;
  thuocTinhSize: string;
  giaBanLe: string;
  giaBanSi: string;
  giaVon: string;
  vaiChinh: string;
  vaiPhoi: string;
  phuLieuKhac: string;
  dinhMucVaiChinh: string;
  dinhMucVaiPhoi1: string;
  dinhMucVaiPhoi2: string;
  dinhMucPhuLieu1: string;
  dinhMucPhuLieu2: string;
  dinhMucPhuKien: string;
  dinhMucKhac: string;
  soLuongKeHoach: string;
  soLuongCat: string;
  soLuongNhapKho: string;
  cdFinal: string;
  cdDongBoNPL: string;
  cdSanXuat: string;
  nhapKho: string;
}

interface MaSPOption {
  id: number;
  maSP: string;
  tenSP: string;
}

interface DetailRow {
  stt: number;
  label: string;
  key: keyof ChiTietMaSP;
  value: string;
  editable?: boolean;
}

export default function ChiTietMaSPTab() {
  const [data, setData] = useState<ChiTietMaSP | null>(null);
  const [maSPList, setMaSPList] = useState<MaSPOption[]>([]);
  const [selectedMaSP, setSelectedMaSP] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Partial<ChiTietMaSP>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMaSPList();
  }, []);

  const fetchMaSPList = async () => {
    try {
      setIsLoadingList(true);
      const response = await fetch("/api/ma-sp");
      const result = await response.json();
      if (result.success) {
        setMaSPList(result.data);
        // Tự động chọn mã SP đầu tiên
        if (result.data.length > 0 && !selectedMaSP) {
          const firstMaSP = result.data[0].maSP;
          loadChiTietMaSP(firstMaSP);
        }
      } else {
        toast.error("Không thể tải danh sách mã sản phẩm");
      }
    } catch (error) {
      console.error("Error fetching ma sp list:", error);
      toast.error("Lỗi khi tải danh sách mã SP");
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadChiTietMaSP = async (maSP: string) => {
    try {
      setIsLoading(true);
      setSelectedMaSP(maSP);

      const response = await fetch("/api/chi-tiet-ma-sp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maSP }),
      });

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu");
      }
    } catch (error) {
      console.error("Error loading chi tiet ma sp:", error);
      toast.error("Lỗi khi tải chi tiết mã SP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaSPChange = (maSP: string) => {
    if (!maSP || maSP === selectedMaSP) return;
    loadChiTietMaSP(maSP);
  };

  const openEditModal = () => {
    if (!data) return;
    setFormData({
      maSP: data.maSP,
      tenSP: data.tenSP,
      bangSizeSanXuat: data.bangSizeSanXuat,
      hinhAnh: data.hinhAnh,
      mauSacSanXuat: data.mauSacSanXuat,
      thuocTinhSize: data.thuocTinhSize,
      giaBanLe: data.giaBanLe,
      giaBanSi: data.giaBanSi,
      giaVon: data.giaVon,
      vaiChinh: data.vaiChinh,
      vaiPhoi: data.vaiPhoi,
      phuLieuKhac: data.phuLieuKhac,
      dinhMucVaiChinh: data.dinhMucVaiChinh,
      dinhMucVaiPhoi1: data.dinhMucVaiPhoi1,
      dinhMucVaiPhoi2: data.dinhMucVaiPhoi2,
      dinhMucPhuLieu1: data.dinhMucPhuLieu1,
      dinhMucPhuLieu2: data.dinhMucPhuLieu2,
      dinhMucPhuKien: data.dinhMucPhuKien,
      dinhMucKhac: data.dinhMucKhac,
      soLuongKeHoach: data.soLuongKeHoach,
      soLuongCat: data.soLuongCat,
      soLuongNhapKho: data.soLuongNhapKho,
      cdFinal: data.cdFinal,
      cdDongBoNPL: data.cdDongBoNPL,
      cdSanXuat: data.cdSanXuat,
      nhapKho: data.nhapKho,
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowEditModal(false);
    setFormData({});
  };

  const handleFormChange = (field: keyof ChiTietMaSP, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!data?.maSP) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/chi-tiet-ma-sp/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maSP: data.maSP,
          ...formData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Cập nhật chi tiết thành công");
        // Reload chi tiết
        loadChiTietMaSP(data.maSP);
        closeModal();
      } else {
        toast.error(result.error || "Không thể cập nhật chi tiết");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatValue = (value: string): string => {
    if (
      !value ||
      value === "#N/A" ||
      value === "#DIV/0!" ||
      value === "#REF!"
    ) {
      return "-";
    }
    return value;
  };

  // Transform data into table rows
  const getDetailRows = (): DetailRow[] => {
    if (!data) return [];

    return [
      {
        stt: 1,
        label: "Tên SP",
        key: "tenSP",
        value: data.tenSP,
        editable: true,
      },
      {
        stt: 2,
        label: "Bảng size sản xuất",
        key: "bangSizeSanXuat",
        value: data.bangSizeSanXuat,
        editable: true,
      },
      {
        stt: 3,
        label: "Hình ảnh",
        key: "hinhAnh",
        value: data.hinhAnh,
        editable: true,
      },
      {
        stt: 4,
        label: "Màu sắc sản xuất",
        key: "mauSacSanXuat",
        value: formatValue(data.mauSacSanXuat),
        editable: true,
      },
      {
        stt: 5,
        label: "Thuộc tính size",
        key: "thuocTinhSize",
        value: data.thuocTinhSize,
        editable: true,
      },
      {
        stt: 6,
        label: "Giá bán lẻ",
        key: "giaBanLe",
        value: data.giaBanLe,
        editable: true,
      },
      {
        stt: 7,
        label: "Giá bán sỉ",
        key: "giaBanSi",
        value: data.giaBanSi,
        editable: true,
      },
      {
        stt: 8,
        label: "Giá vốn",
        key: "giaVon",
        value: formatValue(data.giaVon),
        editable: true,
      },
      {
        stt: 9,
        label: "Vải chính",
        key: "vaiChinh",
        value: data.vaiChinh,
        editable: true,
      },
      {
        stt: 10,
        label: "Vải phối",
        key: "vaiPhoi",
        value: data.vaiPhoi,
        editable: true,
      },
      {
        stt: 11,
        label: "Phụ liệu khác",
        key: "phuLieuKhac",
        value: data.phuLieuKhac,
        editable: true,
      },
      {
        stt: 12,
        label: "Định mức vải chính",
        key: "dinhMucVaiChinh",
        value: formatValue(data.dinhMucVaiChinh),
        editable: true,
      },
      {
        stt: 13,
        label: "Định mức vải phối 1",
        key: "dinhMucVaiPhoi1",
        value: formatValue(data.dinhMucVaiPhoi1),
        editable: true,
      },
      {
        stt: 14,
        label: "Định mức vải phối 2",
        key: "dinhMucVaiPhoi2",
        value: formatValue(data.dinhMucVaiPhoi2),
        editable: true,
      },
      {
        stt: 15,
        label: "Định mức phụ liệu 1",
        key: "dinhMucPhuLieu1",
        value: formatValue(data.dinhMucPhuLieu1),
        editable: true,
      },
      {
        stt: 16,
        label: "Định mức phụ liệu 2",
        key: "dinhMucPhuLieu2",
        value: formatValue(data.dinhMucPhuLieu2),
        editable: true,
      },
      {
        stt: 17,
        label: "Định mức phụ kiện",
        key: "dinhMucPhuKien",
        value: formatValue(data.dinhMucPhuKien),
        editable: true,
      },
      {
        stt: 18,
        label: "Định mức khác",
        key: "dinhMucKhac",
        value: formatValue(data.dinhMucKhac),
        editable: true,
      },
      {
        stt: 19,
        label: "Số lượng kế hoạch",
        key: "soLuongKeHoach",
        value: data.soLuongKeHoach || "0",
        editable: true,
      },
      {
        stt: 20,
        label: "Số lượng cắt",
        key: "soLuongCat",
        value: data.soLuongCat || "0",
        editable: true,
      },
      {
        stt: 21,
        label: "Số lượng nhập kho",
        key: "soLuongNhapKho",
        value: data.soLuongNhapKho || "0",
        editable: true,
      },
      {
        stt: 22,
        label: "CĐ Final",
        key: "cdFinal",
        value: formatValue(data.cdFinal),
        editable: true,
      },
      {
        stt: 23,
        label: "CĐ đồng bộ NPL",
        key: "cdDongBoNPL",
        value: formatValue(data.cdDongBoNPL),
        editable: true,
      },
      {
        stt: 24,
        label: "CĐ sản xuất",
        key: "cdSanXuat",
        value: formatValue(data.cdSanXuat),
        editable: true,
      },
      {
        stt: 25,
        label: "Nhập kho",
        key: "nhapKho",
        value: formatValue(data.nhapKho),
        editable: true,
      },
    ];
  };

  // Get editable fields for the form (all 25 fields)
  const editableFields = [
    { key: "tenSP", label: "Tên SP" },
    { key: "bangSizeSanXuat", label: "Bảng size sản xuất" },
    { key: "hinhAnh", label: "Hình ảnh" },
    { key: "mauSacSanXuat", label: "Màu sắc sản xuất" },
    { key: "thuocTinhSize", label: "Thuộc tính size" },
    { key: "giaBanLe", label: "Giá bán lẻ" },
    { key: "giaBanSi", label: "Giá bán sỉ" },
    { key: "giaVon", label: "Giá vốn" },
    { key: "vaiChinh", label: "Vải chính" },
    { key: "vaiPhoi", label: "Vải phối" },
    { key: "phuLieuKhac", label: "Phụ liệu khác" },
    { key: "dinhMucVaiChinh", label: "Định mức vải chính" },
    { key: "dinhMucVaiPhoi1", label: "Định mức vải phối 1" },
    { key: "dinhMucVaiPhoi2", label: "Định mức vải phối 2" },
    { key: "dinhMucPhuLieu1", label: "Định mức phụ liệu 1" },
    { key: "dinhMucPhuLieu2", label: "Định mức phụ liệu 2" },
    { key: "dinhMucPhuKien", label: "Định mức phụ kiện" },
    { key: "dinhMucKhac", label: "Định mức khác" },
    { key: "soLuongKeHoach", label: "Số lượng kế hoạch" },
    { key: "soLuongCat", label: "Số lượng cắt" },
    { key: "soLuongNhapKho", label: "Số lượng nhập kho" },
    { key: "cdFinal", label: "CĐ Final" },
    { key: "cdDongBoNPL", label: "CĐ đồng bộ NPL" },
    { key: "cdSanXuat", label: "CĐ sản xuất" },
    { key: "nhapKho", label: "Nhập kho" },
  ] as const;

  if (isLoadingList) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Đang tải danh sách mã SP...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Chi tiết mã sản phẩm
        </h3>

        <div className="relative">
          <select
            value={selectedMaSP}
            onChange={(e) => handleMaSPChange(e.target.value)}
            disabled={isLoading}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[320px]"
          >
            <option value="">-- Chọn mã sản phẩm --</option>
            {maSPList.map((item) => (
              <option key={item.id} value={item.maSP}>
                {item.maSP}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={20}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !data && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Package className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-lg font-medium">Chưa có dữ liệu</p>
          <p className="text-sm mt-1">
            Vui lòng chọn mã sản phẩm từ dropdown phía trên
          </p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && data && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-gray-200 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Mã SP: {data.maSP}</h4>
            {/* <button
              onClick={openEditModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pencil size={16} />
              Sửa
            </button> */}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 w-16">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  CHI TIẾT
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                  THÔNG TIN
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getDetailRows().map((row) => (
                <tr key={row.stt} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{row.stt}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {row.label === "Hình ảnh" &&
                    row.value &&
                    row.value !== "-" ? (
                      <a
                        href={row.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Xem hình
                      </a>
                    ) : (
                      <span
                        className={
                          row.label.includes("Giá bán lẻ")
                            ? "text-green-600 font-semibold"
                            : row.label.includes("Giá bán sỉ")
                            ? "text-blue-600 font-semibold"
                            : row.label.includes("Số lượng")
                            ? "font-medium"
                            : "text-gray-900"
                        }
                      >
                        {row.value || "-"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Sửa chi tiết mã sản phẩm: {data?.maSP}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editableFields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-sm text-gray-600">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={formData[field.key] || ""}
                      onChange={(e) =>
                        handleFormChange(field.key, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`Nhập ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
