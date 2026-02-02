import { NextRequest, NextResponse } from "next/server";
import { getBaoHiemFromSheet, saveBaoHiemToSheet, BaoHiemNhanVien } from "@/lib/googleSheets";

/**
 * GET /api/bao-hiem?thang=1&nam=2025
 * Lấy dữ liệu bảo hiểm nhân viên theo tháng/năm
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

    const data = await getBaoHiemFromSheet(thang, nam);

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      thang,
      nam,
    });
  } catch (error: any) {
    console.error("Error fetching insurance data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch insurance data",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bao-hiem
 * Lưu dữ liệu bảo hiểm nhân viên
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: BaoHiemNhanVien[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
        },
        { status: 400 }
      );
    }

    const result = await saveBaoHiemToSheet(data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error saving insurance data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save insurance data",
      },
      { status: 500 }
    );
  }
}
