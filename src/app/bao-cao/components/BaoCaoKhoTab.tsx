"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Warehouse,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  RefreshCw,
} from "lucide-react";

type SubTabType = "ton-kho-npl" | "ton-kho-hang-hoa";
type NPLSubTabType = "kho-cong-ty" | "xuong-sx";

const SUB_TABS = [
  { id: "ton-kho-npl" as SubTabType, label: "Báo cáo tồn kho NPL", icon: Package },
  { id: "ton-kho-hang-hoa" as SubTabType, label: "Báo cáo tồn kho hàng hóa", icon: ShoppingCart },
];

const NPL_SUB_TABS = [
  { id: "kho-cong-ty" as NPLSubTabType, label: "Tồn kho NPL kho công ty", icon: Building2 },
  { id: "xuong-sx" as NPLSubTabType, label: "Tồn kho NPL xưởng SX", icon: Warehouse },
];

const VALID_SUB_TABS: SubTabType[] = ["ton-kho-npl", "ton-kho-hang-hoa"];
const VALID_NPL_SUB_TABS: NPLSubTabType[] = ["kho-cong-ty", "xuong-sx"];

interface TonKhoNPLThang {
  id: number;
  stt: number;
  maNPL: string;
  tonDau: number;
  nhapKho: number;
  xuatKho: number;
  tonCuoi: number;
  donGiaSauThue: number;
  giaTriTon: number;
}

interface TonKhoNPLXuongSX {
  id: number;
  ngayThang: string;
  xuongSX: string;
  tenNPL: string;
  dvt: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
}

interface TonKhoItem {
  id: number;
  maSp: string;     // Mã SP
  tonDau: number;   // Tồn đầu
  nhap: number;     // Nhập
  xuat: number;     // Xuất
  tonCuoi: number;  // Tồn cuối
}

const ITEMS_PER_PAGE = 50;

export default function BaoCaoKhoTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get initial values from URL params
  const subTabFromUrl = searchParams.get("subTab") as SubTabType | null;
  const nplTabFromUrl = searchParams.get("nplTab") as NPLSubTabType | null;

  const [activeSubTab, setActiveSubTab] = useState<SubTabType>(
    subTabFromUrl && VALID_SUB_TABS.includes(subTabFromUrl) ? subTabFromUrl : "ton-kho-npl"
  );
  const [activeNPLSubTab, setActiveNPLSubTab] = useState<NPLSubTabType>(
    nplTabFromUrl && VALID_NPL_SUB_TABS.includes(nplTabFromUrl) ? nplTabFromUrl : "kho-cong-ty"
  );

  // Update URL when tab changes
  const updateUrlParams = (subTab: SubTabType, nplTab: NPLSubTabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subTab", subTab);
    if (subTab === "ton-kho-npl") {
      params.set("nplTab", nplTab);
    } else {
      params.delete("nplTab");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSubTabChange = (tab: SubTabType) => {
    setActiveSubTab(tab);
    updateUrlParams(tab, activeNPLSubTab);
  };

  const handleNPLSubTabChange = (tab: NPLSubTabType) => {
    setActiveNPLSubTab(tab);
    updateUrlParams(activeSubTab, tab);
  };

  // Data states
  const [tonKhoNPLCongTy, setTonKhoNPLCongTy] = useState<TonKhoNPLThang[]>([]);
  const [tonKhoNPLXuongSX, setTonKhoNPLXuongSX] = useState<TonKhoNPLXuongSX[]>([]);
  const [tonKhoItems, setTonKhoItems] = useState<TonKhoItem[]>([]);

  // Loading states
  const [loadingNPL, setLoadingNPL] = useState(false);
  const [loadingTonKho, setLoadingTonKho] = useState(false);

  // Month filter for NPL Kho Công Ty (format: YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Month filter for Tồn kho hàng hóa (format: YYYY-MM)
  const [selectedMonthSP, setSelectedMonthSP] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Search states - separate for each tab
  const [searchTermNPL, setSearchTermNPL] = useState("");
  const [searchTermSP, setSearchTermSP] = useState("");

  // Pagination states - separate for each tab
  const [currentPageNPL, setCurrentPageNPL] = useState(1);
  const [currentPageSP, setCurrentPageSP] = useState(1);

  // Fetch NPL data on mount with current month
  useEffect(() => {
    fetchTonKhoNPL(selectedMonth);
  }, []);

  // Fetch ton kho when tab changes
  useEffect(() => {
    if (activeSubTab === "ton-kho-hang-hoa" && tonKhoItems.length === 0) {
      fetchTonKho(selectedMonthSP);
    }
  }, [activeSubTab]);

  // Reset NPL page when NPL search changes
  useEffect(() => {
    setCurrentPageNPL(1);
  }, [activeNPLSubTab, searchTermNPL]);

  // Reset SP page when SP search changes
  useEffect(() => {
    setCurrentPageSP(1);
  }, [searchTermSP]);

  const fetchTonKhoNPL = async (thangNam?: string) => {
    try {
      setLoadingNPL(true);

      // Use POST if month is provided, otherwise GET
      const response = thangNam
        ? await fetch("/api/ton-kho-npl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ thangNam }),
          })
        : await fetch("/api/ton-kho-npl");

      const result = await response.json();

      if (result.success) {
        setTonKhoNPLCongTy(result.data.tonKhoThang || []);
        setTonKhoNPLXuongSX(result.data.tonKhoXuongSX || []);
      }
    } catch (error) {
      console.error("Error fetching ton kho NPL:", error);
    } finally {
      setLoadingNPL(false);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    fetchTonKhoNPL(month);
  };

  const fetchTonKho = async (thangNam?: string) => {
    try {
      setLoadingTonKho(true);

      // Use POST if month is provided, otherwise GET
      const response = thangNam
        ? await fetch("/api/ton-kho", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ thangNam }),
          })
        : await fetch("/api/ton-kho");

      const result = await response.json();

      if (result.success) {
        setTonKhoItems(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching ton kho:", error);
    } finally {
      setLoadingTonKho(false);
    }
  };

  const handleMonthChangeSP = (month: string) => {
    setSelectedMonthSP(month);
    fetchTonKho(month);
  };

  // Filter functions - use separate search terms
  const filteredNPLCongTy = tonKhoNPLCongTy.filter(item =>
    item.maNPL.toLowerCase().includes(searchTermNPL.toLowerCase())
  );

  const filteredNPLXuongSX = tonKhoNPLXuongSX.filter(item =>
    item.tenNPL.toLowerCase().includes(searchTermNPL.toLowerCase()) ||
    item.xuongSX.toLowerCase().includes(searchTermNPL.toLowerCase())
  );

  const filteredTonKho = tonKhoItems.filter(item =>
    item.maSp.toLowerCase().includes(searchTermSP.toLowerCase())
  );

  // NPL pagination
  const currentNPLData = activeNPLSubTab === "kho-cong-ty" ? filteredNPLCongTy : filteredNPLXuongSX;
  const totalPagesNPL = Math.ceil(currentNPLData.length / ITEMS_PER_PAGE);
  const startIndexNPL = (currentPageNPL - 1) * ITEMS_PER_PAGE;
  const paginatedNPLData = currentNPLData.slice(startIndexNPL, startIndexNPL + ITEMS_PER_PAGE);

  // SP pagination
  const totalPagesSP = Math.ceil(filteredTonKho.length / ITEMS_PER_PAGE);
  const startIndexSP = (currentPageSP - 1) * ITEMS_PER_PAGE;
  const paginatedSPData = filteredTonKho.slice(startIndexSP, startIndexSP + ITEMS_PER_PAGE);

  // Calculate totals for NPL Cong Ty
  const totalNPLCongTy = {
    tonDau: filteredNPLCongTy.reduce((sum, item) => sum + item.tonDau, 0),
    nhapKho: filteredNPLCongTy.reduce((sum, item) => sum + item.nhapKho, 0),
    xuatKho: filteredNPLCongTy.reduce((sum, item) => sum + item.xuatKho, 0),
    tonCuoi: filteredNPLCongTy.reduce((sum, item) => sum + item.tonCuoi, 0),
    giaTriTon: filteredNPLCongTy.reduce((sum, item) => sum + item.giaTriTon, 0),
  };

  // Calculate totals for NPL Xuong SX
  const totalNPLXuongSX = {
    soLuong: filteredNPLXuongSX.reduce((sum, item) => sum + item.soLuong, 0),
    thanhTien: filteredNPLXuongSX.reduce((sum, item) => sum + item.thanhTien, 0),
  };

  // Calculate totals for Ton Kho
  const totalTonKho = {
    tonDau: filteredTonKho.reduce((sum, item) => sum + item.tonDau, 0),
    nhap: filteredTonKho.reduce((sum, item) => sum + item.nhap, 0),
    xuat: filteredTonKho.reduce((sum, item) => sum + item.xuat, 0),
    tonCuoi: filteredTonKho.reduce((sum, item) => sum + item.tonCuoi, 0),
  };

  const renderPaginationNPL = () => {
    if (totalPagesNPL <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 px-4">
        <div className="text-sm text-gray-600">
          Hiển thị {startIndexNPL + 1} - {Math.min(startIndexNPL + ITEMS_PER_PAGE, currentNPLData.length)} / {currentNPLData.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPageNPL(p => Math.max(1, p - 1))}
            disabled={currentPageNPL === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPagesNPL }, (_, i) => i + 1)
              .filter(page => {
                if (totalPagesNPL <= 7) return true;
                if (page === 1 || page === totalPagesNPL) return true;
                if (Math.abs(page - currentPageNPL) <= 1) return true;
                return false;
              })
              .map((page, idx, arr) => (
                <span key={page} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPageNPL(page)}
                    className={`min-w-9 h-9 rounded-lg text-sm font-medium ${
                      currentPageNPL === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}
          </div>
          <button
            onClick={() => setCurrentPageNPL(p => Math.min(totalPagesNPL, p + 1))}
            disabled={currentPageNPL === totalPagesNPL}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderPaginationSP = () => {
    if (totalPagesSP <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 px-4">
        <div className="text-sm text-gray-600">
          Hiển thị {startIndexSP + 1} - {Math.min(startIndexSP + ITEMS_PER_PAGE, filteredTonKho.length)} / {filteredTonKho.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPageSP(p => Math.max(1, p - 1))}
            disabled={currentPageSP === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPagesSP }, (_, i) => i + 1)
              .filter(page => {
                if (totalPagesSP <= 7) return true;
                if (page === 1 || page === totalPagesSP) return true;
                if (Math.abs(page - currentPageSP) <= 1) return true;
                return false;
              })
              .map((page, idx, arr) => (
                <span key={page} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPageSP(page)}
                    className={`min-w-9 h-9 rounded-lg text-sm font-medium ${
                      currentPageSP === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}
          </div>
          <button
            onClick={() => setCurrentPageSP(p => Math.min(totalPagesSP, p + 1))}
            disabled={currentPageSP === totalPagesSP}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Main Sub-tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleSubTabChange(tab.id)}
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
        {/* Báo cáo tồn kho NPL */}
        {activeSubTab === "ton-kho-npl" && (
          <div>
            {/* NPL Sub-tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {NPL_SUB_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNPLSubTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeNPLSubTab === tab.id
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search and Month Filter */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              {/* Month Picker - only for kho-cong-ty */}
              {activeNPLSubTab === "kho-cong-ty" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar size={16} />
                    Tháng:
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <button
                    onClick={() => fetchTonKhoNPL(selectedMonth)}
                    disabled={loadingNPL}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Tải lại dữ liệu"
                  >
                    <RefreshCw size={18} className={loadingNPL ? "animate-spin" : ""} />
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={activeNPLSubTab === "kho-cong-ty" ? "Tìm theo mã NPL..." : "Tìm theo tên NPL hoặc xưởng SX..."}
                  value={searchTermNPL}
                  onChange={(e) => setSearchTermNPL(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Tồn kho NPL Kho Công Ty */}
            {activeNPLSubTab === "kho-cong-ty" && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tồn kho NPL kho công ty ({filteredNPLCongTy.length})
                  </h3>
                  <span className="text-sm text-gray-600">
                    Tháng {selectedMonth.split("-")[1]}/{selectedMonth.split("-")[0]}
                  </span>
                </div>

                {loadingNPL ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">STT</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Mã NPL</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">Tồn đầu</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">Nhập kho</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">Xuất kho</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">Tồn cuối</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">Đơn giá</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-36">Giá trị tồn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(paginatedNPLData as TonKhoNPLThang[]).map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-600">{startIndexNPL + index + 1}</td>
                              <td className="px-4 py-3 font-medium text-blue-600">{item.maNPL}</td>
                              <td className="px-4 py-3 text-right text-gray-600">{item.tonDau.toLocaleString("vi-VN")}</td>
                              <td className="px-4 py-3 text-right text-green-600">+{item.nhapKho.toLocaleString("vi-VN")}</td>
                              <td className="px-4 py-3 text-right text-red-600">-{item.xuatKho.toLocaleString("vi-VN")}</td>
                              <td className={`px-4 py-3 text-right font-medium ${item.tonCuoi < 0 ? "text-red-600" : "text-gray-900"}`}>
                                {item.tonCuoi.toLocaleString("vi-VN")}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">{item.donGiaSauThue.toLocaleString("vi-VN")}</td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">{item.giaTriTon.toLocaleString("vi-VN")}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-semibold">
                            <td colSpan={2} className="px-4 py-3 text-right">Tổng cộng:</td>
                            <td className="px-4 py-3 text-right">{totalNPLCongTy.tonDau.toLocaleString("vi-VN")}</td>
                            <td className="px-4 py-3 text-right text-green-600">+{totalNPLCongTy.nhapKho.toLocaleString("vi-VN")}</td>
                            <td className="px-4 py-3 text-right text-red-600">-{totalNPLCongTy.xuatKho.toLocaleString("vi-VN")}</td>
                            <td className={`px-4 py-3 text-right ${totalNPLCongTy.tonCuoi < 0 ? "text-red-600" : ""}`}>
                              {totalNPLCongTy.tonCuoi.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-right text-green-600">{totalNPLCongTy.giaTriTon.toLocaleString("vi-VN")}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {filteredNPLCongTy.length === 0 && !loadingNPL && (
                      <div className="text-center py-8 text-gray-500">
                        Không có dữ liệu tồn kho NPL kho công ty
                      </div>
                    )}
                    {renderPaginationNPL()}
                  </>
                )}
              </div>
            )}

            {/* Tồn kho NPL Xưởng SX */}
            {activeNPLSubTab === "xuong-sx" && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-orange-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tồn kho NPL xưởng SX ({filteredNPLXuongSX.length})
                  </h3>
                </div>

                {loadingNPL ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">STT</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày tháng</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Xưởng SX</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Tên NPL</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">ĐVT</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">Số lượng</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">Đơn giá</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 w-36">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(paginatedNPLData as TonKhoNPLXuongSX[]).map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-600">{startIndexNPL + index + 1}</td>
                              <td className="px-4 py-3 text-gray-600">{item.ngayThang}</td>
                              <td className="px-4 py-3 font-medium text-orange-600">{item.xuongSX}</td>
                              <td className="px-4 py-3 text-gray-900">{item.tenNPL}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{item.dvt}</td>
                              <td className="px-4 py-3 text-right font-medium">{item.soLuong.toLocaleString("vi-VN")}</td>
                              <td className="px-4 py-3 text-right text-gray-600">{item.donGia.toLocaleString("vi-VN")}</td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">{item.thanhTien.toLocaleString("vi-VN")}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-semibold">
                            <td colSpan={5} className="px-4 py-3 text-right">Tổng cộng:</td>
                            <td className="px-4 py-3 text-right">{totalNPLXuongSX.soLuong.toLocaleString("vi-VN")}</td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-right text-green-600">{totalNPLXuongSX.thanhTien.toLocaleString("vi-VN")}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {filteredNPLXuongSX.length === 0 && !loadingNPL && (
                      <div className="text-center py-8 text-gray-500">
                        Không có dữ liệu tồn kho NPL xưởng SX
                      </div>
                    )}
                    {renderPaginationNPL()}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Báo cáo tồn kho hàng hóa (SP) */}
        {activeSubTab === "ton-kho-hang-hoa" && (
          <div>
            {/* Search, Month Picker and Refresh */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              {/* Month Picker */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar size={16} />
                  Tháng:
                </label>
                <input
                  type="month"
                  value={selectedMonthSP}
                  onChange={(e) => handleMonthChangeSP(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={() => fetchTonKho(selectedMonthSP)}
                  disabled={loadingTonKho}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Tải lại dữ liệu"
                >
                  <RefreshCw size={18} className={loadingTonKho ? "animate-spin" : ""} />
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm theo mã SP..."
                  value={searchTermSP}
                  onChange={(e) => setSearchTermSP(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-green-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tồn kho sản phẩm ({filteredTonKho.length})
                </h3>
                <span className="text-sm text-gray-600">
                  Tháng {selectedMonthSP.split("-")[1]}/{selectedMonthSP.split("-")[0]}
                </span>
              </div>

              {loadingTonKho ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">STT</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Mã SP</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 w-28">Tồn đầu</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 w-28">Nhập</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 w-28">Xuất</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 w-28">Tồn cuối</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedSPData.map((item, index) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">{startIndexSP + index + 1}</td>
                            <td className="px-4 py-3 font-medium text-blue-600">{item.maSp}</td>
                            <td className={`px-4 py-3 text-right ${item.tonDau < 0 ? "text-red-600" : "text-gray-600"}`}>
                              {item.tonDau.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-4 py-3 text-right text-green-600">
                              {item.nhap.toLocaleString("vi-VN")}
                            </td>
                            <td className="px-4 py-3 text-right text-orange-600">
                              {item.xuat.toLocaleString("vi-VN")}
                            </td>
                            <td className={`px-4 py-3 text-right font-medium ${item.tonCuoi < 0 ? "text-red-600" : "text-gray-900"}`}>
                              {item.tonCuoi.toLocaleString("vi-VN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-semibold">
                          <td colSpan={2} className="px-4 py-3 text-right">Tổng cộng:</td>
                          <td className={`px-4 py-3 text-right ${totalTonKho.tonDau < 0 ? "text-red-600" : ""}`}>{totalTonKho.tonDau.toLocaleString("vi-VN")}</td>
                          <td className="px-4 py-3 text-right text-green-600">{totalTonKho.nhap.toLocaleString("vi-VN")}</td>
                          <td className="px-4 py-3 text-right text-orange-600">{totalTonKho.xuat.toLocaleString("vi-VN")}</td>
                          <td className={`px-4 py-3 text-right ${totalTonKho.tonCuoi < 0 ? "text-red-600" : ""}`}>
                            {totalTonKho.tonCuoi.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {filteredTonKho.length === 0 && !loadingTonKho && (
                    <div className="text-center py-8 text-gray-500">
                      Không có dữ liệu tồn kho sản phẩm
                    </div>
                  )}
                  {renderPaginationSP()}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
