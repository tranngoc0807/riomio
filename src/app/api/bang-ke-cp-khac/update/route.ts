import { NextRequest, NextResponse } from "next/server";
import { updateChiPhiKhacInSheet, getBangKeCPKhacFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ngay, noiDung, chiHoXuong, soChoMa, soTien, phanBo, doiTacVC } = body;
    if (id === undefined || id === null) {
      return NextResponse.json({ success: false, error: "Thiếu ID để cập nhật" }, { status: 400 });
    }
    const itemId = typeof id === "number" ? id : parseInt(id);
    const rowIndex = itemId - 1;
    const newData = {
      ngay: ngay || "",
      noiDung: noiDung || "",
      chiHoXuong: chiHoXuong || "",
      soChoMa: soChoMa || "",
      soTien: parseFloat(soTien) || 0,
      phanBo: phanBo || "",
      doiTacVC: doiTacVC || "",
    };
    const before = await getBangKeCPKhacFromSheet();
    const oldRow = before.chiPhiKhac.find((c) => c.id === itemId) ?? null;
    await updateChiPhiKhacInSheet(rowIndex, newData);
    logSheetEdit({
      action: "update",
      tableKey: "bang-ke-cp-khac",
      sheetName: process.env.GOOGLE_SHEET_NAME_BANG_KE_CP_KHAC || "Bảng kê CP khác",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData,
    });
    return NextResponse.json({ success: true, message: "Cập nhật chi phí khác thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
