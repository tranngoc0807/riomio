import { NextRequest, NextResponse } from "next/server";
import { getBaoCaoKhachHang } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/khach-hang
 * Lấy dữ liệu báo cáo mua hàng của khách hàng
 * Query params:
 * - thang: tháng báo cáo (format: "M/YYYY" e.g., "1/2026")
 * - nam: năm báo cáo (format: "YYYY" e.g., "2026")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const thang = searchParams.get("thang") || undefined;
    const nam = searchParams.get("nam") || undefined;

    const data = await getBaoCaoKhachHang(thang, nam);

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
