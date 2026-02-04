import { NextRequest, NextResponse } from "next/server";
import { getThemGioFromSheet, saveThemGioToSheet, updateThemGioCell, deleteThemGioRow, updateThemGioRow, ThemGioItem } from "@/lib/googleSheets";

/**
 * GET /api/them-gio?thang=1&nam=2025
 * Lấy dữ liệu chấm công thêm giờ theo tháng/năm
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const thang = parseInt(searchParams.get("thang") || "0");
    const nam = parseInt(searchParams.get("nam") || "0");

    if (!thang || !nam) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu tham số tháng hoặc năm",
        },
        { status: 400 }
      );
    }

    const themGioData = await getThemGioFromSheet(thang, nam);

    return NextResponse.json({
      success: true,
      data: themGioData,
      count: themGioData.length,
      thang,
      nam,
    });
  } catch (error: any) {
    console.error("Error fetching overtime attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch overtime attendance from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/them-gio
 * Lưu dữ liệu chấm công thêm giờ
 * Body: { data: ThemGioItem[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: ThemGioItem[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
        },
        { status: 400 }
      );
    }

    const result = await saveThemGioToSheet(data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error saving overtime attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save overtime attendance to Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/them-gio
 * Cập nhật một ô hoặc toàn bộ row chấm công thêm giờ
 * Body: { rowNumber: number, dayIndex?: number, value?: number | string, data?: ThemGioItem }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowNumber, dayIndex, value, data } = body;

    if (!rowNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu rowNumber",
        },
        { status: 400 }
      );
    }

    // If data is provided, update the whole row
    if (data) {
      const result = await updateThemGioRow(rowNumber, data);
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    // Otherwise, update a single cell
    if (dayIndex === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu dayIndex hoặc data",
        },
        { status: 400 }
      );
    }

    if (dayIndex < 0 || dayIndex > 30) {
      return NextResponse.json(
        {
          success: false,
          error: "dayIndex phải từ 0-30 (ngày 1-31)",
        },
        { status: 400 }
      );
    }

    await updateThemGioCell(rowNumber, dayIndex, value);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật chấm công thêm giờ ngày ${dayIndex + 1}`,
    });
  } catch (error: any) {
    console.error("Error updating overtime attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update overtime attendance",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/them-gio
 * Xoá một row chấm công thêm giờ
 * Body: { rowNumber: number }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowNumber } = body;

    if (!rowNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu rowNumber",
        },
        { status: 400 }
      );
    }

    const result = await deleteThemGioRow(rowNumber);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error deleting overtime attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete overtime attendance",
      },
      { status: 500 }
    );
  }
}
