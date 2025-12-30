import { NextRequest, NextResponse } from "next/server";
import { deleteAccountFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/accounts/delete?id=123
 * Xóa tài khoản khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Account ID is required",
        },
        { status: 400 }
      );
    }

    await deleteAccountFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting account:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete account from Google Sheets",
      },
      { status: 500 }
    );
  }
}
