"use client";

import { Loader2, FileText, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import PrintDownloadButton from "@/components/PrintDownloadButton";

interface MaSP {
  id: number;
  maSP: string;
  tenSP: string;
}

interface PhieuDinhMucItem {
  stt: number;
  noiDung: string;
  dinhMuc: string;
  ghiChu: string;
}

interface PhieuDinhMucData {
  maSP: string;
  items: PhieuDinhMucItem[];
}

export default function PhieuDinhMucSXTab() {
  const [data, setData] = useState<PhieuDinhMucData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Mã SP dropdown
  const [maSPList, setMaSPList] = useState<MaSP[]>([]);
  const [maSPSearchTerm, setMaSPSearchTerm] = useState("");
  const [showMaSPDropdown, setShowMaSPDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  // Filtered mã SP list - show all when not searching, filter when typing
  const filteredMaSPList = isSearching && maSPSearchTerm
    ? maSPList.filter(
        (item) =>
          item.maSP.toLowerCase().includes(maSPSearchTerm.toLowerCase()) ||
          item.tenSP.toLowerCase().includes(maSPSearchTerm.toLowerCase())
      )
    : maSPList;

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    fetchMaSPList();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMaSPDropdown(false);
        setIsSearching(false);
        // Reset search term to current selected value
        if (data?.maSP) {
          setMaSPSearchTerm(data.maSP);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [data?.maSP]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/phieu-dinh-muc-sx");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setMaSPSearchTerm(result.data.maSP || "");
      } else {
        toast.error("Không thể tải phiếu định mức sản xuất");
      }
    } catch (error) {
      console.error("Error fetching phieu dinh muc sx:", error);
      toast.error("Lỗi khi tải phiếu định mức sản xuất");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaSPList = async () => {
    try {
      const response = await fetch("/api/ma-sp");
      const result = await response.json();
      if (result.success) {
        setMaSPList(result.data);
      }
    } catch (error) {
      console.error("Error fetching ma sp list:", error);
    }
  };

  const handleSelectMaSP = async (maSP: MaSP) => {
    setMaSPSearchTerm(maSP.maSP);
    setShowMaSPDropdown(false);
    setIsSearching(false);

    try {
      setIsUpdating(true);
      const response = await fetch("/api/phieu-dinh-muc-sx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maSP: maSP.maSP }),
      });
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        toast.success(`Đã chọn sản phẩm ${maSP.maSP}`);
      } else {
        toast.error(result.error || "Lỗi khi cập nhật mã SP");
      }
    } catch (error) {
      console.error("Error updating ma sp:", error);
      toast.error("Lỗi khi cập nhật mã SP");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          Phiếu định mức sản xuất
        </h3>
        <PrintDownloadButton
          targetRef={printableRef}
          fileName={`PhieuDinhMucSX_${data?.maSP || "phieu"}`}
          title={`Phiếu định mức sản xuất - ${data?.maSP || ""}`}
          className="print:hidden"
        />
      </div>

      {/* Form Content */}
      <div ref={printableRef} className="bg-white border border-gray-200 rounded-xl overflow-hidden print:border-0 print:shadow-none">
        {/* Company Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 print:bg-white print:text-black">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center print:border print:border-gray-300">
              <span className="text-blue-600 font-bold text-xl print:text-black">R</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">RIOMIO OFFICIAL</h2>
              <p className="text-blue-100 text-sm print:text-gray-600">
                ADD: B12 TT7 Nguyễn Sơn Hà, KĐT Văn Quán, Phúc La, Hà Đông, Hà Nội
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            PHIẾU ĐỊNH MỨC SẢN XUẤT
          </h1>
        </div>

        {/* Mã SP Selection */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Mã SP:
            </label>
            <div className="relative w-64" ref={dropdownRef}>
              <input
                type="text"
                value={maSPSearchTerm}
                onChange={(e) => {
                  setMaSPSearchTerm(e.target.value);
                  setIsSearching(true);
                  setShowMaSPDropdown(true);
                }}
                onFocus={() => {
                  setShowMaSPDropdown(true);
                  setIsSearching(false);
                }}
                disabled={isUpdating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 disabled:bg-gray-100"
                placeholder="Chọn mã sản phẩm..."
              />
              {isUpdating ? (
                <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
              ) : (
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              )}
              {showMaSPDropdown && !isUpdating && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredMaSPList.length > 0 ? (
                    filteredMaSPList.slice(0, 50).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectMaSP(item)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-medium text-blue-600">{item.maSP}</span>
                        <span className="text-gray-500 text-sm truncate">- {item.tenSP}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      Không tìm thấy mã SP
                    </div>
                  )}
                </div>
              )}
            </div>
            {data?.maSP && (
              <span className="text-sm text-green-600 font-medium">
                Đang hiển thị: <strong>{data.maSP}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="p-6">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-16">
                  STT
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                  Nội dung
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-32">
                  Định mức
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 w-48">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.stt} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2.5 text-center text-gray-600">
                    {item.stt}
                  </td>
                  <td className="border border-gray-300 px-4 py-2.5 font-medium text-gray-900">
                    {item.noiDung}
                  </td>
                  <td className="border border-gray-300 px-4 py-2.5 text-center text-blue-600 font-medium">
                    {item.dinhMuc || "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2.5 text-gray-600">
                    {item.ghiChu || "-"}
                  </td>
                </tr>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <tr>
                  <td colSpan={4} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    Chưa có dữ liệu. Vui lòng chọn mã sản phẩm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="px-6 pb-6 text-sm text-gray-500">
          <p>* Định mức được tính toán tự động dựa trên mã sản phẩm đã chọn.</p>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-white.border.border-gray-200.rounded-xl,
          .bg-white.border.border-gray-200.rounded-xl * {
            visibility: visible;
          }
          .bg-white.border.border-gray-200.rounded-xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
