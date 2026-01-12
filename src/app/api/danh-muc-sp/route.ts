import { NextResponse } from "next/server";
import { getDanhMucSPFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/danh-muc-sp
 * Lấy danh sách Mã SP đầy đủ từ Google Sheets (Danh mục SP)
 */
export async function GET() {
  try {
    const danhMucList = await getDanhMucSPFromSheet();

    return NextResponse.json({
      success: true,
      data: danhMucList,
    });
  } catch (error: any) {
    console.error("Error fetching danh muc SP:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch danh muc SP from Google Sheets",
      },
      { status: 500 }
    );
  }
}
