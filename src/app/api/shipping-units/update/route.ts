import { NextRequest, NextResponse } from "next/server";
import { updateShippingUnitInSheet, ShippingUnit, getShippingUnitsFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "ID đơn vị vận chuyển không hợp lệ" }, { status: 400 });
    }
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng điền Tên đơn vị vận chuyển" }, { status: 400 });
    }
    const shippingUnit: ShippingUnit = {
      id: body.id,
      name: body.name || "",
      phone: body.phone || "",
      address: body.address || "",
      contact: body.contact || "",
      note: body.note || "",
    };
    const before = await getShippingUnitsFromSheet();
    const oldRow = before.find((u) => u.id === shippingUnit.id) ?? null;
    await updateShippingUnitInSheet(shippingUnit);
    logSheetEdit({
      action: "update",
      tableKey: "shipping-units",
      sheetName: process.env.GOOGLE_SHEET_NAME_VAN_CHUYEN || "Đối tác vận chuyển",
      recordId: shippingUnit.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: shippingUnit as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Shipping unit updated", data: shippingUnit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
