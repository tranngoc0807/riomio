import { NextRequest, NextResponse } from "next/server";
import { updateXuatKhoHinhInInSheet, XuatKhoHinhIn } from "@/lib/googleSheets";

/**
 * PUT /api/xuat-kho-hinh-in/update
 * Cập nhật xuất kho hình in trong Google Sheets
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

    if (!body.ngayThang) {
      return NextResponse.json(
        {
          success: false,
          error: "Ngày tháng là bắt buộc",
        },
        { status: 400 }
      );
    }

    const xuatKho: XuatKhoHinhIn = {
      id: body.id,
      ngayThang: body.ngayThang || "",
      maHinhIn: body.maHinhIn || "",
      soLuong: parseFloat(body.soLuong) || 0,
      maSPSuDung: body.maSPSuDung || "",
      maPhieuXuat: body.maPhieuXuat || "",
      ghiChu: body.ghiChu || "",
    };

    await updateXuatKhoHinhInInSheet(xuatKho);

    return NextResponse.json({
      success: true,
      message: "Cập nhật xuất kho hình in thành công",
      data: xuatKho,
    });
  } catch (error: any) {
    console.error("Error updating xuat kho hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật xuất kho hình in",
      },
      { status: 500 }
    );
  }
}
