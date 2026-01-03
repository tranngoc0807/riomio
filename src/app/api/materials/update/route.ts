import { NextRequest, NextResponse } from "next/server";
import { updateMaterialInSheet, Material } from "@/lib/googleSheets";

/**
 * PUT /api/materials/update
 * Cập nhật nguyên phụ liệu trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu - chỉ yêu cầu ID và Tên NPL
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Material ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Tên NPL",
        },
        { status: 400 }
      );
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

    await updateMaterialInSheet(material);

    return NextResponse.json({
      success: true,
      message: "Material updated successfully",
      data: material,
    });
  } catch (error: any) {
    console.error("Error updating material:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update material in Google Sheets",
      },
      { status: 500 }
    );
  }
}
