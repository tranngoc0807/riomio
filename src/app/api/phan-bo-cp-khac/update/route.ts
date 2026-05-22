import { NextRequest, NextResponse } from "next/server";
import { updatePhanBoCPKhacInSheet, getPhanBoCPKhacFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ngayThang, nguoiNhap, maPhieu, noiDung, maSP, soTien, loaiChiPhi } = body;
    if (id === undefined || id === null) {
      return NextResponse.json({ success: false, error: "Thiếu ID để cập nhật" }, { status: 400 });
    }
    const itemId = typeof id === "number" ? id : parseInt(id);
    const rowIndex = itemId - 1;
    const newData = {
      ngayThang: ngayThang || "",
      nguoiNhap: nguoiNhap || "",
      maPhieu: maPhieu || "",
      noiDung: noiDung || "",
      maSP: maSP || "",
      soTien: parseFloat(soTien) || 0,
      loaiChiPhi: loaiChiPhi || "",
    };
    const before = await getPhanBoCPKhacFromSheet();
    const oldRow = before.find((p) => p.id === itemId) ?? null;
    await updatePhanBoCPKhacInSheet(rowIndex, newData);
    logSheetEdit({
      action: "update",
      tableKey: "phan-bo-cp-khac",
      sheetName: process.env.GOOGLE_SHEET_NAME_PHAN_BO_CP_KHAC || "Phân bổ CP khác",
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData,
    });
    return NextResponse.json({ success: true, message: "Cập nhật phân bổ chi phí khác thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
