import { NextResponse } from "next/server";
import { deleteNhapKhoNPLFromSheet, getNhapKhoNPLFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndexParam = searchParams.get("rowIndex");
    const idParam = searchParams.get("id");
    let effectiveRowIndex: number | null = null;
    if (rowIndexParam !== null) {
      effectiveRowIndex = parseInt(rowIndexParam);
    } else if (idParam !== null) {
      const id = parseInt(idParam);
      if (!isNaN(id)) effectiveRowIndex = id - 1;
    }
    if (effectiveRowIndex === null || isNaN(effectiveRowIndex) || effectiveRowIndex < 0) {
      return NextResponse.json({ success: false, error: "Vị trí dòng không hợp lệ" }, { status: 400 });
    }
    const before = await getNhapKhoNPLFromSheet();
    const oldRow = before[effectiveRowIndex] ?? null;
    await deleteNhapKhoNPLFromSheet(effectiveRowIndex);
    logSheetEdit({
      action: "delete",
      tableKey: "nhap-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_NHAP_KHO_NPL || "Nhập kho NPL",
      rowIndex: effectiveRowIndex,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xoá nhập kho NPL thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
