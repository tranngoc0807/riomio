import { NextResponse } from "next/server";
import { addDieuChinhGiaVon } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maSP, dieuChinhGiaVon, ghiChu } = body;
    if (!maSP) {
      return NextResponse.json({ success: false, error: "Mã SP là bắt buộc" }, { status: 400 });
    }
    await addDieuChinhGiaVon(maSP, dieuChinhGiaVon || 0, ghiChu || "");
    logSheetEdit({
      action: "add",
      tableKey: "dieu-chinh-gia-von",
      sheetName: process.env.GOOGLE_SHEET_NAME_DIEU_CHINH_GIA_VON || "Điều chỉnh giá vốn",
      newData: { maSP, dieuChinhGiaVon: dieuChinhGiaVon || 0, ghiChu: ghiChu || "" },
    });
    return NextResponse.json({ success: true, message: "Thêm điều chỉnh giá vốn thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
