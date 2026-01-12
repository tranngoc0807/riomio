"use client";

import { Loader2, Search, Receipt, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface CNPTXuongThang {
  id: number;
  stt: number;
  xuongSX: string;
  duDau: number;
  tienGiaCong: number;
  thanhToan: number;
  duCuoi: number;
}

interface CNPTXuongNgay {
  id: number;
  stt: number;
  xuongSX: string;
  soTien: number;
}

export default function CNPTXuongGiaCongTab() {
  const [cnptThang, setCnptThang] = useState<CNPTXuongThang[]>([]);
  const [cnptNgay, setCnptNgay] = useState<CNPTXuongNgay[]>([]);
  const [searchTermThang, setSearchTermThang] = useState("");
  const [searchTermNgay, setSearchTermNgay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<"thang" | "ngay">("thang");

  // Filtered data
  const filteredThang = cnptThang.filter((item) =>
    item.xuongSX.toLowerCase().includes(searchTermThang.toLowerCase())
  );

  const filteredNgay = cnptNgay.filter((item) =>
    item.xuongSX.toLowerCase().includes(searchTermNgay.toLowerCase())
  );

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cnpt-xuong-gia-cong");
      const result = await response.json();
      if (result.success) {
        setCnptThang(result.thangData || []);
        setCnptNgay(result.ngayData || []);
      } else {
        toast.error("Không thể tải danh sách CNPT xưởng gia công");
      }
    } catch (error) {
      console.error("Error fetching CNPT xuong gia cong:", error);
      toast.error("Lỗi khi tải danh sách CNPT xưởng gia công");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for cnptThang
  const totalDuDau = filteredThang.reduce((sum, item) => sum + item.duDau, 0);
  const totalTienGiaCong = filteredThang.reduce((sum, item) => sum + item.tienGiaCong, 0);
  const totalThanhToan = filteredThang.reduce((sum, item) => sum + item.thanhToan, 0);
  const totalDuCuoi = filteredThang.reduce((sum, item) => sum + item.duCuoi, 0);

  // Calculate totals for cnptNgay
  const totalSoTien = filteredNgay.reduce((sum, item) => sum + item.soTien, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTable("thang")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "thang"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Calendar size={18} />
          Công nợ theo tháng
        </button>
        <button
          onClick={() => setActiveTable("ngay")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "ngay"
              ? "bg-orange-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Receipt size={18} />
          Số dư đầu kì đến ngày
        </button>
      </div>

      {/* Table 1: Công nợ theo tháng */}
      {activeTable === "thang" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-700">
              Công nợ phải trả xưởng SX - Theo tháng ({filteredThang.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm xưởng SX..."
                value={searchTermThang}
                onChange={(e) => setSearchTermThang(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50">
                  <th className="px-2 py-3 text-left font-medium text-gray-500 w-12">STT</th>
                  <th className="px-2 py-3 text-left font-medium text-gray-500">Xưởng SX</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Dư đầu</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Tiền gia công</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Thanh toán</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Dư cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredThang.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 text-gray-600">{item.stt}</td>
                    <td className="px-2 py-2.5 font-medium text-gray-900">{item.xuongSX}</td>
                    <td className={`px-2 py-2.5 text-right ${item.duDau < 0 ? "text-green-600" : item.duDau > 0 ? "text-red-600" : "text-gray-600"}`}>
                      {item.duDau !== 0 ? item.duDau.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-blue-600">
                      {item.tienGiaCong !== 0 ? item.tienGiaCong.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-green-600">
                      {item.thanhToan !== 0 ? item.thanhToan.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className={`px-2 py-2.5 text-right font-medium ${item.duCuoi < 0 ? "text-green-600" : item.duCuoi > 0 ? "text-red-600" : "text-gray-600"}`}>
                      {item.duCuoi !== 0 ? item.duCuoi.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-2 py-3 text-right">Tổng cộng:</td>
                  <td className={`px-2 py-3 text-right ${totalDuDau < 0 ? "text-green-600" : totalDuDau > 0 ? "text-red-600" : "text-gray-600"}`}>
                    {totalDuDau !== 0 ? totalDuDau.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-2 py-3 text-right text-blue-600">
                    {totalTienGiaCong !== 0 ? totalTienGiaCong.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-2 py-3 text-right text-green-600">
                    {totalThanhToan !== 0 ? totalThanhToan.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className={`px-2 py-3 text-right ${totalDuCuoi < 0 ? "text-green-600" : totalDuCuoi > 0 ? "text-red-600" : "text-gray-600"}`}>
                    {totalDuCuoi !== 0 ? `${totalDuCuoi.toLocaleString("vi-VN")}đ` : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {filteredThang.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu công nợ theo tháng
              </div>
            )}
          </div>
        </>
      )}

      {/* Table 2: Số dư đầu kì đến ngày */}
      {activeTable === "ngay" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-700">
              Bảng kê số dư đầu kì công nợ phải trả xưởng SX đến ngày ({filteredNgay.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm xưởng SX..."
                value={searchTermNgay}
                onChange={(e) => setSearchTermNgay(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50">
                  <th className="px-3 py-3 text-left font-medium text-gray-500 w-16">STT</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Xưởng SX</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-32">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNgay.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-600">{item.stt}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{item.xuongSX}</td>
                    <td className={`px-3 py-2.5 text-right font-medium ${item.soTien < 0 ? "text-green-600" : item.soTien > 0 ? "text-orange-600" : "text-gray-600"}`}>
                      {item.soTien !== 0 ? item.soTien.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-3 py-3 text-right">Tổng số tiền:</td>
                  <td className={`px-3 py-3 text-right ${totalSoTien < 0 ? "text-green-600" : totalSoTien > 0 ? "text-orange-600" : "text-gray-600"}`}>
                    {totalSoTien !== 0 ? `${totalSoTien.toLocaleString("vi-VN")}đ` : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {filteredNgay.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu số dư đầu kì đến ngày
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
