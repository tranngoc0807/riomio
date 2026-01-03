import { NextRequest, NextResponse } from "next/server";
import { deleteThuChiFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/thu-chi/delete
 * Xóa thu chi khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID thu chi",
        },
        { status: 400 }
      );
    }

    const thuChiId = parseInt(id, 10);

    if (isNaN(thuChiId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID thu chi không hợp lệ",
        },
        { status: 400 }
      );
    }

    await deleteThuChiFromSheet(thuChiId);

    return NextResponse.json({
      success: true,
      message: "Thu chi deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting thu chi:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete thu chi from Google Sheets",
      },
      { status: 500 }
    );
  }
}
