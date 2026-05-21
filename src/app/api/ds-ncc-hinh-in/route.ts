import { NextResponse } from "next/server";
import { getDSNCCHinhInFromSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/ds-ncc-hinh-in
 * Lấy danh sách NCC hình in từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getDSNCCHinhInFromSheet();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching DS NCC hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch DS NCC hinh in",
      },
      { status: 500 },
    );
  }
}
