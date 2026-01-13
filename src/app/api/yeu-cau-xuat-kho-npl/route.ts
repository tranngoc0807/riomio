import { NextResponse } from "next/server";
import { getYeuCauXuatKhoNPLFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/yeu-cau-xuat-kho-npl
 * Lấy dữ liệu bảng kê yêu cầu xuất kho NPL từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getYeuCauXuatKhoNPLFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching yeu cau xuat kho npl:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch yeu cau xuat kho npl",
      },
      { status: 500 }
    );
  }
}
