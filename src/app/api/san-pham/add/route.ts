import { NextRequest, NextResponse } from "next/server";
import { addSanPhamToSheet, SanPham } from "@/lib/googleSheets";

/**
 * POST /api/san-pham/add
 * Thêm sản phẩm mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - yêu cầu mã hoặc tên sản phẩm
    if (!body.code && !body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Mã SP hoặc Tên SP",
        },
        { status: 400 }
      );
    }

    const sanPham: SanPham = {
      id: body.id || 0,
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

    await addSanPhamToSheet(sanPham);

    return NextResponse.json({
      success: true,
      message: "San pham added successfully",
      data: sanPham,
    });
  } catch (error: any) {
    console.error("Error adding san pham:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add san pham to Google Sheets",
      },
      { status: 500 }
    );
  }
}
