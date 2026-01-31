import { NextResponse } from "next/server";
import { getBaoCaoSanPham } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/san-pham
 * Lấy dữ liệu báo cáo doanh thu theo sản phẩm
 */
export async function GET() {
  try {
    const data = await getBaoCaoSanPham();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao san pham:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao san pham",
      },
      { status: 500 }
    );
  }
}
