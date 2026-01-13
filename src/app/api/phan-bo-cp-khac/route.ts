import { NextResponse } from "next/server";
import { getPhanBoCPKhacFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/phan-bo-cp-khac
 * Lấy dữ liệu phân bổ chi phí khác từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getPhanBoCPKhacFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching phan bo cp khac:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch phan bo cp khac",
      },
      { status: 500 }
    );
  }
}
