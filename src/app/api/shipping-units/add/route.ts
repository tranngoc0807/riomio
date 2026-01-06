import { NextRequest, NextResponse } from "next/server";
import { addShippingUnitToSheet, ShippingUnit } from "@/lib/googleSheets";

/**
 * POST /api/shipping-units/add
 * Thêm đơn vị vận chuyển mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
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
      id: body.id || 0,
      name: body.name || "",
      phone: body.phone || "",
      address: body.address || "",
      contact: body.contact || "",
      note: body.note || "",
    };

    await addShippingUnitToSheet(shippingUnit);

    return NextResponse.json({
      success: true,
      message: "Shipping unit added successfully",
      data: shippingUnit,
    });
  } catch (error: any) {
    console.error("Error adding shipping unit:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add shipping unit to Google Sheets",
      },
      { status: 500 }
    );
  }
}
