import { NextRequest, NextResponse } from "next/server";
import { deleteSanPhamFromSheet, getSanPhamFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID sản phẩm" }, { status: 400 });
    }
    const sanPhamId = parseInt(id, 10);
    if (isNaN(sanPhamId)) {
      return NextResponse.json({ success: false, error: "ID sản phẩm không hợp lệ" }, { status: 400 });
    }
    const before = await getSanPhamFromSheet();
    const oldRow = before.find((s) => s.id === sanPhamId) ?? null;
    await deleteSanPhamFromSheet(sanPhamId);
    logSheetEdit({
      action: "delete",
      tableKey: "san-pham",
      sheetName: process.env.GOOGLE_SHEET_NAME_SAN_PHAM_PHAT_TRIEN || "PhatTrienSanPham",
      recordId: sanPhamId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "San pham deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
