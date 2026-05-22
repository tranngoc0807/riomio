import { NextRequest, NextResponse } from "next/server";
import { deleteYeuCauXuatKhoNPLFromSheet, getYeuCauXuatKhoNPLFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(body.id);
    const before = await getYeuCauXuatKhoNPLFromSheet();
    const oldRow = before.find((r) => r.id === itemId) ?? null;
    await deleteYeuCauXuatKhoNPLFromSheet(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: "yeu-cau-xuat-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_YEU_CAU_XUAT_KHO_NPL || "Yêu cầu xuất kho NPL",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa yêu cầu xuất kho NPL thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
