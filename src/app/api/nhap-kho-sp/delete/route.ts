import { NextResponse } from "next/server";
import { deleteNhapKhoSPFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/nhap-kho-sp/delete
 * Xóa một dòng nhập kho SP
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

    const rowNumber = parseInt(id);
    console.log("DELETE nhap-kho-sp - Deleting row number:", rowNumber);

    await deleteNhapKhoSPFromSheet(rowNumber);
    console.log("DELETE nhap-kho-sp - Successfully deleted row:", rowNumber);

    return NextResponse.json({
      success: true,
      message: "Xóa thành công",
    });
  } catch (error: any) {
    console.error("Error deleting nhap kho SP:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể xóa" },
      { status: 500 }
    );
  }
}
