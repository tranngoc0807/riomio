import { NextRequest, NextResponse } from "next/server";
import { deleteDanhMucHinhInFromSheet, getDanhMucHinhInFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(id);
    const before = await getDanhMucHinhInFromSheet();
    const oldRow = before.find((d) => d.id === itemId) ?? null;
    await deleteDanhMucHinhInFromSheet(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: "danh-muc-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_DANH_MUC_HINH_IN || "Danh mục HI",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa danh mục hình in thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
