import { NextRequest, NextResponse } from "next/server";
import { getCoCheLuongFromSheet, saveCoCheLuongToSheet, CoCheLuong } from "@/lib/googleSheets";

/**
 * GET /api/co-che-luong?thang=1&nam=2025
 * Lấy dữ liệu cơ chế lương theo tháng/năm
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

    const data = await getCoCheLuongFromSheet(thang, nam);

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      thang,
      nam,
    });
  } catch (error: any) {
    console.error("Error fetching salary structure:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch salary structure",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/co-che-luong
 * Lưu dữ liệu cơ chế lương
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: CoCheLuong[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
        },
        { status: 400 }
      );
    }

    const result = await saveCoCheLuongToSheet(data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error saving salary structure:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save salary structure",
      },
      { status: 500 }
    );
  }
}
