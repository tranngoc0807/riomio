import { NextResponse } from "next/server";
import {
  getBCQuyTheoNgayData,
  updateDateAndGetBCQuyData,
} from "@/lib/googleSheets";

/**
 * GET /api/bc-quy-theo-ngay
 * Lấy dữ liệu BC quỹ theo ngày từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getBCQuyTheoNgayData();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching BC Quy Theo Ngay:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch BC Quy Theo Ngay from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bc-quy-theo-ngay
 * Cập nhật ngày cho một bảng và trả về dữ liệu mới
 * Body: { tableNumber: 1 | 2, date: string }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tableNumber, date } = body;

    if (!tableNumber || !date) {
      return NextResponse.json(
        { success: false, error: "tableNumber và date là bắt buộc" },
        { status: 400 }
      );
    }

    if (tableNumber !== 1 && tableNumber !== 2) {
      return NextResponse.json(
        { success: false, error: "tableNumber phải là 1 hoặc 2" },
        { status: 400 }
      );
    }

    const data = await updateDateAndGetBCQuyData(tableNumber, date);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật ngày cho bảng ${tableNumber}`,
      data,
    });
  } catch (error: any) {
    console.error("Error updating BC Quy Theo Ngay date:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update date in Google Sheets",
      },
      { status: 500 }
    );
  }
}
