import { NextResponse } from "next/server";
import {
  getCongNoDetailFromSheet,
  setSelectedCustomerForCongNo,
  getCustomersFromSheet,
} from "@/lib/googleSheets";

/**
 * GET /api/cong-no-khach-hang
 * Lấy dữ liệu công nợ chi tiết từ Google Sheets
 */
export async function GET() {
  try {
    const congNoData = await getCongNoDetailFromSheet();

    return NextResponse.json({
      success: true,
      data: congNoData,
    });
  } catch (error: any) {
    console.error("Error fetching debt tracking data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch debt tracking data from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cong-no-khach-hang
 * Cập nhật khách hàng được chọn trong sheet
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { customerName } = body;

    if (!customerName) {
      return NextResponse.json(
        { success: false, error: "Tên khách hàng là bắt buộc" },
        { status: 400 }
      );
    }

    await setSelectedCustomerForCongNo(customerName);

    // Fetch updated data
    const congNoData = await getCongNoDetailFromSheet();

    return NextResponse.json({
      success: true,
      message: "Cập nhật khách hàng thành công",
      data: congNoData,
    });
  } catch (error: any) {
    console.error("Error updating selected customer:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update selected customer in Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cong-no-khach-hang/danh-sach-khach-hang
 * Lấy danh sách khách hàng để hiển thị trong dropdown
 */
export async function getCustomerList() {
  try {
    const customers = await getCustomersFromSheet();

    return NextResponse.json({
      success: true,
      data: customers.map(c => ({ name: c.name, category: c.category })),
    });
  } catch (error: any) {
    console.error("Error fetching customer list:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch customer list",
      },
      { status: 500 }
    );
  }
}
