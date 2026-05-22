import { NextRequest, NextResponse } from "next/server";
import { deleteOrderFromSheet, getOrdersFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

/**
 * DELETE /api/orders/delete?id=123
 * Xóa đơn hàng khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const orderId = parseInt(id);
    const before = await getOrdersFromSheet();
    const oldRow = before.find((o) => o.id === orderId) ?? null;

    await deleteOrderFromSheet(orderId);

    logSheetEdit({
      action: "delete",
      tableKey: "orders",
      sheetName: process.env.GOOGLE_SHEET_NAME_BAN_HANG || "Bán hàng",
      recordId: orderId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete order from Google Sheets" },
      { status: 500 }
    );
  }
}
