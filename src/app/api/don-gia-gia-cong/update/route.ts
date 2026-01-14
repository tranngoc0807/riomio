import { NextRequest, NextResponse } from "next/server";
import { updateDonGiaGiaCongInSheet, DonGiaGiaCong } from "@/lib/googleSheets";

/**
 * PUT /api/don-gia-gia-cong/update
 * Cập nhật đơn giá gia công trong Google Sheets
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

    if (!body.maSPNhapKho && !body.maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã SP nhập kho hoặc Mã SP là bắt buộc",
        },
        { status: 400 }
      );
    }

    const donGia: DonGiaGiaCong = {
      id: body.id,
      maSPNhapKho: body.maSPNhapKho || "",
      maSP: body.maSP || "",
      mucLucSX: body.mucLucSX || "",
      xuongSX: body.xuongSX || "",
      noiDungKhac: body.noiDungKhac || "",
      donGia: parseFloat(body.donGia) || 0,
      nguoiNhap: body.nguoiNhap || "",
      ghiChu: body.ghiChu || "",
    };

    await updateDonGiaGiaCongInSheet(donGia);

    return NextResponse.json({
      success: true,
      message: "Cập nhật đơn giá gia công thành công",
      data: donGia,
    });
  } catch (error: any) {
    console.error("Error updating don gia gia cong:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật đơn giá gia công",
      },
      { status: 500 }
    );
  }
}
