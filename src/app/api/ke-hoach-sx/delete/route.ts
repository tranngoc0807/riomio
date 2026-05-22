import { NextRequest, NextResponse } from "next/server";
import { deleteKeHoachSXFromSheet, getKeHoachSXFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID kế hoạch sản xuất" }, { status: 400 });
    }
    const itemId = parseInt(id);
    const before = await getKeHoachSXFromSheet();
    const oldRow = before.find((k) => k.id === itemId) ?? null;
    await deleteKeHoachSXFromSheet(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: "ke-hoach-sx",
      sheetName: process.env.GOOGLE_SHEET_NAME_KE_HOACH_SAN_XUAT || "LSX",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Ke hoach SX deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
