import { NextResponse } from "next/server";
import { getBaoCaoBanHangTheoThang } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/ban-hang-theo-thang
 * Lấy dữ liệu báo cáo bán hàng theo tháng
 */
export async function GET() {
  try {
    const data = await getBaoCaoBanHangTheoThang();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao ban hang theo thang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao ban hang theo thang",
      },
      { status: 500 }
    );
  }
}
