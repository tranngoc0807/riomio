import { NextRequest, NextResponse } from "next/server";
import { updateNhapKhoHinhInInSheet, NhapKhoHinhIn } from "@/lib/googleSheets";

/**
 * PUT /api/nhap-kho-hinh-in/update
 * Cập nhật nhập kho hình in trong Google Sheets
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

    const nhapKho: NhapKhoHinhIn = {
      id: body.id,
      ngayThang: body.ngayThang || "",
      maHinhIn: body.maHinhIn || "",
      soLuong: parseFloat(body.soLuong) || 0,
      donGia: parseFloat(body.donGia) || 0,
      thanhTien: parseFloat(body.thanhTien) || 0,
      ncc: body.ncc || "",
      maPhieuNhap: body.maPhieuNhap || "",
      ghiChu: body.ghiChu || "",
    };

    await updateNhapKhoHinhInInSheet(nhapKho);

    return NextResponse.json({
      success: true,
      message: "Cập nhật nhập kho hình in thành công",
      data: nhapKho,
    });
  } catch (error: any) {
    console.error("Error updating nhap kho hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật nhập kho hình in",
      },
      { status: 500 }
    );
  }
}
