import { NextRequest, NextResponse } from "next/server";
import {
  getCNPTNCCNPLThangFromSheet,
  getCNPTNCCNPLNgayFromSheet,
  getCNPTNCCNPLDateCells,
  updateCNPTNCCNPLDateCells
} from "@/lib/googleSheets";

/**
 * GET /api/cnpt-ncc-npl
 * Lấy danh sách công nợ phải trả NCC NPL từ Google Sheets (cả 2 bảng)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching CNPT NCC NPL from Google Sheets...");

    // Fetch both tables and date cells in parallel
    const [cnptThang, cnptNgay, dateCells] = await Promise.all([
      getCNPTNCCNPLThangFromSheet(),
      getCNPTNCCNPLNgayFromSheet(),
      getCNPTNCCNPLDateCells(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cnptThang,
        cnptNgay,
      },
      dateCells, // { thangNam: "YYYY-MM", denNgay: "YYYY-MM-DD" }
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

/**
 * POST /api/cnpt-ncc-npl
 * Cập nhật ngày/tháng filter và lấy dữ liệu CNPT NCC NPL
 * Body: { thangNam?: string (format: "YYYY-MM"), denNgay?: string (format: "YYYY-MM-DD") }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thangNam, denNgay } = body;

    console.log("Updating CNPT NCC NPL filters:", { thangNam, denNgay });

    // Update date cells in Google Sheets if provided
    if (thangNam || denNgay) {
      await updateCNPTNCCNPLDateCells({ thangNam, denNgay });
    }

    // Wait a moment for formulas to recalculate
    await new Promise(resolve => setTimeout(resolve, 500));

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
    console.error("Error updating CNPT NCC NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update CNPT NCC NPL",
      },
      { status: 500 }
    );
  }
}
