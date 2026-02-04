import { NextRequest, NextResponse } from "next/server";
import { getBaoHiemFromSheet, saveBaoHiemToSheet, updateBaoHiemRow, deleteBaoHiemRow, BaoHiemNhanVien } from "@/lib/googleSheets";

/**
 * GET /api/bao-hiem?thang=1&nam=2025
 * Lấy dữ liệu bảo hiểm nhân viên theo tháng/năm
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const thang = parseInt(searchParams.get("thang") || "0");
    const nam = parseInt(searchParams.get("nam") || "0");

    if (!thang || !nam) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu tham số tháng hoặc năm",
        },
        { status: 400 }
      );
    }

    const data = await getBaoHiemFromSheet(thang, nam);

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      thang,
      nam,
    });
  } catch (error: any) {
    console.error("Error fetching insurance data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch insurance data",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bao-hiem
 * Lưu dữ liệu bảo hiểm nhân viên
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: BaoHiemNhanVien[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu không hợp lệ",
        },
        { status: 400 }
      );
    }

    const result = await saveBaoHiemToSheet(data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error saving insurance data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save insurance data",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bao-hiem
 * Cập nhật một dòng bảo hiểm
 * Body: { rowNumber: number, data: Partial<BaoHiemNhanVien> }
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

    const result = await updateBaoHiemRow(rowNumber, data);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error updating insurance data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update insurance data",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bao-hiem
 * Xoá một dòng bảo hiểm
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

    const result = await deleteBaoHiemRow(rowNumber);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error deleting insurance data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete insurance data",
      },
      { status: 500 }
    );
  }
}
