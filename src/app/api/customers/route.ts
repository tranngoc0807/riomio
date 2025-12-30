import { NextRequest, NextResponse } from "next/server";
import { getCustomersFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/customers
 * Lấy danh sách tất cả khách hàng từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching customers from Google Sheets...");

    const customers = await getCustomersFromSheet();

    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch customers from Google Sheets",
      },
      { status: 500 }
    );
  }
}
