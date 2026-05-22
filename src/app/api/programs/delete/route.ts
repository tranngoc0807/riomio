import { NextRequest, NextResponse } from "next/server";
import { deleteSalesProgramFromSheet, getSalesProgramsFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

/**
 * DELETE /api/programs/delete?id=123
 * Xóa chương trình bán hàng khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Program ID is required" },
        { status: 400 }
      );
    }

    const programId = parseInt(id);
    const before = await getSalesProgramsFromSheet();
    const oldRow = before.find((p) => p.id === programId) ?? null;

    await deleteSalesProgramFromSheet(programId);

    logSheetEdit({
      action: "delete",
      tableKey: "programs",
      sheetName: process.env.GOOGLE_SHEET_NAME_CHUONG_TRINH_BAN_HANG || "Chương trình BH",
      recordId: programId,
      oldData: oldRow ? { code: oldRow.code, discount: oldRow.discount, type: oldRow.type } : null,
    });

    return NextResponse.json({
      success: true,
      message: "Sales program deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting program:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete program from Google Sheets" },
      { status: 500 }
    );
  }
}
