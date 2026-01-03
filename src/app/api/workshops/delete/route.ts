import { NextRequest, NextResponse } from "next/server";
import { deleteWorkshopFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/workshops/delete
 * Xóa xưởng sản xuất khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Workshop ID is required",
        },
        { status: 400 }
      );
    }

    await deleteWorkshopFromSheet(body.id);

    return NextResponse.json({
      success: true,
      message: "Workshop deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting workshop:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete workshop from Google Sheets",
      },
      { status: 500 }
    );
  }
}
