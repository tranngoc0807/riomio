"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import {
  User,
  Briefcase,
  Building2,
  MapPin,
  CreditCard,
  Calendar,
  Mail,
  IdCard,
  FileText,
  Shield,
  Loader2,
  UserCircle,
  Phone,
} from "lucide-react";

interface EmployeeData {
  id: number;
  name: string;
  position: string;
  department: string;
  gender: string;
  employmentStatus: string;
  birthday: string;
  cccd: string;
  cccdDate: string;
  cccdPlace: string;
  hometown: string;
  address: string;
  contractType: string;
  bankAccount: string;
  phone: string;
  email: string;
}

export default function ProfilePage() {
  const { profile, session } = useAuth();
  const { getRoleLabel, getRoleColor } = useRoles();
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/employees");
        const result = await response.json();
        if (result.success && result.data) {
          const match = result.data.find(
            (emp: EmployeeData) =>
              emp.email?.toLowerCase() === session.user.email?.toLowerCase()
          );
          setEmployeeData(match || null);
        }
      } catch (error) {
        console.error("Error fetching employee:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [session?.user?.email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500 text-lg">Đang tải thông tin...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {employeeData?.name
              ? employeeData.name.split(" ").length >= 2
                ? (employeeData.name.split(" ")[0][0] + employeeData.name.split(" ").slice(-1)[0][0]).toUpperCase()
                : employeeData.name.substring(0, 2).toUpperCase()
              : <User size={40} />}
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {employeeData?.name || profile?.full_name || "Người dùng"}
            </h1>
            <p className="text-blue-100 mt-1 text-lg">
              {employeeData?.position || "—"}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
                <span className={`w-2 h-2 rounded-full ${profile ? getRoleColor(profile.role) : "bg-gray-400"}`}></span>
                {profile ? getRoleLabel(profile.role) : ""}
              </span>
              {employeeData?.employmentStatus && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  employeeData.employmentStatus === "Đang làm việc"
                    ? "bg-green-400/20 text-green-100"
                    : employeeData.employmentStatus === "Thử việc"
                    ? "bg-yellow-400/20 text-yellow-100"
                    : "bg-red-400/20 text-red-100"
                }`}>
                  {employeeData.employmentStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {employeeData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Work Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-600" />
                  Thông tin công việc
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <InfoItem label="Vị trí" value={employeeData.position} />
                  <InfoItem label="Bộ phận" value={employeeData.department} />
                  <InfoItem label="Loại hợp đồng" value={employeeData.contractType} />
                  <InfoItem label="Trạng thái" value={employeeData.employmentStatus} highlight={
                    employeeData.employmentStatus === "Đang làm việc" ? "green" :
                    employeeData.employmentStatus === "Thử việc" ? "yellow" : "red"
                  } />
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User size={18} className="text-purple-600" />
                  Thông tin cá nhân
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <InfoItem label="Ngày sinh" value={employeeData.birthday} icon={<Calendar size={15} className="text-gray-400" />} />
                  <InfoItem label="Giới tính" value={employeeData.gender} icon={<User size={15} className="text-gray-400" />} />
                  <InfoItem label="CCCD" value={employeeData.cccd} subValue={employeeData.cccdDate ? `Ngày cấp: ${employeeData.cccdDate}` : undefined} icon={<IdCard size={15} className="text-gray-400" />} />
                  <InfoItem label="Nơi cấp CCCD" value={employeeData.cccdPlace} />
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin size={18} className="text-green-600" />
                  Địa chỉ
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <InfoItem label="Quê quán" value={employeeData.hometown} icon={<MapPin size={15} className="text-gray-400" />} />
                  <InfoItem label="Địa chỉ hiện tại" value={employeeData.address} icon={<MapPin size={15} className="text-gray-400" />} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Quick Info */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Mail size={18} className="text-orange-600" />
                  Liên hệ
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{employeeData.email || session?.user?.email || "—"}</p>
                  </div>
                </div>
                {employeeData.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Phone size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                      <p className="text-sm font-medium text-gray-900">{employeeData.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <CreditCard size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tài khoản ngân hàng</p>
                    <p className="text-sm font-medium text-gray-900">{employeeData.bankAccount || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Tổng quan
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Mã NV</span>
                  <span className="text-sm font-semibold text-gray-900">#{employeeData.id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Bộ phận</span>
                  <span className="text-sm font-semibold text-gray-900">{employeeData.department || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Hợp đồng</span>
                  <span className="text-sm font-semibold text-gray-900">{employeeData.contractType || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UserCircle size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy thông tin nhân viên</h2>
          <p className="text-gray-500">
            Email <span className="font-medium text-gray-700">{session?.user?.email}</span> chưa được liên kết với nhân viên nào trong hệ thống.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Vui lòng liên hệ quản trị viên để cập nhật email vào hồ sơ nhân viên.
          </p>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, subValue, icon, highlight }: {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  highlight?: "green" | "yellow" | "red";
}) {
  const highlightColors = {
    green: "text-green-700 bg-green-50 px-2 py-0.5 rounded-md inline-block",
    yellow: "text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md inline-block",
    red: "text-red-700 bg-red-50 px-2 py-0.5 rounded-md inline-block",
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className={`text-sm font-semibold ${highlight ? highlightColors[highlight] : "text-gray-900"}`}>
        {value || "—"}
      </p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  );
}
