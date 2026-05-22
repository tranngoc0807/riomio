import { NextResponse } from "next/server";
import {
  getChiPhiBanHangFromSheet,
  addChiPhiBanHang,
  updateChiPhiBanHang,
  deleteChiPhiBanHang,
} from "@/lib/googleSheets";
import { logEdit } from "@/lib/editHistory";
import { getCurrentUserEmail } from "@/lib/getUserEmail";

const TABLE_KEY = "chi-phi-ban-hang";
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME_CHI_PHI_BAN_HANG || "Chi phí bán hàng trực tiếp";

/**
 * GET /api/chi-phi-ban-hang
 */
export async function GET() {
  try {
    const chiPhiList = await getChiPhiBanHangFromSheet();
    return NextResponse.json({ success: true, data: chiPhiList });
  } catch (error: any) {
    console.error("Error fetching chi phi ban hang:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch chi phi ban hang from Google Sheets" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chi-phi-ban-hang
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ngayThang, nguoiChi, noiDung, phanLoai, soTien, maPhieuChi } = body;

    if (!ngayThang || !noiDung) {
      return NextResponse.json(
        { success: false, error: "Ngày tháng và nội dung là bắt buộc" },
        { status: 400 }
      );
    }

    const newData = {
      ngayThang,
      nguoiChi: nguoiChi || "",
      noiDung,
      phanLoai: phanLoai || "",
      soTien: soTien || 0,
      maPhieuChi: maPhieuChi || "",
    };

    await addChiPhiBanHang(newData);

    const chiPhiList = await getChiPhiBanHangFromSheet();
    const userEmail = await getCurrentUserEmail();
    const added = chiPhiList[chiPhiList.length - 1];
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
      message: "Thêm chi phí thành công",
      data: chiPhiList,
    });
  } catch (error: any) {
    console.error("Error adding chi phi ban hang:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add chi phi ban hang" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chi-phi-ban-hang
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, ngayThang, nguoiChi, noiDung, phanLoai, soTien, maPhieuChi } = body;

    if (!rowIndex || !ngayThang || !noiDung) {
      return NextResponse.json(
        { success: false, error: "Row index, ngày tháng và nội dung là bắt buộc" },
        { status: 400 }
      );
    }

    const rowIdx = typeof rowIndex === "number" ? rowIndex : parseInt(rowIndex);
    const before = await getChiPhiBanHangFromSheet();
    const oldRow = before.find((r) => r.rowIndex === rowIdx) ?? null;
    const oldData = oldRow ? toPlain(oldRow as unknown as Record<string, unknown>) : null;

    const newData = {
      ngayThang,
      nguoiChi: nguoiChi || "",
      noiDung,
      phanLoai: phanLoai || "",
      soTien: soTien || 0,
      maPhieuChi: maPhieuChi || "",
    };

    await updateChiPhiBanHang(rowIdx, newData);

    const chiPhiList = await getChiPhiBanHangFromSheet();
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
      message: "Cập nhật chi phí thành công",
      data: chiPhiList,
    });
  } catch (error: any) {
    console.error("Error updating chi phi ban hang:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update chi phi ban hang" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chi-phi-ban-hang
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
    const before = await getChiPhiBanHangFromSheet();
    const oldRow = before.find((r) => r.rowIndex === rowIdx) ?? null;
    const oldData = oldRow ? toPlain(oldRow as unknown as Record<string, unknown>) : null;

    await deleteChiPhiBanHang(rowIdx);

    const chiPhiList = await getChiPhiBanHangFromSheet();
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
      message: "Xóa chi phí thành công",
      data: chiPhiList,
    });
  } catch (error: any) {
    console.error("Error deleting chi phi ban hang:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete chi phi ban hang" },
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
