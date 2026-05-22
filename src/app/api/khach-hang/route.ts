import { NextResponse } from "next/server";
import {
  getCustomersFromSheet,
  addCustomerToSheet,
  updateCustomerInSheet,
  deleteCustomerFromSheet,
} from "@/lib/googleSheets";
import { logEdit } from "@/lib/editHistory";
import { getCurrentUserEmail } from "@/lib/getUserEmail";

const TABLE_KEY = "khach-hang";
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME_KHACH_HANG || "DS KH";

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

    const newData = {
      name,
      category: category || "",
      cccd: cccd || "",
      phone: phone || "",
      address: address || "",
      shippingInfo: shippingInfo || "",
      birthday: birthday || "",
      notes: notes || "",
    };

    await addCustomerToSheet({ ...newData, rowIndex: 0 });

    const customers = await getCustomersFromSheet();
    const userEmail = await getCurrentUserEmail();
    const added = customers[customers.length - 1];
    logEdit({
      source: "app",
      action: "add",
      tableKey: TABLE_KEY,
      sheetName: SHEET_NAME,
      rowIndex: added?.rowIndex ?? null,
      newData,
      userEmail,
    });

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

    const rowIdx = parseInt(rowIndex);
    const before = await getCustomersFromSheet();
    const oldRow = before.find((r) => r.rowIndex === rowIdx) ?? null;
    const oldData = oldRow ? toPlain(oldRow as unknown as Record<string, unknown>) : null;

    const newData = {
      name,
      category: category || "",
      cccd: cccd || "",
      phone: phone || "",
      address: address || "",
      shippingInfo: shippingInfo || "",
      birthday: birthday || "",
      notes: notes || "",
    };

    await updateCustomerInSheet(rowIdx, newData);

    const customers = await getCustomersFromSheet();
    const userEmail = await getCurrentUserEmail();
    logEdit({
      source: "app",
      action: "update",
      tableKey: TABLE_KEY,
      sheetName: SHEET_NAME,
      rowIndex: rowIdx,
      oldData,
      newData,
      userEmail,
    });

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

    const rowIdx = parseInt(rowIndex);
    const before = await getCustomersFromSheet();
    const oldRow = before.find((r) => r.rowIndex === rowIdx) ?? null;
    const oldData = oldRow ? toPlain(oldRow as unknown as Record<string, unknown>) : null;

    await deleteCustomerFromSheet(rowIdx);

    const customers = await getCustomersFromSheet();
    const userEmail = await getCurrentUserEmail();
    logEdit({
      source: "app",
      action: "delete",
      tableKey: TABLE_KEY,
      sheetName: SHEET_NAME,
      rowIndex: rowIdx,
      oldData,
      userEmail,
    });

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

function toPlain(obj: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, rowIndex: _rowIndex, ...rest } = obj;
  void _id;
  void _rowIndex;
  return rest;
}
