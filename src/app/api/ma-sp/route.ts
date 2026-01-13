import { NextResponse } from "next/server";
import { getMaSPFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/ma-sp
 * Lấy dữ liệu mã sản phẩm (phát triển sản phẩm) từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getMaSPFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching ma sp:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch ma sp",
      },
      { status: 500 }
    );
  }
}
