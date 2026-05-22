import { NextRequest, NextResponse } from "next/server";
import { addXuatKhoNPLToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.maPhieu || !body.maNPL) {
      return NextResponse.json({ success: false, error: "Vui lòng điền đầy đủ Mã phiếu và Mã NPL" }, { status: 400 });
    }
    const xuatKhoData = {
      maPhieu: body.maPhieu,
      ngayThang: body.ngayThang || "",
      nguoiNhap: body.nguoiNhap || "",
      noiDung: body.noiDung || "",
      maSP: body.maSP || "",
      lenhSX: body.lenhSX || "",
      xuongSX: body.xuongSX || "",
      maNPL: body.maNPL,
      dvt: body.dvt || "",
      soLuong: body.soLuong || 0,
      donGia: body.donGia || 0,
      thanhTien: body.thanhTien || 0,
      loaiChiPhi: body.loaiChiPhi || "",
      ghiChu: body.ghiChu || "",
      tonThucTe: body.tonThucTe || 0,
    };
    await addXuatKhoNPLToSheet(xuatKhoData);
    logSheetEdit({
      action: "add",
      tableKey: "xuat-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_NPL || "Xuất kho NPL",
      newData: xuatKhoData,
    });
    return NextResponse.json({ success: true, message: "Xuất kho NPL added", data: xuatKhoData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
