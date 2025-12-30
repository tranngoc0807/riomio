import { NextRequest, NextResponse } from "next/server";
import { deleteCustomerFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/customers/delete?id=123
 * Xóa khách hàng khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer ID is required",
        },
        { status: 400 }
      );
    }

    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid customer ID",
        },
        { status: 400 }
      );
    }

    await deleteCustomerFromSheet(customerId);

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting customer:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete customer from Google Sheets",
      },
      { status: 500 }
    );
  }
}
