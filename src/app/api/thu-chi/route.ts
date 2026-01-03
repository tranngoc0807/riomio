import { NextRequest, NextResponse } from "next/server";
import { getThuChiFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/thu-chi
 * Lấy danh sách thu chi từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching thu chi from Google Sheets...");
    const thuChiList = await getThuChiFromSheet();

    return NextResponse.json({
      success: true,
      data: thuChiList,
      count: thuChiList.length,
    });
  } catch (error: any) {
    console.error("Error fetching thu chi:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch thu chi from Google Sheets",
      },
      { status: 500 }
    );
  }
}
