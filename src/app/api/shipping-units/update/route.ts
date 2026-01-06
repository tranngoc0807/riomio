import { NextRequest, NextResponse } from "next/server";
import { updateShippingUnitInSheet, ShippingUnit } from "@/lib/googleSheets";

/**
 * PUT /api/shipping-units/update
 * Cập nhật đơn vị vận chuyển trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID đơn vị vận chuyển không hợp lệ",
        },
        { status: 400 }
      );
    }

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Tên đơn vị vận chuyển",
        },
        { status: 400 }
      );
    }

    const shippingUnit: ShippingUnit = {
      id: body.id,
      name: body.name || "",
      phone: body.phone || "",
      address: body.address || "",
      contact: body.contact || "",
      note: body.note || "",
    };

    await updateShippingUnitInSheet(shippingUnit);

    return NextResponse.json({
      success: true,
      message: "Shipping unit updated successfully",
      data: shippingUnit,
    });
  } catch (error: any) {
    console.error("Error updating shipping unit:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update shipping unit in Google Sheets",
      },
      { status: 500 }
    );
  }
}
