import { NextRequest, NextResponse } from "next/server";
import { addMaterialToSheet, Material } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Vui lòng điền Tên NPL" }, { status: 400 });
    }
    const material: Material = {
      id: body.id || 0,
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
    await addMaterialToSheet(material);
    logSheetEdit({
      action: "add",
      tableKey: "materials",
      sheetName: process.env.GOOGLE_SHEET_NAME_NGUYEN_PHU_LIEU_RIOMIO || "Mã NPL",
      recordId: material.id || null,
      newData: material as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Material added", data: material });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
