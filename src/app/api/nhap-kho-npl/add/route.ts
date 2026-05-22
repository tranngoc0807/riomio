import { NextResponse } from "next/server";
import { addNhapKhoNPLToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maPNKNPL, ngayThang, nguoiNhap, noiDung, maNPL, ncc, dvt, soLuong, donGiaSauThue, ghiChu } = body;
    if (!maPNKNPL || !maNPL) {
      return NextResponse.json({ success: false, error: "Mã PNKNPL và Mã NPL không được để trống" }, { status: 400 });
    }
    const newData = {
      maPNKNPL,
      ngayThang: ngayThang || "",
      nguoiNhap: nguoiNhap || "",
      noiDung: noiDung || "",
      maNPL,
      ncc: ncc || "",
      dvt: dvt || "",
      soLuong: parseFloat(soLuong) || 0,
      donGiaSauThue: parseFloat(donGiaSauThue) || 0,
      ghiChu: ghiChu || "",
    };
    await addNhapKhoNPLToSheet(newData);
    logSheetEdit({
      action: "add",
      tableKey: "nhap-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_NHAP_KHO_NPL || "Nhập kho NPL",
      newData,
    });
    return NextResponse.json({ success: true, message: "Thêm nhập kho NPL thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
