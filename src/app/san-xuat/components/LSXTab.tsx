"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, Search, FileText, Calendar, Factory, Package, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";

interface LSXDetail {
  id: number;
  stt: number;
  maSP: string;
  tenSP: string;
  dongSize: string;
  maVaiChinh: string;
  mauSac: string;
  hinhAnh: string;
  sizes: { [key: string]: number };
  tongSoLuong: number;
}

interface LSXInfo {
  maLenh: string;
  ngayRaLenh: string;
  xuong: string;
  ngayHoanThanh: string;
  ghiChu: string;
  tongSLTrongLenh: number;
  details: LSXDetail[];
}

interface MaLenhOption {
  maLenhSX: string;
}

// Size column headers
const SIZE_COLUMNS = [
  "0/1", "1/2", "2/3", "3/4", "4/5", "5/6", "6/7", "7/8", "8/9", "9/10",
  "10/11", "11/12", "12/13", "13/14", "14/15", "XS", "S", "M", "L", "XL"
];

export default function LSXTab() {
  const [lsxData, setLsxData] = useState<LSXInfo | null>(null);
  const [maLenhList, setMaLenhList] = useState<MaLenhOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingLenh, setIsChangingLenh] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMaLenhList();
    fetchData();
  }, []);

  // Fetch list of Mã lệnh from Bảng kê LSX
  const fetchMaLenhList = async () => {
    try {
      const response = await fetch("/api/ke-hoach-sx");
      const result = await response.json();
      if (result.success && result.data) {
        // Get unique maLenhSX values
        const uniqueMaLenh = [...new Set(result.data.map((item: any) => item.maLenhSX))]
          .filter(Boolean)
          .map((maLenhSX) => ({ maLenhSX: maLenhSX as string }));
        setMaLenhList(uniqueMaLenh);
      }
    } catch (error) {
      console.error("Error fetching ma lenh list:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/lsx");
      const result = await response.json();

      if (result.success) {
        setLsxData(result.data);
      }
    } catch (error) {
      console.error("Error fetching LSX:", error);
      toast.error("Lỗi khi tải dữ liệu LSX");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLenh = async (maLenh: string) => {
    if (maLenh === lsxData?.maLenh) {
      setShowDropdown(false);
      return;
    }

    try {
      setIsChangingLenh(true);
      setShowDropdown(false);

      const response = await fetch("/api/lsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maLenh }),
      });

      const result = await response.json();
      if (result.success) {
        // Wait for Google Sheet to update formulas
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await fetchData();
      }
    } catch (error) {
      console.error("Error changing lenh:", error);
      toast.error("Lỗi khi chuyển lệnh sản xuất");
    } finally {
      setIsChangingLenh(false);
    }
  };

  // Filter dropdown list
  const filteredMaLenh = maLenhList.filter((item) =>
    item.maLenhSX.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get active size columns (columns that have data)
  const getActiveSizeColumns = () => {
    if (!lsxData?.details.length) return [];

    const activeColumns: string[] = [];
    SIZE_COLUMNS.forEach((size) => {
      const hasData = lsxData.details.some((detail) => detail.sizes[size] > 0);
      if (hasData) {
        activeColumns.push(size);
      }
    });
    return activeColumns;
  };

  const activeSizeColumns = getActiveSizeColumns();

  // Calculate total
  const totalSoLuong = lsxData?.details.reduce((sum, item) => sum + item.tongSoLuong, 0) || 0;

  return (
    <div>
      {/* Header with Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Lệnh sản xuất</h3>

          {/* Mã lệnh Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isChangingLenh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors min-w-[180px] disabled:opacity-50"
            >
              {isChangingLenh ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-blue-700">Đang chuyển...</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-blue-700 truncate flex-1 text-left">
                    {lsxData?.maLenh || "Chọn mã lệnh"}
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
                <div className="absolute z-50 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Tìm mã lệnh..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredMaLenh.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500 text-sm text-center">
                        Không tìm thấy mã lệnh
                      </div>
                    ) : (
                      filteredMaLenh.map((item) => (
                        <div
                          key={item.maLenhSX}
                          onClick={() => handleSelectLenh(item.maLenhSX)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            lsxData?.maLenh === item.maLenhSX
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {item.maLenhSX}
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

      {/* LSX Info Cards */}
      {lsxData && !isLoading && !isChangingLenh && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-blue-600" />
              <p className="text-sm text-blue-600">Mã lệnh</p>
            </div>
            <p className="text-lg font-bold text-blue-700">{lsxData.maLenh || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-purple-600" />
              <p className="text-sm text-purple-600">Ngày ra lệnh</p>
            </div>
            <p className="text-lg font-bold text-purple-700">{lsxData.ngayRaLenh || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Factory size={16} className="text-orange-600" />
              <p className="text-sm text-orange-600">Xưởng</p>
            </div>
            <p className="text-sm font-bold text-orange-700 truncate" title={lsxData.xuong}>
              {lsxData.xuong || "-"}
            </p>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-teal-600" />
              <p className="text-sm text-teal-600">Ngày hoàn thành</p>
            </div>
            <p className="text-lg font-bold text-teal-700">{lsxData.ngayHoanThanh || "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-green-600" />
              <p className="text-sm text-green-600">Tổng SL trong lệnh</p>
            </div>
            <p className="text-lg font-bold text-green-700">
              {lsxData.tongSLTrongLenh.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={16} className="text-pink-600" />
              <p className="text-sm text-pink-600">Số dòng SP</p>
            </div>
            <p className="text-lg font-bold text-pink-700">{lsxData.details.length}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading || isChangingLenh ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {isChangingLenh ? "Đang chuyển lệnh..." : "Đang tải dữ liệu..."}
              </p>
            </div>
          </div>
        ) : !lsxData || lsxData.details.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-500">Không có dữ liệu chi tiết lệnh sản xuất</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12 sticky left-0 bg-green-50">
                    STT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                    Mã SP
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">
                    Tên SP
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Dòng size
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mã vải chính
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Màu sắc
                  </th>
                  {activeSizeColumns.map((size) => (
                    <th key={size} className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[50px]">
                      {size}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                    Tổng SL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lsxData.details.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm text-gray-600 sticky left-0 bg-white">
                      {row.stt || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-blue-600">
                      {row.maSP || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 max-w-[250px]">
                      <div className="truncate" title={row.tenSP}>{row.tenSP || "-"}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.dongSize || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.maVaiChinh || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {row.mauSac || "-"}
                    </td>
                    {activeSizeColumns.map((size) => (
                      <td key={size} className="px-2 py-3 text-sm text-center text-gray-900">
                        {row.sizes[size] > 0 ? row.sizes[size].toLocaleString("vi-VN") : "-"}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-sm text-right font-medium text-green-600">
                      {row.tongSoLuong > 0 ? row.tongSoLuong.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={6 + activeSizeColumns.length} className="px-3 py-3 text-sm text-gray-700 text-right">
                    Tổng cộng:
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-green-600">
                    {totalSoLuong.toLocaleString("vi-VN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
