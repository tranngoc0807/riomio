import { NextRequest, NextResponse } from "next/server";
import { updateYeuCauXuatKhoNPLInSheet, getYeuCauXuatKhoNPLFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(body.id);
    const dinhMuc = parseFloat(body.dinhMuc) || 0;
    const slKHSX = parseFloat(body.slKHSX) || 0;
    const tyLeHaoHut = 0.03;
    const slCanDung = dinhMuc * slKHSX * (1 + tyLeHaoHut);
    const newData = {
      ngayThang: body.ngayThang,
      maPhieuYC: body.maPhieuYC,
      maNPL: body.maNPL,
      dvt: body.dvt,
      dinhMuc,
      tyLeHaoHut,
      slKHSX,
      slCanDung,
      maSPSuDung: body.maSPSuDung,
      mauSac: body.mauSac,
      xuongSX: body.xuongSX,
    };
    const before = await getYeuCauXuatKhoNPLFromSheet();
    const oldRow = before.find((r) => r.id === itemId) ?? null;
    await updateYeuCauXuatKhoNPLInSheet(itemId, newData);
    logSheetEdit({
      action: "update",
      tableKey: "yeu-cau-xuat-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_YEU_CAU_XUAT_KHO_NPL || "Yêu cầu xuất kho NPL",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData,
    });
    return NextResponse.json({ success: true, message: "Cập nhật yêu cầu xuất kho NPL thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
