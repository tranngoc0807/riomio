import { NextRequest, NextResponse } from "next/server";
import { updateXuatKhoHinhInInSheet, XuatKhoHinhIn, getXuatKhoHinhInFromSheet } from "@/lib/googleSheets";
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
    const xuatKho: XuatKhoHinhIn = {
      id: body.id,
      maPhieuXuat: body.maPhieuXuat || "",
      ngayThang: body.ngayThang || "",
      maHinhIn: body.maHinhIn || "",
      hinhAnh: body.hinhAnh || "",
      soLuong: parseFloat(body.soLuong) || 0,
      tonKho: parseFloat(body.tonKho) || 0,
      ghiChu: body.ghiChu || "",
    };
    const before = await getXuatKhoHinhInFromSheet();
    const oldRow = before.find((r) => r.id === xuatKho.id) ?? null;
    await updateXuatKhoHinhInInSheet(xuatKho);
    logSheetEdit({
      action: "update",
      tableKey: "xuat-kho-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_HINH_IN || "Xuất kho HI",
      recordId: xuatKho.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: xuatKho as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Cập nhật xuất kho hình in thành công", data: xuatKho });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
