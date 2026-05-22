import { NextRequest, NextResponse } from "next/server";
import { deleteChiPhiKhacFromSheet, getBangKeCPKhacFromSheet } from "@/lib/googleSheets";
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
    const before = await getBangKeCPKhacFromSheet();
    const oldRow = before.chiPhiKhac.find((c) => c.id === itemId) ?? null;
    await deleteChiPhiKhacFromSheet(rowIndex);
    logSheetEdit({
      action: "delete",
      tableKey: "bang-ke-cp-khac",
      sheetName: process.env.GOOGLE_SHEET_NAME_BANG_KE_CP_KHAC || "Bảng kê CP khác",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa chi phí khác thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
