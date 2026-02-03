import { NextRequest, NextResponse } from "next/server";
import { getCnptKhDenNgayFromSheet, updateCnptKhDenNgayDate } from "@/lib/googleSheets";

/**
 * GET /api/cnpt-kh-den-ngay
 * Lấy dữ liệu Công nợ khách hàng đến ngày
 */
export async function GET() {
  try {
    const data = await getCnptKhDenNgayFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching CNPT KH den ngay:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch CNPT KH den ngay data",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cnpt-kh-den-ngay
 * Cập nhật ngày và lấy lại dữ liệu mới
 * Body: { date: "DD/MM/YYYY" } e.g., { date: "31/12/2025" }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng cung cấp ngày (format: DD/MM/YYYY)",
        },
        { status: 400 }
      );
    }

    // Cập nhật ngày vào ô J3
    await updateCnptKhDenNgayDate(date);

    // Đợi một chút để Google Sheets tính toán lại
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Lấy lại dữ liệu mới
    const data = await getCnptKhDenNgayFromSheet();

    return NextResponse.json({
      success: true,
      data,
      message: `Đã cập nhật ngày: ${date}`,
    });
  } catch (error: any) {
    console.error("Error updating CNPT KH den ngay date:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update CNPT KH den ngay date",
      },
      { status: 500 }
    );
  }
}
