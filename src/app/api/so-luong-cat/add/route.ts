import { NextRequest, NextResponse } from "next/server";
import { addSoLuongCatToSheet } from "@/lib/googleSheets";

/**
 * POST /api/so-luong-cat/add
 * Thêm số lượng cắt mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.maPhieuCat && !body.maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã phiếu cắt hoặc mã SP là bắt buộc",
        },
        { status: 400 }
      );
    }

    const soLuongKeHoach = parseFloat(body.soLuongKeHoach) || 0;
    const soLuongCat = parseFloat(body.soLuongCat) || 0;
    const soLuongNhapKho = parseFloat(body.soLuongNhapKho) || 0;

    await addSoLuongCatToSheet({
      maPhieuCat: body.maPhieuCat || "",
      maSP: body.maSP || "",
      lenhSanXuat: body.lenhSanXuat || "",
      xuongSanXuat: body.xuongSanXuat || "",
      mauSac: body.mauSac || "",
      soLuongKeHoach,
      ngayCat: body.ngayCat || "",
      soLuongCat,
      slCatTruSlKH: soLuongCat - soLuongKeHoach,
      nguyenNhan1: body.nguyenNhan1 || "",
      soLuongNhapKho,
      slNKTruSlCat: soLuongNhapKho - soLuongCat,
      nguyenNhan2: body.nguyenNhan2 || "",
      ghiChu: body.ghiChu || "",
    });

    return NextResponse.json({
      success: true,
      message: "Thêm số lượng cắt thành công",
    });
  } catch (error: any) {
    console.error("Error adding so luong cat:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm số lượng cắt",
      },
      { status: 500 }
    );
  }
}
