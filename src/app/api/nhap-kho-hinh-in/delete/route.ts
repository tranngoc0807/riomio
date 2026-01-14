import { NextRequest, NextResponse } from "next/server";
import { deleteNhapKhoHinhInFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/nhap-kho-hinh-in/delete
 * Xóa nhập kho hình in khỏi Google Sheets
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

    await deleteNhapKhoHinhInFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Xóa nhập kho hình in thành công",
    });
  } catch (error: any) {
    console.error("Error deleting nhap kho hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa nhập kho hình in",
      },
      { status: 500 }
    );
  }
}
