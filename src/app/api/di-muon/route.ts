import { NextRequest, NextResponse } from "next/server";
import { getDiMuonFromSheet, saveDiMuonToSheet, updateDiMuonCell, DiMuonItem } from "@/lib/googleSheets";

/**
 * GET /api/di-muon?thang=1&nam=2025
 * Lấy dữ liệu chấm công đi muộn theo tháng/năm
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

    const diMuonData = await getDiMuonFromSheet(thang, nam);

    return NextResponse.json({
      success: true,
      data: diMuonData,
      count: diMuonData.length,
      thang,
      nam,
    });
  } catch (error: any) {
    console.error("Error fetching late attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch late attendance from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/di-muon
 * Lưu dữ liệu chấm công đi muộn
 * Body: { data: DiMuonItem[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: DiMuonItem[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
        },
        { status: 400 }
      );
    }

    const result = await saveDiMuonToSheet(data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error saving late attendance:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save late attendance to Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/di-muon
 * Cập nhật một ô chấm công đi muộn
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

    await updateDiMuonCell(rowNumber, dayIndex, value);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật chấm công đi muộn ngày ${dayIndex + 1}`,
    });
  } catch (error: any) {
    console.error("Error updating late attendance cell:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update late attendance cell",
      },
      { status: 500 }
    );
  }
}
