import { NextRequest, NextResponse } from "next/server";
import {
  getPhieuDinhMucSXFromSheet,
  updatePhieuDinhMucSXMaSP,
} from "@/lib/googleSheets";

/**
 * GET /api/phieu-dinh-muc-sx
 * Lấy dữ liệu phiếu định mức sản xuất từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getPhieuDinhMucSXFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching phieu dinh muc sx:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch phieu dinh muc sx",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/phieu-dinh-muc-sx
 * Cập nhật mã SP trong phiếu định mức sản xuất
 * Body: { maSP: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maSP } = body;

    if (!maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng chọn mã SP",
        },
        { status: 400 }
      );
    }

    const data = await updatePhieuDinhMucSXMaSP(maSP);

    return NextResponse.json({
      success: true,
      data,
      message: "Đã cập nhật mã SP thành công",
    });
  } catch (error: any) {
    console.error("Error updating phieu dinh muc sx:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update phieu dinh muc sx",
      },
      { status: 500 }
    );
  }
}
