import { NextRequest, NextResponse } from "next/server";
import { getCnptKhTheoThangFromSheet, updateCnptKhTheoThangDate } from "@/lib/googleSheets";

/**
 * GET /api/cnpt-kh-theo-thang
 * Lấy dữ liệu Công nợ phải thu khách hàng theo tháng
 */
export async function GET() {
  try {
    const data = await getCnptKhTheoThangFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching CNPT KH theo thang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch CNPT KH theo thang data",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cnpt-kh-theo-thang
 * Cập nhật ngày tháng và lấy lại dữ liệu mới
 * Body: { date: "M/YYYY" } e.g., { date: "1/2026" }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng cung cấp ngày tháng (format: M/YYYY)",
        },
        { status: 400 }
      );
    }

    // Cập nhật ngày tháng vào ô C3
    await updateCnptKhTheoThangDate(date);

    // Đợi một chút để Google Sheets tính toán lại
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Lấy lại dữ liệu mới
    const data = await getCnptKhTheoThangFromSheet();

    return NextResponse.json({
      success: true,
      data,
      message: `Đã cập nhật ngày tháng: ${date}`,
    });
  } catch (error: any) {
    console.error("Error updating CNPT KH theo thang date:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update CNPT KH theo thang date",
      },
      { status: 500 }
    );
  }
}
