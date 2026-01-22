"use client";

import { ShoppingCart } from "lucide-react";
import OrdersTab from "../components/OrdersTab";

export default function DonHangPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={32} />
            Đơn hàng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý đơn hàng của khách hàng
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 text-blue-600 border-blue-600 bg-blue-50/50"
            >
              <ShoppingCart size={20} />
              Đơn hàng
            </button>
          </div>
        </div>

        <div className="p-6">
          <OrdersTab />
        </div>
      </div>
    </div>
  );
}
