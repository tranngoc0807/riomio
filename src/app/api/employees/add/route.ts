import { NextRequest, NextResponse } from "next/server";
import { addEmployeeToSheet, Employee } from "@/lib/googleSheets";

/**
 * POST /api/employees/add
 * Thêm nhân viên mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
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
      id: body.id || Date.now(), // Sử dụng timestamp nếu không có ID
      name: body.name,
      position: body.position,
      phone: body.phone || "",
      birthday: body.birthday || "",
      cccd: body.cccd || "",
      address: body.address || "",
    };

    await addEmployeeToSheet(employee);

    return NextResponse.json({
      success: true,
      message: "Employee added successfully",
      data: employee,
    });
  } catch (error: any) {
    console.error("Error adding employee:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add employee to Google Sheets",
      },
      { status: 500 }
    );
  }
}
