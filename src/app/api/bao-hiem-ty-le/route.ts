import { NextRequest, NextResponse } from "next/server";
import { getBaoHiemTyLeFromSheet, saveBaoHiemTyLeToSheet, updateBaoHiemTyLeRow, deleteBaoHiemTyLeRow } from "@/lib/googleSheets";

/**
 * GET /api/bao-hiem-ty-le
 * Lấy dữ liệu tỷ lệ bảo hiểm
 */
export async function GET() {
  try {
    const data = await getBaoHiemTyLeFromSheet();

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: any) {
    console.error("Error fetching insurance rates:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch insurance rates",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bao-hiem-ty-le
 * Lưu tỷ lệ bảo hiểm mới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batDau, ketThuc, loaiBH, bhxhDN, bhxhNV, bhytDN, bhytNV, bhtnDN, bhtnNV } = body;

    if (!batDau || !ketThuc) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ngày bắt đầu hoặc kết thúc",
        },
        { status: 400 }
      );
    }

    const result = await saveBaoHiemTyLeToSheet({
      batDau,
      ketThuc,
      loaiBH: loaiBH || "Tỷ lệ",
      bhxhDN: bhxhDN || 0,
      bhxhNV: bhxhNV || 0,
      bhytDN: bhytDN || 0,
      bhytNV: bhytNV || 0,
      bhtnDN: bhtnDN || 0,
      bhtnNV: bhtnNV || 0,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error saving insurance rate:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save insurance rate",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bao-hiem-ty-le
 * Cập nhật tỷ lệ bảo hiểm
 * Body: { rowNumber: number, data: Partial<BaoHiemTyLe> }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowNumber, data } = body;

    if (!rowNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu rowNumber",
        },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu dữ liệu cập nhật",
        },
        { status: 400 }
      );
    }

    const result = await updateBaoHiemTyLeRow(rowNumber, data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error updating insurance rate:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update insurance rate",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bao-hiem-ty-le
 * Xoá tỷ lệ bảo hiểm
 * Body: { rowNumber: number }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowNumber } = body;

    if (!rowNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu rowNumber",
        },
        { status: 400 }
      );
    }

    const result = await deleteBaoHiemTyLeRow(rowNumber);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error deleting insurance rate:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete insurance rate",
      },
      { status: 500 }
    );
  }
}
