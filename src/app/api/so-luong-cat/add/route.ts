import { NextRequest, NextResponse } from "next/server";
import { addSoLuongCatToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.maPhieuCat && !body.maSP) {
      return NextResponse.json({ success: false, error: "Mã phiếu cắt hoặc mã SP là bắt buộc" }, { status: 400 });
    }
    const soLuongKeHoach = parseFloat(body.soLuongKeHoach) || 0;
    const soLuongCat = parseFloat(body.soLuongCat) || 0;
    const soLuongNhapKho = parseFloat(body.soLuongNhapKho) || 0;
    const newData = {
      maPhieuCat: body.maPhieuCat || "",
      maSP: body.maSP || "",
      lenhSanXuat: body.lenhSanXuat || "",
      xuongSanXuat: body.xuongSanXuat || "",
      mauSac: body.mauSac || "",
      soLuongKeHoach,
      ngayCat: body.ngayCat || "",
      soLuongCat,
      slCatTruSlKH: soLuongCat - soLuongKeHoach,
      tiLeCacMau: body.tiLeCacMau || "",
      nguyenNhan1: body.nguyenNhan1 || "",
      soLuongNhapKho,
      slNKTruSlCat: soLuongNhapKho - soLuongCat,
      nguyenNhan2: body.nguyenNhan2 || "",
      ghiChu: body.ghiChu || "",
    };
    await addSoLuongCatToSheet(newData);
    logSheetEdit({
      action: "add",
      tableKey: "so-luong-cat",
      sheetName: process.env.GOOGLE_SHEET_NAME_SO_LUONG_CAT || "Số lượng cắt",
      newData,
    });
    return NextResponse.json({ success: true, message: "Thêm số lượng cắt thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
