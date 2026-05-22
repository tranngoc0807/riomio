import { NextRequest, NextResponse } from "next/server";
import { addXuatKhoHinhInToSheet } from "@/lib/googleSheets";
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
    const xuatKho = {
      maPhieuXuat: body.maPhieuXuat || "",
      ngayThang: body.ngayThang || "",
      maHinhIn: body.maHinhIn || "",
      hinhAnh: body.hinhAnh || "",
      soLuong: parseFloat(body.soLuong) || 0,
      tonKho: parseFloat(body.tonKho) || 0,
      ghiChu: body.ghiChu || "",
    };
    await addXuatKhoHinhInToSheet(xuatKho);
    logSheetEdit({
      action: "add",
      tableKey: "xuat-kho-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_HINH_IN || "Xuất kho HI",
      newData: xuatKho,
    });
    return NextResponse.json({ success: true, message: "Thêm xuất kho hình in thành công", data: xuatKho });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
