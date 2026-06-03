import { NextRequest, NextResponse } from "next/server";
import {
  getLaiVayFromSheet,
  addLaiVayToSheet,
  updateLaiVayInSheet,
  deleteLaiVayFromSheet,
} from "@/lib/googleSheets";

/**
 * GET /api/lai-vay
 * Lấy danh sách lãi vay (người cho vay) từ sheet "Lãi vay"
 */
export async function GET() {
  try {
    const data = await getLaiVayFromSheet();
    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lãi vay" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/lai-vay
 * Thêm người cho vay mới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nguoiChoVay) {
      return NextResponse.json(
        { success: false, error: "Người cho vay là bắt buộc" },
        { status: 400 },
      );
    }

    await addLaiVayToSheet({
      stt: body.stt != null ? String(body.stt) : "",
      nguoiChoVay: body.nguoiChoVay,
      laiSuatNam: body.laiSuatNam || "",
      cachTinhLai: body.cachTinhLai || "",
      ghiChu: body.ghiChu || "",
    });

    const data = await getLaiVayFromSheet();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add lãi vay" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/lai-vay
 * Cập nhật người cho vay (theo rowIndex)
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
    if (!body.nguoiChoVay) {
      return NextResponse.json(
        { success: false, error: "Người cho vay là bắt buộc" },
        { status: 400 },
      );
    }

    await updateLaiVayInSheet(parseInt(String(body.rowIndex)), {
      stt: body.stt != null ? String(body.stt) : "",
      nguoiChoVay: body.nguoiChoVay,
      laiSuatNam: body.laiSuatNam || "",
      cachTinhLai: body.cachTinhLai || "",
      ghiChu: body.ghiChu || "",
    });

    const data = await getLaiVayFromSheet();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lãi vay" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/lai-vay?rowIndex=8
 * Xóa người cho vay (theo rowIndex)
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

    await deleteLaiVayFromSheet(parseInt(rowIndex));

    const data = await getLaiVayFromSheet();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete lãi vay" },
      { status: 500 },
    );
  }
}
