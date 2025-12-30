import { NextRequest, NextResponse } from "next/server";
import { addLoanToSheet, Loan } from "@/lib/googleSheets";

/**
 * POST /api/loans/add
 * Thêm khoản vay mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
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
      id: body.id || Date.now(),
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

    await addLoanToSheet(loan);

    return NextResponse.json({
      success: true,
      message: "Loan added successfully",
      data: loan,
    });
  } catch (error: any) {
    console.error("Error adding loan:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add loan to Google Sheets",
      },
      { status: 500 }
    );
  }
}
