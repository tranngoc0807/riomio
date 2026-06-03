import { NextRequest, NextResponse } from "next/server";
import { getMonVayFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/loans
 * Lấy danh sách "Món vay" (tự tổng hợp từ sheet Giao dịch) - chỉ đọc
 */
export async function GET(request: NextRequest) {
  try {
    const loans = await getMonVayFromSheet();

    return NextResponse.json({
      success: true,
      data: loans,
      count: loans.length,
    });
  } catch (error: any) {
    console.error("Error fetching loans:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch loans from Google Sheets",
      },
      { status: 500 }
    );
  }
}
