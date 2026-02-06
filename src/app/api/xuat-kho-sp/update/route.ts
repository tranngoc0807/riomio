import { NextResponse } from "next/server";
import { updateXuatKhoSPInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/xuat-kho-sp/update
 * Cập nhật một dòng xuất kho SP
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, maPXK, ngayThang, maSP, soLuong, maDonHang, khachHang, userThucHien } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID" },
        { status: 400 }
      );
    }

    await updateXuatKhoSPInSheet(id, {
      maPXK: maPXK || "",
      ngayThang: ngayThang || "",
      maSP: maSP || "",
      soLuong: soLuong || 0,
      maDonHang: maDonHang || "",
      khachHang: khachHang || "",
      userThucHien: userThucHien || "",
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (error: any) {
    console.error("Error updating xuat kho SP:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể cập nhật" },
      { status: 500 }
    );
  }
}
