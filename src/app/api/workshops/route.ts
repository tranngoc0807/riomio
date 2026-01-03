import { NextRequest, NextResponse } from "next/server";
import { getWorkshopsFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/workshops
 * Lấy danh sách tất cả xưởng sản xuất từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching workshops from Google Sheets...");

    const workshops = await getWorkshopsFromSheet();

    return NextResponse.json({
      success: true,
      data: workshops,
      count: workshops.length,
    });
  } catch (error: any) {
    console.error("Error fetching workshops:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch workshops from Google Sheets",
      },
      { status: 500 }
    );
  }
}
