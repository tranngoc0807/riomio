import { NextResponse } from "next/server";
import {
  getTaiKhoanListFromSheet,
  addTaiKhoanToSheet,
  updateTaiKhoanInSheet,
  deleteTaiKhoanFromSheet,
} from "@/lib/googleSheets";
import { logEdit } from "@/lib/editHistory";
import { getCurrentUserEmail } from "@/lib/getUserEmail";

const TABLE_KEY = "tai-khoan-so-quy";
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME_TAI_KHOAN || "Thông tin tài khoản";

/**
 * GET /api/tai-khoan-so-quy
 */
export async function GET() {
  try {
    const taiKhoanList = await getTaiKhoanListFromSheet();
    return NextResponse.json({ success: true, data: taiKhoanList });
  } catch (error: any) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch accounts from Google Sheets" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tai-khoan-so-quy
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

    const newData = { taiKhoan };
    await addTaiKhoanToSheet(newData);

    const taiKhoanList = await getTaiKhoanListFromSheet();
    const userEmail = await getCurrentUserEmail();
    const added = taiKhoanList[taiKhoanList.length - 1];
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
      message: "Thêm tài khoản thành công",
      data: taiKhoanList,
    });
  } catch (error: any) {
    console.error("Error adding account:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add account to Google Sheets" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tai-khoan-so-quy
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

    const rowIdx = typeof rowIndex === "number" ? rowIndex : parseInt(rowIndex);
    const before = await getTaiKhoanListFromSheet();
    const oldRow = before.find((r) => r.rowIndex === rowIdx) ?? null;
    const oldData = oldRow ? { taiKhoan: oldRow.taiKhoan } : null;

    const newData = { taiKhoan };
    await updateTaiKhoanInSheet(rowIdx, newData);

    const taiKhoanList = await getTaiKhoanListFromSheet();
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
      message: "Cập nhật tài khoản thành công",
      data: taiKhoanList,
    });
  } catch (error: any) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update account in Google Sheets" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tai-khoan-so-quy
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

    const rowIdx = parseInt(rowIndex);
    const before = await getTaiKhoanListFromSheet();
    const oldRow = before.find((r) => r.rowIndex === rowIdx) ?? null;
    const oldData = oldRow ? { taiKhoan: oldRow.taiKhoan } : null;

    await deleteTaiKhoanFromSheet(rowIdx);

    const taiKhoanList = await getTaiKhoanListFromSheet();
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
      message: "Xóa tài khoản thành công",
      data: taiKhoanList,
    });
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete account from Google Sheets" },
      { status: 500 }
    );
  }
}
