import { NextResponse } from "next/server";
import { deleteMaSPFromSheet, getMaSPFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");
    if (rowIndex === null || parseInt(rowIndex) < 0) {
      return NextResponse.json({ success: false, error: "Vị trí dòng không hợp lệ" }, { status: 400 });
    }
    const rowIdx = parseInt(rowIndex);
    const before = await getMaSPFromSheet();
    const oldRow = before[rowIdx] ?? null;
    await deleteMaSPFromSheet(rowIdx);
    logSheetEdit({
      action: "delete",
      tableKey: "ma-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_MA_SP || "Mã SP",
      rowIndex: rowIdx,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xoá mã sản phẩm thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
