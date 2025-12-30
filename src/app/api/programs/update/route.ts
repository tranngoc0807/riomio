import { NextRequest, NextResponse } from "next/server";
import { updateSalesProgramInSheet, SalesProgram } from "@/lib/googleSheets";

/**
 * PUT /api/programs/update
 * Cập nhật chương trình bán hàng trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Program ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.code) {
      return NextResponse.json(
        {
          success: false,
          error: "Program code is required",
        },
        { status: 400 }
      );
    }

    const program: SalesProgram = {
      id: body.id,
      code: body.code,
      discount: body.discount || "",
      type: body.type || "percent",
    };

    await updateSalesProgramInSheet(program);

    return NextResponse.json({
      success: true,
      message: "Sales program updated successfully",
      data: program,
    });
  } catch (error: any) {
    console.error("Error updating program:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update program in Google Sheets",
      },
      { status: 500 }
    );
  }
}
