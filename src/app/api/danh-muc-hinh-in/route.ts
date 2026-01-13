import { NextResponse } from "next/server";
import { getDanhMucHinhInFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/danh-muc-hinh-in
 * Lấy danh mục hình in từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getDanhMucHinhInFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching danh muc hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch danh muc hinh in",
      },
      { status: 500 }
    );
  }
}
