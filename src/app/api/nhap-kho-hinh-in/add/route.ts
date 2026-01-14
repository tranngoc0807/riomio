import { NextRequest, NextResponse } from "next/server";
import { addNhapKhoHinhInToSheet } from "@/lib/googleSheets";

/**
 * POST /api/nhap-kho-hinh-in/add
 * Thêm nhập kho hình in mới vào Google Sheets
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

    if (!body.ngayThang) {
      return NextResponse.json(
        {
          success: false,
          error: "Ngày tháng là bắt buộc",
        },
        { status: 400 }
      );
    }

    const nhapKho = {
      ngayThang: body.ngayThang || "",
      maHinhIn: body.maHinhIn || "",
      soLuong: parseFloat(body.soLuong) || 0,
      donGia: parseFloat(body.donGia) || 0,
      thanhTien: parseFloat(body.thanhTien) || 0,
      ncc: body.ncc || "",
      maPhieuNhap: body.maPhieuNhap || "",
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
