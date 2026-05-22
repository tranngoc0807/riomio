import { NextResponse } from "next/server";
import { addBangKeGiaCongToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maPGC, ngayThang, maSPSX, maSP, xuongSX, soLuong, donGia, phanLoai, doiSoat, ghiChu } = body;
    if (!maPGC || !maSPSX) {
      return NextResponse.json({ success: false, error: "Mã PGC và Mã SP SX không được để trống" }, { status: 400 });
    }
    const newData = {
      maPGC,
      ngayThang: ngayThang || "",
      maSPSX,
      maSP: maSP || "",
      xuongSX: xuongSX || "",
      soLuong: parseFloat(soLuong) || 0,
      donGia: parseFloat(donGia) || 0,
      phanLoai: phanLoai || "",
      doiSoat: doiSoat || "",
      ghiChu: ghiChu || "",
    };
    await addBangKeGiaCongToSheet(newData);
    logSheetEdit({
      action: "add",
      tableKey: "bang-ke-gia-cong",
      sheetName: process.env.GOOGLE_SHEET_NAME_BANG_KE_GIA_CONG || "Bảng kê gia công",
      newData,
    });
    return NextResponse.json({ success: true, message: "Thêm bảng kê gia công thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
