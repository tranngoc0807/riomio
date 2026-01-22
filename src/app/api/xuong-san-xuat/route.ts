import { NextResponse } from "next/server";
import { getWorkshopsFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/xuong-san-xuat
 * Lấy danh sách xưởng sản xuất từ Google Sheets
 */
export async function GET() {
  try {
    const workshops = await getWorkshopsFromSheet();

    return NextResponse.json({
      success: true,
      data: workshops,
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
