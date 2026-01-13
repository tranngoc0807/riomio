import { NextResponse } from "next/server";
import { getLSXInfoFromSheet, updateLSXMaLenh } from "@/lib/googleSheets";

/**
 * GET /api/lsx
 * Lấy thông tin Lệnh Sản Xuất từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getLSXInfoFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching LSX:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch LSX",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lsx
 * Cập nhật mã lệnh LSX để thay đổi lệnh sản xuất hiển thị
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maLenh } = body;

    if (!maLenh) {
      return NextResponse.json(
        { success: false, error: "Mã lệnh is required" },
        { status: 400 }
      );
    }

    await updateLSXMaLenh(maLenh);

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật mã lệnh thành công",
    });
  } catch (error: any) {
    console.error("Error updating LSX ma lenh:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update LSX ma lenh",
      },
      { status: 500 }
    );
  }
}
