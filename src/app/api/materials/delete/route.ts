import { NextRequest, NextResponse } from "next/server";
import { deleteMaterialFromSheet, getMaterialsFromSheet } from "@/lib/googleSheets";
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
      return NextResponse.json({ success: false, error: "Material ID is required" }, { status: 400 });
    }
    const materialId = parseInt(id);
    const before = await getMaterialsFromSheet();
    const oldRow = before.find((m) => m.id === materialId) ?? null;
    await deleteMaterialFromSheet(materialId);
    logSheetEdit({
      action: "delete",
      tableKey: "materials",
      sheetName: process.env.GOOGLE_SHEET_NAME_NGUYEN_PHU_LIEU_RIOMIO || "Mã NPL",
      recordId: materialId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Material deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
