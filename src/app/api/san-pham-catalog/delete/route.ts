import { NextRequest, NextResponse } from "next/server";
import { deleteSanPhamCatalogFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/san-pham-catalog/delete
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

    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID sản phẩm không hợp lệ",
        },
        { status: 400 }
      );
    }

    await deleteSanPhamCatalogFromSheet(productId);

    return NextResponse.json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error: any) {
    console.error("Error deleting san pham catalog:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa sản phẩm khỏi Google Sheets",
      },
      { status: 500 }
    );
  }
}
