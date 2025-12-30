import { NextRequest, NextResponse } from "next/server";
import { updateEmployeeInSheet, Employee } from "@/lib/googleSheets";

/**
 * PUT /api/employees/update
 * Cập nhật thông tin nhân viên trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.name || !body.position) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and position are required fields",
        },
        { status: 400 }
      );
    }

    const employee: Employee = {
      id: body.id,
      name: body.name,
      position: body.position,
      phone: body.phone || "",
      birthday: body.birthday || "",
      cccd: body.cccd || "",
      address: body.address || "",
    };

    await updateEmployeeInSheet(employee);

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error: any) {
    console.error("Error updating employee:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update employee in Google Sheets",
      },
      { status: 500 }
    );
  }
}
