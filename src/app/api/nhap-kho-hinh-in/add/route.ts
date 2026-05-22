import { NextRequest, NextResponse } from "next/server";
import { addNhapKhoHinhInToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.maHinhIn) {
      return NextResponse.json({ success: false, error: "Mã hình in là bắt buộc" }, { status: 400 });
    }
    if (!body.ngayThang) {
      return NextResponse.json({ success: false, error: "Ngày tháng là bắt buộc" }, { status: 400 });
    }
    const nhapKho = {
      maDon: body.maDon || "",
      ngayThang: body.ngayThang || "",
      stt: body.stt != null ? String(body.stt) : "",
      maHinhIn: body.maHinhIn || "",
      kichThuoc: body.kichThuoc || "",
      hinhAnh: body.hinhAnh || "",
      datHI: parseFloat(body.datHI) || 0,
      nhapKhoThucTe: parseFloat(body.nhapKhoThucTe) || 0,
      maSPSuDung: body.maSPSuDung || "",
      xuongIn: body.xuongIn || "",
      nhapKhoMet: parseFloat(body.nhapKhoMet) || 0,
      donGia: parseFloat(body.donGia) || 0,
      ngayNhapKho: body.ngayNhapKho || "",
      ghiChu: body.ghiChu || "",
    };
    await addNhapKhoHinhInToSheet(nhapKho);
    logSheetEdit({
      action: "add",
      tableKey: "nhap-kho-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_NHAP_KHO_HINH_IN || "Nhập kho HI",
      newData: nhapKho,
    });
    return NextResponse.json({ success: true, message: "Thêm nhập kho hình in thành công", data: nhapKho });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
