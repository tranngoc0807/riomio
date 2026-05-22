import { NextResponse } from "next/server";
import { deleteXuatKhoSPFromSheet, getXuatKhoSPFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

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

    const rowIdx = parseInt(id);
    const before = await getXuatKhoSPFromSheet();
    const oldRow = before.find((r) => r.id === rowIdx) ?? null;

    await deleteXuatKhoSPFromSheet(rowIdx);

    logSheetEdit({
      action: "delete",
      tableKey: "xuat-kho-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_SP || "Xuất kho SP",
      rowIndex: rowIdx,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });

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
