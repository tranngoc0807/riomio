import { NextRequest, NextResponse } from "next/server";
import { addDanhMucHinhInToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.maHinhIn) {
      return NextResponse.json({ success: false, error: "Mã hình in là bắt buộc" }, { status: 400 });
    }
    const danhMuc = {
      maHinhIn: body.maHinhIn || "",
      thongTinHinhIn: body.thongTinHinhIn || "",
      hinhAnh: body.hinhAnh || "",
      anhMinhHoa: body.anhMinhHoa || "",
      maSPSuDung: body.maSPSuDung || "",
      tonKho: parseFloat(body.tonKho) || 0,
    };
    await addDanhMucHinhInToSheet(danhMuc);
    logSheetEdit({
      action: "add",
      tableKey: "danh-muc-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_DANH_MUC_HINH_IN || "Danh mục HI",
      newData: danhMuc,
    });
    return NextResponse.json({ success: true, message: "Thêm danh mục hình in thành công", data: danhMuc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
