import { NextRequest, NextResponse } from "next/server";
import { updateKeHoachSXInSheet, KeHoachSX, getKeHoachSXFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Thiếu ID kế hoạch sản xuất" }, { status: 400 });
    }
    if (!body.lsxCode) {
      return NextResponse.json({ success: false, error: "Vui lòng điền LSX số" }, { status: 400 });
    }
    const keHoach: KeHoachSX = {
      id: body.id,
      lsxCode: body.lsxCode,
      workshop: body.workshop || "",
      orderDate: body.orderDate || "",
      completionDate: body.completionDate || "",
      productCode: body.productCode || "",
      productName: body.productName || "",
      size: body.size || "",
      mainFabric: body.mainFabric || "",
      color: body.color || "",
      image: body.image || "",
      size0_1: body.size0_1 || 0,
      size1_2: body.size1_2 || 0,
      size2_3: body.size2_3 || 0,
      size3_4: body.size3_4 || 0,
      size4_5: body.size4_5 || 0,
      size5_6: body.size5_6 || 0,
      size6_7: body.size6_7 || 0,
      size7_8: body.size7_8 || 0,
      size8_9: body.size8_9 || 0,
      size9_10: body.size9_10 || 0,
      size10_11: body.size10_11 || 0,
      size11_12: body.size11_12 || 0,
      size12_13: body.size12_13 || 0,
      size13_14: body.size13_14 || 0,
      size14_15: body.size14_15 || 0,
      sizeXS: body.sizeXS || 0,
      sizeS: body.sizeS || 0,
      sizeM: body.sizeM || 0,
      sizeL: body.sizeL || 0,
      sizeXL: body.sizeXL || 0,
      sizeXXL: body.sizeXXL || 0,
      totalQuantity: body.totalQuantity || 0,
      note: body.note || "",
    };
    const before = await getKeHoachSXFromSheet();
    const oldRow = before.find((k) => k.id === keHoach.id) ?? null;
    await updateKeHoachSXInSheet(keHoach);
    logSheetEdit({
      action: "update",
      tableKey: "ke-hoach-sx",
      sheetName: process.env.GOOGLE_SHEET_NAME_KE_HOACH_SAN_XUAT || "LSX",
      recordId: keHoach.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: keHoach as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Ke hoach SX updated", data: keHoach });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
