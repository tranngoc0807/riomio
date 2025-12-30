import { NextRequest, NextResponse } from "next/server";
import { getLoansFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/loans
 * Lấy danh sách khoản vay từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const loans = await getLoansFromSheet();

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
