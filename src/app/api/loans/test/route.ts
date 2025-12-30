import { NextRequest, NextResponse } from "next/server";
import { getLoansFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/loans/test
 * Test API để kiểm tra kết nối với Google Sheets (KhoanVay)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Testing Google Sheets connection for Loans...");

    const loans = await getLoansFromSheet();

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Google Sheets (KhoanVay)!",
      data: loans,
      count: loans.length,
      config: {
        sheetName: process.env.GOOGLE_SHEET_NAME_KHOAN_VAY,
      },
    });
  } catch (error: any) {
    console.error("Error testing loans connection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to connect to Google Sheets",
        stack: error.stack,
        config: {
          sheetName: process.env.GOOGLE_SHEET_NAME_KHOAN_VAY,
          hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
          hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        },
      },
      { status: 500 }
    );
  }
}
