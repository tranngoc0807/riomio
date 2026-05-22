import { NextResponse } from "next/server";
import { addMaSPToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maSP, tenSP, size, vaiChinh, vaiPhoi, phuLieuKhac, lenhSX, xuongSX } = body;
    if (!maSP) {
      return NextResponse.json({ success: false, error: "Mã sản phẩm không được để trống" }, { status: 400 });
    }
    const newData = {
      maSP,
      tenSP: tenSP || "",
      size: size || "",
      vaiChinh: vaiChinh || "",
      vaiPhoi: vaiPhoi || "",
      phuLieuKhac: phuLieuKhac || "",
      lenhSX: lenhSX || "",
      xuongSX: xuongSX || "",
    };
    await addMaSPToSheet(newData);
    logSheetEdit({
      action: "add",
      tableKey: "ma-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_MA_SP || "Mã SP",
      newData,
    });
    return NextResponse.json({ success: true, message: "Thêm mã sản phẩm thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
