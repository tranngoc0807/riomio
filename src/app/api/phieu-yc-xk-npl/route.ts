import { NextRequest, NextResponse } from "next/server";
import { getPhieuYCXKNPLFromSheet, updatePhieuYCXKNPLMaYeuCau } from "@/lib/googleSheets";

/**
 * GET /api/phieu-yc-xk-npl
 * Lấy dữ liệu phiếu yêu cầu xuất kho NPL từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getPhieuYCXKNPLFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching phieu yc xk npl:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch phieu yc xk npl",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/phieu-yc-xk-npl
 * Cập nhật mã yêu cầu để thay đổi phiếu hiển thị
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maYeuCau } = body;

    if (!maYeuCau) {
      return NextResponse.json(
        { success: false, error: "Mã yêu cầu is required" },
        { status: 400 }
      );
    }

    await updatePhieuYCXKNPLMaYeuCau(maYeuCau);

    return NextResponse.json({
      success: true,
      message: "Updated ma yeu cau successfully",
    });
  } catch (error: any) {
    console.error("Error updating phieu yc xk npl:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update phieu yc xk npl",
      },
      { status: 500 }
    );
  }
}
