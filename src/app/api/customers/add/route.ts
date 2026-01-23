import { NextRequest, NextResponse } from "next/server";
import { addCustomerToSheet, Customer } from "@/lib/googleSheets";

/**
 * POST /api/customers/add
 * Thêm khách hàng mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
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
      id: body.id || Date.now(),
      name: body.name,
      category: body.category || "",
      cccd: body.cccd || "",
      phone: body.phone || "",
      address: body.address || "",
      shippingInfo: body.shippingInfo || "",
      birthday: body.birthday || "",
      notes: body.notes || "",
      rowIndex: 0, // Will be assigned when added to sheet
    };

    await addCustomerToSheet(customer);

    return NextResponse.json({
      success: true,
      message: "Customer added successfully",
      data: customer,
    });
  } catch (error: any) {
    console.error("Error adding customer:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add customer to Google Sheets",
      },
      { status: 500 }
    );
  }
}
