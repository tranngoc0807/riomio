import { NextResponse } from "next/server";
import {
  getCustomersFromSheet,
  addCustomerToSheet,
  updateCustomerInSheet,
  deleteCustomerFromSheet,
  Customer,
} from "@/lib/googleSheets";

/**
 * GET /api/khach-hang
 * Lấy danh sách khách hàng từ Google Sheets
 */
export async function GET() {
  try {
    const customers = await getCustomersFromSheet();

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch customers from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/khach-hang
 * Thêm khách hàng mới vào Google Sheets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, cccd, phone, address, shippingInfo, birthday, notes } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Tên khách hàng là bắt buộc" },
        { status: 400 }
      );
    }

    await addCustomerToSheet({
      name,
      category: category || "",
      cccd: cccd || "",
      phone: phone || "",
      address: address || "",
      shippingInfo: shippingInfo || "",
      birthday: birthday || "",
      notes: notes || "",
      rowIndex: 0, // Will be assigned when added to sheet
    });

    // Fetch updated data
    const customers = await getCustomersFromSheet();

    return NextResponse.json({
      success: true,
      message: "Thêm khách hàng thành công",
      data: customers,
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

/**
 * PUT /api/khach-hang
 * Cập nhật thông tin khách hàng trong Google Sheets
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, name, category, cccd, phone, address, shippingInfo, birthday, notes } = body;

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "Row index là bắt buộc" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Tên khách hàng là bắt buộc" },
        { status: 400 }
      );
    }

    await updateCustomerInSheet(parseInt(rowIndex), {
      name,
      category: category || "",
      cccd: cccd || "",
      phone: phone || "",
      address: address || "",
      shippingInfo: shippingInfo || "",
      birthday: birthday || "",
      notes: notes || "",
    });

    // Fetch updated data
    const customers = await getCustomersFromSheet();

    return NextResponse.json({
      success: true,
      message: "Cập nhật khách hàng thành công",
      data: customers,
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

/**
 * DELETE /api/khach-hang
 * Xóa khách hàng khỏi Google Sheets
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "Row index là bắt buộc" },
        { status: 400 }
      );
    }

    await deleteCustomerFromSheet(parseInt(rowIndex));

    // Fetch updated data
    const customers = await getCustomersFromSheet();

    return NextResponse.json({
      success: true,
      message: "Xóa khách hàng thành công",
      data: customers,
    });
  } catch (error: any) {
    console.error("Error deleting customer:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete customer from Google Sheets",
      },
      { status: 500 }
    );
  }
}
