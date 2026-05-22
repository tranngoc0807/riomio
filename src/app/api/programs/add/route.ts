import { NextRequest, NextResponse } from "next/server";
import { addSalesProgramToSheet, SalesProgram } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

/**
 * POST /api/programs/add
 * Thêm chương trình bán hàng mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.code) {
      return NextResponse.json(
        { success: false, error: "Program code is required" },
        { status: 400 }
      );
    }

    if (!body.discount) {
      return NextResponse.json(
        { success: false, error: "Discount is required" },
        { status: 400 }
      );
    }

    const program: SalesProgram = {
      id: body.id || 0,
      code: body.code,
      discount: body.discount,
      type: body.type || "percent",
    };

    await addSalesProgramToSheet(program);

    logSheetEdit({
      action: "add",
      tableKey: "programs",
      sheetName: process.env.GOOGLE_SHEET_NAME_CHUONG_TRINH_BAN_HANG || "Chương trình BH",
      recordId: program.id,
      newData: { code: program.code, discount: program.discount, type: program.type },
    });

    return NextResponse.json({
      success: true,
      message: "Sales program added successfully",
      data: program,
    });
  } catch (error: any) {
    console.error("Error adding program:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add program to Google Sheets" },
      { status: 500 }
    );
  }
}
