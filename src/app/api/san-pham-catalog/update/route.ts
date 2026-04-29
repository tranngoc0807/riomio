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
      code: body.code || "",
      printPattern: body.printPattern || "",
      size: body.size || "",
      color: body.color || "",
      name: body.name || "",
      image: body.image || "",
      wholesalePrice: body.wholesalePrice || 0,
      retailPrice: body.retailPrice || 0,
      sizeChart: body.sizeChart || "",
      tonKho: body.tonKho || 0,
      costPrice: 0,
      mainFabric: "",
      accentFabric: "",
      otherMaterials: "",
      mainFabricQuota: "",
      accentFabricQuota: "",
      materialsQuota: "",
      accessoriesQuota: "",
      otherQuota: "",
      plannedQuantity: 0,
      cutQuantity: 0,
      warehouseQuantity: 0,
      finalStatus: "",
      nplSyncStatus: "",
      productionStatus: "",
      warehouseEntry: "",
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
