import { NextRequest, NextResponse } from "next/server";
import {
  getBaoCaoLaiLo,
  updateBaoCaoLaiLoMonthYear,
} from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/lai-lo
 * Lấy dữ liệu báo cáo lãi/lỗ
 */
export async function GET() {
  try {
    const data = await getBaoCaoLaiLo();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao lai lo:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao lai lo",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bao-cao/lai-lo
 * Cập nhật tháng và năm
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json(
        {
          success: false,
          error: "Year and month are required",
        },
        { status: 400 }
      );
    }

    await updateBaoCaoLaiLoMonthYear(year, month);

    // Lấy lại dữ liệu sau khi cập nhật
    const data = await getBaoCaoLaiLo();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error updating bao cao lai lo:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update bao cao lai lo",
      },
      { status: 500 }
    );
  }
}
