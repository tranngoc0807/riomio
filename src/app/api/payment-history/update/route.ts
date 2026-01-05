import { NextRequest, NextResponse } from "next/server";
import { updatePaymentHistoryInSheet, PaymentHistory } from "@/lib/googleSheets";

/**
 * PUT /api/payment-history/update
 * Cập nhật lịch sử thanh toán trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - cần có id và ngày giao dịch
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID lịch sử thanh toán",
        },
        { status: 400 }
      );
    }

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
      id: body.id,
      transactionDate: body.transactionDate,
      loanCode: body.loanCode || "",
      transactionType: body.transactionType || "",
      amountIn: body.amountIn || 0,
      amountOut: body.amountOut || 0,
    };

    await updatePaymentHistoryInSheet(payment);

    return NextResponse.json({
      success: true,
      message: "Payment history updated successfully",
      data: payment,
    });
  } catch (error: any) {
    console.error("Error updating payment history:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update payment history in Google Sheets",
      },
      { status: 500 }
    );
  }
}
