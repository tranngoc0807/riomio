import { NextRequest, NextResponse } from "next/server";
import { updateMaterialInSheet, Material, getMaterialsFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Material ID is required" }, { status: 400 });
    }
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Vui lòng điền Tên NPL" }, { status: 400 });
    }
    const material: Material = {
      id: body.id,
      code: body.code || "",
      name: body.name,
      supplier: body.supplier || "",
      info: body.info || "",
      unit: body.unit || "",
      priceBeforeTax: body.priceBeforeTax || 0,
      taxRate: body.taxRate || 0,
      priceWithTax: body.priceWithTax || 0,
      image: body.image || "",
      note: body.note || "",
    };
    const before = await getMaterialsFromSheet();
    const oldRow = before.find((m) => m.id === material.id) ?? null;
    await updateMaterialInSheet(material);
    logSheetEdit({
      action: "update",
      tableKey: "materials",
      sheetName: process.env.GOOGLE_SHEET_NAME_NGUYEN_PHU_LIEU_RIOMIO || "Mã NPL",
      recordId: material.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: material as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Material updated", data: material });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
