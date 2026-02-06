import { NextResponse } from "next/server";
import { addNhapKhoSPToSheet } from "@/lib/googleSheets";

/**
 * POST /api/nhap-kho-sp/add
 * Thêm phiếu nhập kho SP (có thể thêm nhiều sản phẩm trong 1 phiếu)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maPNK, ngayNhap, products } = body;

    if (!maPNK || !products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    await addNhapKhoSPToSheet({
      maPNK,
      ngayNhap: ngayNhap || new Date().toISOString().split('T')[0],
      products,
    });

    return NextResponse.json({
      success: true,
      message: "Thêm phiếu nhập kho thành công",
    });
  } catch (error: any) {
    console.error("Error adding nhap kho SP:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể thêm phiếu nhập kho" },
      { status: 500 }
    );
  }
}
