import { NextRequest, NextResponse } from "next/server";
import { updateDanhMucHinhInInSheet, DanhMucHinhIn } from "@/lib/googleSheets";

/**
 * PUT /api/danh-muc-hinh-in/update
 * Cập nhật danh mục hình in trong Google Sheets
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

    if (!body.maHinhIn) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã hình in là bắt buộc",
        },
        { status: 400 }
      );
    }

    const danhMuc: DanhMucHinhIn = {
      id: body.id,
      maHinhIn: body.maHinhIn || "",
      thongTinHinhIn: body.thongTinHinhIn || "",
      hinhAnh: body.hinhAnh || "",
      donGiaChuaThue: parseFloat(body.donGiaChuaThue) || 0,
      thueSuat: body.thueSuat || "",
      donGiaCoThue: parseFloat(body.donGiaCoThue) || 0,
      maSPSuDung: body.maSPSuDung || "",
      xuongIn: body.xuongIn || "",
    };

    await updateDanhMucHinhInInSheet(danhMuc);

    return NextResponse.json({
      success: true,
      message: "Cập nhật danh mục hình in thành công",
      data: danhMuc,
    });
  } catch (error: any) {
    console.error("Error updating danh muc hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật danh mục hình in",
      },
      { status: 500 }
    );
  }
}
