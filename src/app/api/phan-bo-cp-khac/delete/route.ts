import { NextRequest, NextResponse } from "next/server";
import { deletePhanBoCPKhacFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/phan-bo-cp-khac/delete
 * Xóa phân bổ chi phí khác khỏi Google Sheets
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

    await deletePhanBoCPKhacFromSheet(rowIndex);

    return NextResponse.json({
      success: true,
      message: "Xóa phân bổ chi phí khác thành công",
    });
  } catch (error: any) {
    console.error("Error deleting phan bo cp khac:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa phân bổ chi phí khác",
      },
      { status: 500 }
    );
  }
}
