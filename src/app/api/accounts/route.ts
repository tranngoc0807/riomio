import { NextRequest, NextResponse } from "next/server";
import { getAccountsFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/accounts
 * Lấy danh sách tài khoản từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const accounts = await getAccountsFromSheet();

    return NextResponse.json({
      success: true,
      data: accounts,
      count: accounts.length,

      
    });
  } catch (error: any) {
    console.error("Error fetching accounts:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch accounts from Google Sheets",
      },
      { status: 500 }
    );
  }
}
