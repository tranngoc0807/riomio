import { NextRequest, NextResponse } from "next/server";
import { getCongNoFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/cong-no
 * Lấy danh sách công nợ phải thu khách hàng từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const congNoItems = await getCongNoFromSheet();

    return NextResponse.json({
      success: true,
      data: congNoItems,
      count: congNoItems.length,
    });
  } catch (error: any) {
    console.error("Error fetching debt:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch debt from Google Sheets",
      },
      { status: 500 }
    );
  }
}
