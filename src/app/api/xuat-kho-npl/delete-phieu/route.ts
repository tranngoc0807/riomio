import { NextRequest, NextResponse } from "next/server";
import { deleteXuatKhoNPLByMaPhieuFromSheet, getXuatKhoNPLFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const maPhieu = request.nextUrl.searchParams.get("maPhieu");
    if (!maPhieu || !maPhieu.trim()) {
      return NextResponse.json({ success: false, error: "Missing maPhieu parameter" }, { status: 400 });
    }
    const before = await getXuatKhoNPLFromSheet();
    const oldRows = before.filter((r) => r.maPhieu === maPhieu);
    const deletedCount = await deleteXuatKhoNPLByMaPhieuFromSheet(maPhieu);
    logSheetEdit({
      action: "delete",
      tableKey: "xuat-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_NPL || "Xuất kho NPL",
      oldData: { maPhieu, rows: oldRows },
    });
    return NextResponse.json({ success: true, deletedCount, message: `Deleted ${deletedCount} rows of ${maPhieu}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
