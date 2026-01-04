import { NextRequest, NextResponse } from "next/server";
import { deleteKeHoachSXFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/ke-hoach-sx/delete
 * Xóa kế hoạch sản xuất khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID kế hoạch sản xuất",
        },
        { status: 400 }
      );
    }

    const keHoachId = parseInt(id, 10);

    if (isNaN(keHoachId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID kế hoạch sản xuất không hợp lệ",
        },
        { status: 400 }
      );
    }

    await deleteKeHoachSXFromSheet(keHoachId);

    return NextResponse.json({
      success: true,
      message: "Ke hoach SX deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting ke hoach SX:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete ke hoach SX from Google Sheets",
      },
      { status: 500 }
    );
  }
}
