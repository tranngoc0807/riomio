"use client";

import {
  Settings,
  Building2,
  Save,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Check,
  X,
  Edit3,
  Plus,
  Trash2,
  Eye,
  Target,
  Factory,
  ShoppingBag,
  Truck,
  Palette,
  Bell,
  Megaphone,
  PartyPopper,
  AlertTriangle,
  Info,
  Pencil,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  useCompanyConfig,
  CompanyConfig,
  BusinessArea,
  QuickLinkSection,
  Announcement,
} from "@/context/CompanyConfigContext";
import UserManagement from "@/components/UserManagement";

const iconOptions = [
  { value: "Factory", label: "Sản xuất", icon: Factory },
  { value: "ShoppingBag", label: "Bán lẻ", icon: ShoppingBag },
  { value: "Truck", label: "Phân phối", icon: Truck },
  { value: "Palette", label: "Thiết kế", icon: Palette },
  { value: "Users", label: "Nhân sự", icon: Users },
  { value: "Globe", label: "Toàn cầu", icon: Globe },
];

const colorOptions = [
  { value: "from-orange-400 to-orange-500", label: "Cam" },
  { value: "from-blue-400 to-blue-500", label: "Xanh dương" },
  { value: "from-green-400 to-green-500", label: "Xanh lá" },
  { value: "from-purple-400 to-purple-500", label: "Tím" },
  { value: "from-pink-400 to-pink-500", label: "Hồng" },
  { value: "from-cyan-400 to-cyan-500", label: "Cyan" },
];

const announcementTypes = [
  {
    value: "info",
    label: "Thông tin",
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    iconBg: "bg-blue-100",
  },
  {
    value: "success",
    label: "Thành công",
    icon: Check,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    iconBg: "bg-green-100",
  },
  {
    value: "warning",
    label: "Cảnh báo",
    icon: AlertTriangle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    iconBg: "bg-yellow-100",
  },
  {
    value: "celebration",
    label: "Chúc mừng",
    icon: PartyPopper,
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
    iconBg: "bg-pink-100",
  },
];

// Edit Section Modal
function EditModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Edit3 size={20} />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Editable Section Wrapper
function EditableSection({
  children,
  onEdit,
  label,
  className = "",
}: {
  children: React.ReactNode;
  onEdit: () => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={`group relative ${className}`}>
      {children}
      <button
        onClick={onEdit}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 shadow-lg hover:bg-blue-700 z-20"
      >
        <Pencil size={14} />
        Sửa {label}
      </button>
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-lg pointer-events-none transition-colors" />
    </div>
  );
}

export default function CauHinh() {
  const { config, updateConfig } = useCompanyConfig();
  const [editConfig, setEditConfig] = useState<CompanyConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "config">("users");

  // Modal states
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => {
    setEditConfig(config);
  }, [config]);

  const handleSave = () => {
    updateConfig(editConfig);
    setEditingSection(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancel = () => {
    setEditConfig(config);
    setEditingSection(null);
  };

  // Business Area handlers
  const addBusinessArea = () => {
    const newArea: BusinessArea = {
      id: Date.now().toString(),
      icon: "Factory",
      title: "Lĩnh vực mới",
      description: "Mô tả lĩnh vực",
      color: "from-orange-400 to-orange-500",
    };
    setEditConfig({
      ...editConfig,
      businessAreas: [...editConfig.businessAreas, newArea],
    });
  };

  const removeBusinessArea = (id: string) => {
    setEditConfig({
      ...editConfig,
      businessAreas: editConfig.businessAreas.filter((a) => a.id !== id),
    });
  };

  const updateBusinessArea = (
    id: string,
    field: keyof BusinessArea,
    value: string
  ) => {
    setEditConfig({
      ...editConfig,
      businessAreas: editConfig.businessAreas.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    });
  };

  // Quick Links handlers
  const addQuickLinkSection = () => {
    const newSection: QuickLinkSection = {
      id: Date.now().toString(),
      title: "Mục mới",
      links: ["Liên kết 1"],
    };
    setEditConfig({
      ...editConfig,
      quickLinks: [...editConfig.quickLinks, newSection],
    });
  };

  const removeQuickLinkSection = (id: string) => {
    setEditConfig({
      ...editConfig,
      quickLinks: editConfig.quickLinks.filter((s) => s.id !== id),
    });
  };

  const updateQuickLinkSection = (id: string, title: string) => {
    setEditConfig({
      ...editConfig,
      quickLinks: editConfig.quickLinks.map((s) =>
        s.id === id ? { ...s, title } : s
      ),
    });
  };

  const addLinkToSection = (sectionId: string) => {
    setEditConfig({
      ...editConfig,
      quickLinks: editConfig.quickLinks.map((s) =>
        s.id === sectionId ? { ...s, links: [...s.links, "Liên kết mới"] } : s
      ),
    });
  };

  const removeLinkFromSection = (sectionId: string, linkIndex: number) => {
    setEditConfig({
      ...editConfig,
      quickLinks: editConfig.quickLinks.map((s) =>
        s.id === sectionId
          ? { ...s, links: s.links.filter((_, i) => i !== linkIndex) }
          : s
      ),
    });
  };

  const updateLinkInSection = (
    sectionId: string,
    linkIndex: number,
    value: string
  ) => {
    setEditConfig({
      ...editConfig,
      quickLinks: editConfig.quickLinks.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              links: s.links.map((l, i) => (i === linkIndex ? value : l)),
            }
          : s
      ),
    });
  };

  // Announcement handlers
  const addAnnouncement = () => {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: "Thông báo mới",
      content: "Nội dung thông báo...",
      type: "info",
      isActive: true,
      startDate: today,
      endDate: nextWeek,
    };
    setEditConfig({
      ...editConfig,
      announcements: [...editConfig.announcements, newAnnouncement],
    });
  };

  const removeAnnouncement = (id: string) => {
    setEditConfig({
      ...editConfig,
      announcements: editConfig.announcements.filter((a) => a.id !== id),
    });
  };

  const updateAnnouncement = (
    id: string,
    field: keyof Announcement,
    value: string | boolean
  ) => {
    setEditConfig({
      ...editConfig,
      announcements: editConfig.announcements.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    });
  };

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((i) => i.value === iconName);
    return iconOption?.icon || Factory;
  };

  return (
    <div className="-m-6 lg:-m-8 w-[calc(100%+48px)] lg:w-[calc(100%+64px)] min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="text-blue-600" size={28} />
              Cấu hình
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === "users"
                ? "Thêm, sửa, xóa tài khoản nhân viên"
                : "Di chuột vào từng phần để chỉnh sửa. Thay đổi sẽ được áp dụng ngay lên trang thông tin công ty."}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={20} />
                Quản lý tài khoản
              </div>
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "config"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 size={20} />
                Cấu hình trang thông tin
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 shadow-lg animate-in slide-in-from-right">
          <div className="p-2 bg-green-100 rounded-full">
            <Check className="text-green-600" size={20} />
          </div>
          <p className="text-green-800 font-medium">
            Đã lưu thay đổi thành công!
          </p>
        </div>
      )}

      {/* Tab: User Management */}
      {activeTab === "users" && (
        <div className="py-6 px-4 lg:px-6">
          <UserManagement />
        </div>
      )}

      {/* Tab: Company Info Config */}
      {activeTab === "config" && (
        <div className="bg-gray-200 min-h-screen">
          <div className="py-6 px-4 lg:px-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Announcements Section - NEW */}
              {config.announcements.filter((a) => a.isActive).length > 0 && (
                <EditableSection
                  onEdit={() => setEditingSection("announcements")}
                  label="Thông báo"
                >
                  <div className="p-4 space-y-3">
                    {config.announcements
                      .filter((a) => a.isActive)
                      .map((announcement) => {
                        const typeConfig =
                          announcementTypes.find(
                            (t) => t.value === announcement.type
                          ) || announcementTypes[0];
                        const TypeIcon = typeConfig.icon;
                        return (
                          <div
                            key={announcement.id}
                            className={`${typeConfig.bgColor} ${typeConfig.borderColor} border rounded-xl p-4 flex items-start gap-4`}
                          >
                            <div
                              className={`p-2 ${typeConfig.iconBg} rounded-lg shrink-0`}
                            >
                              <TypeIcon
                                className={typeConfig.textColor}
                                size={20}
                              />
                            </div>
                            <div>
                              <h4
                                className={`font-bold ${typeConfig.textColor}`}
                              >
                                {announcement.title}
                              </h4>
                              <p className="text-gray-700 text-sm mt-1">
                                {announcement.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </EditableSection>
              )}

              {/* Add Announcements Button when empty */}
              {config.announcements.filter((a) => a.isActive).length === 0 && (
                <div className="p-4 border-b border-dashed border-gray-300">
                  <button
                    onClick={() => setEditingSection("announcements")}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Bell size={24} />
                    <span>Thêm thông báo (Giáng sinh, Tết, v.v.)</span>
                  </button>
                </div>
              )}

              {/* Hero Section */}
              <EditableSection
                onEdit={() => setEditingSection("hero")}
                label="Banner"
              >
                <div className="relative min-h-[400px] overflow-hidden">
                  <Image
                    src="/team.png"
                    alt="Business Team"
                    fill
                    className="object-cover object-center"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/85 via-blue-800/70 to-transparent" />
                  <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
                    <div className="max-w-2xl">
                      <h1 className="text-5xl font-bold mb-6 leading-tight">
                        <span className="text-orange-400 italic">
                          {config.heroTitle1}
                        </span>
                        <br />
                        <span className="text-white italic">
                          {config.heroTitle2}
                        </span>
                      </h1>
                      <p className="text-blue-100 text-lg leading-relaxed">
                        {config.heroDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </EditableSection>

              {/* About Us Section */}
              <EditableSection
                onEdit={() => setEditingSection("about")}
                label="Về chúng tôi"
              >
                <div className="bg-white px-6 py-12">
                  <div className="max-w-6xl mx-auto">
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
                </div>
              </EditableSection>

              {/* Vision & Mission */}
              <EditableSection
                onEdit={() => setEditingSection("vision")}
                label="Tầm nhìn & Sứ mệnh"
              >
                <div className="bg-gray-50 px-6 py-12">
                  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Eye className="text-orange-500" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-orange-500">
                          TẦM NHÌN
                        </h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {config.vision}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Settings className="text-blue-500" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-blue-600">
                          SỨ MỆNH
                        </h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {config.mission}
                      </p>
                    </div>
                  </div>
                </div>
              </EditableSection>

              {/* Business Areas */}
              <EditableSection
                onEdit={() => setEditingSection("business")}
                label="Lĩnh vực hoạt động"
              >
                <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 px-6 py-12">
                  <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                        <Globe className="text-white" size={28} />
                      </div>
                      <h2 className="text-3xl font-bold text-blue-600">
                        LĨNH VỰC HOẠT ĐỘNG
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {config.businessAreas.map((area) => {
                        const IconComponent = getIconComponent(area.icon);
                        return (
                          <div
                            key={area.id}
                            className={`bg-gradient-to-br ${area.color} rounded-2xl p-5 text-white shadow-lg`}
                          >
                            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                              <IconComponent size={24} />
                            </div>
                            <h4 className="font-bold text-lg mb-1">
                              {area.title}
                            </h4>
                            <p className="text-white/90 text-sm">
                              {area.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </EditableSection>

              {/* Footer */}
              <EditableSection
                onEdit={() => setEditingSection("footer")}
                label="Footer"
              >
                <footer className="bg-white border-t border-gray-200">
                  <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Building2 className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-blue-600 text-lg">
                              Riomio
                            </h3>
                            <p className="text-orange-500 text-sm font-medium">
                              Shop
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {config.name}
                        </p>
                        <div className="flex items-start gap-2 text-gray-600 text-sm">
                          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                          <span>{config.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Mail size={16} className="flex-shrink-0" />
                          <span>{config.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Phone size={16} className="flex-shrink-0" />
                          <span>{config.phone}</span>
                        </div>
                      </div>
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
                                    <span className="text-gray-600 text-sm">
                                      {link}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </footer>
              </EditableSection>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modals */}

      {/* Hero Edit Modal */}
      <EditModal
        isOpen={editingSection === "hero"}
        onClose={handleCancel}
        title="Chỉnh sửa Banner"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề dòng 1 (màu cam)
            </label>
            <input
              type="text"
              value={editConfig.heroTitle1}
              onChange={(e) =>
                setEditConfig({ ...editConfig, heroTitle1: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề dòng 2 (màu trắng)
            </label>
            <input
              type="text"
              value={editConfig.heroTitle2}
              onChange={(e) =>
                setEditConfig({ ...editConfig, heroTitle2: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              rows={4}
              value={editConfig.heroDescription}
              onChange={(e) =>
                setEditConfig({
                  ...editConfig,
                  heroDescription: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Lưu
            </button>
          </div>
        </div>
      </EditModal>

      {/* About Edit Modal */}
      <EditModal
        isOpen={editingSection === "about"}
        onClose={handleCancel}
        title="Chỉnh sửa Về chúng tôi"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung
            </label>
            <textarea
              rows={6}
              value={editConfig.aboutUs}
              onChange={(e) =>
                setEditConfig({ ...editConfig, aboutUs: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Lưu
            </button>
          </div>
        </div>
      </EditModal>

      {/* Vision Edit Modal */}
      <EditModal
        isOpen={editingSection === "vision"}
        onClose={handleCancel}
        title="Chỉnh sửa Tầm nhìn & Sứ mệnh"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tầm nhìn
            </label>
            <textarea
              rows={4}
              value={editConfig.vision}
              onChange={(e) =>
                setEditConfig({ ...editConfig, vision: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sứ mệnh
            </label>
            <textarea
              rows={4}
              value={editConfig.mission}
              onChange={(e) =>
                setEditConfig({ ...editConfig, mission: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Lưu
            </button>
          </div>
        </div>
      </EditModal>

      {/* Business Areas Edit Modal */}
      <EditModal
        isOpen={editingSection === "business"}
        onClose={handleCancel}
        title="Chỉnh sửa Lĩnh vực hoạt động"
      >
        <div className="space-y-4">
          {editConfig.businessAreas.map((area) => {
            const IconComponent = getIconComponent(area.icon);
            return (
              <div
                key={area.id}
                className={`bg-gradient-to-br ${area.color} rounded-xl p-4 text-white relative`}
              >
                <button
                  onClick={() => removeBusinessArea(area.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      value={area.title}
                      onChange={(e) =>
                        updateBusinessArea(area.id, "title", e.target.value)
                      }
                      className="w-full px-2 py-1.5 bg-white/20 border border-white/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/70 mb-1">
                      Icon
                    </label>
                    <select
                      value={area.icon}
                      onChange={(e) =>
                        updateBusinessArea(area.id, "icon", e.target.value)
                      }
                      className="w-full px-2 py-1.5 bg-white/20 border border-white/30 rounded text-white text-sm"
                    >
                      {iconOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="text-gray-900"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-white/70 mb-1">
                      Mô tả
                    </label>
                    <input
                      type="text"
                      value={area.description}
                      onChange={(e) =>
                        updateBusinessArea(
                          area.id,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full px-2 py-1.5 bg-white/20 border border-white/30 rounded text-white text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-white/70 mb-1">
                      Màu sắc
                    </label>
                    <select
                      value={area.color}
                      onChange={(e) =>
                        updateBusinessArea(area.id, "color", e.target.value)
                      }
                      className="w-full px-2 py-1.5 bg-white/20 border border-white/30 rounded text-white text-sm"
                    >
                      {colorOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="text-gray-900"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={addBusinessArea}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Thêm lĩnh vực
          </button>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Lưu
            </button>
          </div>
        </div>
      </EditModal>

      {/* Footer Edit Modal */}
      <EditModal
        isOpen={editingSection === "footer"}
        onClose={handleCancel}
        title="Chỉnh sửa Footer"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Thông tin công ty</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Tên công ty
                </label>
                <input
                  type="text"
                  value={editConfig.name}
                  onChange={(e) =>
                    setEditConfig({ ...editConfig, name: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Mã số thuế
                </label>
                <input
                  type="text"
                  value={editConfig.taxCode}
                  onChange={(e) =>
                    setEditConfig({ ...editConfig, taxCode: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={editConfig.address}
                  onChange={(e) =>
                    setEditConfig({ ...editConfig, address: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editConfig.email}
                  onChange={(e) =>
                    setEditConfig({ ...editConfig, email: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editConfig.phone}
                  onChange={(e) =>
                    setEditConfig({ ...editConfig, phone: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Người đại diện
                </label>
                <input
                  type="text"
                  value={editConfig.representative}
                  onChange={(e) =>
                    setEditConfig({
                      ...editConfig,
                      representative: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Chức vụ
                </label>
                <input
                  type="text"
                  value={editConfig.position}
                  onChange={(e) =>
                    setEditConfig({ ...editConfig, position: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Liên kết nhanh</h4>
            {editConfig.quickLinks.map((section) => (
              <div key={section.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      updateQuickLinkSection(section.id, e.target.value)
                    }
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                  />
                  <button
                    onClick={() => removeQuickLinkSection(section.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="space-y-1 ml-2">
                  {section.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={link}
                        onChange={(e) =>
                          updateLinkInSection(
                            section.id,
                            linkIndex,
                            e.target.value
                          )
                        }
                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                      <button
                        onClick={() =>
                          removeLinkFromSection(section.id, linkIndex)
                        }
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addLinkToSection(section.id)}
                    className="text-blue-600 text-xs hover:underline mt-1"
                  >
                    + Thêm liên kết
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addQuickLinkSection}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} /> Thêm mục liên kết
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Lưu
            </button>
          </div>
        </div>
      </EditModal>

      {/* Announcements Edit Modal */}
      <EditModal
        isOpen={editingSection === "announcements"}
        onClose={handleCancel}
        title="Quản lý Thông báo"
      >
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">
            Thêm các thông báo như chúc mừng Giáng sinh, Tết, lịch nghỉ lễ, v.v.
          </p>

          {editConfig.announcements.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {editConfig.announcements.map((announcement) => {
                const typeConfig =
                  announcementTypes.find(
                    (t) => t.value === announcement.type
                  ) || announcementTypes[0];
                return (
                  <div
                    key={announcement.id}
                    className={`${typeConfig.bgColor} ${typeConfig.borderColor} border rounded-xl p-4 relative`}
                  >
                    <button
                      onClick={() => removeAnnouncement(announcement.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tiêu đề
                        </label>
                        <input
                          type="text"
                          value={announcement.title}
                          onChange={(e) =>
                            updateAnnouncement(
                              announcement.id,
                              "title",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nội dung
                        </label>
                        <textarea
                          rows={2}
                          value={announcement.content}
                          onChange={(e) =>
                            updateAnnouncement(
                              announcement.id,
                              "content",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Loại
                          </label>
                          <select
                            value={announcement.type}
                            onChange={(e) =>
                              updateAnnouncement(
                                announcement.id,
                                "type",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-sm"
                          >
                            {announcementTypes.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Từ ngày
                          </label>
                          <input
                            type="date"
                            value={announcement.startDate}
                            onChange={(e) =>
                              updateAnnouncement(
                                announcement.id,
                                "startDate",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Đến ngày
                          </label>
                          <input
                            type="date"
                            value={announcement.endDate}
                            onChange={(e) =>
                              updateAnnouncement(
                                announcement.id,
                                "endDate",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Trạng thái
                          </label>
                          <button
                            onClick={() =>
                              updateAnnouncement(
                                announcement.id,
                                "isActive",
                                !announcement.isActive
                              )
                            }
                            className={`w-full px-2 py-1.5 rounded text-sm font-medium ${
                              announcement.isActive
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {announcement.isActive ? "Hiển thị" : "Ẩn"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={addAnnouncement}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Thêm thông báo mới
          </button>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Lưu
            </button>
          </div>
        </div>
      </EditModal>
    </div>
  );
}
