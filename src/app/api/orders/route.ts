import { NextResponse } from "next/server";
import { getOrdersFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/orders
 * Lấy danh sách đơn hàng từ Google Sheets
 */
export async function GET() {
  try {
    const orders = await getOrdersFromSheet();

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch orders from Google Sheets",
      },
      { status: 500 }
    );
  }
}
