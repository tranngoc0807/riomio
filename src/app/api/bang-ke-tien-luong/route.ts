import { NextRequest, NextResponse } from "next/server";
import { getBangKeTienLuongFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/bang-ke-tien-luong
 * Lấy danh sách Bảng kê tiền lương từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const bangKeTienLuongItems = await getBangKeTienLuongFromSheet();

    return NextResponse.json({
      success: true,
      data: bangKeTienLuongItems,
      count: bangKeTienLuongItems.length,
    });
  } catch (error: any) {
    console.error("Error fetching Bảng kê tiền lương:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch Bảng kê tiền lương from Google Sheets",
      },
      { status: 500 }
    );
  }
}
