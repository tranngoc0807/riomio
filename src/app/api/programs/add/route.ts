import { NextRequest, NextResponse } from "next/server";
import { addSalesProgramToSheet, SalesProgram } from "@/lib/googleSheets";

/**
 * POST /api/programs/add
 * Thêm chương trình bán hàng mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.code) {
      return NextResponse.json(
        {
          success: false,
          error: "Program code is required",
        },
        { status: 400 }
      );
    }

    if (!body.discount) {
      return NextResponse.json(
        {
          success: false,
          error: "Discount is required",
        },
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

    return NextResponse.json({
      success: true,
      message: "Sales program added successfully",
      data: program,
    });
  } catch (error: any) {
    console.error("Error adding program:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add program to Google Sheets",
      },
      { status: 500 }
    );
  }
}
