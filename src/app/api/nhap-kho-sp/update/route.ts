import { NextResponse } from "next/server";
import { updateNhapKhoSPInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/nhap-kho-sp/update
 * Cập nhật một dòng nhập kho SP
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, maPNK, ngayNhap, maSP, soLuong, ghiChu } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID" },
        { status: 400 }
      );
    }

    await updateNhapKhoSPInSheet(id, {
      maPNK: maPNK || "",
      ngayNhap: ngayNhap || "",
      maSP: maSP || "",
      soLuong: soLuong || 0,
      ghiChu: ghiChu || "",
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật thành công",
    });
  } catch (error: any) {
    console.error("Error updating nhap kho SP:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể cập nhật" },
      { status: 500 }
    );
  }
}
