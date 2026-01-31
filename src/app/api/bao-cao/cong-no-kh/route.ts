import { NextResponse } from "next/server";
import { getBaoCaoCongNoKH } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/cong-no-kh
 * Lấy dữ liệu báo cáo công nợ khách hàng
 */
export async function GET() {
  try {
    const data = await getBaoCaoCongNoKH();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao cong no KH:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao cong no KH",
      },
      { status: 500 }
    );
  }
}
