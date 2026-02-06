import { NextResponse } from "next/server";
import { getNhapKhoSPFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/nhap-kho-sp
 * Lấy danh sách nhập kho SP từ Google Sheets
 */
export async function GET() {
  try {
    const nhapKhoList = await getNhapKhoSPFromSheet();

    return NextResponse.json({
      success: true,
      data: nhapKhoList,
    });
  } catch (error: any) {
    console.error("Error fetching nhap kho SP:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch nhap kho SP from Google Sheets",
      },
      { status: 500 }
    );
  }
}
