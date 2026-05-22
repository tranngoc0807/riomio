import { NextRequest, NextResponse } from "next/server";
import { updateWorkshopInSheet, Workshop, getWorkshopsFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Workshop ID is required" }, { status: 400 });
    }
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Workshop name is required" }, { status: 400 });
    }
    const workshop: Workshop = {
      id: body.id,
      name: body.name,
      phone: body.phone || "",
      address: body.address || "",
      manager: body.manager || "",
      note: body.note || "",
    };
    const before = await getWorkshopsFromSheet();
    const oldRow = before.find((w) => w.id === workshop.id) ?? null;
    await updateWorkshopInSheet(workshop);
    logSheetEdit({
      action: "update",
      tableKey: "workshops",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUONG_SAN_XUAT || "Xưởng SX",
      recordId: workshop.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: workshop as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Workshop updated", data: workshop });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
