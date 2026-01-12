import { NextResponse } from "next/server";
import { getBangKeGiaCongFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/bang-ke-gia-cong
 * Lấy danh sách bảng kê gia công từ Google Sheets
 */
export async function GET() {
  try {
    const bangKeData = await getBangKeGiaCongFromSheet();

    return NextResponse.json({
      success: true,
      data: bangKeData,
    });
  } catch (error: any) {
    console.error("Error fetching bang ke gia cong:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bảng kê gia công",
      },
      { status: 500 }
    );
  }
}
