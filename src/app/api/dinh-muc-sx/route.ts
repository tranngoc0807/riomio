import { NextResponse } from "next/server";
import { getDinhMucSXFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/dinh-muc-sx
 * Lấy dữ liệu định mức sản xuất từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getDinhMucSXFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching dinh muc sx:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dinh muc sx",
      },
      { status: 500 }
    );
  }
}
