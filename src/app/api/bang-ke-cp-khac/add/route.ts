import { NextRequest, NextResponse } from "next/server";
import { addChiPhiKhacToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ngay, noiDung, chiHoXuong, soChoMa, soTien, phanBo, doiTacVC } = body;
    if (!ngay && !noiDung) {
      return NextResponse.json({ success: false, error: "Vui lòng điền Ngày hoặc Nội dung" }, { status: 400 });
    }
    const newData = {
      ngay: ngay || "",
      noiDung: noiDung || "",
      chiHoXuong: chiHoXuong || "",
      soChoMa: soChoMa || "",
      soTien: parseFloat(soTien) || 0,
      phanBo: phanBo || "",
      doiTacVC: doiTacVC || "",
    };
    await addChiPhiKhacToSheet(newData);
    logSheetEdit({
      action: "add",
      tableKey: "bang-ke-cp-khac",
      sheetName: process.env.GOOGLE_SHEET_NAME_BANG_KE_CP_KHAC || "Bảng kê CP khác",
      newData,
    });
    return NextResponse.json({ success: true, message: "Thêm chi phí khác thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
