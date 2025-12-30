import { NextRequest, NextResponse } from "next/server";
import { getEmployeesFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/employees
 * Lấy danh sách nhân viên từ Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    const employees = await getEmployeesFromSheet();

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length,
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
