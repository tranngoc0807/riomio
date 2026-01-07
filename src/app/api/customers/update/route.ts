import { NextRequest, NextResponse } from "next/server";
import { updateCustomerInSheet, Customer } from "@/lib/googleSheets";

/**
 * PUT /api/customers/update
 * Cập nhật thông tin khách hàng trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer name is required",
        },
        { status: 400 }
      );
    }

    const customer: Customer = {
      id: body.id,
      name: body.name,
      category: body.category || "",
      cccd: body.cccd || "",
      phone: body.phone || "",
      address: body.address || "",
      shippingInfo: body.shippingInfo || "",
      birthday: body.birthday || "",
      notes: body.notes || "",
    };

    await updateCustomerInSheet(customer);

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error: any) {
    console.error("Error updating customer:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update customer in Google Sheets",
      },
      { status: 500 }
    );
  }
}
