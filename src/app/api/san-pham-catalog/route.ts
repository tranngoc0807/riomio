import { NextResponse } from "next/server";
import { getSanPhamCatalogFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/san-pham-catalog
 * Lấy danh sách sản phẩm từ Google Sheets
 */
export async function GET() {
  try {
    const products = await getSanPhamCatalogFromSheet();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Error fetching san pham catalog:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch san pham catalog from Google Sheets",
      },
      { status: 500 }
    );
  }
}
