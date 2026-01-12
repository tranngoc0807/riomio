import { NextResponse } from "next/server";
import { getPhieuGiaCongFromSheet, updatePhieuGiaCongSelection } from "@/lib/googleSheets";

/**
 * GET /api/phieu-gia-cong
 * Lấy thông tin phiếu gia công hiện tại từ Google Sheets
 */
export async function GET() {
  try {
    const phieuData = await getPhieuGiaCongFromSheet();

    return NextResponse.json({
      success: true,
      data: phieuData,
    });
  } catch (error: any) {
    console.error("Error fetching phieu gia cong:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch phiếu gia công",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/phieu-gia-cong
 * Cập nhật mã phiếu gia công được chọn (thay đổi cell B3)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maPhieu } = body;

    if (!maPhieu) {
      return NextResponse.json(
        { success: false, error: "Mã phiếu is required" },
        { status: 400 }
      );
    }

    await updatePhieuGiaCongSelection(maPhieu);

    return NextResponse.json({
      success: true,
      message: `Đã chọn phiếu: ${maPhieu}`,
    });
  } catch (error: any) {
    console.error("Error updating phieu gia cong:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update phiếu gia công",
      },
      { status: 500 }
    );
  }
}
