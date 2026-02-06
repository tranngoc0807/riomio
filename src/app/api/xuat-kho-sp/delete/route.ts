import { NextResponse } from "next/server";
import { deleteXuatKhoSPFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/xuat-kho-sp/delete
 * Xóa một dòng xuất kho SP
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID" },
        { status: 400 }
      );
    }

    await deleteXuatKhoSPFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Đã xóa thành công",
    });
  } catch (error: any) {
    console.error("Error deleting xuat kho SP:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể xóa" },
      { status: 500 }
    );
  }
}
