import { NextResponse } from "next/server";
import { getKeHoachSXFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/ke-hoach-sx
 * Lấy danh sách kế hoạch sản xuất từ Google Sheets
 */
export async function GET() {
  try {
    const keHoachList = await getKeHoachSXFromSheet();

    return NextResponse.json({
      success: true,
      data: keHoachList,
    });
  } catch (error: any) {
    console.error("Error fetching ke hoach SX:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch ke hoach SX from Google Sheets",
      },
      { status: 500 }
    );
  }
}
