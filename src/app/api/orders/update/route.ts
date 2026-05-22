import { NextRequest, NextResponse } from "next/server";
import { updateOrderInSheet, Order, getOrdersFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

/**
 * PUT /api/orders/update
 * Cập nhật đơn hàng trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!body.code) {
      return NextResponse.json(
        { success: false, error: "Order code is required" },
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
      notes: body.notes || "",
    };

    const before = await getOrdersFromSheet();
    const oldRow = before.find((o) => o.id === order.id) ?? null;

    await updateOrderInSheet(order);

    logSheetEdit({
      action: "update",
      tableKey: "orders",
      sheetName: process.env.GOOGLE_SHEET_NAME_BAN_HANG || "Bán hàng",
      recordId: order.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: order as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order in Google Sheets" },
      { status: 500 }
    );
  }
}
