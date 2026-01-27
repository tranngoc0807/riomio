"use client";

import { useState } from "react";
import {
  FileText,
  Users,
  TrendingUp,
  Award,
  Briefcase,
  BookOpen,
  Scale,
  FileCheck,
} from "lucide-react";

// Import sub-tab components
import HopDongLaoDongTab from "./contracts/HopDongLaoDongTab";
import KPIKinhDoanhTab from "./contracts/KPIKinhDoanhTab";
import KPIKyThuatTab from "./contracts/KPIKyThuatTab";
import KPIVanPhongTab from "./contracts/KPIVanPhongTab";
import ThoaUocTab from "./contracts/ThoaUocTab";
import BienBanHopTab from "./contracts/BienBanHopTab";
import QuyCheTab from "./contracts/QuyCheTab";
import QuyetDinhTab from "./contracts/QuyetDinhTab";

type SubTabType =
  | "thoa-uoc"
  | "bien-ban"
  | "hop-dong"
  | "kpi-kinh-doanh"
  | "kpi-ky-thuat"
  | "kpi-van-phong"
  | "quy-che"
  | "quyet-dinh";

const SUB_TABS = [
  { id: "thoa-uoc" as SubTabType, label: "Thỏa ước LĐTT", icon: Scale },
  { id: "bien-ban" as SubTabType, label: "Biên bản họp", icon: Users },
  { id: "hop-dong" as SubTabType, label: "HĐ Lao động", icon: FileText },
  { id: "kpi-kinh-doanh" as SubTabType, label: "KPI Kinh doanh", icon: TrendingUp },
  { id: "kpi-ky-thuat" as SubTabType, label: "KPI Kỹ thuật", icon: Briefcase },
  { id: "kpi-van-phong" as SubTabType, label: "KPI Văn phòng", icon: BookOpen },
  { id: "quy-che" as SubTabType, label: "Quy chế lương", icon: Award },
  { id: "quyet-dinh" as SubTabType, label: "Quyết định", icon: FileCheck },
];

export default function ContractsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("thoa-uoc");

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
        {activeSubTab === "thoa-uoc" && <ThoaUocTab />}
        {activeSubTab === "bien-ban" && <BienBanHopTab />}
        {activeSubTab === "hop-dong" && <HopDongLaoDongTab />}
        {activeSubTab === "kpi-kinh-doanh" && <KPIKinhDoanhTab />}
        {activeSubTab === "kpi-ky-thuat" && <KPIKyThuatTab />}
        {activeSubTab === "kpi-van-phong" && <KPIVanPhongTab />}
        {activeSubTab === "quy-che" && <QuyCheTab />}
        {activeSubTab === "quyet-dinh" && <QuyetDinhTab />}
      </div>
    </div>
  );
}
