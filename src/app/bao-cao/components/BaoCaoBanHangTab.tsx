"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  User,
  Package,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

type SubTabType = "theo-thang" | "theo-khach-hang" | "theo-nhan-vien" | "theo-san-pham";

interface BaoCaoBanHangTheoThangRow {
  thang: number;
  nam: number;
  doanhThu: number;
  tienVon: number;
  loiNhuan: number;
}

interface BaoCaoBanHangTheoThangData {
  rows: BaoCaoBanHangTheoThangRow[];
}

interface BaoCaoSanPhamRow {
  tenSanPham: string;
  soLuongBan: number;
  doanhThu: number;
  loiNhuanGop: number;
}

interface BaoCaoSanPhamData {
  rows: BaoCaoSanPhamRow[];
}

interface BaoCaoNhanVienRow {
  thang: number;
  nhanVien: string;
  doanhThu: number;
  loiNhuanGop: number;
}

interface BaoCaoNhanVienData {
  rows: BaoCaoNhanVienRow[];
}

interface BaoCaoKhachHangRow {
  thang: number;
  khachHang: string;
  doanhThu: number;
  loiNhuanGop: number;
}

interface BaoCaoKhachHangData {
  rows: BaoCaoKhachHangRow[];
}

const SUB_TABS = [
  { id: "theo-thang" as SubTabType, label: "Báo cáo bán hàng theo tháng", icon: Calendar },
  { id: "theo-khach-hang" as SubTabType, label: "Báo cáo bán hàng theo khách hàng", icon: Users },
  { id: "theo-nhan-vien" as SubTabType, label: "Báo cáo bán hàng theo nhân viên", icon: User },
  { id: "theo-san-pham" as SubTabType, label: "Báo cáo bán hàng theo sản phẩm", icon: Package },
];

export default function BaoCaoBanHangTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("theo-thang");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BaoCaoBanHangTheoThangData | null>(null);
  const [sanPhamData, setSanPhamData] = useState<BaoCaoSanPhamData | null>(null);
  const [nhanVienData, setNhanVienData] = useState<BaoCaoNhanVienData | null>(null);
  const [khachHangData, setKhachHangData] = useState<BaoCaoKhachHangData | null>(null);

  // Lấy dữ liệu khi component mount hoặc khi tab thay đổi
  useEffect(() => {
    if (activeSubTab === "theo-thang") {
      fetchData();
    } else if (activeSubTab === "theo-san-pham") {
      fetchSanPhamData();
    } else if (activeSubTab === "theo-nhan-vien") {
      fetchNhanVienData();
    } else if (activeSubTab === "theo-khach-hang") {
      fetchKhachHangData();
    }
  }, [activeSubTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/ban-hang-theo-thang");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchSanPhamData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/san-pham");
      const result = await response.json();

      if (result.success) {
        setSanPhamData(result.data);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching san pham data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVienData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/nhan-vien");
      const result = await response.json();

      if (result.success) {
        setNhanVienData(result.data);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching nhan vien data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchKhachHangData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bao-cao/khach-hang");
      const result = await response.json();

      if (result.success) {
        setKhachHangData(result.data);
      } else {
        toast.error(result.error || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching khach hang data:", error);
      toast.error("Lỗi khi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  return (
    <div>
      {/* Sub-tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div>
        {activeSubTab === "theo-thang" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : data ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo bán hàng theo tháng
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tháng
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Năm
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doanh thu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiền vốn
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lợi nhuận
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                            {row.thang}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                            {row.nam}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.doanhThu)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.tienVon)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.loiNhuan > 0 ? "text-green-600" : row.loiNhuan < 0 ? "text-red-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.loiNhuan)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "theo-khach-hang" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : khachHangData ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo mua hàng của khách hàng
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tháng
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Khách hàng
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doanh thu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lợi nhuận góp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {khachHangData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                            {row.thang}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.khachHang}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.doanhThu)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.loiNhuanGop > 0 ? "text-green-600" : row.loiNhuanGop < 0 ? "text-red-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.loiNhuanGop)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "theo-nhan-vien" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : nhanVienData ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo bán hàng theo nhân viên
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tháng
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nhân viên
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doanh thu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lợi nhuận góp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {nhanVienData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                            {row.thang}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.nhanVien}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.doanhThu)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.loiNhuanGop > 0 ? "text-green-600" : row.loiNhuanGop < 0 ? "text-red-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.loiNhuanGop)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "theo-san-pham" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : sanPhamData ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo doanh thu theo sản phẩm
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng bán
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doanh thu
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lợi nhuận góp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sanPhamData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.tenSanPham}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {row.soLuongBan}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(row.doanhThu)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            row.loiNhuanGop > 0 ? "text-green-600" : row.loiNhuanGop < 0 ? "text-red-600" : "text-gray-900"
                          }`}>
                            {formatCurrency(row.loiNhuanGop)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-gray-500 text-center">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
