import { NextRequest, NextResponse } from "next/server";
import {
  getTonKhoNPLThangFromSheet,
  getTonKhoNPLNgayFromSheet,
  getTonKhoNPLXuongSXFromSheet,
  updateTonKhoNPLDateCells
} from "@/lib/googleSheets";

/**
 * GET /api/ton-kho-npl
 * Lấy danh sách tồn kho NPL từ Google Sheets (cả 3 bảng)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching ton kho NPL from Google Sheets...");

    // Fetch all 3 tables in parallel
    const [tonKhoThang, tonKhoNgay, tonKhoXuongSX] = await Promise.all([
      getTonKhoNPLThangFromSheet(),
      getTonKhoNPLNgayFromSheet(),
      getTonKhoNPLXuongSXFromSheet(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tonKhoThang,
        tonKhoNgay,
        tonKhoXuongSX,
      },
      count: {
        tonKhoThang: tonKhoThang.length,
        tonKhoNgay: tonKhoNgay.length,
        tonKhoXuongSX: tonKhoXuongSX.length,
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

/**
 * POST /api/ton-kho-npl
 * Cập nhật ngày/tháng filter và lấy dữ liệu tồn kho NPL
 * Body: { thangNam?: string (format: "YYYY-MM"), denNgay?: string (format: "YYYY-MM-DD") }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thangNam, denNgay } = body;

    console.log("Updating ton kho NPL filters:", { thangNam, denNgay });

    // Update date cells in Google Sheets if provided
    if (thangNam || denNgay) {
      await updateTonKhoNPLDateCells({ thangNam, denNgay });
    }

    // Wait a moment for formulas to recalculate
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch all 3 tables in parallel
    const [tonKhoThang, tonKhoNgay, tonKhoXuongSX] = await Promise.all([
      getTonKhoNPLThangFromSheet(),
      getTonKhoNPLNgayFromSheet(),
      getTonKhoNPLXuongSXFromSheet(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tonKhoThang,
        tonKhoNgay,
        tonKhoXuongSX,
      },
      count: {
        tonKhoThang: tonKhoThang.length,
        tonKhoNgay: tonKhoNgay.length,
        tonKhoXuongSX: tonKhoXuongSX.length,
      },
    });
  } catch (error: any) {
    console.error("Error updating ton kho NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update ton kho NPL",
      },
      { status: 500 }
    );
  }
}
