import { NextRequest, NextResponse } from "next/server";
import { updateDonGiaGiaCongInSheet, DonGiaGiaCong, getDonGiaGiaCongFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    if (!body.maSPNhapKho && !body.maSP) {
      return NextResponse.json({ success: false, error: "Mã SP nhập kho hoặc Mã SP là bắt buộc" }, { status: 400 });
    }
    const donGia: DonGiaGiaCong = {
      id: body.id,
      maSPNhapKho: body.maSPNhapKho || "",
      maSP: body.maSP || "",
      mucLucSX: body.mucLucSX || "",
      xuongSX: body.xuongSX || "",
      noiDungKhac: body.noiDungKhac || "",
      donGia: parseFloat(body.donGia) || 0,
      nguoiNhap: body.nguoiNhap || "",
      ghiChu: body.ghiChu || "",
    };
    const before = await getDonGiaGiaCongFromSheet();
    const oldRow = before.find((d) => d.id === donGia.id) ?? null;
    await updateDonGiaGiaCongInSheet(donGia);
    logSheetEdit({
      action: "update",
      tableKey: "don-gia-gia-cong",
      sheetName: process.env.GOOGLE_SHEET_NAME_DON_GIA_GIA_CONG || "Đơn giá gia công",
      recordId: donGia.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: donGia as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Cập nhật đơn giá gia công thành công", data: donGia });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
