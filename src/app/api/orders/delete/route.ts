import { NextRequest, NextResponse } from "next/server";
import { deleteOrderFromSheet } from "@/lib/googleSheets";

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
        {
          success: false,
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    await deleteOrderFromSheet(parseInt(id));

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting order:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete order from Google Sheets",
      },
      { status: 500 }
    );
  }
}
