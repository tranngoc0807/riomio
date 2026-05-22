import { NextResponse } from "next/server";
import { updateMaSPInSheet, getMaSPFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, maSP, tenSP, size, vaiChinh, vaiPhoi, phuLieuKhac, lenhSX, xuongSX } = body;
    if (rowIndex === undefined || rowIndex < 0) {
      return NextResponse.json({ success: false, error: "Vị trí dòng không hợp lệ" }, { status: 400 });
    }
    if (!maSP) {
      return NextResponse.json({ success: false, error: "Mã sản phẩm không được để trống" }, { status: 400 });
    }
    const rowIdx = typeof rowIndex === "number" ? rowIndex : parseInt(rowIndex);
    // getMaSPFromSheet trả về list theo thứ tự, rowIdx tương ứng với index trong list
    const before = await getMaSPFromSheet();
    const oldRow = before[rowIdx] ?? null;
    const newData = {
      maSP,
      tenSP: tenSP || "",
      size: size || "",
      vaiChinh: vaiChinh || "",
      vaiPhoi: vaiPhoi || "",
      phuLieuKhac: phuLieuKhac || "",
      lenhSX: lenhSX || "",
      xuongSX: xuongSX || "",
    };
    await updateMaSPInSheet(rowIdx, newData);
    logSheetEdit({
      action: "update",
      tableKey: "ma-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_MA_SP || "Mã SP",
      rowIndex: rowIdx,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData,
    });
    return NextResponse.json({ success: true, message: "Cập nhật mã sản phẩm thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
