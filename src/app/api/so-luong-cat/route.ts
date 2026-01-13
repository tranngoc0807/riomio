import { NextResponse } from "next/server";
import { getSoLuongCatFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/so-luong-cat
 * Lấy dữ liệu số lượng cắt từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getSoLuongCatFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching so luong cat:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch so luong cat",
      },
      { status: 500 }
    );
  }
}
