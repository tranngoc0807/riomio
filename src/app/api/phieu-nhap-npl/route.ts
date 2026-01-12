import { NextRequest, NextResponse } from "next/server";
import { getPhieuNhapNPLFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/phieu-nhap-npl
 * Lấy danh sách phiếu nhập kho NPL từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching phieu nhap kho NPL from Google Sheets...");
    const phieuNhapList = await getPhieuNhapNPLFromSheet();

    return NextResponse.json({
      success: true,
      data: phieuNhapList,
      count: phieuNhapList.length,
    });
  } catch (error: any) {
    console.error("Error fetching phieu nhap kho NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch phieu nhap kho NPL from Google Sheets",
      },
      { status: 500 }
    );
  }
}
