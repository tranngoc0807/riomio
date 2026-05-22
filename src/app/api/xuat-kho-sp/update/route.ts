import { NextResponse } from "next/server";
import { updateXuatKhoSPInSheet, getXuatKhoSPFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

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

    const rowIdx = typeof id === "number" ? id : parseInt(id);
    const before = await getXuatKhoSPFromSheet();
    const oldRow = before.find((r) => r.id === rowIdx) ?? null;

    const newData = {
      maPXK: maPXK || "",
      ngayThang: ngayThang || "",
      maSP: maSP || "",
      soLuong: soLuong || 0,
      maDonHang: maDonHang || "",
      khachHang: khachHang || "",
      userThucHien: userThucHien || "",
    };

    await updateXuatKhoSPInSheet(rowIdx, newData);

    logSheetEdit({
      action: "update",
      tableKey: "xuat-kho-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_SP || "Xuất kho SP",
      rowIndex: rowIdx,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData,
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
