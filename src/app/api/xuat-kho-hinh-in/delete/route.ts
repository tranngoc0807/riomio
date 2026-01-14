import { NextRequest, NextResponse } from "next/server";
import { deleteXuatKhoHinhInFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/xuat-kho-hinh-in/delete
 * Xóa xuất kho hình in từ Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID là bắt buộc",
        },
        { status: 400 }
      );
    }

    await deleteXuatKhoHinhInFromSheet(body.id);

    return NextResponse.json({
      success: true,
      message: "Xóa xuất kho hình in thành công",
    });
  } catch (error: any) {
    console.error("Error deleting xuat kho hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa xuất kho hình in",
      },
      { status: 500 }
    );
  }
}
