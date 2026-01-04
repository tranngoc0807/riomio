import { NextRequest, NextResponse } from "next/server";
import { addKeHoachSXToSheet, KeHoachSX } from "@/lib/googleSheets";

/**
 * POST /api/ke-hoach-sx/add
 * Thêm kế hoạch sản xuất mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - chỉ yêu cầu LSX số
    if (!body.lsxCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền LSX số",
        },
        { status: 400 }
      );
    }

    const keHoach: KeHoachSX = {
      id: body.id || 0,
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
      size1_2: body.size1_2 || 0,
      size3_4: body.size3_4 || 0,
      size5_6: body.size5_6 || 0,
      size7_8: body.size7_8 || 0,
      size9_10: body.size9_10 || 0,
      sizeXS: body.sizeXS || 0,
      sizeS: body.sizeS || 0,
      sizeM: body.sizeM || 0,
      sizeL: body.sizeL || 0,
      sizeXL: body.sizeXL || 0,
      totalQuantity: body.totalQuantity || 0,
      note: body.note || "",
    };

    await addKeHoachSXToSheet(keHoach);

    return NextResponse.json({
      success: true,
      message: "Ke hoach SX added successfully",
      data: keHoach,
    });
  } catch (error: any) {
    console.error("Error adding ke hoach SX:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add ke hoach SX to Google Sheets",
      },
      { status: 500 }
    );
  }
}
