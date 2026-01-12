import { NextRequest, NextResponse } from "next/server";
import { getNhapKhoNPLFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/nhap-kho-npl
 * Lấy danh sách nhập kho NPL từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching nhap kho NPL from Google Sheets...");
    const nhapKhoList = await getNhapKhoNPLFromSheet();

    return NextResponse.json({
      success: true,
      data: nhapKhoList,
      count: nhapKhoList.length,
    });
  } catch (error: any) {
    console.error("Error fetching nhap kho NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch nhap kho NPL from Google Sheets",
      },
      { status: 500 }
    );
  }
}
