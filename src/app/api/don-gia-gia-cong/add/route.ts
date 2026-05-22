import { NextRequest, NextResponse } from "next/server";
import { addDonGiaGiaCongToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.maSPNhapKho && !body.maSP) {
      return NextResponse.json({ success: false, error: "Mã SP nhập kho hoặc Mã SP là bắt buộc" }, { status: 400 });
    }
    const donGia = {
      maSPNhapKho: body.maSPNhapKho || "",
      maSP: body.maSP || "",
      mucLucSX: body.mucLucSX || "",
      xuongSX: body.xuongSX || "",
      noiDungKhac: body.noiDungKhac || "",
      donGia: parseFloat(body.donGia) || 0,
      nguoiNhap: body.nguoiNhap || "",
      ghiChu: body.ghiChu || "",
    };
    await addDonGiaGiaCongToSheet(donGia);
    logSheetEdit({
      action: "add",
      tableKey: "don-gia-gia-cong",
      sheetName: process.env.GOOGLE_SHEET_NAME_DON_GIA_GIA_CONG || "Đơn giá gia công",
      newData: donGia,
    });
    return NextResponse.json({ success: true, message: "Thêm đơn giá gia công thành công", data: donGia });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
