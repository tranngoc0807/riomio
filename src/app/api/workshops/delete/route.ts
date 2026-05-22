import { NextRequest, NextResponse } from "next/server";
import { deleteWorkshopFromSheet, getWorkshopsFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id ? String(body.id) : null;
      } catch {}
    }
    if (!id) {
      return NextResponse.json({ success: false, error: "Workshop ID is required" }, { status: 400 });
    }
    const workshopId = parseInt(id);
    const before = await getWorkshopsFromSheet();
    const oldRow = before.find((w) => w.id === workshopId) ?? null;
    await deleteWorkshopFromSheet(workshopId);
    logSheetEdit({
      action: "delete",
      tableKey: "workshops",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUONG_SAN_XUAT || "Xưởng SX",
      recordId: workshopId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Workshop deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
