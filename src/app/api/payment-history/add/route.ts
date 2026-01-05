import { NextRequest, NextResponse } from "next/server";
import { addPaymentHistoryToSheet, PaymentHistory } from "@/lib/googleSheets";

/**
 * POST /api/payment-history/add
 * Thêm lịch sử thanh toán mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - yêu cầu ngày giao dịch
    if (!body.transactionDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Ngày giao dịch",
        },
        { status: 400 }
      );
    }

    const payment: PaymentHistory = {
      id: body.id || 0,
      transactionDate: body.transactionDate,
      loanCode: body.loanCode || "",
      transactionType: body.transactionType || "",
      amountIn: body.amountIn || 0,
      amountOut: body.amountOut || 0,
    };

    await addPaymentHistoryToSheet(payment);

    return NextResponse.json({
      success: true,
      message: "Payment history added successfully",
      data: payment,
    });
  } catch (error: any) {
    console.error("Error adding payment history:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add payment history to Google Sheets",
      },
      { status: 500 }
    );
  }
}
