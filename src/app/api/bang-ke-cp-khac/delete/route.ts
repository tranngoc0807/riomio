import { NextRequest, NextResponse } from "next/server";
import { deleteChiPhiKhacFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/bang-ke-cp-khac/delete
 * Xóa chi phí khác khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID để xóa",
        },
        { status: 400 }
      );
    }

    // id is 1-based from the data, convert to 0-based rowIndex
    const rowIndex = parseInt(id) - 1;

    await deleteChiPhiKhacFromSheet(rowIndex);

    return NextResponse.json({
      success: true,
      message: "Xóa chi phí khác thành công",
    });
  } catch (error: any) {
    console.error("Error deleting chi phi khac:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa chi phí khác",
      },
      { status: 500 }
    );
  }
}
