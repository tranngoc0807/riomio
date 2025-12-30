import { NextRequest, NextResponse } from "next/server";
import { deleteLoanFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/loans/delete?id=123
 * Xóa khoản vay khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Loan ID is required",
        },
        { status: 400 }
      );
    }

    // id is the loan code (e.g., "MV01", "MV02", etc.)
    await deleteLoanFromSheet(id);

    return NextResponse.json({
      success: true,
      message: "Loan deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting loan:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete loan from Google Sheets",
      },
      { status: 500 }
    );
  }
}
