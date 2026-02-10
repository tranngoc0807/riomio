import { NextRequest, NextResponse } from "next/server";
import { updateTonKhoNPLNgayInSheet } from "@/lib/googleSheets";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowIndex, maSP, soLuong } = body;

    if (rowIndex === undefined || rowIndex === null) {
      return NextResponse.json(
        { success: false, error: "rowIndex là bắt buộc" },
        { status: 400 }
      );
    }

    if (!maSP || maSP.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Mã SP không được để trống" },
        { status: 400 }
      );
    }

    await updateTonKhoNPLNgayInSheet(Number(rowIndex), {
      maSP: maSP.trim(),
      soLuong: Number(soLuong) || 0,
    });

    return NextResponse.json({ success: true, message: "Đã cập nhật thành công" });
  } catch (error: any) {
    console.error("Error updating ton kho NPL ngay:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi cập nhật dữ liệu" },
      { status: 500 }
    );
  }
}
