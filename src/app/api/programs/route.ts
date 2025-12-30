import { NextResponse } from "next/server";
import { getSalesProgramsFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/programs
 * Lấy danh sách chương trình bán hàng từ Google Sheets
 */
export async function GET() {
  try {
    const programs = await getSalesProgramsFromSheet();

    return NextResponse.json({
      success: true,
      data: programs,
    });
  } catch (error: any) {
    console.error("Error fetching programs:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch programs from Google Sheets",
      },
      { status: 500 }
    );
  }
}
