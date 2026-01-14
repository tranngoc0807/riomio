import { NextResponse } from "next/server";
import { deleteNhapKhoNPLFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/nhap-kho-npl/delete
 * Xoá nhập kho NPL
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

    await deleteNhapKhoNPLFromSheet(parseInt(rowIndex));

    return NextResponse.json({
      success: true,
      message: "Xoá nhập kho NPL thành công",
    });
  } catch (error: any) {
    console.error("Error deleting nhap kho NPL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xoá nhập kho NPL",
      },
      { status: 500 }
    );
  }
}
