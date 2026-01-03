import { NextRequest, NextResponse } from "next/server";
import { addMaterialToSheet, Material } from "@/lib/googleSheets";

/**
 * POST /api/materials/add
 * Thêm nguyên phụ liệu mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu - chỉ yêu cầu Tên NPL
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

    return NextResponse.json({
      success: true,
      message: "Material added successfully",
      data: material,
    });
  } catch (error: any) {
    console.error("Error adding material:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add material to Google Sheets",
      },
      { status: 500 }
    );
  }
}
