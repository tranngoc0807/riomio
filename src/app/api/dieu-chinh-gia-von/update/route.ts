import { NextResponse } from "next/server";
import { updateDieuChinhGiaVon } from "@/lib/googleSheets";

/**
 * PUT /api/dieu-chinh-gia-von/update
 * Cập nhật điều chỉnh giá vốn
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, maSP, dieuChinhGiaVon, ghiChu } = body;

    if (!id || !maSP) {
      return NextResponse.json(
        { success: false, error: "ID và Mã SP là bắt buộc" },
        { status: 400 }
      );
    }

    await updateDieuChinhGiaVon(id, maSP, dieuChinhGiaVon || 0, ghiChu || "");

    return NextResponse.json({
      success: true,
      message: "Cập nhật điều chỉnh giá vốn thành công",
    });
  } catch (error: any) {
    console.error("Error updating dieu chinh gia von:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update dieu chinh gia von",
      },
      { status: 500 }
    );
  }
}
