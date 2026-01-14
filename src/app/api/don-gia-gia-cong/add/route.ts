import { NextRequest, NextResponse } from "next/server";
import { addDonGiaGiaCongToSheet } from "@/lib/googleSheets";

/**
 * POST /api/don-gia-gia-cong/add
 * Thêm đơn giá gia công mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu - cần ít nhất maSPNhapKho hoặc maSP
    if (!body.maSPNhapKho && !body.maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã SP nhập kho hoặc Mã SP là bắt buộc",
        },
        { status: 400 }
      );
    }

    const donGia = {
      maSPNhapKho: body.maSPNhapKho || "",
      maSP: body.maSP || "",
      mucLucSX: body.mucLucSX || "",
      xuongSX: body.xuongSX || "",
      noiDungKhac: body.noiDungKhac || "",
      donGia: parseFloat(body.donGia) || 0,
      nguoiNhap: body.nguoiNhap || "",
      ghiChu: body.ghiChu || "",
    };

    await addDonGiaGiaCongToSheet(donGia);

    return NextResponse.json({
      success: true,
      message: "Thêm đơn giá gia công thành công",
      data: donGia,
    });
  } catch (error: any) {
    console.error("Error adding don gia gia cong:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm đơn giá gia công",
      },
      { status: 500 }
    );
  }
}
