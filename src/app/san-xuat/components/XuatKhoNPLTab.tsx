"use client";

import { Eye, Loader2, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import toast from "react-hot-toast";
import type { XuatKhoNPL } from "@/lib/googleSheets";

export default function XuatKhoNPLTab() {
  const [data, setData] = useState<XuatKhoNPL[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<XuatKhoNPL | null>(null);

  // Filtered data
  const filteredList = data.filter(
    (item) =>
      item.maPhieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maNPL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maSP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.xuongSX.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lenhSX.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/xuat-kho-npl");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải danh sách xuất kho NPL");
      }
    } catch (error) {
      console.error("Error fetching xuat kho NPL:", error);
      toast.error("Lỗi khi tải danh sách xuất kho NPL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (item: XuatKhoNPL) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  // Calculate totals
  const totalThanhTien = filteredList.reduce((sum, item) => sum + item.thanhTien, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Danh sách xuất kho NPL ({filteredList.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
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
                <th className="px-2 py-3 text-left font-medium text-gray-500 w-10">STT</th>
                <th className="px-2 py-3 text-left font-medium text-gray-500">Mã phiếu</th>
                <th className="px-2 py-3 text-left font-medium text-gray-500">Ngày</th>
                <th className="px-2 py-3 text-left font-medium text-gray-500">Lệnh SX</th>
                <th className="px-2 py-3 text-left font-medium text-gray-500">Xưởng SX</th>
                <th className="px-2 py-3 text-left font-medium text-gray-500">Mã NPL</th>
                <th className="px-2 py-3 text-center font-medium text-gray-500">ĐVT</th>
                <th className="px-2 py-3 text-right font-medium text-gray-500">SL</th>
                <th className="px-2 py-3 text-right font-medium text-gray-500">Đơn giá</th>
                <th className="px-2 py-3 text-right font-medium text-gray-500">Thành tiền</th>
                <th className="px-2 py-3 text-left font-medium text-gray-500">Loại CP</th>
                <th className="px-2 py-3 text-center font-medium text-gray-500 w-14">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredList.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2.5 text-gray-600">{index + 1}</td>
                  <td className="px-2 py-2.5 font-medium text-blue-600">{item.maPhieu}</td>
                  <td className="px-2 py-2.5 text-gray-600">{item.ngayThang}</td>
                  <td className="px-2 py-2.5 text-gray-600">{item.lenhSX || "-"}</td>
                  <td className="px-2 py-2.5 text-gray-600 max-w-[120px] truncate" title={item.xuongSX}>
                    {item.xuongSX}
                  </td>
                  <td className="px-2 py-2.5 text-gray-900 max-w-[180px] truncate" title={item.maNPL}>
                    {item.maNPL}
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-600">{item.dvt}</td>
                  <td className="px-2 py-2.5 text-right text-gray-900">
                    {item.soLuong.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-2 py-2.5 text-right text-gray-900">
                    {item.donGia > 0 ? item.donGia.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-2 py-2.5 text-right font-medium text-red-600">
                    {item.thanhTien > 0 ? item.thanhTien.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-2 py-2.5 text-gray-600">{item.loaiChiPhi || "-"}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleView(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={9} className="px-2 py-3 text-right">Tổng cộng:</td>
                <td className="px-2 py-3 text-right text-red-600">
                  {totalThanhTien.toLocaleString("vi-VN")}đ
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>

          {filteredList.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu xuất kho NPL
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowViewModal(false)} />
          <div className="fixed top-0 right-0 w-full max-w-xl h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết phiếu xuất kho</h3>
                <p className="text-sm text-gray-500">{selectedItem.maPhieu}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Mã phiếu:</span>
                    <p className="font-medium text-blue-600">{selectedItem.maPhieu}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Ngày tháng:</span>
                    <p className="font-medium">{selectedItem.ngayThang}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Người nhập:</span>
                    <p className="font-medium">{selectedItem.nguoiNhap || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Nội dung:</span>
                    <p className="font-medium">{selectedItem.noiDung || "-"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Mã SP:</span>
                      <p className="font-medium">{selectedItem.maSP || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Lệnh SX:</span>
                      <p className="font-medium">{selectedItem.lenhSX || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-500">Xưởng sản xuất:</span>
                      <p className="font-medium">{selectedItem.xuongSX || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <span className="text-sm text-gray-500">Mã NPL:</span>
                      <p className="font-medium">{selectedItem.maNPL}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Đơn vị tính:</span>
                      <p className="font-medium">{selectedItem.dvt || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Số lượng:</span>
                      <p className="font-medium">{selectedItem.soLuong.toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Đơn giá:</span>
                      <p className="font-medium">
                        {selectedItem.donGia > 0
                          ? `${selectedItem.donGia.toLocaleString("vi-VN")}đ`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Thành tiền:</span>
                      <p className="font-medium text-lg text-red-600">
                        {selectedItem.thanhTien > 0
                          ? `${selectedItem.thanhTien.toLocaleString("vi-VN")}đ`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Loại chi phí:</span>
                      <p className="font-medium">{selectedItem.loaiChiPhi || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Tồn thực tế:</span>
                      <p className="font-medium">{selectedItem.tonThucTe.toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                </div>

                {selectedItem.ghiChu && (
                  <div className="border-t pt-4">
                    <span className="text-sm text-gray-500">Ghi chú:</span>
                    <p className="font-medium">{selectedItem.ghiChu}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
