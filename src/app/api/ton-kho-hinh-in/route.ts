import { NextResponse } from "next/server";
import { getTonKhoHinhInThangFromSheet, getTonKhoHinhInNgayFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/ton-kho-hinh-in
 * Lấy dữ liệu tồn kho hình in từ Google Sheets
 * Trả về cả 2 bảng: theo tháng và đến ngày
 */
export async function GET() {
  try {
    // Fetch cả 2 bảng song song
    const [thangData, ngayData] = await Promise.all([
      getTonKhoHinhInThangFromSheet(),
      getTonKhoHinhInNgayFromSheet(),
    ]);

    return NextResponse.json({
      success: true,
      thangData,
      ngayData,
    });
  } catch (error: any) {
    console.error("Error fetching ton kho hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch ton kho hinh in",
      },
      { status: 500 }
    );
  }
}
