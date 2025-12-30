import { NextRequest, NextResponse } from "next/server";
import { deleteSalesProgramFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/programs/delete?id=123
 * Xóa chương trình bán hàng khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Program ID is required",
        },
        { status: 400 }
      );
    }

    await deleteSalesProgramFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Sales program deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting program:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete program from Google Sheets",
      },
      { status: 500 }
    );
  }
}
