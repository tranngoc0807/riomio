import { NextResponse } from "next/server";
import { getSanPhamBanHangFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/san-pham-ban-hang
 * Lấy danh sách sản phẩm bán hàng từ Google Sheets (PhatTrienSanPhamBanHang)
 */
export async function GET() {
  try {
    const sanPhams = await getSanPhamBanHangFromSheet();

    return NextResponse.json({
      success: true,
      data: sanPhams,
    });
  } catch (error: any) {
    console.error("Error fetching san pham ban hang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch san pham ban hang from Google Sheets",
      },
      { status: 500 }
    );
  }
}
