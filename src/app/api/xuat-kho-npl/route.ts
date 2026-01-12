import { NextRequest, NextResponse } from "next/server";
import { getXuatKhoNPLFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/xuat-kho-npl
 * Lấy danh sách xuất kho NPL từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching xuat kho NPL from Google Sheets...");
    const xuatKhoList = await getXuatKhoNPLFromSheet();

    return NextResponse.json({
      success: true,
      data: xuatKhoList,
      count: xuatKhoList.length,
    });
  } catch (error: any) {
    console.error("Error fetching xuat kho NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch xuat kho NPL from Google Sheets",
      },
      { status: 500 }
    );
  }
}
