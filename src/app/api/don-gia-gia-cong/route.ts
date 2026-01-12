import { NextResponse } from "next/server";
import { getDonGiaGiaCongFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/don-gia-gia-cong
 * Lấy danh sách đơn giá gia công từ Google Sheets
 */
export async function GET() {
  try {
    const donGiaData = await getDonGiaGiaCongFromSheet();

    return NextResponse.json({
      success: true,
      data: donGiaData,
    });
  } catch (error: any) {
    console.error("Error fetching don gia gia cong:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch đơn giá gia công",
      },
      { status: 500 }
    );
  }
}
