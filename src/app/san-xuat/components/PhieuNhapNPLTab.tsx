"use client";

import { Loader2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { PhieuNhapNPL } from "@/lib/googleSheets";

export default function PhieuNhapNPLTab() {
  const [data, setData] = useState<PhieuNhapNPL[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maNPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ghiChu.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/phieu-nhap-npl");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải danh sách phiếu nhập kho NPL");
      }
    } catch (error) {
      console.error("Error fetching phieu nhap kho NPL:", error);
      toast.error("Lỗi khi tải danh sách phiếu nhập kho NPL");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total
  const totalSoLuong = filteredList.reduce((sum, item) => sum + item.soLuong, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Phiếu nhập kho NPL, trả NPL NCC ({filteredList.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm mã NPL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-16">STT</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Mã nguyên phụ liệu</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 w-24">ĐVT</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">Số lượng</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{item.stt}</td>
                  <td className="px-4 py-3 text-gray-900">{item.maNPL}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.dvt}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">
                    {item.soLuong.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.ghiChu || "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={3} className="px-4 py-3 text-right">Tổng cộng:</td>
                <td className="px-4 py-3 text-right text-blue-600">
                  {totalSoLuong.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {filteredList.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu phiếu nhập kho NPL
            </div>
          )}
        </div>
      )}
    </>
  );
}
