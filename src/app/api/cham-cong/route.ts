import { NextRequest, NextResponse } from "next/server";
import { getChamCongFromSheet, saveChamCongToSheet, updateChamCongCell, ChamCongItem } from "@/lib/googleSheets";

/**
 * GET /api/cham-cong?thang=1&nam=2025
 * Lấy dữ liệu chấm công theo tháng/năm
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

    const chamCongData = await getChamCongFromSheet(thang, nam);

    return NextResponse.json({
      success: true,
      data: chamCongData,
      count: chamCongData.length,
      thang,
      nam,
    });
  } catch (error: any) {
    console.error("Error fetching attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch attendance from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cham-cong
 * Lưu dữ liệu chấm công
 * Body: { data: ChamCongItem[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: ChamCongItem[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
        },
        { status: 400 }
      );
    }

    const result = await saveChamCongToSheet(data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error saving attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save attendance to Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cham-cong
 * Cập nhật một ô chấm công
 * Body: { rowNumber: number, dayIndex: number, value: number | string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowNumber, dayIndex, value } = body;

    if (!rowNumber || dayIndex === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu rowNumber hoặc dayIndex",
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

    await updateChamCongCell(rowNumber, dayIndex, value);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật chấm công ngày ${dayIndex + 1}`,
    });
  } catch (error: any) {
    console.error("Error updating attendance cell:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update attendance cell",
      },
      { status: 500 }
    );
  }
}
