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
  Check,
  AlertTriangle,
  PartyPopper,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useCompanyConfig } from "@/context/CompanyConfigContext";

const iconOptions: Record<string, React.ComponentType<{ size?: number }>> = {
  Factory,
  ShoppingBag,
  Truck,
  Palette,
  Users,
  Globe,
};

const announcementTypes = [
  { value: "info", icon: Info, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700", iconBg: "bg-blue-100" },
  { value: "success", icon: Check, bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700", iconBg: "bg-green-100" },
  { value: "warning", icon: AlertTriangle, bgColor: "bg-yellow-50", borderColor: "border-yellow-200", textColor: "text-yellow-700", iconBg: "bg-yellow-100" },
  { value: "celebration", icon: PartyPopper, bgColor: "bg-pink-50", borderColor: "border-pink-200", textColor: "text-pink-700", iconBg: "bg-pink-100" },
];

export default function ThongTinCongTy() {
  const { config } = useCompanyConfig();

  const getIconComponent = (iconName: string) => {
    return iconOptions[iconName] || Factory;
  };

  // Filter active announcements
  const activeAnnouncements = config.announcements.filter(a => a.isActive);

  return (
    <div className="space-y-0 -m-6 flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Section with Background Image */}
        <div className="relative min-h-[500px] overflow-hidden">
          {/* Background Image */}
          <Image
            src="/team.png"
            alt="Business Team"
            fill
            className="object-cover object-center"
            priority
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
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-orange-400 italic">{config.heroTitle1}</span>
                <br />
                <span className="text-white italic">{config.heroTitle2}</span>
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed">
                {config.heroDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Về chúng tôi */}
        <div className="bg-white px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                <Target className="text-white" size={28} />
              </div>
              <h2 className="text-3xl font-bold text-blue-600">VỀ CHÚNG TÔI</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              {config.aboutUs}
            </p>
          </div>
        </div>

        {/* Tầm nhìn & Sứ mệnh */}
        <div className="bg-gray-50 px-6 py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tầm nhìn */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="text-orange-500" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-orange-500">TẦM NHÌN</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {config.vision}
              </p>
            </div>

            {/* Sứ mệnh */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="text-blue-500" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-blue-600">SỨ MỆNH</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {config.mission}
              </p>
            </div>
          </div>
        </div>

        {/* Thông báo */}
        {activeAnnouncements.length > 0 && (
          <div className="bg-white px-6 py-8">
            <div className="max-w-6xl mx-auto space-y-4">
              {activeAnnouncements.map((announcement) => {
                const typeConfig = announcementTypes.find(t => t.value === announcement.type) || announcementTypes[0];
                const TypeIcon = typeConfig.icon;
                return (
                  <div key={announcement.id} className={`${typeConfig.bgColor} ${typeConfig.borderColor} border rounded-xl p-5 flex items-start gap-4`}>
                    <div className={`p-3 ${typeConfig.iconBg} rounded-lg shrink-0`}>
                      <TypeIcon className={typeConfig.textColor} size={24} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-lg ${typeConfig.textColor}`}>{announcement.title}</h4>
                      <p className="text-gray-700 mt-1">{announcement.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lĩnh vực hoạt động */}
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 px-6 py-12 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
          <div className="absolute bottom-0 right-20 w-24 h-24 bg-orange-100 rounded-full translate-y-1/2 opacity-50"></div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Content */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                    <Globe className="text-white" size={28} />
                  </div>
                  <h2 className="text-3xl font-bold text-blue-600">
                    LĨNH VỰC HOẠT ĐỘNG
                  </h2>
                </div>
                <p className="text-gray-600 mb-8">
                  Với hơn{" "}
                  {new Date().getFullYear() -
                    new Date(config.foundedDate).getFullYear()}{" "}
                  năm kinh nghiệm, chúng tôi tự hào cung cấp đa dạng các dịch vụ
                  và sản phẩm chất lượng cao phục vụ nhu cầu của khách hàng trên
                  toàn quốc.
                </p>

                {/* Service Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {config.businessAreas.map((area) => {
                    const IconComponent = getIconComponent(area.icon);
                    return (
                      <div
                        key={area.id}
                        className={`bg-gradient-to-br ${area.color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow`}
                      >
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                          <IconComponent size={24} />
                        </div>
                        <h4 className="font-bold text-lg mb-1">{area.title}</h4>
                        <p className="text-white/90 text-sm">
                          {area.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right - Image */}
              <div className="relative h-[400px] flex items-center justify-center">
                <Image
                  src="https://img.freepik.com/free-vector/business-team-discussing-ideas-startup_74855-4380.jpg"
                  alt="Business Meeting"
                  width={500}
                  height={400}
                  className="object-contain drop-shadow-xl"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer - Company Info */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left - Company Info */}
            <div className="lg:col-span-5 space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-blue-600 text-lg">Riomio</h3>
                  <p className="text-orange-500 text-sm font-medium">Shop</p>
                </div>
              </div>

              {/* Registration Info */}
              <p className="text-gray-600 text-sm leading-relaxed">
                Giấy chứng nhận ĐKDN số {config.taxCode} do Sở Kế hoạch Đầu
                tư Thành phố Hà Nội cấp ngày{" "}
                {new Date(config.foundedDate).toLocaleDateString("vi-VN")}
              </p>

              {/* Company Name */}
              <p className="font-semibold text-gray-900">{config.name}</p>

              {/* Address */}
              <div className="flex items-start gap-2 text-gray-600 text-sm">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span>{config.address}</span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Mail size={16} className="flex-shrink-0" />
                <span>{config.email}</span>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Phone size={16} className="flex-shrink-0" />
                <span>{config.phone}</span>
              </div>

              {/* Representative */}
              <p className="text-gray-600 text-sm">
                <span className="font-medium">Người đại diện:</span> Ông{" "}
                {config.representative} - {config.position}
              </p>

              {/* Certification Badge */}
              <div className="flex items-center gap-2 pt-2">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600"
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

            {/* Right - Quick Links */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {config.quickLinks.map((section) => (
                  <div key={section.id}>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      {section.title}
                    </h4>
                    <ul className="space-y-2">
                      {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <a
                            href="#"
                            className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      Kết nối với chúng tôi:
                    </span>
                    <div className="flex items-center gap-3">
                      {/* Facebook */}
                      <a
                        href="#"
                        className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                      {/* Zalo */}
                      <a
                        href="#"
                        className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors font-bold text-xs"
                      >
                        Zalo
                      </a>
                      {/* Instagram */}
                      <a
                        href="#"
                        className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity"
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
                  </div>

                  {/* Hotline */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                    <Phone size={18} className="text-green-600" />
                    <span className="font-bold text-green-600">
                      {config.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} {config.name}. Tất cả quyền được
              bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
