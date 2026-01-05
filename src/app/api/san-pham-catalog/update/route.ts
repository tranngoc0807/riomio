import { NextRequest, NextResponse } from "next/server";
import { updateSanPhamCatalogInSheet, SanPhamCatalog } from "@/lib/googleSheets";

/**
 * PUT /api/san-pham-catalog/update
 * Cập nhật sản phẩm trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - cần có id
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID sản phẩm",
        },
        { status: 400 }
      );
    }

    const product: SanPhamCatalog = {
      id: body.id,
      name: body.name || "",
      sizeChart: body.sizeChart || "",
      image: body.image || "",
      color: body.color || "",
      retailPrice: body.retailPrice || 0,
      wholesalePrice: body.wholesalePrice || 0,
      costPrice: body.costPrice || 0,
      mainFabric: body.mainFabric || "",
      accentFabric: body.accentFabric || "",
      otherMaterials: body.otherMaterials || "",
      mainFabricQuota: body.mainFabricQuota || "",
      accentFabricQuota: body.accentFabricQuota || "",
      materialsQuota: body.materialsQuota || "",
      accessoriesQuota: body.accessoriesQuota || "",
      otherQuota: body.otherQuota || "",
      plannedQuantity: body.plannedQuantity || 0,
      cutQuantity: body.cutQuantity || 0,
      warehouseQuantity: body.warehouseQuantity || 0,
      finalStatus: body.finalStatus || "",
      nplSyncStatus: body.nplSyncStatus || "",
      productionStatus: body.productionStatus || "",
      warehouseEntry: body.warehouseEntry || "",
    };

    await updateSanPhamCatalogInSheet(product);

    return NextResponse.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: product,
    });
  } catch (error: any) {
    console.error("Error updating san pham catalog:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật sản phẩm trong Google Sheets",
      },
      { status: 500 }
    );
  }
}
