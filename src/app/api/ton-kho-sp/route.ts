import { NextResponse } from "next/server";
import { getTonKhoSPFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/ton-kho-sp
 * Lấy danh sách tồn kho sản phẩm từ Google Sheets (Tonkhosp)
 */
export async function GET() {
  try {
    const tonKhoList = await getTonKhoSPFromSheet();

    return NextResponse.json({
      success: true,
      data: tonKhoList,
    });
  } catch (error: any) {
    console.error("Error fetching ton kho SP:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch ton kho SP from Google Sheets",
      },
      { status: 500 }
    );
  }
}
