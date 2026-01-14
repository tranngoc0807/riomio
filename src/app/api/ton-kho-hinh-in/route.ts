import { NextRequest, NextResponse } from "next/server";
import { getTonKhoHinhInThangFromSheet, getTonKhoHinhInNgayFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/ton-kho-hinh-in?monthYear=12/2025&toDate=31/12/25
 * Lấy dữ liệu tồn kho hình in từ Google Sheets
 * Trả về cả 2 bảng: theo tháng và đến ngày
 * @param monthYear - Optional: tháng/năm format "MM/YYYY"
 * @param toDate - Optional: ngày đến format "DD/MM/YY"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthYear = searchParams.get("monthYear") || undefined;
    const toDate = searchParams.get("toDate") || undefined;

    // Fetch cả 2 bảng song song
    const [thangData, ngayData] = await Promise.all([
      getTonKhoHinhInThangFromSheet(monthYear),
      getTonKhoHinhInNgayFromSheet(toDate),
    ]);

    return NextResponse.json({
      success: true,
      thangData,
      ngayData,
      selectedMonthYear: monthYear,
      selectedToDate: toDate,
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
