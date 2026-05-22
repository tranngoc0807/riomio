import { NextResponse } from "next/server";
import { updateDieuChinhGiaVon, getDieuChinhGiaVonFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, maSP, dieuChinhGiaVon, ghiChu } = body;
    if (!id || !maSP) {
      return NextResponse.json({ success: false, error: "ID và Mã SP là bắt buộc" }, { status: 400 });
    }
    const itemId = typeof id === "number" ? id : parseInt(id);
    const before = await getDieuChinhGiaVonFromSheet();
    const oldRow = before.find((d) => d.id === itemId) ?? null;
    await updateDieuChinhGiaVon(id, maSP, dieuChinhGiaVon || 0, ghiChu || "");
    logSheetEdit({
      action: "update",
      tableKey: "dieu-chinh-gia-von",
      sheetName: process.env.GOOGLE_SHEET_NAME_DIEU_CHINH_GIA_VON || "Điều chỉnh giá vốn",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: { maSP, dieuChinhGiaVon: dieuChinhGiaVon || 0, ghiChu: ghiChu || "" },
    });
    return NextResponse.json({ success: true, message: "Cập nhật điều chỉnh giá vốn thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
