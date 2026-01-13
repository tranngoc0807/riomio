import { NextResponse } from "next/server";
import { getXuatKhoHinhInFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/xuat-kho-hinh-in
 * Lấy dữ liệu xuất kho hình in từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getXuatKhoHinhInFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching xuat kho hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch xuat kho hinh in",
      },
      { status: 500 }
    );
  }
}
