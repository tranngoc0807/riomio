import { NextRequest, NextResponse } from "next/server";
import { addNhapKhoHinhInToSheet } from "@/lib/googleSheets";

/**
 * POST /api/nhap-kho-hinh-in/add
 * Thêm nhập kho hình in mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    const nhapKho = {
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
      nhapKhoMet: parseFloat(body.nhapKhoMet) || 0,
      donGia: parseFloat(body.donGia) || 0,
      ngayNhapKho: body.ngayNhapKho || "",
      ghiChu: body.ghiChu || "",
    };

    await addNhapKhoHinhInToSheet(nhapKho);

    return NextResponse.json({
      success: true,
      message: "Thêm nhập kho hình in thành công",
      data: nhapKho,
    });
  } catch (error: any) {
    console.error("Error adding nhap kho hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm nhập kho hình in",
      },
      { status: 500 }
    );
  }
}
