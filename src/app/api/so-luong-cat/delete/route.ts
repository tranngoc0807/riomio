import { NextRequest, NextResponse } from "next/server";
import { deleteSoLuongCatFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/so-luong-cat/delete
 * Xóa số lượng cắt trong Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID là bắt buộc",
        },
        { status: 400 }
      );
    }

    await deleteSoLuongCatFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Xóa số lượng cắt thành công",
    });
  } catch (error: any) {
    console.error("Error deleting so luong cat:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa số lượng cắt",
      },
      { status: 500 }
    );
  }
}
