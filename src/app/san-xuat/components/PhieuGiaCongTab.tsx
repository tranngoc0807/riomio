"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, Search, FileText, Calendar, Factory, Package } from "lucide-react";

interface PhieuGiaCongDetail {
  id: number;
  stt: number;
  maSanPham: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  ghiChu: string;
}

interface PhieuGiaCongInfo {
  maPhieu: string;
  ngay: string;
  xuongSX: string;
  tongSoLuong: number;
  details: PhieuGiaCongDetail[];
}

interface MaPhieuOption {
  maPGC: string;
}

export default function PhieuGiaCongTab() {
  const [phieuData, setPhieuData] = useState<PhieuGiaCongInfo | null>(null);
  const [maPhieuList, setMaPhieuList] = useState<MaPhieuOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPhieu, setIsChangingPhieu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMaPhieuList();
    fetchData();
  }, []);

  // Fetch list of Mã phiếu from Bảng kê gia công
  const fetchMaPhieuList = async () => {
    try {
      const response = await fetch("/api/bang-ke-gia-cong");
      const result = await response.json();
      if (result.success && result.data) {
        // Get unique maPGC values
        const uniqueMaPhieu = [...new Set(result.data.map((item: any) => item.maPGC))]
          .filter(Boolean)
          .map((maPGC) => ({ maPGC: maPGC as string }));
        setMaPhieuList(uniqueMaPhieu);
      }
    } catch (error) {
      console.error("Error fetching ma phieu list:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/phieu-gia-cong");
      const result = await response.json();

      if (result.success) {
        setPhieuData(result.data);
      }
    } catch (error) {
      console.error("Error fetching phieu gia cong:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPhieu = async (maPhieu: string) => {
    if (maPhieu === phieuData?.maPhieu) {
      setShowDropdown(false);
      return;
    }

    try {
      setIsChangingPhieu(true);
      setShowDropdown(false);

      const response = await fetch("/api/phieu-gia-cong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maPhieu }),
      });

      const result = await response.json();
      if (result.success) {
        // Wait for Google Sheet to update formulas
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await fetchData();
      }
    } catch (error) {
      console.error("Error changing phieu:", error);
    } finally {
      setIsChangingPhieu(false);
    }
  };

  // Filter dropdown list
  const filteredMaPhieu = maPhieuList.filter((item) =>
    item.maPGC.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter only rows with data (maSanPham not empty)
  const filteredDetails = phieuData?.details.filter(
    (item) => item.maSanPham && item.maSanPham.trim() !== ""
  ) || [];

  // Calculate totals from filtered data
  const totalThanhTien = filteredDetails.reduce((sum, item) => sum + item.thanhTien, 0);

  return (
    <div>
      {/* Header with Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Phiếu gia công</h3>

          {/* Mã phiếu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isChangingPhieu}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors min-w-[160px] disabled:opacity-50"
            >
              {isChangingPhieu ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-blue-700">Đang chuyển...</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-blue-700 truncate flex-1 text-left">
                    {phieuData?.maPhieu || "Chọn mã phiếu"}
                  </span>
                  <ChevronDown size={18} className="text-blue-600" />
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
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          key={item.maPGC}
                          onClick={() => handleSelectPhieu(item.maPGC)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            phieuData?.maPhieu === item.maPGC
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {item.maPGC}
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

      {/* Phiếu Info Cards */}
      {phieuData && !isLoading && !isChangingPhieu && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-blue-600" />
              <p className="text-sm text-blue-600">Mã phiếu</p>
            </div>
            <p className="text-xl font-bold text-blue-700">{phieuData.maPhieu || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-purple-600" />
              <p className="text-sm text-purple-600">Ngày</p>
            </div>
            <p className="text-xl font-bold text-purple-700">{phieuData.ngay || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Factory size={16} className="text-orange-600" />
              <p className="text-sm text-orange-600">Xưởng SX</p>
            </div>
            <p className="text-lg font-bold text-orange-700 truncate" title={phieuData.xuongSX}>
              {phieuData.xuongSX || "-"}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-green-600" />
              <p className="text-sm text-green-600">Tổng số lượng</p>
            </div>
            <p className="text-xl font-bold text-green-700">
              {phieuData.tongSoLuong.toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading || isChangingPhieu ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {isChangingPhieu ? "Đang chuyển phiếu..." : "Đang tải dữ liệu..."}
              </p>
            </div>
          </div>
        ) : !phieuData || filteredDetails.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-500">Không có dữ liệu chi tiết phiếu</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mã sản phẩm
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thành tiền
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDetails.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.stt || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {row.maSanPham || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {row.soLuong > 0 ? row.soLuong.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {row.donGia > 0 ? row.donGia.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                      {row.thanhTien > 0 ? row.thanhTien.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[300px]">
                      <div className="whitespace-pre-wrap">{row.ghiChu || "-"}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={4} className="px-4 py-3 text-sm text-gray-700 text-right">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {totalThanhTien.toLocaleString("vi-VN")}đ
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
