import { NextRequest, NextResponse } from "next/server";
import { getCustomersFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/customers/test
 * Test API để kiểm tra kết nối với Google Sheets (DSKhachHang)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Testing Google Sheets connection for Customers...");

    const customers = await getCustomersFromSheet();

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Google Sheets (DSKhachHang)!",
      data: customers,
      count: customers.length,
      config: {
        sheetName: process.env.GOOGLE_SHEET_NAME_KHACH_HANG,
      },
    });
  } catch (error: any) {
    console.error("Error testing customers connection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to connect to Google Sheets",
        stack: error.stack,
        config: {
          sheetName: process.env.GOOGLE_SHEET_NAME_KHACH_HANG,
          hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
          hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        },
      },
      { status: 500 }
    );
  }
}
