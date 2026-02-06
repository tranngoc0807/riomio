import { NextRequest, NextResponse } from "next/server";
import {
  getCNPTXuongThangFromSheet,
  getCNPTXuongNgayFromSheet,
  getCNPTXuongGiaCongDateCells,
  updateCNPTXuongGiaCongDateCells
} from "@/lib/googleSheets";

/**
 * GET /api/cnpt-xuong-gia-cong
 * Lấy dữ liệu CNPT xưởng gia công từ Google Sheets
 * Trả về cả 2 bảng: theo tháng và đến ngày, kèm dateCells
 */
export async function GET() {
  try {
    // Fetch cả 2 bảng và date cells song song
    const [thangData, ngayData, dateCells] = await Promise.all([
      getCNPTXuongThangFromSheet(),
      getCNPTXuongNgayFromSheet(),
      getCNPTXuongGiaCongDateCells(),
    ]);

    return NextResponse.json({
      success: true,
      thangData,
      ngayData,
      dateCells, // { thangNam: "YYYY-MM", denNgay: "YYYY-MM-DD" }
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

/**
 * POST /api/cnpt-xuong-gia-cong
 * Cập nhật ngày/tháng filter và lấy dữ liệu CNPT xưởng gia công
 * Body: { thangNam?: string (format: "YYYY-MM"), denNgay?: string (format: "YYYY-MM-DD") }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thangNam, denNgay } = body;

    console.log("Updating CNPT Xuong Gia Cong filters:", { thangNam, denNgay });

    // Update date cells in Google Sheets if provided
    if (thangNam || denNgay) {
      await updateCNPTXuongGiaCongDateCells({ thangNam, denNgay });
    }

    // Wait a moment for formulas to recalculate
    await new Promise(resolve => setTimeout(resolve, 500));

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
    console.error("Error updating CNPT xuong gia cong:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update CNPT xưởng gia công",
      },
      { status: 500 }
    );
  }
}
