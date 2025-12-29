import {
  Building2,
  Factory,
  ShoppingCart,
  Wallet,
  Users,
  HandCoins,
  FileBarChart,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    name: "Doanh thu tháng",
    value: "1.2 tỷ",
    change: "+12%",
    trend: "up",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    name: "Chi phí sản xuất",
    value: "450 triệu",
    change: "-5%",
    trend: "down",
    icon: TrendingDown,
    color: "bg-red-500",
  },
  {
    name: "Lợi nhuận ròng",
    value: "320 triệu",
    change: "+8%",
    trend: "up",
    icon: TrendingUp,
    color: "bg-blue-500",
  },
  {
    name: "Nhân viên",
    value: "45",
    change: "+2",
    trend: "up",
    icon: Users,
    color: "bg-purple-500",
  },
];

const quickLinks = [
  {
    name: "Thông tin công ty",
    href: "/thong-tin-cong-ty",
    icon: Building2,
    description: "Quản lý thông tin doanh nghiệp",
    color: "bg-blue-600",
  },
  {
    name: "Sản xuất",
    href: "/san-xuat",
    icon: Factory,
    description: "Quản lý quy trình sản xuất",
    color: "bg-orange-500",
  },
  {
    name: "Bán hàng",
    href: "/ban-hang",
    icon: ShoppingCart,
    description: "Quản lý đơn hàng và khách hàng",
    color: "bg-green-500",
  },
  {
    name: "Dòng tiền",
    href: "/dong-tien",
    icon: Wallet,
    description: "Theo dõi thu chi tài chính",
    color: "bg-emerald-500",
  },
  {
    name: "Lương & Bảo hiểm",
    href: "/luong-bao-hiem",
    icon: Users,
    description: "Quản lý lương và phúc lợi",
    color: "bg-purple-500",
  },
  {
    name: "Quản lý tiền vay",
    href: "/quan-ly-tien-vay",
    icon: HandCoins,
    description: "Theo dõi các khoản vay",
    color: "bg-red-500",
  },
  {
    name: "Báo cáo",
    href: "/bao-cao",
    icon: FileBarChart,
    description: "Xem báo cáo tổng hợp",
    color: "bg-indigo-500",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Chào mừng bạn đến với hệ thống quản lý Riomio Shop
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span
                  className={`text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-gray-500 text-sm ml-2">so với tháng trước</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {link.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{link.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Hoạt động gần đây
        </h2>
        <div className="space-y-4">
          {[
            { action: "Đơn hàng mới #1234", time: "5 phút trước", type: "order" },
            { action: "Thanh toán lương tháng 12", time: "2 giờ trước", type: "salary" },
            { action: "Nhập nguyên liệu sản xuất", time: "1 ngày trước", type: "production" },
            { action: "Cập nhật báo cáo tài chính", time: "2 ngày trước", type: "report" },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-700">{activity.action}</span>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
