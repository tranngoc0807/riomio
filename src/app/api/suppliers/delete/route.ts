import { NextRequest, NextResponse } from "next/server";
import { deleteSupplierFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/suppliers/delete
 * Xóa nhà cung cấp khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier ID is required",
        },
        { status: 400 }
      );
    }

    await deleteSupplierFromSheet(body.id);

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting supplier:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete supplier from Google Sheets",
      },
      { status: 500 }
    );
  }
}
