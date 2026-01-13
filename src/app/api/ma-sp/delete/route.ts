import { NextResponse } from "next/server";
import { deleteMaSPFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/ma-sp/delete
 * Xoá mã sản phẩm
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");

    if (rowIndex === null || parseInt(rowIndex) < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vị trí dòng không hợp lệ",
        },
        { status: 400 }
      );
    }

    await deleteMaSPFromSheet(parseInt(rowIndex));

    return NextResponse.json({
      success: true,
      message: "Xoá mã sản phẩm thành công",
    });
  } catch (error: any) {
    console.error("Error deleting ma sp:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xoá mã sản phẩm",
      },
      { status: 500 }
    );
  }
}
