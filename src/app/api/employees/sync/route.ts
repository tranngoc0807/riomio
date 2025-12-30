import { NextRequest, NextResponse } from "next/server";
import { writeEmployeesToSheet, Employee } from "@/lib/googleSheets";

/**
 * POST /api/employees/sync
 * Đồng bộ toàn bộ danh sách nhân viên vào Google Sheets
 * (Ghi đè dữ liệu cũ)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.employees)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body. Expected an array of employees",
        },
        { status: 400 }
      );
    }

    const employees: Employee[] = body.employees;

    await writeEmployeesToSheet(employees, false);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${employees.length} employees to Google Sheets`,
      count: employees.length,
    });
  } catch (error: any) {
    console.error("Error syncing employees:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync employees to Google Sheets",
      },
      { status: 500 }
    );
  }
}
