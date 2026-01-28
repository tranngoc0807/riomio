"use client";

import { useState, useEffect } from "react";
import { BangKeTienLuongItem } from "@/lib/googleSheets";
import {
  X,
  User,
  Calendar,
  Briefcase,
  DollarSign,
  Clock,
  TrendingUp,
  Gift,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";

export default function SalaryTab() {
  const [salaryData, setSalaryData] = useState<BangKeTienLuongItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<BangKeTienLuongItem | null>(null);

  // Load salary data from Google Sheets on mount
  useEffect(() => {
    loadSalaryFromSheet();
  }, []);

  const loadSalaryFromSheet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/bang-ke-tien-luong");
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setSalaryData(data.data);
      } else {
        setError("Không có dữ liệu trong sheet");
      }
    } catch (error) {
      console.error("Error loading salary from sheet:", error);
      setError("Lỗi khi tải dữ liệu từ Google Sheets");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totals = salaryData.reduce(
    (acc, row) => ({
      mucLuongCoBan: acc.mucLuongCoBan + row.mucLuongCoBan,
      luongThucTe: acc.luongThucTe + row.luongThucTe,
      tongPhuCap: acc.tongPhuCap + row.tongPhuCap,
      kpi: acc.kpi + row.kpi,
      thuongSangKien: acc.thuongSangKien + row.thuongSangKien,
      truBHYTBHXHBHTN: acc.truBHYTBHXHBHTN + row.truBHYTBHXHBHTN,
      truTNCN: acc.truTNCN + row.truTNCN,
      thucLinh: acc.thucLinh + row.thucLinh,
    }),
    {
      mucLuongCoBan: 0,
      luongThucTe: 0,
      tongPhuCap: 0,
      kpi: 0,
      thuongSangKien: 0,
      truBHYTBHXHBHTN: 0,
      truTNCN: 0,
      thucLinh: 0,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            Bảng kê tiền lương ({salaryData.length} nhân viên)
          </h2>
          <button
            onClick={loadSalaryFromSheet}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 sticky left-0 bg-gray-50">
                STT
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 sticky left-14 bg-gray-50">
                Họ và tên
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Chức vụ</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Bộ phận</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Lương cơ bản
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                Công thực tế
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Lương thực tế
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Tổng phụ cấp
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">KPI</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Thưởng sáng kiến
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-orange-50">
                Trừ BHXH/BHYT/BHTN
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-orange-50">
                Trừ TNCN
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-green-50">
                Thực lĩnh
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {salaryData.map((row, index) => (
              <tr
                key={row.id}
                className="hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => setSelectedEmployee(row)}
              >
                <td className="px-4 py-4 text-sm text-gray-600 sticky left-0 bg-white hover:bg-blue-50">
                  {index + 1}
                </td>
                <td className="px-4 py-4 sticky left-14 bg-white hover:bg-blue-50">
                  <p className="text-sm font-medium text-gray-900">{row.hoVaTen}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {row.chucVu}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{row.boPhan}</td>
                <td className="px-4 py-4 text-sm text-right text-gray-900">
                  {row.mucLuongCoBan.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-center text-gray-600">{row.congThucTe}</td>
                <td className="px-4 py-4 text-sm text-right text-gray-900">
                  {row.luongThucTe.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right text-green-600">
                  +{row.tongPhuCap.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right text-blue-600">
                  +{row.kpi.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right text-blue-600">
                  +{row.thuongSangKien.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right text-orange-600 bg-orange-50">
                  -{row.truBHYTBHXHBHTN.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right text-orange-600 bg-orange-50">
                  -{row.truTNCN.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-green-600 bg-green-50">
                  {row.thucLinh.toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={4} className="px-4 py-3 text-right">
                Tổng cộng:
              </td>
              <td className="px-4 py-3 text-right">
                {totals.mucLuongCoBan.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-center">-</td>
              <td className="px-4 py-3 text-right">
                {totals.luongThucTe.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-green-600">
                +{totals.tongPhuCap.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-blue-600">
                +{totals.kpi.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-blue-600">
                +{totals.thuongSangKien.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-orange-600 bg-orange-100">
                -{totals.truBHYTBHXHBHTN.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-orange-600 bg-orange-100">
                -{totals.truTNCN.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-right text-green-700 bg-green-100">
                {totals.thucLinh.toLocaleString("vi-VN")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal Chi tiết */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Gradient với pattern */}
            <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 text-white overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <User size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {selectedEmployee.hoVaTen}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                        {selectedEmployee.chucVu}
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                        {selectedEmployee.boPhan}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-8 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-600" size={24} />
                    <h4 className="font-bold text-lg text-gray-800">Thông tin cơ bản</h4>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Mã phiếu</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {selectedEmployee.maPhieu || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày bắt đầu</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {selectedEmployee.ngayBatDau || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày kết thúc</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {selectedEmployee.ngayKetThuc || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lương & Công */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-green-600" size={24} />
                    <h4 className="font-bold text-lg text-gray-800">Lương & Công</h4>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Lương cơ bản</p>
                      <p className="font-bold text-xl text-gray-900">
                        {selectedEmployee.mucLuongCoBan.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Thưởng chuyên cần</p>
                      <p className="font-bold text-xl text-green-700">
                        +{selectedEmployee.thuongChuyenCan.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Quỹ lương</p>
                      <p className="font-bold text-xl text-gray-900">
                        {selectedEmployee.quyLuong.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">VNĐ</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-gray-600" />
                        <p className="text-xs text-gray-600">Công thực tế</p>
                      </div>
                      <p className="font-bold text-2xl text-gray-900">{selectedEmployee.congThucTe}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-orange-600" />
                        <p className="text-xs text-gray-600">Đi muộn</p>
                      </div>
                      <p className="font-bold text-2xl text-orange-600">{selectedEmployee.diMuon}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-blue-600" />
                        <p className="text-xs text-gray-600">Làm thêm giờ</p>
                      </div>
                      <p className="font-bold text-2xl text-blue-600">{selectedEmployee.lamThemGio}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Lương thực tế</p>
                      <p className="font-bold text-lg text-gray-900">
                        {selectedEmployee.luongThucTe.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Trừ đi muộn</p>
                      <p className="font-bold text-lg text-orange-600">
                        -{selectedEmployee.truDiMuon.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Lương thêm giờ</p>
                      <p className="font-bold text-lg text-green-600">
                        +{selectedEmployee.luongThemGio.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phụ cấp */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-purple-600" size={24} />
                    <h4 className="font-bold text-lg text-gray-800">Phụ cấp</h4>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-3">
                  {[
                    { label: "Ăn trưa/ngày", value: selectedEmployee.phuCapAnTruaNgay },
                    { label: "Ăn trưa/tháng", value: selectedEmployee.phuCapAnTruaThang },
                    { label: "Xăng xe", value: selectedEmployee.phuCapXangXeThang },
                    { label: "Điện thoại", value: selectedEmployee.phuCapDienThoaiThang },
                    { label: "Độc hại, nặng nhọc", value: selectedEmployee.phuCapDocHaiNangNhocThang },
                    { label: "Trang phục", value: selectedEmployee.phuCapTrangPhucThang },
                    { label: "Nhà ở", value: selectedEmployee.phuCapNhaOThang },
                    { label: "Giữ trẻ và nuôi con", value: selectedEmployee.giuTreVaNuoiCon },
                    { label: "Phụ cấp khác", value: selectedEmployee.phuCapKhac },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <p className="text-sm text-gray-700">{item.label}</p>
                      <p className="font-semibold text-gray-900">
                        {item.value.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-300">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800">TỔNG PHỤ CẤP</p>
                      <p className="font-bold text-2xl text-purple-700">
                        {selectedEmployee.tongPhuCap.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thưởng & Các khoản trừ */}
              <div className="grid grid-cols-2 gap-6">
                {/* Thưởng */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Gift className="text-blue-600" size={24} />
                      <h4 className="font-bold text-lg text-gray-800">Thưởng</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">KPI</p>
                      <p className="font-bold text-xl text-blue-600">
                        +{selectedEmployee.kpi.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Thưởng sáng kiến</p>
                      <p className="font-bold text-xl text-green-600">
                        +{selectedEmployee.thuongSangKien.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Cộng khác</p>
                      <p className="font-bold text-xl text-purple-600">
                        +{selectedEmployee.congKhac.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Các khoản trừ */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-orange-600" size={24} />
                      <h4 className="font-bold text-lg text-gray-800">Các khoản trừ</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">BHXH, BHYT, BHTN</p>
                      <p className="font-bold text-xl text-orange-600">
                        -{selectedEmployee.truBHYTBHXHBHTN.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-xs text-gray-600 mb-1">Thuế TNCN</p>
                      <p className="font-bold text-xl text-red-600">
                        -{selectedEmployee.truTNCN.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Công đoàn & Khác</p>
                      <p className="font-bold text-xl text-gray-600">
                        -{(selectedEmployee.truCongDoan + selectedEmployee.truKhac).toLocaleString(
                          "vi-VN"
                        )}{" "}
                        đ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thực lĩnh - Highlight chính */}
              <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl border-4 border-green-400 overflow-hidden">
                <div className="relative p-8">
                  <div className="absolute inset-0 bg-grid-white/10"></div>
                  <div className="relative text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <CheckCircle size={32} className="text-white" />
                      <p className="text-white text-lg font-semibold uppercase tracking-wide">
                        Thực lĩnh
                      </p>
                    </div>
                    <p className="text-6xl font-black text-white drop-shadow-lg">
                      {selectedEmployee.thucLinh.toLocaleString("vi-VN")}
                    </p>
                    <p className="text-2xl text-white/90 font-semibold mt-2">VNĐ</p>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              {selectedEmployee.ghiChu && (
                <div className="bg-yellow-50 rounded-xl shadow-md border-2 border-yellow-200 p-6">
                  <div className="flex items-start gap-3">
                    <FileText className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Ghi chú</h4>
                      <p className="text-gray-700 leading-relaxed">{selectedEmployee.ghiChu}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
