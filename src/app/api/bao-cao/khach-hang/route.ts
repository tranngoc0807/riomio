import { NextResponse } from "next/server";
import { getBaoCaoKhachHang } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/khach-hang
 * Lấy dữ liệu báo cáo mua hàng của khách hàng
 */
export async function GET() {
  try {
    const data = await getBaoCaoKhachHang();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao khach hang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao khach hang",
      },
      { status: 500 }
    );
  }
}
