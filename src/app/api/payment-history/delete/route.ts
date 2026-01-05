import { NextRequest, NextResponse } from "next/server";
import { deletePaymentHistoryFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/payment-history/delete
 * Xóa lịch sử thanh toán khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID lịch sử thanh toán",
        },
        { status: 400 }
      );
    }

    const paymentId = parseInt(id, 10);

    if (isNaN(paymentId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID lịch sử thanh toán không hợp lệ",
        },
        { status: 400 }
      );
    }

    await deletePaymentHistoryFromSheet(paymentId);

    return NextResponse.json({
      success: true,
      message: "Payment history deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting payment history:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete payment history from Google Sheets",
      },
      { status: 500 }
    );
  }
}
