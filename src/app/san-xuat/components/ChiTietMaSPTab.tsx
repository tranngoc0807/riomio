"use client";

import { Loader2, Package, ChevronDown } from "lucide-react";
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
  value: string;
}

export default function ChiTietMaSPTab() {
  const [data, setData] = useState<ChiTietMaSP | null>(null);
  const [maSPList, setMaSPList] = useState<MaSPOption[]>([]);
  const [selectedMaSP, setSelectedMaSP] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

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
        fetchCurrentData();
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

  const fetchCurrentData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chi-tiet-ma-sp");
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
        setSelectedMaSP(result.data.maSP);
      }
    } catch (error) {
      console.error("Error fetching chi tiet ma sp:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaSPChange = async (maSP: string) => {
    if (!maSP || maSP === selectedMaSP) return;

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
        toast.success(`Đã chuyển sang mã SP: ${maSP}`);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu");
      }
    } catch (error) {
      console.error("Error changing ma sp:", error);
      toast.error("Lỗi khi thay đổi mã SP");
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (value: string): string => {
    if (!value || value === "#N/A" || value === "#DIV/0!" || value === "#REF!") {
      return "-";
    }
    return value;
  };

  // Transform data into table rows
  const getDetailRows = (): DetailRow[] => {
    if (!data) return [];

    return [
      { stt: 1, label: "Tên SP", value: data.tenSP },
      { stt: 2, label: "Bảng size sản xuất", value: data.bangSizeSanXuat },
      { stt: 3, label: "Hình ảnh", value: data.hinhAnh },
      { stt: 4, label: "Màu sắc sản xuất", value: formatValue(data.mauSacSanXuat) },
      { stt: 5, label: "Thuộc tính size", value: data.thuocTinhSize },
      { stt: 6, label: "Giá bán lẻ", value: data.giaBanLe },
      { stt: 7, label: "Giá bán sỉ", value: data.giaBanSi },
      { stt: 8, label: "Giá vốn", value: formatValue(data.giaVon) },
      { stt: 9, label: "Vải chính", value: data.vaiChinh },
      { stt: 10, label: "Vải phối", value: data.vaiPhoi },
      { stt: 11, label: "Phụ liệu khác", value: data.phuLieuKhac },
      { stt: 12, label: "Định mức vải chính", value: formatValue(data.dinhMucVaiChinh) },
      { stt: 13, label: "Định mức vải phối 1", value: formatValue(data.dinhMucVaiPhoi1) },
      { stt: 14, label: "Định mức vải phối 2", value: formatValue(data.dinhMucVaiPhoi2) },
      { stt: 15, label: "Định mức phụ liệu 1", value: formatValue(data.dinhMucPhuLieu1) },
      { stt: 16, label: "Định mức phụ liệu 2", value: formatValue(data.dinhMucPhuLieu2) },
      { stt: 17, label: "Định mức phụ kiện", value: formatValue(data.dinhMucPhuKien) },
      { stt: 18, label: "Định mức khác", value: formatValue(data.dinhMucKhac) },
      { stt: 19, label: "Số lượng kế hoạch", value: data.soLuongKeHoach || "0" },
      { stt: 20, label: "Số lượng cắt", value: data.soLuongCat || "0" },
      { stt: 21, label: "Số lượng nhập kho", value: data.soLuongNhapKho || "0" },
      { stt: 22, label: "CĐ Final", value: formatValue(data.cdFinal) },
      { stt: 23, label: "CĐ đồng bộ NPL", value: formatValue(data.cdDongBoNPL) },
      { stt: 24, label: "CĐ sản xuất", value: formatValue(data.cdSanXuat) },
      { stt: 25, label: "Nhập kho", value: formatValue(data.nhapKho) },
    ];
  };

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
      {/* Header with Dropdown */}
      <div className="flex items-center gap-4 flex-wrap">
        <h3 className="text-lg font-semibold text-gray-900">Chi tiết mã sản phẩm</h3>
        <div className="relative">
          <select
            value={selectedMaSP}
            onChange={(e) => handleMaSPChange(e.target.value)}
            disabled={isLoading}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[280px]"
          >
            <option value="">-- Chọn mã sản phẩm --</option>
            {maSPList.map((item) => (
              <option key={item.id} value={item.maSP}>
                {item.maSP} - {item.tenSP}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
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
          <p className="text-sm mt-1">Vui lòng chọn mã sản phẩm từ dropdown phía trên</p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && data && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 w-16">STT</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">CHI TIẾT</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">THÔNG TIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getDetailRows().map((row) => (
                <tr key={row.stt} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{row.stt}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.label}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {row.label === "Hình ảnh" && row.value && row.value !== "-" ? (
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
    </div>
  );
}
