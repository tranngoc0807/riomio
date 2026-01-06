import { NextRequest, NextResponse } from "next/server";
import { deleteShippingUnitFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/shipping-units/delete
 * Xóa đơn vị vận chuyển khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID đơn vị vận chuyển không hợp lệ",
        },
        { status: 400 }
      );
    }

    const unitId = parseInt(id, 10);

    if (isNaN(unitId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID đơn vị vận chuyển phải là số",
        },
        { status: 400 }
      );
    }

    await deleteShippingUnitFromSheet(unitId);

    return NextResponse.json({
      success: true,
      message: "Shipping unit deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting shipping unit:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete shipping unit from Google Sheets",
      },
      { status: 500 }
    );
  }
}
