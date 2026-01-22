import { NextRequest, NextResponse } from "next/server";
import { deleteXuatKhoNPLFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/xuat-kho-npl/delete?id=123
 * Xóa phiếu xuất kho NPL từ Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing id parameter",
        },
        { status: 400 }
      );
    }

    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid id parameter",
        },
        { status: 400 }
      );
    }

    await deleteXuatKhoNPLFromSheet(idNumber);

    return NextResponse.json({
      success: true,
      message: "Xuất kho NPL deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting xuat kho NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete xuat kho NPL from Google Sheets",
      },
      { status: 500 }
    );
  }
}
