import { NextRequest, NextResponse } from "next/server";
import { deleteNhapKhoHinhInFromSheet, getNhapKhoHinhInFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(id);
    const before = await getNhapKhoHinhInFromSheet();
    const oldRow = before.find((r) => r.id === itemId) ?? null;
    await deleteNhapKhoHinhInFromSheet(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: "nhap-kho-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_NHAP_KHO_HINH_IN || "Nhập kho HI",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa nhập kho hình in thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
