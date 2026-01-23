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
      message: "Successfully connected to Google Sheets (Danh sách món vay)!",
      data: loans,
      count: loans.length,
      config: {
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_DONG_TIEN,
        sheetName: process.env.GOOGLE_SHEET_NAME_DANH_SACH_MON_VAY,
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
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_DONG_TIEN,
          sheetName: process.env.GOOGLE_SHEET_NAME_DANH_SACH_MON_VAY,
          hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
          hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        },
      },
      { status: 500 }
    );
  }
}
