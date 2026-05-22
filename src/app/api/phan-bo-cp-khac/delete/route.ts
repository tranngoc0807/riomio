import { NextRequest, NextResponse } from "next/server";
import { deletePhanBoCPKhacFromSheet, getPhanBoCPKhacFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID để xóa" }, { status: 400 });
    }
    const itemId = parseInt(id);
    const rowIndex = itemId - 1;
    const before = await getPhanBoCPKhacFromSheet();
    const oldRow = before.find((p) => p.id === itemId) ?? null;
    await deletePhanBoCPKhacFromSheet(rowIndex);
    logSheetEdit({
      action: "delete",
      tableKey: "phan-bo-cp-khac",
      sheetName: process.env.GOOGLE_SHEET_NAME_PHAN_BO_CP_KHAC || "Phân bổ CP khác",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa phân bổ chi phí khác thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
