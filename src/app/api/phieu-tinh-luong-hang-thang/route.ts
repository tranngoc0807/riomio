import { NextResponse } from "next/server";
import { getPhieuTinhLuongHangThangFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/phieu-tinh-luong-hang-thang
 * Lấy dữ liệu Phiếu tính lương hàng tháng
 */
export async function GET() {
  try {
    const data = await getPhieuTinhLuongHangThangFromSheet();

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: any) {
    console.error("Error fetching Phiếu tính lương hàng tháng:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch monthly salary slip data",
      },
      { status: 500 }
    );
  }
}
