import { NextRequest, NextResponse } from "next/server";
import { getCNPTNCCNPLThangFromSheet, getCNPTNCCNPLNgayFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/cnpt-ncc-npl
 * Lấy danh sách công nợ phải trả NCC NPL từ Google Sheets (cả 2 bảng)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching CNPT NCC NPL from Google Sheets...");

    // Fetch both tables in parallel
    const [cnptThang, cnptNgay] = await Promise.all([
      getCNPTNCCNPLThangFromSheet(),
      getCNPTNCCNPLNgayFromSheet(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cnptThang,
        cnptNgay,
      },
      count: {
        cnptThang: cnptThang.length,
        cnptNgay: cnptNgay.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching CNPT NCC NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch CNPT NCC NPL from Google Sheets",
      },
      { status: 500 }
    );
  }
}
