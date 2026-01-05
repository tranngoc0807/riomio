import { NextRequest, NextResponse } from "next/server";
import { updateSanPhamInSheet, SanPham } from "@/lib/googleSheets";

/**
 * PUT /api/san-pham/update
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

    const sanPham: SanPham = {
      id: body.id,
      code: body.code || "",
      name: body.name || "",
      size: body.size || "",
      mainFabric: body.mainFabric || "",
      accentFabric: body.accentFabric || "",
      otherMaterials: body.otherMaterials || "",
      productionStatus: body.productionStatus || "",
      productionOrder: body.productionOrder || "",
      workshop: body.workshop || "",
      note: body.note || "",
    };

    await updateSanPhamInSheet(sanPham);

    return NextResponse.json({
      success: true,
      message: "San pham updated successfully",
      data: sanPham,
    });
  } catch (error: any) {
    console.error("Error updating san pham:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update san pham in Google Sheets",
      },
      { status: 500 }
    );
  }
}
