import { NextRequest, NextResponse } from "next/server";
import { batchUpdateOrdersInSheet, Order } from "@/lib/googleSheets";

/**
 * PUT /api/orders/batch-update
 * Cập nhật nhiều đơn hàng cùng lúc trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.orders || !Array.isArray(body.orders) || body.orders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Orders array is required" },
        { status: 400 }
      );
    }

    const orders: Order[] = body.orders.map((o: any) => ({
      id: o.id,
      code: o.code,
      date: o.date || "",
      customer: o.customer || "",
      productCode: o.productCode || "",
      image: o.image || "",
      items: o.items || 0,
      productPrice: o.productPrice || 0,
      subtotal: o.subtotal || 0,
      salesProgram: o.salesProgram || "",
      discount: o.discount || "",
      priceAfterDiscount: o.priceAfterDiscount || 0,
      subtotalAfterDiscount: o.subtotalAfterDiscount || 0,
      paymentDiscount: o.paymentDiscount || "",
      total: o.total || 0,
      salesUser: o.salesUser || "",
      notes: o.notes || "",
    }));

    // Validate all orders have id and code
    for (const order of orders) {
      if (!order.id || !order.code) {
        return NextResponse.json(
          { success: false, error: "Each order must have id and code" },
          { status: 400 }
        );
      }
    }

    await batchUpdateOrdersInSheet(orders);

    return NextResponse.json({
      success: true,
      message: `Updated ${orders.length} orders successfully`,
    });
  } catch (error: any) {
    console.error("Error batch updating orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to batch update orders" },
      { status: 500 }
    );
  }
}
