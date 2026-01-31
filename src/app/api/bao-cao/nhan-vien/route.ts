import { NextResponse } from "next/server";
import { getBaoCaoNhanVien } from "@/lib/googleSheets";

/**
 * GET /api/bao-cao/nhan-vien
 * Lấy dữ liệu báo cáo bán hàng theo nhân viên
 */
export async function GET() {
  try {
    const data = await getBaoCaoNhanVien();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching bao cao nhan vien:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bao cao nhan vien",
      },
      { status: 500 }
    );
  }
}
