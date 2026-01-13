import { NextResponse } from "next/server";
import { updateChiTietMaSPInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/chi-tiet-ma-sp/update
 * Cập nhật chi tiết mã sản phẩm
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { maSP, ...data } = body;

    if (!maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã sản phẩm không được để trống",
        },
        { status: 400 }
      );
    }

    await updateChiTietMaSPInSheet(maSP, data);

    return NextResponse.json({
      success: true,
      message: "Cập nhật chi tiết mã sản phẩm thành công",
    });
  } catch (error: any) {
    console.error("Error updating chi tiet ma sp:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật chi tiết mã sản phẩm",
      },
      { status: 500 }
    );
  }
}
