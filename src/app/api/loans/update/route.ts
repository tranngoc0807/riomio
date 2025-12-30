import { NextRequest, NextResponse } from "next/server";
import { updateLoanInSheet, Loan } from "@/lib/googleSheets";

/**
 * PUT /api/loans/update
 * Cập nhật thông tin khoản vay trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Loan ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.code) {
      return NextResponse.json(
        {
          success: false,
          error: "Loan code is required",
        },
        { status: 400 }
      );
    }

    const loan: Loan = {
      id: body.id,
      code: body.code,
      lender: body.lender || "",
      amount: body.amount || 0,
      remaining: body.remaining || 0,
      interestRate: body.interestRate || "",
      interestType: body.interestType || "",
      monthlyInterest: body.monthlyInterest || 0,
      dueDate: body.dueDate || "",
      status: body.status || "",
    };

    await updateLoanInSheet(loan);

    return NextResponse.json({
      success: true,
      message: "Loan updated successfully",
      data: loan,
    });
  } catch (error: any) {
    console.error("Error updating loan:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update loan in Google Sheets",
      },
      { status: 500 }
    );
  }
}
