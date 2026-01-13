"use client";

import { Loader2, Search, ChevronLeft, ChevronRight, Receipt, Truck, Factory } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface ChiPhiKhacItem {
  id: number;
  ngay: string;
  noiDung: string;
  chiHoXuong: string;
  soChoMa: string;
  soTien: number;
  phanBo: string;
  doiTacVC: string;
}

interface DoiTacVanChuyenItem {
  id: number;
  stt: number;
  doiTacVC: string;
  tienPhatSinh: number;
  thanhToan: number;
  congNo: number;
}

interface ChiHoXuongItem {
  id: number;
  xuongSX: string;
  tienPhatSinh: number;
  thanhToan: number;
  xuongNoRiomio: number;
}

interface BangKeCPKhacData {
  chiPhiKhac: ChiPhiKhacItem[];
  doiTacVC: DoiTacVanChuyenItem[];
  chiHoXuong: ChiHoXuongItem[];
}

type SubTabType = "chi-phi-khac" | "doi-tac-vc" | "chi-ho-xuong";

const SUB_TABS = [
  { id: "chi-phi-khac" as SubTabType, label: "Chi phí khác", icon: Receipt },
  { id: "doi-tac-vc" as SubTabType, label: "Đối tác vận chuyển", icon: Truck },
  { id: "chi-ho-xuong" as SubTabType, label: "Chi hộ xưởng", icon: Factory },
];

const ITEMS_PER_PAGE = 50;

export default function BangKeCPKhacTab() {
  const [data, setData] = useState<BangKeCPKhacData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("chi-phi-khac");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeSubTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/bang-ke-cp-khac");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Không thể tải dữ liệu bảng kê chi phí khác");
      }
    } catch (error) {
      console.error("Error fetching bang ke cp khac:", error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSubTab === tab.id
                  ? "text-white bg-green-600 shadow-sm"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content based on sub-tab */}
      {activeSubTab === "chi-phi-khac" && (
        <ChiPhiKhacView
          data={data.chiPhiKhac}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}
      {activeSubTab === "doi-tac-vc" && (
        <DoiTacVCView
          data={data.doiTacVC}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}
      {activeSubTab === "chi-ho-xuong" && (
        <ChiHoXuongView
          data={data.chiHoXuong}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}
    </div>
  );
}

// View 1: Chi phí khác
function ChiPhiKhacView({
  data,
  searchTerm,
  setSearchTerm,
  currentPage,
  setCurrentPage
}: {
  data: ChiPhiKhacItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  currentPage: number;
  setCurrentPage: (v: number | ((p: number) => number)) => void;
}) {
  const filtered = data.filter(
    (item) =>
      item.ngay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.noiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chiHoXuong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doiTacVC.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalSoTien = filtered.reduce((sum, item) => sum + item.soTien, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Receipt size={20} className="text-blue-600" />
          Bảng kê chi phí khác ({filtered.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm ngày, nội dung, xưởng, đối tác..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-80"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 inline-block">
        <p className="text-sm text-blue-600">Tổng chi phí khác</p>
        <p className="text-2xl font-bold text-blue-700">{totalSoTien.toLocaleString("vi-VN")}</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left font-medium text-gray-600 w-12">STT</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Ngày</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[200px]">Nội dung</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 min-w-[180px]">Chi hộ xưởng</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Số cho mã</th>
                <th className="px-3 py-3 text-right font-medium text-gray-600">Số tiền</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Phân bổ</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Đối tác VC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-600">{startIndex + index + 1}</td>
                  <td className="px-3 py-2.5 text-gray-900">{item.ngay || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[250px]">
                    <div className="truncate" title={item.noiDung}>{item.noiDung || "-"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[200px]">
                    <div className="truncate" title={item.chiHoXuong}>{item.chiHoXuong || "-"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{item.soChoMa || "-"}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-blue-600">
                    {item.soTien > 0 ? item.soTien.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{item.phanBo || "-"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{item.doiTacVC || "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={5} className="px-3 py-3 text-right">Tổng:</td>
                <td className="px-3 py-3 text-right text-blue-600">{totalSoTien.toLocaleString("vi-VN")}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// View 2: Đối tác vận chuyển
function DoiTacVCView({
  data,
  searchTerm,
  setSearchTerm
}: {
  data: DoiTacVanChuyenItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}) {
  const filtered = data.filter(
    (item) => item.doiTacVC.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTienPS = filtered.reduce((sum, item) => sum + item.tienPhatSinh, 0);
  const totalThanhToan = filtered.reduce((sum, item) => sum + item.thanhToan, 0);
  const totalCongNo = filtered.reduce((sum, item) => sum + item.congNo, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Truck size={20} className="text-purple-600" />
          Tổng hợp đối tác vận chuyển ({filtered.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm đối tác vận chuyển..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-64"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <p className="text-sm text-purple-600">Tiền phát sinh</p>
          <p className="text-2xl font-bold text-purple-700">{totalTienPS.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600">Thanh toán</p>
          <p className="text-2xl font-bold text-green-700">{totalThanhToan.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-600">Công nợ</p>
          <p className="text-2xl font-bold text-red-700">{totalCongNo.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">STT</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[200px]">Đối tác vận chuyển</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Tiền phát sinh</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Thanh toán</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Công nợ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{item.stt || item.id}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{item.doiTacVC}</td>
                  <td className="px-4 py-3 text-right text-purple-600 font-medium">
                    {item.tienPhatSinh > 0 ? item.tienPhatSinh.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    {item.thanhToan > 0 ? item.thanhToan.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-bold">
                    {item.congNo > 0 ? item.congNo.toLocaleString("vi-VN") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">Tổng:</td>
                <td className="px-4 py-3 text-right text-purple-600">{totalTienPS.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 text-right text-green-600">{totalThanhToan.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 text-right text-red-600">{totalCongNo.toLocaleString("vi-VN")}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu đối tác vận chuyển
          </div>
        )}
      </div>
    </div>
  );
}

// View 3: Chi hộ xưởng
function ChiHoXuongView({
  data,
  searchTerm,
  setSearchTerm
}: {
  data: ChiHoXuongItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}) {
  const filtered = data.filter(
    (item) => item.xuongSX.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTienPS = filtered.reduce((sum, item) => sum + item.tienPhatSinh, 0);
  const totalThanhToan = filtered.reduce((sum, item) => sum + item.thanhToan, 0);
  const totalXuongNo = filtered.reduce((sum, item) => sum + item.xuongNoRiomio, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Factory size={20} className="text-green-600" />
          Tổng hợp chi hộ xưởng ({filtered.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm xưởng sản xuất..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-64"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600">Tiền phát sinh</p>
          <p className="text-2xl font-bold text-green-700">{totalTienPS.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600">Thanh toán</p>
          <p className="text-2xl font-bold text-blue-700">{totalThanhToan.toLocaleString("vi-VN")}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <p className="text-sm text-orange-600">Xưởng nợ Riomio</p>
          <p className="text-2xl font-bold text-orange-700">{totalXuongNo.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">STT</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[250px]">Xưởng sản xuất</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Tiền phát sinh</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Thanh toán</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Xưởng nợ Riomio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    <div className="truncate" title={item.xuongSX}>{item.xuongSX}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    {item.tienPhatSinh > 0 ? item.tienPhatSinh.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">
                    {item.thanhToan > 0 ? item.thanhToan.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600 font-bold">
                    {item.xuongNoRiomio > 0 ? item.xuongNoRiomio.toLocaleString("vi-VN") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">Tổng:</td>
                <td className="px-4 py-3 text-right text-green-600">{totalTienPS.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 text-right text-blue-600">{totalThanhToan.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 text-right text-orange-600">{totalXuongNo.toLocaleString("vi-VN")}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu chi hộ xưởng
          </div>
        )}
      </div>
    </div>
  );
}
