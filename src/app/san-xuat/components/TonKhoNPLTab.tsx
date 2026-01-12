"use client";

import { Loader2, Search, Archive, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { TonKhoNPLThang, TonKhoNPLNgay } from "@/lib/googleSheets";

export default function TonKhoNPLTab() {
  const [tonKhoThang, setTonKhoThang] = useState<TonKhoNPLThang[]>([]);
  const [tonKhoNgay, setTonKhoNgay] = useState<TonKhoNPLNgay[]>([]);
  const [searchTermThang, setSearchTermThang] = useState("");
  const [searchTermNgay, setSearchTermNgay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<"thang" | "ngay">("thang");

  // Filtered data
  const filteredThang = tonKhoThang.filter((item) =>
    item.maNPL.toLowerCase().includes(searchTermThang.toLowerCase())
  );

  const filteredNgay = tonKhoNgay.filter((item) =>
    item.maSP.toLowerCase().includes(searchTermNgay.toLowerCase())
  );

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/ton-kho-npl");
      const result = await response.json();
      if (result.success) {
        setTonKhoThang(result.data.tonKhoThang);
        setTonKhoNgay(result.data.tonKhoNgay);
      } else {
        toast.error("Không thể tải danh sách tồn kho NPL");
      }
    } catch (error) {
      console.error("Error fetching ton kho NPL:", error);
      toast.error("Lỗi khi tải danh sách tồn kho NPL");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for tonKhoThang
  const totalGiaTriTon = filteredThang.reduce((sum, item) => sum + item.giaTriTon, 0);

  // Calculate totals for tonKhoNgay
  const totalSoLuongNgay = filteredNgay.reduce((sum, item) => sum + item.soLuong, 0);

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
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Calendar size={18} />
          Tồn kho theo tháng
        </button>
        <button
          onClick={() => setActiveTable("ngay")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTable === "ngay"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Archive size={18} />
          Tồn kho đến ngày
        </button>
      </div>

      {/* Table 1: Tồn kho theo tháng */}
      {activeTable === "thang" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-700">
              Tồn kho NPL kho công ty - Theo tháng ({filteredThang.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm mã NPL..."
                value={searchTermThang}
                onChange={(e) => setSearchTermThang(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-2 py-3 text-left font-medium text-gray-500 w-12">STT</th>
                  <th className="px-2 py-3 text-left font-medium text-gray-500">Mã nguyên phụ liệu</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-24">Tồn đầu</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-24">Nhập kho</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-24">Xuất kho</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-24">Tồn cuối</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-28">Đơn giá sau thuế</th>
                  <th className="px-2 py-3 text-right font-medium text-gray-500 w-32">Giá trị tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredThang.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 text-gray-600">{item.stt}</td>
                    <td className="px-2 py-2.5 font-medium text-gray-900">{item.maNPL}</td>
                    <td className="px-2 py-2.5 text-right text-gray-600">
                      {item.tonDau > 0 ? item.tonDau.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-green-600">
                      {item.nhapKho > 0 ? item.nhapKho.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-red-600">
                      {item.xuatKho > 0 ? item.xuatKho.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right font-medium text-blue-600">
                      {item.tonCuoi.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-600">
                      {item.donGiaSauThue > 0 ? item.donGiaSauThue.toLocaleString("vi-VN") : "-"}
                    </td>
                    <td className="px-2 py-2.5 text-right font-medium text-orange-600">
                      {item.giaTriTon > 0 ? item.giaTriTon.toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={7} className="px-2 py-3 text-right">Tổng giá trị tồn:</td>
                  <td className="px-2 py-3 text-right text-orange-600">
                    {totalGiaTriTon.toLocaleString("vi-VN")}đ
                  </td>
                </tr>
              </tfoot>
            </table>

            {filteredThang.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu tồn kho theo tháng
              </div>
            )}
          </div>
        </>
      )}

      {/* Table 2: Tồn kho đến ngày */}
      {activeTable === "ngay" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-700">
              Tồn kho NPL đến ngày ({filteredNgay.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm mã SP..."
                value={searchTermNgay}
                onChange={(e) => setSearchTermNgay(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50">
                  <th className="px-3 py-3 text-left font-medium text-gray-500 w-16">STT</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Mã SP</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500 w-32">Số lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNgay.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-600">{item.stt}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{item.maSP}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-green-600">
                      {item.soLuong.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-3 py-3 text-right">Tổng số lượng:</td>
                  <td className="px-3 py-3 text-right text-green-600">
                    {totalSoLuongNgay.toLocaleString("vi-VN")}
                  </td>
                </tr>
              </tfoot>
            </table>

            {filteredNgay.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu tồn kho đến ngày
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
