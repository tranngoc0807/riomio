import { NextResponse } from "next/server";
import { deleteDieuChinhGiaVon } from "@/lib/googleSheets";

/**
 * DELETE /api/dieu-chinh-gia-von/delete
 * Xóa điều chỉnh giá vốn
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID là bắt buộc" },
        { status: 400 }
      );
    }

    await deleteDieuChinhGiaVon(parseInt(id, 10));

    return NextResponse.json({
      success: true,
      message: "Xóa điều chỉnh giá vốn thành công",
    });
  } catch (error: any) {
    console.error("Error deleting dieu chinh gia von:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete dieu chinh gia von",
      },
      { status: 500 }
    );
  }
}
