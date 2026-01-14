import { NextRequest, NextResponse } from "next/server";
import { addXuatKhoHinhInToSheet } from "@/lib/googleSheets";

/**
 * POST /api/xuat-kho-hinh-in/add
 * Thêm xuất kho hình in mới vào Google Sheets
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

    const xuatKho = {
      ngayThang: body.ngayThang || "",
      maHinhIn: body.maHinhIn || "",
      soLuong: parseFloat(body.soLuong) || 0,
      maSPSuDung: body.maSPSuDung || "",
      maPhieuXuat: body.maPhieuXuat || "",
      ghiChu: body.ghiChu || "",
    };

    await addXuatKhoHinhInToSheet(xuatKho);

    return NextResponse.json({
      success: true,
      message: "Thêm xuất kho hình in thành công",
      data: xuatKho,
    });
  } catch (error: any) {
    console.error("Error adding xuat kho hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm xuất kho hình in",
      },
      { status: 500 }
    );
  }
}
