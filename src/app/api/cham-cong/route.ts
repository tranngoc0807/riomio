import { NextRequest, NextResponse } from "next/server";
import { getChamCongFromSheet, saveChamCongToSheet, ChamCongItem } from "@/lib/googleSheets";

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
