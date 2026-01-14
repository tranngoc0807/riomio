import { NextResponse } from "next/server";
import { addNhapKhoNPLToSheet } from "@/lib/googleSheets";

/**
 * POST /api/nhap-kho-npl/add
 * Thêm nhập kho NPL mới
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maPNKNPL, ngayThang, nguoiNhap, noiDung, maNPL, ncc, dvt, soLuong, donGiaSauThue, ghiChu } = body;

    if (!maPNKNPL || !maNPL) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã PNKNPL và Mã NPL không được để trống",
        },
        { status: 400 }
      );
    }

    await addNhapKhoNPLToSheet({
      maPNKNPL,
      ngayThang: ngayThang || "",
      nguoiNhap: nguoiNhap || "",
      noiDung: noiDung || "",
      maNPL,
      ncc: ncc || "",
      dvt: dvt || "",
      soLuong: parseFloat(soLuong) || 0,
      donGiaSauThue: parseFloat(donGiaSauThue) || 0,
      ghiChu: ghiChu || "",
    });

    return NextResponse.json({
      success: true,
      message: "Thêm nhập kho NPL thành công",
    });
  } catch (error: any) {
    console.error("Error adding nhap kho NPL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm nhập kho NPL",
      },
      { status: 500 }
    );
  }
}
