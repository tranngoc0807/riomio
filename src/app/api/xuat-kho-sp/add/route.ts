import { NextResponse } from "next/server";
import { addXuatKhoSPToSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

/**
 * POST /api/xuat-kho-sp/add
 * Thêm phiếu xuất kho SP (có thể thêm nhiều sản phẩm trong 1 phiếu)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maPXK, ngayThang, maDonHang, khachHang, userThucHien, products } = body;

    if (!maPXK || !products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const newData = {
      maPXK,
      ngayThang: ngayThang || new Date().toISOString().split('T')[0],
      maDonHang: maDonHang || "",
      khachHang: khachHang || "",
      userThucHien: userThucHien || "",
      products,
    };

    await addXuatKhoSPToSheet(newData);

    logSheetEdit({
      action: "add",
      tableKey: "xuat-kho-sp",
      sheetName: process.env.GOOGLE_SHEET_NAME_XUAT_KHO_SP || "Xuất kho SP",
      newData,
    });

    return NextResponse.json({
      success: true,
      message: "Thêm phiếu xuất kho thành công",
    });
  } catch (error: any) {
    console.error("Error adding xuat kho SP:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể thêm phiếu xuất kho" },
      { status: 500 }
    );
  }
}
