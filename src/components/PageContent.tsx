"use client";

import { Plus, Search, ListChecks, FileText } from "lucide-react";

interface PageContentProps {
  title: string;
  subtitle?: string;
}

export default function PageContent({ title, subtitle = "Quản lý và theo dõi thông tin" }: PageContentProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{subtitle}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus size={20} />
            <span>Thêm mới</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <ListChecks size={20} />
            <span>Lọc</span>
          </button>
        </div>

        {/* Content Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 mb-4">
              Chưa có dữ liệu. Nhấn &quot;Thêm mới&quot; để bắt đầu.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Thêm mới
            </button>
          </div>
        </div>

        {/* Table placeholder for future data */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">STT</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Chi tiết</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Chưa có dữ liệu
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
