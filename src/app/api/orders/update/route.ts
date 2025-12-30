import { NextRequest, NextResponse } from "next/server";
import { updateOrderInSheet, Order } from "@/lib/googleSheets";

/**
 * PUT /api/orders/update
 * Cập nhật đơn hàng trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.code) {
      return NextResponse.json(
        {
          success: false,
          error: "Order code is required",
        },
        { status: 400 }
      );
    }

    const order: Order = {
      id: body.id,
      code: body.code,
      date: body.date || "",
      customer: body.customer || "",
      productCode: body.productCode || "",
      image: body.image || "",
      items: body.items || 0,
      productPrice: body.productPrice || 0,
      subtotal: body.subtotal || 0,
      salesProgram: body.salesProgram || "",
      discount: body.discount || "",
      priceAfterDiscount: body.priceAfterDiscount || 0,
      subtotalAfterDiscount: body.subtotalAfterDiscount || 0,
      paymentDiscount: body.paymentDiscount || "",
      total: body.total || 0,
      salesUser: body.salesUser || "",
      status: body.status || "pending",
      notes: body.notes || "",
    };

    await updateOrderInSheet(order);

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error: any) {
    console.error("Error updating order:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update order in Google Sheets",
      },
      { status: 500 }
    );
  }
}
