import { NextResponse } from "next/server";
import { getPaymentHistoryFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/payment-history
 * Lấy danh sách lịch sử thanh toán từ Google Sheets
 */
export async function GET() {
  try {
    const paymentHistory = await getPaymentHistoryFromSheet();

    return NextResponse.json({
      success: true,
      data: paymentHistory,
    });
  } catch (error: any) {
    console.error("Error fetching payment history:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch payment history from Google Sheets",
      },
      { status: 500 }
    );
  }
}
