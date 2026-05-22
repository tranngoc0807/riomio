import { NextRequest, NextResponse } from "next/server";
import { updateTonKhoNPLNgaySoLuong } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, soLuong } = body;
    if (!id || soLuong === undefined) {
      return NextResponse.json({ success: false, error: "ID và số lượng là bắt buộc" }, { status: 400 });
    }
    const itemId = parseInt(id);
    const newSoLuong = parseFloat(soLuong);
    await updateTonKhoNPLNgaySoLuong(itemId, newSoLuong);
    logSheetEdit({
      action: "update",
      tableKey: "ton-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_TON_KHO_NPL || "Tồn kho NPL kho công ty",
      recordId: itemId,
      newData: { soLuong: newSoLuong },
    });
    return NextResponse.json({ success: true, message: "Cập nhật số lượng thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
