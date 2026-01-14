import { NextRequest, NextResponse } from "next/server";
import { deleteDonGiaGiaCongFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/don-gia-gia-cong/delete
 * Xóa đơn giá gia công khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Validate dữ liệu
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID là bắt buộc",
        },
        { status: 400 }
      );
    }

    await deleteDonGiaGiaCongFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Xóa đơn giá gia công thành công",
    });
  } catch (error: any) {
    console.error("Error deleting don gia gia cong:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa đơn giá gia công",
      },
      { status: 500 }
    );
  }
}
