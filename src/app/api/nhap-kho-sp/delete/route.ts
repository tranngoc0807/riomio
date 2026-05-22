import { NextResponse } from "next/server";
import { deleteNhapKhoSPFromSheet, getNhapKhoSPFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

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
    const before = await getNhapKhoSPFromSheet();
    const oldRow = before.find((r) => r.id === rowNumber) ?? null;

    await deleteNhapKhoSPFromSheet(rowNumber);

    logSheetEdit({
      action: "delete",
      tableKey: "nhap-kho-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_NHAP_KHO_SP_RIOMIO || "Nhập kho SP",
      rowIndex: rowNumber,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });

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
