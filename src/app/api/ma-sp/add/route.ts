import { NextResponse } from "next/server";
import { addMaSPToSheet } from "@/lib/googleSheets";

/**
 * POST /api/ma-sp/add
 * Thêm mã sản phẩm mới
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maSP, tenSP, size, vaiChinh, vaiPhoi, phuLieuKhac, tinhTrangSX, lenhSX, xuongSX, hinhAnh } = body;

    if (!maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã sản phẩm không được để trống",
        },
        { status: 400 }
      );
    }

    await addMaSPToSheet({
      maSP,
      tenSP: tenSP || "",
      size: size || "",
      vaiChinh: vaiChinh || "",
      vaiPhoi: vaiPhoi || "",
      phuLieuKhac: phuLieuKhac || "",
      tinhTrangSX: tinhTrangSX || "",
      lenhSX: lenhSX || "",
      xuongSX: xuongSX || "",
      hinhAnh: hinhAnh || "",
    });

    return NextResponse.json({
      success: true,
      message: "Thêm mã sản phẩm thành công",
    });
  } catch (error: any) {
    console.error("Error adding ma sp:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm mã sản phẩm",
      },
      { status: 500 }
    );
  }
}
