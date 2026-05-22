import { NextResponse } from "next/server";
import { updateNhapKhoSPInSheet, getNhapKhoSPFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

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

    const rowIdx = typeof id === "number" ? id : parseInt(id);
    const before = await getNhapKhoSPFromSheet();
    const oldRow = before.find((r) => r.id === rowIdx) ?? null;

    const newData = {
      maPNK: maPNK || "",
      ngayNhap: ngayNhap || "",
      maSP: maSP || "",
      soLuong: soLuong || 0,
      ghiChu: ghiChu || "",
    };

    await updateNhapKhoSPInSheet(rowIdx, newData);

    logSheetEdit({
      action: "update",
      tableKey: "nhap-kho-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_NHAP_KHO_SP_RIOMIO || "Nhập kho SP",
      rowIndex: rowIdx,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData,
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
