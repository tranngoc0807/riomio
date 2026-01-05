import { NextRequest, NextResponse } from "next/server";
import { addSanPhamCatalogToSheet, SanPhamCatalog } from "@/lib/googleSheets";

/**
 * POST /api/san-pham-catalog/add
 * Thêm sản phẩm mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - cần có tên sản phẩm
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu tên sản phẩm",
        },
        { status: 400 }
      );
    }

    const product: SanPhamCatalog = {
      id: 0,
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

    await addSanPhamCatalogToSheet(product);

    return NextResponse.json({
      success: true,
      message: "Thêm sản phẩm thành công",
      data: product,
    });
  } catch (error: any) {
    console.error("Error adding san pham catalog:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm sản phẩm vào Google Sheets",
      },
      { status: 500 }
    );
  }
}
