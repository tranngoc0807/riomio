import { NextRequest, NextResponse } from "next/server";
import { getPhieuBaoSLCatFromSheet, updatePhieuBaoSLCatMaPhieu } from "@/lib/googleSheets";

/**
 * GET /api/phieu-bao-sl-cat
 * Lấy dữ liệu phiếu báo số lượng cắt từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getPhieuBaoSLCatFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching phieu bao sl cat:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch phieu bao sl cat",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/phieu-bao-sl-cat
 * Cập nhật mã phiếu để thay đổi phiếu hiển thị
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maPhieu } = body;

    if (!maPhieu) {
      return NextResponse.json(
        { success: false, error: "Mã phiếu is required" },
        { status: 400 }
      );
    }

    await updatePhieuBaoSLCatMaPhieu(maPhieu);

    return NextResponse.json({
      success: true,
      message: "Updated ma phieu successfully",
    });
  } catch (error: any) {
    console.error("Error updating phieu bao sl cat:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update phieu bao sl cat",
      },
      { status: 500 }
    );
  }
}
