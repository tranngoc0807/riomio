import { NextRequest, NextResponse } from "next/server";
import { getLuongFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/luong
 * Lấy danh sách lương nhân viên từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const luongItems = await getLuongFromSheet();

    return NextResponse.json({
      success: true,
      data: luongItems,
      count: luongItems.length,
    });
  } catch (error: any) {
    console.error("Error fetching salary:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch salary from Google Sheets",
      },
      { status: 500 }
    );
  }
}
