import { NextRequest, NextResponse } from "next/server";
import { updateSoLuongCatInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/so-luong-cat/update
 * Cập nhật số lượng cắt trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID là bắt buộc",
        },
        { status: 400 }
      );
    }

    const soLuongKeHoach = parseFloat(body.soLuongKeHoach) || 0;
    const soLuongCat = parseFloat(body.soLuongCat) || 0;
    const soLuongNhapKho = parseFloat(body.soLuongNhapKho) || 0;

    await updateSoLuongCatInSheet(parseInt(body.id), {
      maPhieuCat: body.maPhieuCat || "",
      maSP: body.maSP || "",
      lenhSanXuat: body.lenhSanXuat || "",
      xuongSanXuat: body.xuongSanXuat || "",
      mauSac: body.mauSac || "",
      soLuongKeHoach,
      ngayCat: body.ngayCat || "",
      soLuongCat,
      slCatTruSlKH: soLuongCat - soLuongKeHoach,
      tiLeCacMau: body.tiLeCacMau || "",
      nguyenNhan1: body.nguyenNhan1 || "",
      soLuongNhapKho,
      slNKTruSlCat: soLuongNhapKho - soLuongCat,
      nguyenNhan2: body.nguyenNhan2 || "",
      ghiChu: body.ghiChu || "",
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật số lượng cắt thành công",
    });
  } catch (error: any) {
    console.error("Error updating so luong cat:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật số lượng cắt",
      },
      { status: 500 }
    );
  }
}
