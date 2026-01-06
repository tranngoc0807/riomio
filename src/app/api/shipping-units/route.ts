import { NextRequest, NextResponse } from "next/server";
import { getShippingUnitsFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/shipping-units
 * Lấy danh sách tất cả đơn vị vận chuyển từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching shipping units from Google Sheets...");

    const shippingUnits = await getShippingUnitsFromSheet();

    return NextResponse.json({
      success: true,
      data: shippingUnits,
      count: shippingUnits.length,
    });
  } catch (error: any) {
    console.error("Error fetching shipping units:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch shipping units from Google Sheets",
      },
      { status: 500 }
    );
  }
}
