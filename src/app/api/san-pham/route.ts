import { NextResponse } from "next/server";
import { getSanPhamFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/san-pham
 * Lấy danh sách sản phẩm từ Google Sheets
 */
export async function GET() {
  try {
    const sanPhams = await getSanPhamFromSheet();

    return NextResponse.json({
      success: true,
      data: sanPhams,
    });
  } catch (error: any) {
    console.error("Error fetching san pham:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch san pham from Google Sheets",
      },
      { status: 500 }
    );
  }
}
