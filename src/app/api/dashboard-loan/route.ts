import { NextResponse } from "next/server";
import { getDashboardLoanData } from "@/lib/googleSheets";

/**
 * GET /api/dashboard-loan
 * Lấy dữ liệu Dashboard tiền vay từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getDashboardLoanData();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching Dashboard Loan:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch Dashboard Loan from Google Sheets",
      },
      { status: 500 }
    );
  }
}
