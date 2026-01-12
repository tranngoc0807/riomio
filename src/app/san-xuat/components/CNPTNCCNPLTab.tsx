"use client";

import { Loader2, Search, Receipt, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { CNPTNCCNPLThang, CNPTNCCNPLNgay } from "@/lib/googleSheets";

export default function CNPTNCCNPLTab() {
  const [cnptThang, setCnptThang] = useState<CNPTNCCNPLThang[]>([]);
  const [cnptNgay, setCnptNgay] = useState<CNPTNCCNPLNgay[]>([]);
  const [searchTermThang, setSearchTermThang] = useState("");
  const [searchTermNgay, setSearchTermNgay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<"thang" | "ngay">("thang");

  // Filtered data
  const filteredThang = cnptThang.filter((item) =>
    item.nccNPL.toLowerCase().includes(searchTermThang.toLowerCase())
  );

  const filteredNgay = cnptNgay.filter((item) =>
    item.nccNPL.toLowerCase().includes(searchTermNgay.toLowerCase())
  );

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cnpt-ncc-npl");
      const result = await response.json();
      if (result.success) {
        setCnptThang(result.data.cnptThang);
        setCnptNgay(result.data.cnptNgay);
      } else {
        toast.error("Không thể tải danh sách CNPT NCC NPL");
      }
    } catch (error) {
      console.error("Error fetching CNPT NCC NPL:", error);
      toast.error("Lỗi khi tải danh sách CNPT NCC NPL");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for cnptThang
  const totalDuDauKi = filteredThang.reduce((sum, item) => sum + item.duDauKi, 0);
  const totalPhatSinh = filteredThang.reduce((sum, item) => sum + item.phatSinh, 0);
  const totalThanhToan = filteredThang.reduce((sum, item) => sum + item.thanhToan, 0);
  const totalDuCuoiKi = filteredThang.reduce((sum, item) => sum + item.duCuoiKi, 0);

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
              Công nợ phải trả NCC NPL - Theo tháng ({filteredThang.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm NCC NPL..."
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
                  <th className="px-2 py-3 text-left font-medium text-gray-500">NCC NPL</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Dư đầu kì</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Phát sinh</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Thanh toán</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Dư cuối kì</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredThang.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 text-gray-600">{item.stt}</td>
                    <td className="px-2 py-2.5 font-medium text-gray-900">{item.nccNPL}</td>
                    <td className={`px-2 py-2.5 text-right ${item.duDauKi < 0 ? "text-red-600" : "text-gray-600"}`}>
                      {item.duDauKi !== 0 ? item.duDauKi.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-blue-600">
                      {item.phatSinh !== 0 ? item.phatSinh.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-green-600">
                      {item.thanhToan !== 0 ? item.thanhToan.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className={`px-2 py-2.5 text-right font-medium ${item.duCuoiKi < 0 ? "text-green-600" : "text-red-600"}`}>
                      {item.duCuoiKi !== 0 ? item.duCuoiKi.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-2 py-3 text-right">Tổng cộng:</td>
                  <td className={`px-2 py-3 text-right ${totalDuDauKi < 0 ? "text-red-600" : "text-gray-600"}`}>
                    {totalDuDauKi !== 0 ? totalDuDauKi.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-2 py-3 text-right text-blue-600">
                    {totalPhatSinh !== 0 ? totalPhatSinh.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-2 py-3 text-right text-green-600">
                    {totalThanhToan !== 0 ? totalThanhToan.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className={`px-2 py-3 text-right ${totalDuCuoiKi < 0 ? "text-green-600" : "text-red-600"}`}>
                    {totalDuCuoiKi !== 0 ? `${totalDuCuoiKi.toLocaleString("vi-VN")}đ` : "-"}
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
              Bảng kê số dư đầu kì công nợ phải trả đến ngày ({filteredNgay.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm NCC NPL..."
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
                  <th className="px-3 py-3 text-left font-medium text-gray-500">NCC NPL</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-32">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNgay.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-600">{item.stt}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{item.nccNPL}</td>
                    <td className={`px-3 py-2.5 text-right font-medium ${item.soTien < 0 ? "text-red-600" : "text-orange-600"}`}>
                      {item.soTien !== 0 ? item.soTien.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-3 py-3 text-right">Tổng số tiền:</td>
                  <td className={`px-3 py-3 text-right ${totalSoTien < 0 ? "text-red-600" : "text-orange-600"}`}>
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
