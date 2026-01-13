import { NextResponse } from "next/server";
import { getNhapKhoHinhInFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/nhap-kho-hinh-in
 * Lấy dữ liệu nhập kho hình in từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getNhapKhoHinhInFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching nhap kho hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch nhap kho hinh in",
      },
      { status: 500 }
    );
  }
}
