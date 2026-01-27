"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, Search } from "lucide-react";

interface CongNoXuongRow {
  id: number;
  date: string;
  noiDung: string;
  tienGiaCong: number;
  thanhToan: number;
  duCuoi: number;
}

interface Workshop {
  id: number;
  name: string;
}

export default function TheoDoiCNXuongTab() {
  const [congNoData, setCongNoData] = useState<CongNoXuongRow[]>([]);
  const [xuongSXName, setXuongSXName] = useState<string>("");
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingXuong, setIsChangingXuong] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchWorkshops();
    fetchData();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await fetch("/api/workshops");
      const result = await response.json();
      if (result.success) {
        setWorkshops(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching workshops:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/theo-doi-cn-xuong");
      const result = await response.json();

      if (result.success) {
        setCongNoData(result.data || []);
        setXuongSXName(result.xuongSX || "");
      }
    } catch (error) {
      console.error("Error fetching cong no data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectXuong = async (name: string) => {
    if (name === xuongSXName) {
      setShowDropdown(false);
      return;
    }

    try {
      setIsChangingXuong(true);
      setShowDropdown(false);

      // Cập nhật xưởng SX trong Google Sheet
      const response = await fetch("/api/theo-doi-cn-xuong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xuongSX: name }),
      });

      const result = await response.json();
      if (result.success) {
        // Đợi 1 giây để Google Sheet cập nhật formulas
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Fetch lại data mới
        await fetchData();
      }
    } catch (error) {
      console.error("Error changing xưởng SX:", error);
    } finally {
      setIsChangingXuong(false);
    }
  };

  // Lọc danh sách xưởng SX theo từ khóa
  const filteredWorkshops = workshops.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tính tổng
  const totalTienGiaCong = congNoData.reduce((sum, row) => sum + row.tienGiaCong, 0);
  const totalThanhToan = congNoData.reduce((sum, row) => sum + row.thanhToan, 0);
  const lastBalance = congNoData.length > 0 ? congNoData[congNoData.length - 1].duCuoi : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Theo dõi CN từng xưởng SX</h3>

          {/* Xưởng SX Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isChangingXuong}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors min-w-[200px] disabled:opacity-50"
            >
              {isChangingXuong ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  <span className="text-orange-700">Đang chuyển...</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-orange-700 truncate flex-1 text-left">
                    {xuongSXName || "Chọn xưởng SX"}
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
                <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Tìm xưởng SX..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Workshop List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredWorkshops.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500 text-sm text-center">
                        Không tìm thấy xưởng SX
                      </div>
                    ) : (
                      filteredWorkshops.map((workshop) => (
                        <div
                          key={workshop.id}
                          onClick={() => handleSelectXuong(workshop.name)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            xuongSXName === workshop.name
                              ? "bg-orange-50 text-orange-700 font-medium"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {workshop.name}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Tổng tiền gia công</p>
          <p className="text-2xl font-bold text-blue-700">
            {totalTienGiaCong.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Tổng thanh toán</p>
          <p className="text-2xl font-bold text-green-700">
            {totalThanhToan.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className={`bg-gradient-to-br rounded-xl p-4 border ${
          lastBalance > 0
            ? "from-red-50 to-red-100 border-red-200"
            : lastBalance < 0
            ? "from-green-50 to-green-100 border-green-200"
            : "from-gray-50 to-gray-100 border-gray-200"
        }`}>
          <p className={`text-sm mb-1 ${
            lastBalance > 0 ? "text-red-600" : lastBalance < 0 ? "text-green-600" : "text-gray-600"
          }`}>
            Dư nợ hiện tại
          </p>
          <p className={`text-2xl font-bold ${
            lastBalance > 0 ? "text-red-700" : lastBalance < 0 ? "text-green-700" : "text-gray-700"
          }`}>
            {lastBalance.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading || isChangingXuong ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {isChangingXuong ? "Đang chuyển xưởng SX..." : "Đang tải dữ liệu..."}
              </p>
            </div>
          </div>
        ) : congNoData.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-500">Không có dữ liệu công nợ</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ngày tháng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tiền gia công
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-red-50">
                    Dư cuối
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {congNoData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.noiDung || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {row.tienGiaCong !== 0 ? row.tienGiaCong.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                      {row.thanhToan !== 0 ? row.thanhToan.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold bg-red-50 ${
                      row.duCuoi > 0 ? "text-red-700" : row.duCuoi < 0 ? "text-green-700" : "text-gray-700"
                    }`}>
                      {row.duCuoi.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={3} className="px-4 py-3 text-sm text-gray-700 text-right">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {totalTienGiaCong.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {totalThanhToan.toLocaleString("vi-VN")}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right bg-red-100 ${
                    lastBalance > 0 ? "text-red-700" : lastBalance < 0 ? "text-green-700" : "text-gray-700"
                  }`}>
                    {lastBalance.toLocaleString("vi-VN")}
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
