import { NextResponse } from "next/server";
import {
  getTaiKhoanListFromSheet,
  addTaiKhoanToSheet,
  updateTaiKhoanInSheet,
  deleteTaiKhoanFromSheet,
} from "@/lib/googleSheets";

/**
 * GET /api/tai-khoan-so-quy
 * Lấy danh sách tài khoản từ Google Sheets
 */
export async function GET() {
  try {
    const taiKhoanList = await getTaiKhoanListFromSheet();

    return NextResponse.json({
      success: true,
      data: taiKhoanList,
    });
  } catch (error: any) {
    console.error("Error fetching accounts:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch accounts from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tai-khoan-so-quy
 * Thêm tài khoản mới vào Google Sheets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taiKhoan } = body;

    if (!taiKhoan) {
      return NextResponse.json(
        { success: false, error: "Tên tài khoản là bắt buộc" },
        { status: 400 }
      );
    }

    await addTaiKhoanToSheet({ taiKhoan });

    // Fetch updated list
    const taiKhoanList = await getTaiKhoanListFromSheet();

    return NextResponse.json({
      success: true,
      message: "Thêm tài khoản thành công",
      data: taiKhoanList,
    });
  } catch (error: any) {
    console.error("Error adding account:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add account to Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tai-khoan-so-quy
 * Cập nhật tài khoản trong Google Sheets
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, taiKhoan } = body;

    if (!rowIndex || !taiKhoan) {
      return NextResponse.json(
        { success: false, error: "rowIndex và tên tài khoản là bắt buộc" },
        { status: 400 }
      );
    }

    await updateTaiKhoanInSheet(rowIndex, { taiKhoan });

    // Fetch updated list
    const taiKhoanList = await getTaiKhoanListFromSheet();

    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản thành công",
      data: taiKhoanList,
    });
  } catch (error: any) {
    console.error("Error updating account:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update account in Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tai-khoan-so-quy
 * Xóa tài khoản khỏi Google Sheets
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "rowIndex là bắt buộc" },
        { status: 400 }
      );
    }

    await deleteTaiKhoanFromSheet(parseInt(rowIndex));

    // Fetch updated list
    const taiKhoanList = await getTaiKhoanListFromSheet();

    return NextResponse.json({
      success: true,
      message: "Xóa tài khoản thành công",
      data: taiKhoanList,
    });
  } catch (error: any) {
    console.error("Error deleting account:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete account from Google Sheets",
      },
      { status: 500 }
    );
  }
}
