import { NextResponse } from "next/server";
import { getSanPhamCatalogFromSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/san-pham-catalog
 * Lấy danh sách sản phẩm từ Google Sheets
 */
export async function GET() {
  try {
    const products = await getSanPhamCatalogFromSheet();

    if (products.length > 0) {
      console.log("[san-pham-catalog] sample first row:", JSON.stringify({
        code: products[0].code,
        printPattern: products[0].printPattern,
        size: products[0].size,
        color: products[0].color,
        name: products[0].name,
        tonKho: products[0].tonKho,
      }));
    }

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
