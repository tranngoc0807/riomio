import { NextRequest, NextResponse } from "next/server";
import { getTonKhoFromSheet, updateTonKhoSPDateCell } from "@/lib/googleSheets";

/**
 * GET /api/ton-kho
 * Lấy danh sách tồn kho từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const tonKhoItems = await getTonKhoFromSheet();

    return NextResponse.json({
      success: true,
      data: tonKhoItems,
      count: tonKhoItems.length,
    });
  } catch (error: any) {
    console.error("Error fetching inventory:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch inventory from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ton-kho
 * Cập nhật tháng/năm filter và lấy dữ liệu tồn kho
 * Body: { thangNam: string (format: "YYYY-MM") }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thangNam } = body;

    console.log("Updating ton kho SP filter:", { thangNam });

    // Update date cell in Google Sheets if provided
    if (thangNam) {
      await updateTonKhoSPDateCell(thangNam);
    }

    // Wait a moment for formulas to recalculate
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch updated data
    const tonKhoItems = await getTonKhoFromSheet();

    return NextResponse.json({
      success: true,
      data: tonKhoItems,
      count: tonKhoItems.length,
    });
  } catch (error: any) {
    console.error("Error updating ton kho SP:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update ton kho SP",
      },
      { status: 500 }
    );
  }
}
