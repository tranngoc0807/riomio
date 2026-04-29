import { NextRequest, NextResponse } from "next/server";
import { addSanPhamCatalogToSheet, SanPhamCatalog } from "@/lib/googleSheets";

/**
 * POST /api/san-pham-catalog/add
 * Thêm sản phẩm mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - cần có Mã SP
    if (!body.code) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu Mã SP",
        },
        { status: 400 }
      );
    }

    const product: SanPhamCatalog = {
      id: 0,
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
