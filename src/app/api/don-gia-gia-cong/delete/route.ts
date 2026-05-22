import { NextRequest, NextResponse } from "next/server";
import { deleteDonGiaGiaCongFromSheet, getDonGiaGiaCongFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(id);
    const before = await getDonGiaGiaCongFromSheet();
    const oldRow = before.find((d) => d.id === itemId) ?? null;
    await deleteDonGiaGiaCongFromSheet(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: "don-gia-gia-cong",
      sheetName: process.env.GOOGLE_SHEET_NAME_DON_GIA_GIA_CONG || "Đơn giá gia công",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa đơn giá gia công thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
