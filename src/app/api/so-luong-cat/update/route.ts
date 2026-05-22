import { NextRequest, NextResponse } from "next/server";
import { updateSoLuongCatInSheet, getSoLuongCatFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(body.id);
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
    const before = await getSoLuongCatFromSheet();
    const oldRow = before.find((s) => s.id === itemId) ?? null;
    await updateSoLuongCatInSheet(itemId, newData);
    logSheetEdit({
      action: "update",
      tableKey: "so-luong-cat",
      sheetName: process.env.GOOGLE_SHEET_NAME_SO_LUONG_CAT || "Số lượng cắt",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData,
    });
    return NextResponse.json({ success: true, message: "Cập nhật số lượng cắt thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
