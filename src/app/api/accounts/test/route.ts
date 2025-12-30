import { NextRequest, NextResponse } from "next/server";
import { getAccountsFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/accounts/test
 * Test API để kiểm tra kết nối với Google Sheets (TaiKhoan)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Testing Google Sheets connection for Accounts...");

    const accounts = await getAccountsFromSheet();

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Google Sheets (TaiKhoan)!",
      data: accounts,
      count: accounts.length,
      config: {
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN,
        sheetName: process.env.GOOGLE_SHEET_NAME_TAI_KHOAN,
      },
    });
  } catch (error: any) {
    console.error("Error testing accounts connection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to connect to Google Sheets",
        stack: error.stack,
        config: {
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN,
          sheetName: process.env.GOOGLE_SHEET_NAME_TAI_KHOAN,
          hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
          hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        },
      },
      { status: 500 }
    );
  }
}
