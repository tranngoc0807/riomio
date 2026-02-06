import { NextResponse } from "next/server";
import { getBangKeLSXFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/bang-ke-lsx
 * Lấy dữ liệu Bảng kê LSX từ Google Sheets
 * Trả về tổng SL theo Mã SP (gộp các hàng có cùng Mã SP)
 */
export async function GET() {
  try {
    const bangKeLSX = await getBangKeLSXFromSheet();

    // Group by maSP and sum tongSL
    const groupedByMaSP: Record<string, number> = {};

    bangKeLSX.forEach((item) => {
      const maSP = item.maSP.trim();
      if (maSP) {
        if (groupedByMaSP[maSP]) {
          groupedByMaSP[maSP] += item.tongSL;
        } else {
          groupedByMaSP[maSP] = item.tongSL;
        }
      }
    });

    // Convert to array format
    const result = Object.entries(groupedByMaSP).map(([maSP, tongSL]) => ({
      maSP,
      tongSL,
    }));

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error: any) {
    console.error("Error fetching Bang Ke LSX:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch Bang Ke LSX from Google Sheets",
      },
      { status: 500 }
    );
  }
}
