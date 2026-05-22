import { NextResponse } from "next/server";
import { updateNhapKhoNPLInSheet, getNhapKhoNPLFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, id, ...data } = body;
    const effectiveRowIndex =
      typeof rowIndex === "number" ? rowIndex : typeof id === "number" ? id - 1 : undefined;
    if (effectiveRowIndex === undefined || effectiveRowIndex < 0) {
      return NextResponse.json({ success: false, error: "Vị trí dòng không hợp lệ" }, { status: 400 });
    }
    const before = await getNhapKhoNPLFromSheet();
    const oldRow = before[effectiveRowIndex] ?? null;
    await updateNhapKhoNPLInSheet(effectiveRowIndex, data);
    logSheetEdit({
      action: "update",
      tableKey: "nhap-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_NHAP_KHO_NPL || "Nhập kho NPL",
      rowIndex: effectiveRowIndex,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: data,
    });
    return NextResponse.json({ success: true, message: "Cập nhật nhập kho NPL thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
