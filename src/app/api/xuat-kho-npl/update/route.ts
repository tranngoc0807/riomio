import { NextRequest, NextResponse } from "next/server";
import { updateXuatKhoNPLInSheet, getXuatKhoNPLFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const newData = {
      soLuong: body.soLuong,
      donGia: body.donGia,
      loaiChiPhi: body.loaiChiPhi,
      ghiChu: body.ghiChu,
    };
    const before = await getXuatKhoNPLFromSheet();
    const oldRow = before.find((r) => r.id === body.id) ?? null;
    await updateXuatKhoNPLInSheet(body.id, newData);
    logSheetEdit({
      action: "update",
      tableKey: "xuat-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_NPL || "Xuất kho NPL",
      recordId: body.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData,
    });
    return NextResponse.json({ success: true, message: "Cập nhật xuất kho NPL thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
