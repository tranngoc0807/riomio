import { NextRequest, NextResponse } from "next/server";
import { addAccountToSheet, Account } from "@/lib/googleSheets";

/**
 * POST /api/accounts/add
 * Thêm tài khoản mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.accountNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Account number is required",
        },
        { status: 400 }
      );
    }

    const account: Account = {
      id: body.id || Date.now(), // Sử dụng timestamp nếu không có ID
      accountNumber: body.accountNumber,
      ownerName: body.ownerName || "",
      type: body.type || "",
    };

    await addAccountToSheet(account);

    return NextResponse.json({
      success: true,
      message: "Account added successfully",
      data: account,
    });
  } catch (error: any) {
    console.error("Error adding account:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add account to Google Sheets",
      },
      { status: 500 }
    );
  }
}
