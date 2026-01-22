"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, UserCheck, RefreshCw } from "lucide-react";
import { CongNoTransaction } from "@/lib/googleSheets";
import toast, { Toaster } from "react-hot-toast";

interface CongNoData {
  selectedCustomer: string;
  transactions: CongNoTransaction[];
}

interface Customer {
  name: string;
  category: string;
}

export default function CongNoTab() {
  const [congNoData, setCongNoData] = useState<CongNoData>({
    selectedCustomer: "",
    transactions: [],
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingCustomer, setIsChangingCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCongNoData();
    fetchCustomers();
  }, []);

  const fetchCongNoData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cong-no-khach-hang");
      const result = await response.json();

      if (result.success) {
        setCongNoData(result.data);
      } else {
        toast.error(result.error || "Không thể tải dữ liệu công nợ");
      }
    } catch (err: any) {
      console.error("Error fetching debt tracking data:", err);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/khach-hang");
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data.map((c: any) => ({
          name: c.name,
          category: c.category
        })));
      }
    } catch (err: any) {
      console.error("Error fetching customers:", err);
    }
  };

  const handleCustomerChange = async (customerName: string) => {
    if (!customerName || customerName === congNoData.selectedCustomer) {
      return;
    }

    setIsChangingCustomer(true);

    try {
      const response = await fetch("/api/cong-no-khach-hang", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName }),
      });

      const result = await response.json();

      if (result.success) {
        setCongNoData(result.data);
        toast.success("Đã chuyển sang khách hàng: " + customerName);
      } else {
        toast.error(result.error || "Không thể chuyển khách hàng");
      }
    } catch (err: any) {
      console.error("Error changing customer:", err);
      toast.error("Đã xảy ra lỗi khi chuyển khách hàng");
    } finally {
      setIsChangingCustomer(false);
    }
  };

  if (isLoading && congNoData.transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-gray-600">Đang tải dữ liệu công nợ...</span>
      </div>
    );
  }

  // Calculate totals
  const totalTienHang = congNoData.transactions.reduce((sum, t) => sum + t.tienHang, 0);
  const totalThanhToan = congNoData.transactions.reduce((sum, t) => sum + t.thanhToan, 0);
  const duCuoiCung = congNoData.transactions.length > 0
    ? congNoData.transactions[congNoData.transactions.length - 1].duCuoi
    : 0;

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* Customer Selection */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-4">
          <UserCheck className="text-blue-600" size={24} />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn khách hàng
            </label>
            <select
              value={congNoData.selectedCustomer}
              onChange={(e) => handleCustomerChange(e.target.value)}
              disabled={isChangingCustomer}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {congNoData.selectedCustomer && (
                <option value={congNoData.selectedCustomer}>
                  {congNoData.selectedCustomer}
                </option>
              )}
              {customers
                .filter(c => c.name !== congNoData.selectedCustomer)
                .map((customer) => (
                  <option key={customer.name} value={customer.name}>
                    {customer.name} {customer.category && `(${customer.category})`}
                  </option>
                ))}
            </select>
          </div>
          <button
            onClick={fetchCongNoData}
            disabled={isLoading || isChangingCustomer}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {congNoData.selectedCustomer && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Tổng tiền hàng</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalTienHang.toLocaleString()} đ
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Tổng thanh toán</div>
            <div className="text-2xl font-bold text-green-600">
              {totalThanhToan.toLocaleString()} đ
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Dư cuối kỳ</div>
            <div className={`text-2xl font-bold ${duCuoiCung >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {duCuoiCung.toLocaleString()} đ
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ngày tháng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Mã đơn hàng
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Tiền hàng
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Thanh toán
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Dư cuối
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {congNoData.transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {congNoData.selectedCustomer
                      ? "Chưa có giao dịch nào cho khách hàng này"
                      : "Vui lòng chọn khách hàng để xem công nợ"}
                  </td>
                </tr>
              ) : (
                congNoData.transactions.map((transaction, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900">{transaction.ngayThang}</td>
                    <td className="px-4 py-3">
                      {transaction.maDonHang ? (
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 font-medium">
                          {transaction.maDonHang}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {transaction.tienHang > 0 ? transaction.tienHang.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {transaction.thanhToan > 0 ? transaction.thanhToan.toLocaleString() : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${
                      transaction.duCuoi >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {transaction.duCuoi.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      {congNoData.selectedCustomer && congNoData.transactions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Lưu ý:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Dữ liệu được đồng bộ tự động từ Google Sheets</li>
                <li>Dư cuối kỳ được tính dựa trên công thức: Dư đầu + Tiền hàng - Thanh toán</li>
                <li>Nhấn nút làm mới để cập nhật dữ liệu mới nhất</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
