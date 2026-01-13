"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, Search, FileText, Calendar, Package, Scissors } from "lucide-react";
import toast from "react-hot-toast";

interface PhieuBaoSLCatDetail {
  id: number;
  stt: number;
  maSP: string;
  lsx: string;
  xuongSX: string;
  mauSac: string;
  soLuong: number;
  ghiChu: string;
}

interface PhieuBaoSLCatInfo {
  maPhieu: string;
  ngay: string;
  tongSoLuong: number;
  details: PhieuBaoSLCatDetail[];
}

interface MaPhieuOption {
  maPhieuCat: string;
}

export default function PhieuBaoSLCatTab() {
  const [data, setData] = useState<PhieuBaoSLCatInfo | null>(null);
  const [maPhieuList, setMaPhieuList] = useState<MaPhieuOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMaPhieuList();
    fetchData();
  }, []);

  // Fetch list of Mã phiếu from Số lượng cắt
  const fetchMaPhieuList = async () => {
    try {
      const response = await fetch("/api/so-luong-cat");
      const result = await response.json();
      if (result.success && result.data) {
        // Get unique maPhieuCat values
        const uniqueMaPhieu = [...new Set(result.data.map((item: any) => item.maPhieuCat))]
          .filter(Boolean)
          .map((maPhieuCat) => ({ maPhieuCat: maPhieuCat as string }));
        setMaPhieuList(uniqueMaPhieu);
      }
    } catch (error) {
      console.error("Error fetching ma phieu list:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/phieu-bao-sl-cat");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching phieu bao sl cat:", error);
      toast.error("Lỗi khi tải dữ liệu phiếu báo số lượng cắt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMaPhieu = async (maPhieu: string) => {
    if (maPhieu === data?.maPhieu) {
      setShowDropdown(false);
      return;
    }

    try {
      setIsChanging(true);
      setShowDropdown(false);

      const response = await fetch("/api/phieu-bao-sl-cat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maPhieu }),
      });

      const result = await response.json();
      if (result.success) {
        // Wait for Google Sheet to update formulas
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await fetchData();
      }
    } catch (error) {
      console.error("Error changing ma phieu:", error);
      toast.error("Lỗi khi chuyển phiếu");
    } finally {
      setIsChanging(false);
    }
  };

  // Filter dropdown list
  const filteredMaPhieu = maPhieuList.filter((item) =>
    item.maPhieuCat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total
  const totalSoLuong = data?.details.reduce((sum, item) => sum + item.soLuong, 0) || 0;

  return (
    <div>
      {/* Header with Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Phiếu báo số lượng cắt hàng</h3>

          {/* Mã phiếu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isChanging}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors min-w-[150px] disabled:opacity-50"
            >
              {isChanging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  <span className="text-green-700">Đang chuyển...</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-green-700 truncate flex-1 text-left">
                    {data?.maPhieu || "Chọn mã phiếu"}
                  </span>
                  <ChevronDown size={18} className="text-green-600" />
                </>
              )}
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute z-50 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Tìm mã phiếu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredMaPhieu.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500 text-sm text-center">
                        Không tìm thấy mã phiếu
                      </div>
                    ) : (
                      filteredMaPhieu.map((item) => (
                        <div
                          key={item.maPhieuCat}
                          onClick={() => handleSelectMaPhieu(item.maPhieuCat)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            data?.maPhieu === item.maPhieuCat
                              ? "bg-green-50 text-green-700 font-medium"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {item.maPhieuCat}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      {data && !isLoading && !isChanging && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-green-600" />
              <p className="text-sm text-green-600">Mã phiếu</p>
            </div>
            <p className="text-lg font-bold text-green-700">{data.maPhieu || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-purple-600" />
              <p className="text-sm text-purple-600">Ngày</p>
            </div>
            <p className="text-lg font-bold text-purple-700">{data.ngay || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-blue-600" />
              <p className="text-sm text-blue-600">Tổng số lượng</p>
            </div>
            <p className="text-lg font-bold text-blue-700">{data.tongSoLuong.toLocaleString("vi-VN")}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Scissors size={16} className="text-orange-600" />
              <p className="text-sm text-orange-600">Số dòng SP</p>
            </div>
            <p className="text-lg font-bold text-orange-700">{data.details.length}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading || isChanging ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {isChanging ? "Đang chuyển phiếu..." : "Đang tải dữ liệu..."}
              </p>
            </div>
          </div>
        ) : !data || data.details.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-500">Không có dữ liệu chi tiết phiếu báo</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                    STT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                    Mã SP
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    LSX
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">
                    Xưởng SX
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Màu sắc
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.details.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.stt || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-blue-600">
                      {row.maSP || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.lsx || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-[250px]">
                      <div className="truncate" title={row.xuongSX}>{row.xuongSX || "-"}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.mauSac || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-green-600">
                      {row.soLuong > 0 ? row.soLuong.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 max-w-[150px]">
                      <div className="truncate" title={row.ghiChu}>{row.ghiChu || "-"}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={5} className="px-3 py-3 text-sm text-gray-700 text-right">
                    Tổng cộng:
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-green-600">
                    {totalSoLuong.toLocaleString("vi-VN")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
