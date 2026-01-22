import { NextResponse } from "next/server";
import { addBangKeGiaCongToSheet } from "@/lib/googleSheets";

/**
 * POST /api/bang-ke-gia-cong/add
 * Thêm bảng kê gia công mới
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maPGC, ngayThang, maSPSX, maSP, xuongSX, soLuong, donGia, phanLoai, doiSoat, ghiChu } = body;

    if (!maPGC || !maSPSX) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã PGC và Mã SP SX không được để trống",
        },
        { status: 400 }
      );
    }

    await addBangKeGiaCongToSheet({
      maPGC,
      ngayThang: ngayThang || "",
      maSPSX,
      maSP: maSP || "",
      xuongSX: xuongSX || "",
      soLuong: parseFloat(soLuong) || 0,
      donGia: parseFloat(donGia) || 0,
      phanLoai: phanLoai || "",
      doiSoat: doiSoat || "",
      ghiChu: ghiChu || "",
    });

    return NextResponse.json({
      success: true,
      message: "Thêm bảng kê gia công thành công",
    });
  } catch (error: any) {
    console.error("Error adding bang ke gia cong:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm bảng kê gia công",
      },
      { status: 500 }
    );
  }
}
