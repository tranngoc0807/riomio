import { NextRequest, NextResponse } from "next/server";
import { getPhanLoaiThuChiFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/phan-loai-thu-chi
 * Lấy danh sách phân loại thu chi từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching phan loai thu chi from Google Sheets...");

    const phanLoaiList = await getPhanLoaiThuChiFromSheet();

    return NextResponse.json({
      success: true,
      data: phanLoaiList,
      count: phanLoaiList.length,
    });
  } catch (error: any) {
    console.error("Error fetching phan loai thu chi:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch phan loai thu chi from Google Sheets",
      },
      { status: 500 }
    );
  }
}
