import { NextRequest, NextResponse } from "next/server";
import { deleteShippingUnitFromSheet, getShippingUnitsFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID đơn vị vận chuyển không hợp lệ" }, { status: 400 });
    }
    const unitId = parseInt(id, 10);
    if (isNaN(unitId)) {
      return NextResponse.json({ success: false, error: "ID đơn vị vận chuyển phải là số" }, { status: 400 });
    }
    const before = await getShippingUnitsFromSheet();
    const oldRow = before.find((u) => u.id === unitId) ?? null;
    await deleteShippingUnitFromSheet(unitId);
    logSheetEdit({
      action: "delete",
      tableKey: "shipping-units",
      sheetName: process.env.GOOGLE_SHEET_NAME_VAN_CHUYEN || "Đối tác vận chuyển",
      recordId: unitId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Shipping unit deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
