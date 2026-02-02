import { NextRequest, NextResponse } from "next/server";
import { getNghiPhepFromSheet, saveNghiPhepToSheet, updateNghiPhepRow, NghiPhepItem } from "@/lib/googleSheets";

/**
 * GET /api/nghi-phep?thang=1&nam=2025
 * Lấy dữ liệu nghỉ phép theo tháng/năm
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

    const nghiPhepData = await getNghiPhepFromSheet(thang, nam);

    return NextResponse.json({
      success: true,
      data: nghiPhepData,
      count: nghiPhepData.length,
      thang,
      nam,
    });
  } catch (error: any) {
    console.error("Error fetching leave data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch leave data from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nghi-phep
 * Lưu dữ liệu nghỉ phép
 * Body: { data: NghiPhepItem[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: NghiPhepItem[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
        },
        { status: 400 }
      );
    }

    const result = await saveNghiPhepToSheet(data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error saving leave data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save leave data to Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/nghi-phep
 * Cập nhật một dòng nghỉ phép
 * Body: { rowNumber: number, phepThang: number, suDung: number }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowNumber, phepThang, suDung } = body;

    if (!rowNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu rowNumber",
        },
        { status: 400 }
      );
    }

    if (phepThang === undefined || suDung === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu phepThang hoặc suDung",
        },
        { status: 400 }
      );
    }

    await updateNghiPhepRow(rowNumber, phepThang, suDung);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật nghỉ phép`,
    });
  } catch (error: any) {
    console.error("Error updating leave data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update leave data",
      },
      { status: 500 }
    );
  }
}
