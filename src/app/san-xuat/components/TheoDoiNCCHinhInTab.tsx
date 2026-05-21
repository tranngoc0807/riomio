"use client";

import { Eye, Hourglass } from "lucide-react";

export default function TheoDoiNCCHinhInTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-100 rounded-full blur-2xl opacity-60" />
        <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-lg">
          <Eye className="text-white" size={40} />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Hourglass className="text-amber-500" size={22} />
        Coming soon
      </h2>
      <p className="mt-2 text-gray-500 max-w-md">
        Tính năng Theo dõi chi tiết NCC Hình In đang được phát triển. Vui lòng
        quay lại sau.
      </p>
    </div>
  );
}
