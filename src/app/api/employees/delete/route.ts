import { NextRequest, NextResponse } from "next/server";
import { deleteEmployeeFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/employees/delete
 * Xóa nhân viên khỏi Google Sheets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee ID is required",
        },
        { status: 400 }
      );
    }

    const employeeId = parseInt(idParam);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid employee ID",
        },
        { status: 400 }
      );
    }

    await deleteEmployeeFromSheet(employeeId);

    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting employee:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete employee from Google Sheets",
      },
      { status: 500 }
    );
  }
}
