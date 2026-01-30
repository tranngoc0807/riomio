import { NextResponse } from "next/server";
import { getEmployeesFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/nhan-vien
 * Lấy danh sách nhân viên từ Google Sheets
 */
export async function GET() {
  try {
    const employees = await getEmployeesFromSheet();

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error: any) {
    console.error("Error fetching employees:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch employees from Google Sheets",
      },
      { status: 500 }
    );
  }
}
