import { NextRequest, NextResponse } from "next/server";
import { addShippingUnitToSheet, ShippingUnit } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng điền Tên đơn vị vận chuyển" }, { status: 400 });
    }
    const shippingUnit: ShippingUnit = {
      id: body.id || 0,
      name: body.name || "",
      phone: body.phone || "",
      address: body.address || "",
      contact: body.contact || "",
      note: body.note || "",
    };
    await addShippingUnitToSheet(shippingUnit);
    logSheetEdit({
      action: "add",
      tableKey: "shipping-units",
      sheetName: process.env.GOOGLE_SHEET_NAME_VAN_CHUYEN || "Đối tác vận chuyển",
      recordId: shippingUnit.id || null,
      newData: shippingUnit as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Shipping unit added", data: shippingUnit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
