import { NextRequest, NextResponse } from "next/server";
import { deleteSoLuongCatFromSheet, getSoLuongCatFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(id);
    const before = await getSoLuongCatFromSheet();
    const oldRow = before.find((s) => s.id === itemId) ?? null;
    await deleteSoLuongCatFromSheet(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: "so-luong-cat",
      sheetName: process.env.GOOGLE_SHEET_NAME_SO_LUONG_CAT || "Số lượng cắt",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa số lượng cắt thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
