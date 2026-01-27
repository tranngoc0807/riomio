"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, CreditCard, RefreshCw, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface BCTungTaiKhoanRow {
  ngayThang: string;
  doiTuong: string;
  noiDung: string;
  phanLoai: string;
  thu: number;
  chi: number;
  duCuoi: number;
}

interface BCTungTaiKhoanData {
  selectedAccount: string;
  accounts: string[];
  transactions: BCTungTaiKhoanRow[];
}

export default function BCTungTaiKhoanTab() {
  const [data, setData] = useState<BCTungTaiKhoanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bc-tung-tai-khoan");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Error fetching BC Tung Tai Khoan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountChange = async (account: string) => {
    setIsDropdownOpen(false);
    setIsUpdating(true);
    setCurrentPage(1);
    try {
      const response = await fetch("/api/bc-tung-tai-khoan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Error updating account:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!data?.transactions) return { thu: 0, chi: 0 };
    return data.transactions.reduce(
      (acc, row) => ({
        thu: acc.thu + row.thu,
        chi: acc.chi + row.chi,
      }),
      { thu: 0, chi: 0 }
    );
  }, [data?.transactions]);

  // Get last balance (dư cuối)
  const lastBalance = data?.transactions?.[data.transactions.length - 1]?.duCuoi || 0;

  // Pagination
  const totalPages = Math.ceil((data?.transactions?.length || 0) / itemsPerPage);
  const paginatedData = data?.transactions?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard size={20} className="text-indigo-600" />
          Báo cáo từng tài khoản
        </h3>
        <div className="flex items-center gap-3">
          {/* Account Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Tài khoản:</label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isUpdating}
                className={`flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[200px] text-left ${
                  isUpdating ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-gray-400 bg-white"
                }`}
              >
                <span className={data?.selectedAccount ? "text-gray-900" : "text-gray-400"}>
                  {data?.selectedAccount || "Chọn tài khoản"}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {data?.accounts?.map((account, index) => (
                    <button
                      key={index}
                      onClick={() => handleAccountChange(account)}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-indigo-50 ${
                        account === data?.selectedAccount ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {account}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Tổng thu</p>
          <p className="text-xl font-bold text-green-700">
            {totals.thu.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Tổng chi</p>
          <p className="text-xl font-bold text-red-700">
            {totals.chi.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className={`border rounded-lg p-4 ${lastBalance >= 0 ? "bg-indigo-50 border-indigo-200" : "bg-orange-50 border-orange-200"}`}>
          <p className={`text-sm font-medium ${lastBalance >= 0 ? "text-indigo-600" : "text-orange-600"}`}>
            Dư cuối
          </p>
          <p className={`text-xl font-bold ${lastBalance >= 0 ? "text-indigo-700" : "text-orange-700"}`}>
            {lastBalance.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-indigo-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày tháng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Đối tượng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nội dung</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phân loại</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Thu</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Chi</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Dư cuối</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {data?.selectedAccount ? "Không có giao dịch" : "Vui lòng chọn tài khoản"}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.ngayThang}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-32 truncate">{row.doiTuong || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-48 truncate">{row.noiDung || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.phanLoai && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        row.phanLoai.toLowerCase().includes("thu")
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {row.phanLoai}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                    {row.thu > 0 ? row.thu.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                    {row.chi > 0 ? row.chi.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${row.duCuoi >= 0 ? "text-indigo-600" : "text-orange-600"}`}>
                    {row.duCuoi.toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {paginatedData.length > 0 && (
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={4} className="px-4 py-3 font-semibold text-gray-700">Tổng</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">
                  {totals.thu.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-red-700">
                  {totals.chi.toLocaleString("vi-VN")}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${lastBalance >= 0 ? "text-indigo-700" : "text-orange-700"}`}>
                  {lastBalance.toLocaleString("vi-VN")}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, data?.transactions?.length || 0)} trong{" "}
            {data?.transactions?.length || 0} giao dịch
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
