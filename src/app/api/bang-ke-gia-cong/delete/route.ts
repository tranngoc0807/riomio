import { NextRequest, NextResponse } from "next/server";
import { deleteBangKeGiaCongFromSheet, getBangKeGiaCongFromSheet } from "@/lib/googleSheets";
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
    const before = await getBangKeGiaCongFromSheet();
    const oldRow = before.find((b) => b.id === idNumber) ?? null;
    await deleteBangKeGiaCongFromSheet(idNumber);
    logSheetEdit({
      action: "delete",
      tableKey: "bang-ke-gia-cong",
      sheetName: process.env.GOOGLE_SHEET_NAME_BANG_KE_GIA_CONG || "Bảng kê gia công",
      recordId: idNumber,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Bảng kê gia công deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
