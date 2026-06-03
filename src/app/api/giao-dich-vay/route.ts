import { NextRequest, NextResponse } from "next/server";
import {
  getGiaoDichVayFromSheet,
  addGiaoDichVayToSheet,
  updateGiaoDichVayInSheet,
  deleteGiaoDichVayFromSheet,
} from "@/lib/googleSheets";

/**
 * GET /api/giao-dich-vay
 * Lấy sổ giao dịch vay từ sheet "Giao dịch vay"
 */
export async function GET() {
  try {
    const data = await getGiaoDichVayFromSheet();
    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch giao dịch vay" },
      { status: 500 },
    );
  }
}

function pickInput(body: any) {
  return {
    ngay: body.ngay || "",
    maMonVay: body.maMonVay || "",
    nguoiChoVay: body.nguoiChoVay || "",
    loaiGD: body.loaiGD || "",
    soTien: Number(body.soTien) || 0,
    ghiChu: body.ghiChu || "",
  };
}

/**
 * POST /api/giao-dich-vay — thêm giao dịch mới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.maMonVay) {
      return NextResponse.json(
        { success: false, error: "Mã món vay là bắt buộc" },
        { status: 400 },
      );
    }
    await addGiaoDichVayToSheet(pickInput(body));
    const data = await getGiaoDichVayFromSheet();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add giao dịch vay" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/giao-dich-vay — cập nhật giao dịch (theo rowIndex)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.rowIndex) {
      return NextResponse.json(
        { success: false, error: "rowIndex là bắt buộc" },
        { status: 400 },
      );
    }
    if (!body.maMonVay) {
      return NextResponse.json(
        { success: false, error: "Mã món vay là bắt buộc" },
        { status: 400 },
      );
    }
    await updateGiaoDichVayInSheet(parseInt(String(body.rowIndex)), pickInput(body));
    const data = await getGiaoDichVayFromSheet();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update giao dịch vay" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/giao-dich-vay?rowIndex=5 — xóa giao dịch (xóa hẳn dòng)
 */
export async function DELETE(request: NextRequest) {
  try {
    const rowIndex = request.nextUrl.searchParams.get("rowIndex");
    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "rowIndex là bắt buộc" },
        { status: 400 },
      );
    }
    await deleteGiaoDichVayFromSheet(parseInt(rowIndex));
    const data = await getGiaoDichVayFromSheet();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete giao dịch vay" },
      { status: 500 },
    );
  }
}
