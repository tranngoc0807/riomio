import { NextRequest, NextResponse } from "next/server";
import { updateNhapKhoHinhInInSheet, NhapKhoHinhIn } from "@/lib/googleSheets";

/**
 * PUT /api/nhap-kho-hinh-in/update
 * Cập nhật nhập kho hình in trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ID là bắt buộc" },
        { status: 400 }
      );
    }

    if (!body.maHinhIn) {
      return NextResponse.json(
        { success: false, error: "Mã hình in là bắt buộc" },
        { status: 400 }
      );
    }

    if (!body.ngayThang) {
      return NextResponse.json(
        { success: false, error: "Ngày tháng là bắt buộc" },
        { status: 400 }
      );
    }

    const nhapKhoMet = parseFloat(body.nhapKhoMet) || 0;
    const donGia = parseFloat(body.donGia) || 0;

    const nhapKho: NhapKhoHinhIn = {
      id: body.id,
      maDon: body.maDon || "",
      ngayThang: body.ngayThang || "",
      stt: body.stt != null ? String(body.stt) : "",
      maHinhIn: body.maHinhIn || "",
      kichThuoc: body.kichThuoc || "",
      hinhAnh: body.hinhAnh || "",
      datHI: parseFloat(body.datHI) || 0,
      nhapKhoThucTe: parseFloat(body.nhapKhoThucTe) || 0,
      maSPSuDung: body.maSPSuDung || "",
      xuongIn: body.xuongIn || "",
      nhapKhoMet,
      donGia,
      thanhTien: nhapKhoMet * donGia,
      ngayNhapKho: body.ngayNhapKho || "",
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
