"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, Search, FileText, Calendar, Factory, Package, Layers } from "lucide-react";
import toast from "react-hot-toast";

interface PhieuYCXKNPLDetail {
  id: number;
  stt: number;
  maNPL: string;
  dvt: string;
  dinhMuc: number;
  slSX: number;
  tong: number;
  maSP: string;
}

interface PhieuYCXKNPLInfo {
  maYeuCau: string;
  ngayThang: string;
  xuongSX: string;
  maSP: string;
  tenSP: string;
  dongSize: string;
  hinhAnh: string;
  details: PhieuYCXKNPLDetail[];
}

interface MaYeuCauOption {
  maPhieuYC: string;
}

export default function PhieuYCXKNPLTab() {
  const [data, setData] = useState<PhieuYCXKNPLInfo | null>(null);
  const [maYeuCauList, setMaYeuCauList] = useState<MaYeuCauOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMaYeuCauList();
    fetchData();
  }, []);

  // Fetch list of Mã yêu cầu from Bảng kê yêu cầu xuất kho NPL
  const fetchMaYeuCauList = async () => {
    try {
      const response = await fetch("/api/yeu-cau-xuat-kho-npl");
      const result = await response.json();
      if (result.success && result.data) {
        // Get unique maPhieuYC values
        const uniqueMaYeuCau = [...new Set(result.data.map((item: any) => item.maPhieuYC))]
          .filter(Boolean)
          .map((maPhieuYC) => ({ maPhieuYC: maPhieuYC as string }));
        setMaYeuCauList(uniqueMaYeuCau);
      }
    } catch (error) {
      console.error("Error fetching ma yeu cau list:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/phieu-yc-xk-npl");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching phieu yc xk npl:", error);
      toast.error("Lỗi khi tải dữ liệu phiếu yêu cầu xuất kho NPL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMaYeuCau = async (maYeuCau: string) => {
    if (maYeuCau === data?.maYeuCau) {
      setShowDropdown(false);
      return;
    }

    try {
      setIsChanging(true);
      setShowDropdown(false);

      const response = await fetch("/api/phieu-yc-xk-npl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maYeuCau }),
      });

      const result = await response.json();
      if (result.success) {
        // Wait for Google Sheet to update formulas
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await fetchData();
      }
    } catch (error) {
      console.error("Error changing ma yeu cau:", error);
      toast.error("Lỗi khi chuyển phiếu yêu cầu");
    } finally {
      setIsChanging(false);
    }
  };

  // Filter dropdown list
  const filteredMaYeuCau = maYeuCauList.filter((item) =>
    item.maPhieuYC.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totalTong = data?.details.reduce((sum, item) => sum + item.tong, 0) || 0;
  const totalSlSX = data?.details.reduce((sum, item) => sum + item.slSX, 0) || 0;

  return (
    <div>
      {/* Header with Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Phiếu yêu cầu xuất kho NPL</h3>

          {/* Mã yêu cầu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isChanging}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors min-w-[150px] disabled:opacity-50"
            >
              {isChanging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  <span className="text-orange-700">Đang chuyển...</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-orange-700 truncate flex-1 text-left">
                    {data?.maYeuCau || "Chọn mã YC"}
                  </span>
                  <ChevronDown size={18} className="text-orange-600" />
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
                        placeholder="Tìm mã yêu cầu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredMaYeuCau.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500 text-sm text-center">
                        Không tìm thấy mã yêu cầu
                      </div>
                    ) : (
                      filteredMaYeuCau.map((item) => (
                        <div
                          key={item.maPhieuYC}
                          onClick={() => handleSelectMaYeuCau(item.maPhieuYC)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            data?.maYeuCau === item.maPhieuYC
                              ? "bg-orange-50 text-orange-700 font-medium"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {item.maPhieuYC}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-orange-600" />
              <p className="text-sm text-orange-600">Mã yêu cầu</p>
            </div>
            <p className="text-lg font-bold text-orange-700">{data.maYeuCau || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-purple-600" />
              <p className="text-sm text-purple-600">Ngày tháng</p>
            </div>
            <p className="text-lg font-bold text-purple-700">{data.ngayThang || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Factory size={16} className="text-blue-600" />
              <p className="text-sm text-blue-600">Xưởng SX</p>
            </div>
            <p className="text-sm font-bold text-blue-700 truncate" title={data.xuongSX}>
              {data.xuongSX || "-"}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-green-600" />
              <p className="text-sm text-green-600">Mã SP</p>
            </div>
            <p className="text-lg font-bold text-green-700">{data.maSP || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
            <div className="flex items-center gap-2 mb-1">
              <Layers size={16} className="text-teal-600" />
              <p className="text-sm text-teal-600">Dòng size</p>
            </div>
            <p className="text-lg font-bold text-teal-700">{data.dongSize || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-pink-600" />
              <p className="text-sm text-pink-600">Số dòng NPL</p>
            </div>
            <p className="text-lg font-bold text-pink-700">{data.details.length}</p>
          </div>
        </div>
      )}

      {/* Tên SP */}
      {data && !isLoading && !isChanging && data.tenSP && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm text-gray-500">Tên SP: </span>
          <span className="font-medium text-gray-900">{data.tenSP}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading || isChanging ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {isChanging ? "Đang chuyển phiếu..." : "Đang tải dữ liệu..."}
              </p>
            </div>
          </div>
        ) : !data || data.details.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-500">Không có dữ liệu chi tiết phiếu yêu cầu</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                    STT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[300px]">
                    Mã nguyên phụ liệu
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ĐVT
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Định mức
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    SL SX
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tổng
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mã SP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.details.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.stt || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 max-w-[350px]">
                      <div className="truncate" title={row.maNPL}>{row.maNPL || "-"}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.dvt || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-right text-gray-600">
                      {row.dinhMuc > 0 ? row.dinhMuc.toLocaleString("vi-VN", { maximumFractionDigits: 3 }) : "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-blue-600">
                      {row.slSX > 0 ? row.slSX.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-green-600">
                      {row.tong > 0 ? row.tong.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.maSP || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={4} className="px-3 py-3 text-sm text-gray-700 text-right">
                    Tổng cộng:
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-blue-600">
                    {totalSlSX.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-green-600">
                    {totalTong.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
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
