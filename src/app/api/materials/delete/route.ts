import { NextRequest, NextResponse } from "next/server";
import { deleteMaterialFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/materials/delete
 * Xóa nguyên phụ liệu khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Material ID is required",
        },
        { status: 400 }
      );
    }

    await deleteMaterialFromSheet(body.id);

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting material:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete material from Google Sheets",
      },
      { status: 500 }
    );
  }
}
