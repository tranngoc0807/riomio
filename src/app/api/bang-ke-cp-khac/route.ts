import { NextResponse } from "next/server";
import { getBangKeCPKhacFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/bang-ke-cp-khac
 * Lấy dữ liệu bảng kê chi phí khác từ Google Sheets (3 bảng)
 */
export async function GET() {
  try {
    const data = await getBangKeCPKhacFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bang ke cp khac:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bang ke cp khac",
      },
      { status: 500 }
    );
  }
}
