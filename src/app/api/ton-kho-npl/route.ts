import { NextRequest, NextResponse } from "next/server";
import { getTonKhoNPLThangFromSheet, getTonKhoNPLNgayFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/ton-kho-npl
 * Lấy danh sách tồn kho NPL từ Google Sheets (cả 2 bảng)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching ton kho NPL from Google Sheets...");

    // Fetch both tables in parallel
    const [tonKhoThang, tonKhoNgay] = await Promise.all([
      getTonKhoNPLThangFromSheet(),
      getTonKhoNPLNgayFromSheet(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tonKhoThang,
        tonKhoNgay,
      },
      count: {
        tonKhoThang: tonKhoThang.length,
        tonKhoNgay: tonKhoNgay.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching ton kho NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch ton kho NPL from Google Sheets",
      },
      { status: 500 }
    );
  }
}
