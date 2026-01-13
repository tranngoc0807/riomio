import { NextResponse } from "next/server";
import { getChiPhiHinhInFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/chi-phi-hinh-in
 * Lấy dữ liệu chi phí hình in từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getChiPhiHinhInFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching chi phi hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch chi phi hinh in",
      },
      { status: 500 }
    );
  }
}
