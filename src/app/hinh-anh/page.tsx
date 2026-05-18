"use client";

import { Image as ImageIcon, Package, Boxes, Printer, Palette } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useRolePermissions } from "@/context/RolePermissionsContext";
import HinhAnhSanPhamTab from "../san-xuat/components/HinhAnhSanPhamTab";

type TabType = "san-pham" | "nguyen-phu-lieu" | "hinh-in" | "thiet-ke";

const TABS = [
  { id: "san-pham" as TabType, label: "Sản phẩm", icon: Package },
  { id: "nguyen-phu-lieu" as TabType, label: "Nguyên phụ liệu", icon: Boxes },
  { id: "hinh-in" as TabType, label: "Hình in", icon: Printer },
  { id: "thiet-ke" as TabType, label: "Thiết kế hình ảnh", icon: Palette },
];

const FOLDER_CONFIG: Record<TabType, { id: string; label: string }[]> = {
  "san-pham": [{ id: "san-pham", label: "Sản phẩm" }],
  "nguyen-phu-lieu": [{ id: "nguyen-phu-lieu", label: "Nguyên phụ liệu" }],
  "hinh-in": [{ id: "hinh-in", label: "Hình in" }],
  "thiet-ke": [{ id: "thiet-ke", label: "Thiết kế hình ảnh" }],
};

const DEFAULT_FOLDER: Record<TabType, string> = {
  "san-pham": "san-pham",
  "nguyen-phu-lieu": "nguyen-phu-lieu",
  "hinh-in": "hinh-in",
  "thiet-ke": "thiet-ke",
};

export default function HinhAnhPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, loading: permissionsLoading } = useRolePermissions();

  const [activeTab, setActiveTab] = useState<TabType>("san-pham");

  const filteredTabs = useMemo(() => {
    if (hasAccess("hinh-anh")) return TABS;
    return TABS.filter((tab) => hasAccess(`hinh-anh/${tab.id}`));
  }, [hasAccess]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const validTabs = filteredTabs.map((t) => t.id);
    if (tabFromUrl && validTabs.includes(tabFromUrl as TabType)) {
      setActiveTab(tabFromUrl as TabType);
    } else if (filteredTabs.length > 0 && !validTabs.includes(activeTab)) {
      setActiveTab(filteredTabs[0].id);
    }
  }, [searchParams, filteredTabs, activeTab]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ImageIcon className="text-blue-600" size={32} />
            Hình ảnh
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý hình ảnh sản phẩm, nguyên phụ liệu và hình in
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-3">
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTabs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Bạn không có quyền truy cập các tab trong mục này
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "text-white bg-blue-600 shadow-sm"
                        : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6">
          {activeTab === "san-pham" && (
            <HinhAnhSanPhamTab
              folders={FOLDER_CONFIG["san-pham"]}
              defaultFolder={DEFAULT_FOLDER["san-pham"]}
            />
          )}
          {activeTab === "nguyen-phu-lieu" && (
            <HinhAnhSanPhamTab
              folders={FOLDER_CONFIG["nguyen-phu-lieu"]}
              defaultFolder={DEFAULT_FOLDER["nguyen-phu-lieu"]}
            />
          )}
          {activeTab === "hinh-in" && (
            <HinhAnhSanPhamTab
              folders={FOLDER_CONFIG["hinh-in"]}
              defaultFolder={DEFAULT_FOLDER["hinh-in"]}
            />
          )}
          {activeTab === "thiet-ke" && (
            <HinhAnhSanPhamTab
              folders={FOLDER_CONFIG["thiet-ke"]}
              defaultFolder={DEFAULT_FOLDER["thiet-ke"]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
