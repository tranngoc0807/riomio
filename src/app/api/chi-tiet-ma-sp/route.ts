import { NextResponse } from "next/server";
import { getChiTietMaSPFromSheet, updateAndGetChiTietMaSP } from "@/lib/googleSheets";

/**
 * GET /api/chi-tiet-ma-sp
 * Lấy chi tiết mã sản phẩm từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getChiTietMaSPFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching chi tiet ma sp:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch chi tiet ma sp",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chi-tiet-ma-sp
 * Cập nhật mã sản phẩm và lấy dữ liệu chi tiết
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maSP } = body;

    if (!maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã sản phẩm không được để trống",
        },
        { status: 400 }
      );
    }

    const data = await updateAndGetChiTietMaSP(maSP);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error updating chi tiet ma sp:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update chi tiet ma sp",
      },
      { status: 500 }
    );
  }
}
