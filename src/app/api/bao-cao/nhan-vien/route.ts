import { NextRequest, NextResponse } from "next/server";
import { getBaoCaoNhanVien } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/nhan-vien
 * Lấy dữ liệu báo cáo bán hàng theo nhân viên
 * Query params:
 * - thang: tháng báo cáo (format: "M/YYYY" e.g., "1/2026")
 * - nam: năm báo cáo (format: "YYYY" e.g., "2026")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const thang = searchParams.get("thang") || undefined;
    const nam = searchParams.get("nam") || undefined;

    const data = await getBaoCaoNhanVien(thang, nam);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao nhan vien:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao nhan vien",
      },
      { status: 500 }
    );
  }
}
