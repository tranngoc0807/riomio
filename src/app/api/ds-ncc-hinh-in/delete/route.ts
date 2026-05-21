import { NextRequest, NextResponse } from "next/server";
import { deleteDSNCCHinhInFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/ds-ncc-hinh-in/delete?id=...
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID là bắt buộc" },
        { status: 400 },
      );
    }

    await deleteDSNCCHinhInFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Xóa NCC hình in thành công",
    });
  } catch (error: any) {
    console.error("Error deleting DS NCC hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa NCC hình in",
      },
      { status: 500 },
    );
  }
}
