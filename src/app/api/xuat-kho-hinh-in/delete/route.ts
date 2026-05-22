import { NextRequest, NextResponse } from "next/server";
import { deleteXuatKhoHinhInFromSheet, getXuatKhoHinhInFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    // Accept id from query OR body
    const url = new URL(request.url);
    let id: string | null = url.searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id ? String(body.id) : null;
      } catch {}
    }
    if (!id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(id);
    const before = await getXuatKhoHinhInFromSheet();
    const oldRow = before.find((r) => r.id === itemId) ?? null;
    await deleteXuatKhoHinhInFromSheet(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: "xuat-kho-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_HINH_IN || "Xuất kho HI",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa xuất kho hình in thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
