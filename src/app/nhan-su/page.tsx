"use client";

import { UserCog } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Import components
import {
  DanhSachNhanVienTab,
  QuyCheHopDongTab,
  ChamCongTab,
  BangLuongTab,
  BaoHiemTab,
} from "./components";

const VALID_TABS = ["danh-sach", "quy-che-hop-dong", "cham-cong", "bang-luong", "bao-hiem"];

export default function NhanSu() {
  const searchParams = useSearchParams();

  // Get active tab directly from URL (no useState needed for tab)
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "danh-sach";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UserCog className="w-7 h-7 text-blue-600" />
          Quản lý Nhân sự
        </h1>
        <p className="text-gray-500 mt-1">
          Quản lý nhân viên, hợp đồng, chấm công, bảng lương và bảo hiểm
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {/* Tab: Danh sách nhân viên */}
          {activeTab === "danh-sach" && <DanhSachNhanVienTab />}

          {/* Tab: Quy chế & Hợp đồng */}
          {activeTab === "quy-che-hop-dong" && <QuyCheHopDongTab />}

          {/* Tab: Chấm công */}
          {activeTab === "cham-cong" && <ChamCongTab />}

          {/* Tab: Bảng lương */}
          {activeTab === "bang-luong" && <BangLuongTab />}

          {/* Tab: Bảo hiểm */}
          {activeTab === "bao-hiem" && <BaoHiemTab />}
        </div>
      </div>
    </div>
  );
}
