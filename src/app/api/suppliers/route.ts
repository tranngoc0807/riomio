import { NextRequest, NextResponse } from "next/server";
import { getSuppliersFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/suppliers
 * Lấy danh sách tất cả nhà cung cấp từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching suppliers from Google Sheets...");

    const suppliers = await getSuppliersFromSheet();

    return NextResponse.json({
      success: true,
      data: suppliers,
      count: suppliers.length,
    });
  } catch (error: any) {
    console.error("Error fetching suppliers:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch suppliers from Google Sheets",
      },
      { status: 500 }
    );
  }
}
