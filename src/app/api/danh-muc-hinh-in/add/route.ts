import { NextRequest, NextResponse } from "next/server";
import { addDanhMucHinhInToSheet } from "@/lib/googleSheets";

/**
 * POST /api/danh-muc-hinh-in/add
 * Thêm danh mục hình in mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.maHinhIn) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã hình in là bắt buộc",
        },
        { status: 400 }
      );
    }

    const danhMuc = {
      maHinhIn: body.maHinhIn || "",
      thongTinHinhIn: body.thongTinHinhIn || "",
      hinhAnh: body.hinhAnh || "",
      donGiaChuaThue: parseFloat(body.donGiaChuaThue) || 0,
      thueSuat: body.thueSuat || "",
      donGiaCoThue: parseFloat(body.donGiaCoThue) || 0,
      maSPSuDung: body.maSPSuDung || "",
      xuongIn: body.xuongIn || "",
    };

    await addDanhMucHinhInToSheet(danhMuc);

    return NextResponse.json({
      success: true,
      message: "Thêm danh mục hình in thành công",
      data: danhMuc,
    });
  } catch (error: any) {
    console.error("Error adding danh muc hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm danh mục hình in",
      },
      { status: 500 }
    );
  }
}
