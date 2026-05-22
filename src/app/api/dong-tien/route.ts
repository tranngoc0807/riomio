import { NextResponse } from "next/server";
import {
  getDongTienFromSheet,
  addDongTienToSheet,
  updateDongTienInSheet,
  deleteDongTienFromSheet,
} from "@/lib/googleSheets";
import { logEdit } from "@/lib/editHistory";
import { getCurrentUserEmail } from "@/lib/getUserEmail";

const TABLE_KEY = "dong-tien";
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME_DONG_TIEN || "Dòng tiền";

/**
 * GET /api/dong-tien
 * Lấy danh sách dòng tiền từ Google Sheets
 */
export async function GET() {
  try {
    const dongTienList = await getDongTienFromSheet();

    return NextResponse.json({
      success: true,
      data: dongTienList,
    });
  } catch (error: any) {
    console.error("Error fetching cash flow data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch cash flow data from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dong-tien
 * Thêm dòng tiền mới vào Google Sheets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ngayThang,
      tenTK,
      nccNPL,
      xuongSX,
      chiVanChuyen,
      thuTienHang,
      thuKhac,
      chiKhac,
      maPhieuThu,
      maPhieuChi,
      doiTuong,
      noiDung,
      phanLoaiThuChi,
      tongThu,
      tongChi,
      ghiChu,
    } = body;

    if (!tenTK || !phanLoaiThuChi) {
      return NextResponse.json(
        { success: false, error: "Tên TK và Phân loại thu chi là bắt buộc" },
        { status: 400 }
      );
    }

    const newData = {
      ngayThang: ngayThang || "",
      tenTK,
      nccNPL: nccNPL || "",
      xuongSX: xuongSX || "",
      chiVanChuyen: chiVanChuyen || "",
      thuTienHang: thuTienHang || "",
      thuKhac: thuKhac || "",
      chiKhac: chiKhac || "",
      maPhieuThu: maPhieuThu || "",
      maPhieuChi: maPhieuChi || "",
      doiTuong: doiTuong || "",
      noiDung: noiDung || "",
      phanLoaiThuChi,
      tongThu: tongThu || "",
      tongChi: tongChi || "",
      ghiChu: ghiChu || "",
    };

    await addDongTienToSheet(newData);

    const dongTienList = await getDongTienFromSheet();
    const userEmail = await getCurrentUserEmail();
    const added = dongTienList[dongTienList.length - 1];
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
      message: "Thêm dòng tiền thành công",
      data: dongTienList,
    });
  } catch (error: any) {
    console.error("Error adding cash flow:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add cash flow to Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dong-tien
 * Cập nhật dòng tiền trong Google Sheets
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      rowIndex,
      ngayThang,
      tenTK,
      nccNPL,
      xuongSX,
      chiVanChuyen,
      thuTienHang,
      thuKhac,
      chiKhac,
      maPhieuThu,
      maPhieuChi,
      doiTuong,
      noiDung,
      phanLoaiThuChi,
      tongThu,
      tongChi,
      ghiChu,
    } = body;

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "Row index là bắt buộc" },
        { status: 400 }
      );
    }

    if (!tenTK || !phanLoaiThuChi) {
      return NextResponse.json(
        { success: false, error: "Tên TK và Phân loại thu chi là bắt buộc" },
        { status: 400 }
      );
    }

    const rowIdx = parseInt(rowIndex);
    const before = await getDongTienFromSheet();
    const oldRow = before.find((r) => r.rowIndex === rowIdx) ?? null;
    const oldData = oldRow ? toPlain(oldRow as unknown as Record<string, unknown>) : null;

    const newData = {
      ngayThang: ngayThang || "",
      tenTK,
      nccNPL: nccNPL || "",
      xuongSX: xuongSX || "",
      chiVanChuyen: chiVanChuyen || "",
      thuTienHang: thuTienHang || "",
      thuKhac: thuKhac || "",
      chiKhac: chiKhac || "",
      maPhieuThu: maPhieuThu || "",
      maPhieuChi: maPhieuChi || "",
      doiTuong: doiTuong || "",
      noiDung: noiDung || "",
      phanLoaiThuChi,
      tongThu: tongThu || "",
      tongChi: tongChi || "",
      ghiChu: ghiChu || "",
    };

    await updateDongTienInSheet(rowIdx, newData);

    const dongTienList = await getDongTienFromSheet();
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
      message: "Cập nhật dòng tiền thành công",
      data: dongTienList,
    });
  } catch (error: any) {
    console.error("Error updating cash flow:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update cash flow in Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dong-tien
 * Xóa dòng tiền khỏi Google Sheets
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
    const before = await getDongTienFromSheet();
    const oldRow = before.find((r) => r.rowIndex === rowIdx) ?? null;
    const oldData = oldRow ? toPlain(oldRow as unknown as Record<string, unknown>) : null;

    await deleteDongTienFromSheet(rowIdx);

    const dongTienList = await getDongTienFromSheet();
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
      message: "Xóa dòng tiền thành công",
      data: dongTienList,
    });
  } catch (error: any) {
    console.error("Error deleting cash flow:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete cash flow from Google Sheets",
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
