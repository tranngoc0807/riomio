import { NextRequest, NextResponse } from "next/server";
import { deleteXuatKhoNPLFromSheet, getXuatKhoNPLFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id parameter" }, { status: 400 });
    }
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      return NextResponse.json({ success: false, error: "Invalid id parameter" }, { status: 400 });
    }
    const before = await getXuatKhoNPLFromSheet();
    const oldRow = before.find((r) => r.id === idNumber) ?? null;
    await deleteXuatKhoNPLFromSheet(idNumber);
    logSheetEdit({
      action: "delete",
      tableKey: "xuat-kho-npl",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_NPL || "Xuất kho NPL",
      recordId: idNumber,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xuất kho NPL deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
