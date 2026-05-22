import { NextRequest, NextResponse } from "next/server";
import { addWorkshopToSheet, Workshop } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Workshop name is required" }, { status: 400 });
    }
    const workshop: Workshop = {
      id: body.id || 0,
      name: body.name,
      phone: body.phone || "",
      address: body.address || "",
      manager: body.manager || "",
      note: body.note || "",
    };
    await addWorkshopToSheet(workshop);
    logSheetEdit({
      action: "add",
      tableKey: "workshops",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUONG_SAN_XUAT || "Xưởng SX",
      recordId: workshop.id || null,
      newData: workshop as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Workshop added", data: workshop });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
