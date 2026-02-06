import { NextResponse } from "next/server";
import { updateMaSPInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/ma-sp/update
 * Cập nhật mã sản phẩm
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, maSP, tenSP, size, vaiChinh, vaiPhoi, phuLieuKhac, lenhSX, xuongSX } = body;

    if (rowIndex === undefined || rowIndex < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vị trí dòng không hợp lệ",
        },
        { status: 400 }
      );
    }

    if (!maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã sản phẩm không được để trống",
        },
        { status: 400 }
      );
    }

    await updateMaSPInSheet(rowIndex, {
      maSP,
      tenSP: tenSP || "",
      size: size || "",
      vaiChinh: vaiChinh || "",
      vaiPhoi: vaiPhoi || "",
      phuLieuKhac: phuLieuKhac || "",
      lenhSX: lenhSX || "",
      xuongSX: xuongSX || "",
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật mã sản phẩm thành công",
    });
  } catch (error: any) {
    console.error("Error updating ma sp:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật mã sản phẩm",
      },
      { status: 500 }
    );
  }
}
