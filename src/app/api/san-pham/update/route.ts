import { NextRequest, NextResponse } from "next/server";
import { updateSanPhamInSheet, SanPham, getSanPhamFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Thiếu ID sản phẩm" }, { status: 400 });
    }
    const sanPham: SanPham = {
      id: body.id,
      code: body.code || "",
      name: body.name || "",
      size: body.size || "",
      mainFabric: body.mainFabric || "",
      accentFabric: body.accentFabric || "",
      otherMaterials: body.otherMaterials || "",
      productionOrder: body.productionOrder || "",
      workshop: body.workshop || "",
      mainFabricQuota: body.mainFabricQuota || "",
      accentFabricQuota1: body.accentFabricQuota1 || "",
      accentFabricQuota2: body.accentFabricQuota2 || "",
      materialsQuota1: body.materialsQuota1 || "",
      materialsQuota2: body.materialsQuota2 || "",
      accessoriesQuota: body.accessoriesQuota || "",
      otherQuota: body.otherQuota || "",
      plannedQuantity: body.plannedQuantity || 0,
      cutQuantity: body.cutQuantity || 0,
      warehouseQuantity: body.warehouseQuantity || 0,
      developmentStage: body.developmentStage || "",
      productionStage: body.productionStage || "",
      image: body.image || "",
    };
    const before = await getSanPhamFromSheet();
    const oldRow = before.find((s) => s.id === sanPham.id) ?? null;
    await updateSanPhamInSheet(sanPham);
    logSheetEdit({
      action: "update",
      tableKey: "san-pham",
      sheetName: process.env.GOOGLE_SHEET_NAME_SAN_PHAM_PHAT_TRIEN || "PhatTrienSanPham",
      recordId: sanPham.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: sanPham as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "San pham updated", data: sanPham });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
