import { NextRequest, NextResponse } from "next/server";
import { deleteDanhMucHinhInFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/danh-muc-hinh-in/delete
 * Xóa danh mục hình in khỏi Google Sheets
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

    await deleteDanhMucHinhInFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Xóa danh mục hình in thành công",
    });
  } catch (error: any) {
    console.error("Error deleting danh muc hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa danh mục hình in",
      },
      { status: 500 }
    );
  }
}
