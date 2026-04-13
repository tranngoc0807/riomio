import { NextRequest, NextResponse } from "next/server";
import { updateXuatKhoNPLInSheet } from "@/lib/googleSheets";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ID là bắt buộc" },
        { status: 400 }
      );
    }

    await updateXuatKhoNPLInSheet(body.id, {
      soLuong: body.soLuong,
      donGia: body.donGia,
      loaiChiPhi: body.loaiChiPhi,
      ghiChu: body.ghiChu,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật xuất kho NPL thành công",
    });
  } catch (error: any) {
    console.error("Error updating xuat kho NPL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể cập nhật" },
      { status: 500 }
    );
  }
}
