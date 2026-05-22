import { NextResponse } from "next/server";
import { updateChiTietMaSPInSheet, getChiTietMaSPFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { maSP, ...data } = body;
    if (!maSP) {
      return NextResponse.json({ success: false, error: "Mã sản phẩm không được để trống" }, { status: 400 });
    }
    const before = await getChiTietMaSPFromSheet();
    await updateChiTietMaSPInSheet(maSP, data);
    logSheetEdit({
      action: "update",
      tableKey: "chi-tiet-ma-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_CHI_TIET_MA_SP || "Chi tiết Mã SP",
      oldData: before as unknown as Record<string, unknown> | null,
      newData: { maSP, ...data },
    });
    return NextResponse.json({ success: true, message: "Cập nhật chi tiết mã sản phẩm thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
