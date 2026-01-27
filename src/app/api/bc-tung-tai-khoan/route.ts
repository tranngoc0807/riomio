import { NextResponse } from "next/server";
import {
  getBCTungTaiKhoanData,
  updateAccountAndGetBCTungTaiKhoanData,
} from "@/lib/googleSheets";

/**
 * GET /api/bc-tung-tai-khoan
 * Lấy dữ liệu BC từng tài khoản từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getBCTungTaiKhoanData();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching BC Tung Tai Khoan:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch BC Tung Tai Khoan from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bc-tung-tai-khoan
 * Cập nhật tài khoản được chọn và trả về dữ liệu mới
 * Body: { account: string }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { account } = body;

    if (!account) {
      return NextResponse.json(
        { success: false, error: "account là bắt buộc" },
        { status: 400 }
      );
    }

    const data = await updateAccountAndGetBCTungTaiKhoanData(account);

    return NextResponse.json({
      success: true,
      message: `Đã chọn tài khoản: ${account}`,
      data,
    });
  } catch (error: any) {
    console.error("Error updating BC Tung Tai Khoan account:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update account in Google Sheets",
      },
      { status: 500 }
    );
  }
}
