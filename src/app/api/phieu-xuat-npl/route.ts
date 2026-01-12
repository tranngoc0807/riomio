import { NextRequest, NextResponse } from "next/server";
import { getPhieuXuatNPLFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/phieu-xuat-npl
 * Lấy danh sách phiếu xuất kho NPL từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching phieu xuat kho NPL from Google Sheets...");
    const phieuXuatList = await getPhieuXuatNPLFromSheet();

    return NextResponse.json({
      success: true,
      data: phieuXuatList,
      count: phieuXuatList.length,
    });
  } catch (error: any) {
    console.error("Error fetching phieu xuat kho NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch phieu xuat kho NPL from Google Sheets",
      },
      { status: 500 }
    );
  }
}
