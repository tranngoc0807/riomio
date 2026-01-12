import { NextRequest, NextResponse } from "next/server";
import { addOrderToSheet, Order } from "@/lib/googleSheets";

/**
 * POST /api/orders/add
 * Thêm đơn hàng mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.code) {
      return NextResponse.json(
        {
          success: false,
          error: "Order code is required",
        },
        { status: 400 }
      );
    }

    if (!body.customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer is required",
        },
        { status: 400 }
      );
    }

    const order: Order = {
      id: body.id || 0,
      code: body.code,
      date: body.date || new Date().toISOString().split("T")[0],
      customer: body.customer,
      productCode: body.productCode || "",
      color: body.color || "",
      size: body.size || "",
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

    await addOrderToSheet(order);

    return NextResponse.json({
      success: true,
      message: "Order added successfully",
      data: order,
    });
  } catch (error: any) {
    console.error("Error adding order:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add order to Google Sheets",
      },
      { status: 500 }
    );
  }
}
