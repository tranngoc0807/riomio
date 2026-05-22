import { NextResponse } from "next/server";
import { deleteDieuChinhGiaVon, getDieuChinhGiaVonFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(id, 10);
    const before = await getDieuChinhGiaVonFromSheet();
    const oldRow = before.find((d) => d.id === itemId) ?? null;
    await deleteDieuChinhGiaVon(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: "dieu-chinh-gia-von",
      sheetName: process.env.GOOGLE_SHEET_NAME_DIEU_CHINH_GIA_VON || "Điều chỉnh giá vốn",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa điều chỉnh giá vốn thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
