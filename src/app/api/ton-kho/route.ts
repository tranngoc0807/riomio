import { NextRequest, NextResponse } from "next/server";
import { getTonKhoFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/ton-kho
 * Lấy danh sách tồn kho từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const tonKhoItems = await getTonKhoFromSheet();

    return NextResponse.json({
      success: true,
      data: tonKhoItems,
      count: tonKhoItems.length,
    });
  } catch (error: any) {
    console.error("Error fetching inventory:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch inventory from Google Sheets",
      },
      { status: 500 }
    );
  }
}
