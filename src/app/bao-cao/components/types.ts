// Types for Bao Cao
export interface RevenueReport {
  id: number;
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  growthRate: number;
  orderCount: number;
}

export interface DebtReport {
  id: number;
  name: string;
  type: "customer" | "supplier" | "workshop";
  totalDebt: number;
  paid: number;
  remaining: number;
  dueDate: string;
  status: "normal" | "warning" | "overdue";
}

export interface InventoryReport {
  id: number;
  productName: string;
  sku: string;
  category: string;
  stockIn: number;
  stockOut: number;
  currentStock: number;
  value: number;
}

// Interface cho dữ liệu tồn kho từ Google Sheet
export interface TonKhoItem {
  id: number;
  maSp: string; // Mã SP
  nhap1: number; // Nhập (cột C)
  nhap2: number; // Nhập (cột D)
  xuat: number; // Xuất
  tonCuoi: number; // Tồn cuối
}

export interface SalaryReport {
  id: number;
  employeeName: string;
  department: string;
  baseSalary: number;
  allowance: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  month: string;
}

// Format currency helper
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};
