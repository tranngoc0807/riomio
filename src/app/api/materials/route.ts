import { NextRequest, NextResponse } from "next/server";
import { getMaterialsFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/materials
 * Lấy danh sách nguyên phụ liệu từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching materials from Google Sheets...");
    const materials = await getMaterialsFromSheet();

    return NextResponse.json({
      success: true,
      data: materials,
      count: materials.length,
    });
  } catch (error: any) {
    console.error("Error fetching materials:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch materials from Google Sheets",
      },
      { status: 500 }
    );
  }
}
