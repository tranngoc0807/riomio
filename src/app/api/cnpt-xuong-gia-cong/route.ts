import { NextResponse } from "next/server";
import { getCNPTXuongThangFromSheet, getCNPTXuongNgayFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/cnpt-xuong-gia-cong
 * Lấy dữ liệu CNPT xưởng gia công từ Google Sheets
 * Trả về cả 2 bảng: theo tháng và đến ngày
 */
export async function GET() {
  try {
    // Fetch cả 2 bảng song song
    const [thangData, ngayData] = await Promise.all([
      getCNPTXuongThangFromSheet(),
      getCNPTXuongNgayFromSheet(),
    ]);

    return NextResponse.json({
      success: true,
      thangData,
      ngayData,
    });
  } catch (error: any) {
    console.error("Error fetching CNPT xuong gia cong:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch CNPT xưởng gia công",
      },
      { status: 500 }
    );
  }
}
