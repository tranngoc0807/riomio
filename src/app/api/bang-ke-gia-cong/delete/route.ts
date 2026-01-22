import { NextRequest, NextResponse } from "next/server";
import { deleteBangKeGiaCongFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/bang-ke-gia-cong/delete?id=123
 * Xóa bảng kê gia công từ Google Sheets
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

    await deleteBangKeGiaCongFromSheet(idNumber);

    return NextResponse.json({
      success: true,
      message: "Bảng kê gia công deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting bang ke gia cong:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete bảng kê gia công from Google Sheets",
      },
      { status: 500 }
    );
  }
}
