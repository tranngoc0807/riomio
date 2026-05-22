import { NextRequest, NextResponse } from "next/server";
import { updateNhapKhoHinhInInSheet, NhapKhoHinhIn, getNhapKhoHinhInFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    if (!body.maHinhIn) {
      return NextResponse.json({ success: false, error: "Mã hình in là bắt buộc" }, { status: 400 });
    }
    if (!body.ngayThang) {
      return NextResponse.json({ success: false, error: "Ngày tháng là bắt buộc" }, { status: 400 });
    }
    const nhapKhoMet = parseFloat(body.nhapKhoMet) || 0;
    const donGia = parseFloat(body.donGia) || 0;
    const nhapKho: NhapKhoHinhIn = {
      id: body.id,
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
      nhapKhoMet,
      donGia,
      thanhTien: nhapKhoMet * donGia,
      ngayNhapKho: body.ngayNhapKho || "",
      ghiChu: body.ghiChu || "",
    };
    const before = await getNhapKhoHinhInFromSheet();
    const oldRow = before.find((r) => r.id === nhapKho.id) ?? null;
    await updateNhapKhoHinhInInSheet(nhapKho);
    logSheetEdit({
      action: "update",
      tableKey: "nhap-kho-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_NHAP_KHO_HINH_IN || "Nhập kho HI",
      recordId: nhapKho.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: nhapKho as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Cập nhật nhập kho hình in thành công", data: nhapKho });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
