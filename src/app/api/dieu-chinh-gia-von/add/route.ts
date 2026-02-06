import { NextResponse } from "next/server";
import { addDieuChinhGiaVon } from "@/lib/googleSheets";

/**
 * POST /api/dieu-chinh-gia-von/add
 * Thêm điều chỉnh giá vốn mới
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maSP, dieuChinhGiaVon, ghiChu } = body;

    if (!maSP) {
      return NextResponse.json(
        { success: false, error: "Mã SP là bắt buộc" },
        { status: 400 }
      );
    }

    await addDieuChinhGiaVon(maSP, dieuChinhGiaVon || 0, ghiChu || "");

    return NextResponse.json({
      success: true,
      message: "Thêm điều chỉnh giá vốn thành công",
    });
  } catch (error: any) {
    console.error("Error adding dieu chinh gia von:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add dieu chinh gia von",
      },
      { status: 500 }
    );
  }
}
