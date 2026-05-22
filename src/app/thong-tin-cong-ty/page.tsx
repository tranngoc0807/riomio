"use client";

import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Target,
  Eye,
  ShoppingBag,
  Factory,
  Truck,
  Palette,
  Settings,
  Users,
  Gem,
  Package,
  ShoppingCart,
  BarChart3,
  DollarSign,
  Briefcase,
  Headphones,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Zap,
  Gift,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCompanyConfig } from "@/context/CompanyConfigContext";
import { useRolePermissions } from "@/context/RolePermissionsContext";

const iconOptions: Record<string, React.ComponentType<{ size?: number }>> = {
  Factory,
  Package,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Palette,
  Users,
  BarChart3,
  DollarSign,
  Briefcase,
  Headphones,
  Globe,
};

// Calendar widget — mini lịch tháng hiện tại, navigate prev/next
function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first: getDay() returns 0=Sun, so adjust
  let firstDayOfWeek = firstDay.getDay() - 1;
  if (firstDayOfWeek < 0) firstDayOfWeek = 6;

  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon size={18} className="text-blue-600" />
        <h3 className="font-semibold text-gray-900 text-sm">LỊCH</h3>
      </div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 text-sm">
          Tháng {month + 1}, {year}
        </h4>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600"
            aria-label="Tháng sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2 font-medium">
        {dayLabels.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`pre-${i}`} className="py-1.5 text-gray-300">
            &nbsp;
          </div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === today.getDate();
          return (
            <div
              key={day}
              className={
                isToday
                  ? "py-1.5 bg-blue-600 text-white rounded-full font-semibold"
                  : "py-1.5 text-gray-700 hover:bg-gray-50 rounded-full cursor-pointer"
              }
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Quick actions — shortcut đến các trang user có quyền truy cập (dựa theo role)
function QuickActionsWidget() {
  const { hasAccess } = useRolePermissions();
  const actions = [
    {
      id: "san-xuat",
      label: "Sản xuất",
      icon: Factory,
      perm: "san-xuat",
      href: "/san-xuat",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
    },
    {
      id: "san-pham",
      label: "Sản phẩm",
      icon: Package,
      perm: "san-pham",
      href: "/san-pham",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      id: "hinh-anh",
      label: "Hình ảnh",
      icon: Palette,
      perm: "hinh-anh",
      href: "/hinh-anh",
      iconBg: "bg-fuchsia-100",
      iconColor: "text-fuchsia-600",
    },
    {
      id: "ban-hang",
      label: "Bán hàng",
      icon: ShoppingCart,
      perm: "ban-hang",
      href: "/ban-hang",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      id: "dong-tien",
      label: "Dòng tiền",
      icon: DollarSign,
      perm: "dong-tien",
      href: "/dong-tien",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      id: "bao-cao",
      label: "Báo cáo",
      icon: BarChart3,
      perm: "bao-cao",
      href: "/bao-cao",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      id: "nhan-su",
      label: "Nhân sự",
      icon: Users,
      perm: "nhan-su",
      href: "/nhan-su",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: "cau-hinh",
      label: "Cấu hình",
      icon: Settings,
      perm: "cau-hinh",
      href: "/cau-hinh",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
  ];
  const visible = actions.filter((a) => hasAccess(a.perm)).slice(0, 4);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-amber-500" />
        <h3 className="font-semibold text-gray-900 text-sm">TÁC VỤ NHANH</h3>
      </div>
      {visible.length === 0 ? (
        <p className="text-xs text-gray-500">
          Bạn chưa có quyền truy cập tác vụ nào.
        </p>
      ) : (
        <div className="space-y-1">
          {visible.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.id}
                href={a.href}
                className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 ${a.iconBg} ${a.iconColor} rounded-lg`}
                  >
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {a.label}
                  </span>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Birthday widget — sinh nhật trong tháng hiện tại từ /api/employees
type EmployeeLite = {
  id?: number | string;
  name?: string;
  position?: string;
  birthday?: string;
};

function BirthdaysWidget() {
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data: EmployeeLite[] | { data?: EmployeeLite[] }) => {
        const arr = Array.isArray(data) ? data : data?.data || [];
        setEmployees(arr);
      })
      .catch(() => setEmployees([]));
  }, []);

  // Parse birthday string (hỗ trợ dd/mm/yyyy, yyyy-mm-dd, dd-mm-yyyy)
  const parseBirthday = (bd: string): { day: number; month: number } | null => {
    if (!bd) return null;
    const parts = bd.split(/[\/\-]/).map((p) => p.trim());
    if (parts.length < 2) return null;
    // dd/mm/yyyy or dd-mm-yyyy → first is day
    // yyyy-mm-dd → first is year (4 digits)
    let day: number, month: number;
    if (parts[0].length === 4) {
      // yyyy-mm-dd
      month = parseInt(parts[1]);
      day = parseInt(parts[2] || "0");
    } else {
      day = parseInt(parts[0]);
      month = parseInt(parts[1]);
    }
    if (isNaN(day) || isNaN(month) || day < 1 || month < 1 || month > 12)
      return null;
    return { day, month };
  };

  const today = new Date();
  // Sắp xếp theo sinh nhật sắp tới gần nhất (không giới hạn tháng)
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const daysUntil = (m: number, d: number) => {
    let target = new Date(today.getFullYear(), m - 1, d);
    if (target < todayMidnight) {
      target = new Date(today.getFullYear() + 1, m - 1, d);
    }
    return Math.floor(
      (target.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24),
    );
  };
  const upcoming = employees
    .map((e) => ({ ...e, _bd: parseBirthday(e.birthday || "") }))
    .filter((e) => e._bd)
    .map((e) => ({ ...e, _daysUntil: daysUntil(e._bd!.month, e._bd!.day) }))
    .sort((a, b) => a._daysUntil - b._daysUntil);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift size={18} className="text-pink-500" />
        <h3 className="font-semibold text-gray-900 text-sm">SINH NHẬT</h3>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-xs text-gray-500">
          Không có sinh nhật trong tháng này.
        </p>
      ) : (
        <div className="space-y-3">
          {upcoming.slice(0, 3).map((emp, idx) => (
            <div key={emp.id ?? idx} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {emp.name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {emp.name || "—"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {emp.position || ""}
                </p>
              </div>
              <span className="text-xs text-gray-600 font-medium shrink-0">
                {String(emp._bd!.day).padStart(2, "0")}/
                {String(emp._bd!.month).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Bảng màu icon theo từng lĩnh vực
const iconColorMap: Record<string, { bg: string; text: string }> = {
  Factory: { bg: "bg-sky-100", text: "text-sky-600" },
  Package: { bg: "bg-emerald-100", text: "text-emerald-600" },
  ShoppingBag: { bg: "bg-orange-100", text: "text-orange-600" },
  ShoppingCart: { bg: "bg-pink-100", text: "text-pink-600" },
  Truck: { bg: "bg-amber-100", text: "text-amber-600" },
  Palette: { bg: "bg-fuchsia-100", text: "text-fuchsia-600" },
  Users: { bg: "bg-blue-100", text: "text-blue-600" },
  BarChart3: { bg: "bg-purple-100", text: "text-purple-600" },
  DollarSign: { bg: "bg-cyan-100", text: "text-cyan-600" },
  Briefcase: { bg: "bg-indigo-100", text: "text-indigo-600" },
  Headphones: { bg: "bg-rose-100", text: "text-rose-600" },
  Globe: { bg: "bg-teal-100", text: "text-teal-600" },
};

export default function ThongTinCongTy() {
  const { config } = useCompanyConfig();
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(true);

  const getIconComponent = (iconName: string) => {
    return iconOptions[iconName] || Factory;
  };

  // Filter active announcements
  const activeAnnouncements = config.announcements.filter((a) => a.isActive);

  return (
    <div className="space-y-0 -m-6 flex flex-col min-h-screen">
      {/* Thông báo - Modal popup welcome */}
      {activeAnnouncements.length > 0 && showAnnouncementModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 animate-in fade-in duration-200"
          onClick={() => setShowAnnouncementModal(false)}
        >
          <div
            className="relative w-full max-w-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="absolute -top-3 -right-3 z-30 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-red-600 hover:scale-110 transition-all"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>

            {/* Card: nền trắng + ảnh trang trí + nội dung announcement */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
              {/* Ảnh trang trí Tết (làm khung) */}
              <Image
                src="/riomioLogo.png"
                alt="Welcome"
                width={1200}
                height={800}
                className="w-full h-auto object-contain select-none pointer-events-none"
                priority
              />

              {/* Nội dung announcement chồng lên giữa */}
              <div className="absolute inset-0 flex items-center justify-center px-12 sm:px-20 md:px-28">
                <div className="text-center space-y-5 max-w-lg -translate-y-6 md:-translate-y-10">
                  {activeAnnouncements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="space-y-6 md:space-y-8"
                    >
                      <h3 className="text-3xl md:text-5xl font-extrabold text-red-600 drop-shadow-sm">
                        {announcement.title}
                      </h3>
                      <p className="text-gray-800 text-base md:text-xl leading-relaxed whitespace-pre-line font-semibold">
                        {announcement.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Section with Background Image */}
        <div className="relative min-h-[600px] overflow-hidden">
          {/* Background Image */}
          <Image
            src={config.heroImage || "/team.png"}
            alt="Business Team"
            fill
            className="object-cover object-center"
            priority
            unoptimized={config.heroImage?.startsWith("http")}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/85 via-blue-800/70 to-transparent"></div>

          {/* Decorative elements */}
          <div className="absolute top-10 right-20 w-8 h-8 text-orange-400 z-10">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="absolute top-20 right-40 w-6 h-6 text-blue-300 z-10">
            <Settings className="animate-spin-slow" />
          </div>
          <div className="absolute bottom-20 left-10 w-4 h-4 bg-orange-300 rounded-full opacity-60 z-10"></div>

          {/* Content */}
          <div className="relative z-10 max-w-8xl mx-auto px-6 py-16 lg:py-24">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-orange-400 italic">
                  {config.heroTitle1}
                </span>
                <br />
                <span className="text-white italic">{config.heroTitle2}</span>
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed">
                {config.heroDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Content + Right Sidebar */}
        <div className="bg-gray-50 px-8 py-10">
          <div className="max-w-8xl mx-auto grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            {/* LEFT */}
            <div className="space-y-6 min-w-0">
              {/* Về chúng tôi */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                    <Target className="text-white" size={28} />
                  </div>
                  <h2 className="text-3xl font-bold text-blue-600">
                    VỀ CHÚNG TÔI
                  </h2>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {config.aboutUs}
                </p>
              </div>

              {/* Tầm nhìn + Sứ mệnh + Giá trị cốt lõi */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border-t-4 border-orange-400 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Eye className="text-orange-500" size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-orange-500">
                      TẦM NHÌN
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {config.vision}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border-t-4 border-blue-500 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="text-blue-500" size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-blue-600">SỨ MỆNH</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {config.mission}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border-t-4 border-pink-400 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Gem className="text-pink-500" size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-pink-500">
                      GIÁ TRỊ CỐT LÕI
                    </h3>
                  </div>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    {config.coreValues.map((value, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0"></span>
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Lĩnh vực hoạt động */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="text-blue-600" size={22} />
                  </div>
                  <h2 className="text-lg font-bold text-blue-600">
                    LĨNH VỰC HOẠT ĐỘNG
                  </h2>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                  {config.businessAreas.map((area) => {
                    const IconComponent = getIconComponent(area.icon);
                    const colors = iconColorMap[area.icon] || {
                      bg: "bg-gray-100",
                      text: "text-gray-600",
                    };
                    return (
                      <div
                        key={area.id}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`p-2 ${colors.bg} ${colors.text} rounded-lg shrink-0 flex items-center justify-center`}
                          >
                            <IconComponent size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm mb-0.5 truncate">
                              {area.title}
                            </h4>
                            <p className="text-gray-500 text-xs leading-snug line-clamp-2">
                              {area.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Sidebar widgets */}
            <aside className="space-y-6">
              <CalendarWidget />
              <QuickActionsWidget />
              <BirthdaysWidget />
            </aside>
          </div>
        </div>
      </div>

      {/* Fixed Footer - Company Info */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-8xl mx-auto px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Col 1 - Company Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="text-white" size={22} />
                </div>
                <h3 className="font-bold text-blue-600 text-lg">Riomio</h3>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">
                Giấy chứng nhận ĐKDN số {config.taxCode} do Sở Kế hoạch Đầu tư
                Thành phố Hà Nội cấp ngày{" "}
                {new Date(config.foundedDate).toLocaleDateString("vi-VN")}
              </p>

              <p className="font-semibold text-gray-900 text-sm">
                {config.name}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium text-blue-700">
                    ĐÃ ĐĂNG KÝ BỘ CÔNG THƯƠNG
                  </span>
                </div>
              </div>
            </div>

            {/* Col 2 - Contact details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">
                LIÊN HỆ
              </h4>
              <div className="flex items-start gap-2 text-gray-600 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <span>{config.address}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Mail size={16} className="shrink-0 text-gray-400" />
                <span>{config.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Phone size={16} className="shrink-0 text-gray-400" />
                <span>{config.phone}</span>
              </div>
              <p className="text-gray-600 text-sm pt-1">
                <span className="font-medium">Người đại diện:</span> Ông{" "}
                {config.representative} - {config.position}
              </p>
            </div>

            {/* Col 3 - Social + Hotline */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">
                KẾT NỐI VỚI CHÚNG TÔI
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                  aria-label="Facebook"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors font-bold text-xs"
                  aria-label="Zalo"
                >
                  Zalo
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">Hotline hỗ trợ</p>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
                  <Phone size={18} className="text-green-600" />
                  <span className="font-bold text-green-700 text-base">
                    {config.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-8xl mx-auto px-6 py-4">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} {config.name}. Tất cả quyền được bảo
              lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
