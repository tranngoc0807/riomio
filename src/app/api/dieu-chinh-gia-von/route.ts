import { NextResponse } from "next/server";
import { getDieuChinhGiaVonFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/dieu-chinh-gia-von
 * Lấy dữ liệu điều chỉnh giá vốn từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getDieuChinhGiaVonFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching dieu chinh gia von:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dieu chinh gia von",
      },
      { status: 500 }
    );
  }
}
