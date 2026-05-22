import { NextRequest, NextResponse } from "next/server";
import { updateSalesProgramInSheet, SalesProgram, getSalesProgramsFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

/**
 * PUT /api/programs/update
 * Cập nhật chương trình bán hàng trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Program ID is required" },
        { status: 400 }
      );
    }

    if (!body.code) {
      return NextResponse.json(
        { success: false, error: "Program code is required" },
        { status: 400 }
      );
    }

    const program: SalesProgram = {
      id: body.id,
      code: body.code,
      discount: body.discount || "",
      type: body.type || "percent",
    };

    const before = await getSalesProgramsFromSheet();
    const oldRow = before.find((p) => p.id === program.id) ?? null;

    await updateSalesProgramInSheet(program);

    logSheetEdit({
      action: "update",
      tableKey: "programs",
      sheetName: process.env.GOOGLE_SHEET_NAME_CHUONG_TRINH_BAN_HANG || "Chương trình BH",
      recordId: program.id,
      oldData: oldRow ? { code: oldRow.code, discount: oldRow.discount, type: oldRow.type } : null,
      newData: { code: program.code, discount: program.discount, type: program.type },
    });

    return NextResponse.json({
      success: true,
      message: "Sales program updated successfully",
      data: program,
    });
  } catch (error: any) {
    console.error("Error updating program:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update program in Google Sheets" },
      { status: 500 }
    );
  }
}
