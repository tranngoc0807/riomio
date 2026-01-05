import { NextRequest, NextResponse } from "next/server";
import { deleteSanPhamFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/san-pham/delete
 * Xóa sản phẩm khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID sản phẩm",
        },
        { status: 400 }
      );
    }

    const sanPhamId = parseInt(id, 10);

    if (isNaN(sanPhamId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID sản phẩm không hợp lệ",
        },
        { status: 400 }
      );
    }

    await deleteSanPhamFromSheet(sanPhamId);

    return NextResponse.json({
      success: true,
      message: "San pham deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting san pham:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete san pham from Google Sheets",
      },
      { status: 500 }
    );
  }
}
