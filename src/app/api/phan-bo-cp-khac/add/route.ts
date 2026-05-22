import { NextRequest, NextResponse } from "next/server";
import { addPhanBoCPKhacToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ngayThang, nguoiNhap, maPhieu, noiDung, maSP, soTien, loaiChiPhi } = body;
    if (!ngayThang && !maPhieu) {
      return NextResponse.json({ success: false, error: "Vui lòng điền Ngày tháng hoặc Mã phiếu" }, { status: 400 });
    }
    const newData = {
      ngayThang: ngayThang || "",
      nguoiNhap: nguoiNhap || "",
      maPhieu: maPhieu || "",
      noiDung: noiDung || "",
      maSP: maSP || "",
      soTien: parseFloat(soTien) || 0,
      loaiChiPhi: loaiChiPhi || "",
    };
    await addPhanBoCPKhacToSheet(newData);
    logSheetEdit({
      action: "add",
      tableKey: "phan-bo-cp-khac",
      sheetName: process.env.GOOGLE_SHEET_NAME_PHAN_BO_CP_KHAC || "Phân bổ CP khác",
      newData,
    });
    return NextResponse.json({ success: true, message: "Thêm phân bổ chi phí khác thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
