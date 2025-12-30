import { NextRequest, NextResponse } from "next/server";
import { updateAccountInSheet, Account } from "@/lib/googleSheets";

/**
 * PUT /api/accounts/update
 * Cập nhật thông tin tài khoản trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Account ID is required",
        },
        { status: 400 }
      );
    }

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
      id: body.id,
      accountNumber: body.accountNumber,
      ownerName: body.ownerName || "",
      type: body.type || "",
    };

    await updateAccountInSheet(account);

    return NextResponse.json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error: any) {
    console.error("Error updating account:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update account in Google Sheets",
      },
      { status: 500 }
    );
  }
}
