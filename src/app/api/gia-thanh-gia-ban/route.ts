import { NextResponse } from "next/server";
import { getGiaThanhGiaBanFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/gia-thanh-gia-ban
 * Lấy dữ liệu giá thành giá bán từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getGiaThanhGiaBanFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching gia thanh gia ban:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch gia thanh gia ban",
      },
      { status: 500 }
    );
  }
}
