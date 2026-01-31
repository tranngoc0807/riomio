import { NextResponse } from "next/server";
import { getBaoCaoCongNoXuong } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/cong-no-xuong
 * Lấy dữ liệu báo cáo công nợ phải trả xưởng SX
 */
export async function GET() {
  try {
    const data = await getBaoCaoCongNoXuong();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao cong no xuong:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao cong no xuong",
      },
      { status: 500 }
    );
  }
}
