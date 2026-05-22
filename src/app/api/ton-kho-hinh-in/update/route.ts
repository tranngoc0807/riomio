import { NextRequest, NextResponse } from "next/server";
import { updateTonKhoHinhInNgay, updateTonKhoHinhInThang } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID là bắt buộc" }, { status: 400 });
    }
    if (!body.type || !["ngay", "thang"].includes(body.type)) {
      return NextResponse.json({ success: false, error: "Type phải là 'ngay' hoặc 'thang'" }, { status: 400 });
    }
    if (body.value === undefined || body.value === null) {
      return NextResponse.json({ success: false, error: "Giá trị là bắt buộc" }, { status: 400 });
    }
    const id = parseInt(body.id);
    const value = parseFloat(body.value) || 0;
    if (body.type === "ngay") {
      await updateTonKhoHinhInNgay(id, value);
    } else {
      await updateTonKhoHinhInThang(id, value);
    }
    logSheetEdit({
      action: "update",
      tableKey: "ton-kho-hinh-in",
      sheetName: process.env.GOOGLE_SHEET_NAME_TON_KHO_HINH_IN || "Tồn kho HI",
      recordId: id,
      newData: { type: body.type, value },
    });
    return NextResponse.json({
      success: true,
      message: `Cập nhật tồn kho hình in ${body.type === "ngay" ? "đến ngày" : "theo tháng"} thành công`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
