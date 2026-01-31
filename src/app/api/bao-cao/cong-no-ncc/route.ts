import { NextResponse } from "next/server";
import { getBaoCaoCongNoNCC } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/cong-no-ncc
 * Lấy dữ liệu báo cáo công nợ phải trả NCC NPL
 */
export async function GET() {
  try {
    const data = await getBaoCaoCongNoNCC();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao cong no NCC:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao cong no NCC",
      },
      { status: 500 }
    );
  }
}
