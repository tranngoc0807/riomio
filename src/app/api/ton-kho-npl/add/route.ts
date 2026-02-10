import { NextRequest, NextResponse } from "next/server";
import { addTonKhoNPLNgayToSheet } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maSP, soLuong } = body;

    if (!maSP || maSP.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Mã SP không được để trống" },
        { status: 400 }
      );
    }

    await addTonKhoNPLNgayToSheet({
      maSP: maSP.trim(),
      soLuong: Number(soLuong) || 0,
    });

    return NextResponse.json({ success: true, message: "Đã thêm thành công" });
  } catch (error: any) {
    console.error("Error adding ton kho NPL ngay:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi thêm dữ liệu" },
      { status: 500 }
    );
  }
}
