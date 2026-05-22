import { NextRequest, NextResponse } from "next/server";
import { updateDanhMucHinhInInSheet, DanhMucHinhIn, getDanhMucHinhInFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    if (!body.maHinhIn) {
      return NextResponse.json({ success: false, error: "Mã hình in là bắt buộc" }, { status: 400 });
    }
    const danhMuc: DanhMucHinhIn = {
      id: body.id,
      maHinhIn: body.maHinhIn || "",
      thongTinHinhIn: body.thongTinHinhIn || "",
      hinhAnh: body.hinhAnh || "",
      anhMinhHoa: body.anhMinhHoa || "",
      maSPSuDung: body.maSPSuDung || "",
      tonKho: parseFloat(body.tonKho) || 0,
    };
    const before = await getDanhMucHinhInFromSheet();
    const oldRow = before.find((d) => d.id === danhMuc.id) ?? null;
    await updateDanhMucHinhInInSheet(danhMuc);
    logSheetEdit({
      action: "update",
      tableKey: "danh-muc-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_DANH_MUC_HINH_IN || "Danh mục HI",
      recordId: danhMuc.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: danhMuc as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Cập nhật danh mục hình in thành công", data: danhMuc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
