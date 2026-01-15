import { NextRequest, NextResponse } from "next/server";
import { addYeuCauXuatKhoNPLToSheet } from "@/lib/googleSheets";

/**
 * POST /api/yeu-cau-xuat-kho-npl/add
 * Thêm yêu cầu xuất kho NPL mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.maNPL) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã NPL là bắt buộc",
        },
        { status: 400 }
      );
    }

    await addYeuCauXuatKhoNPLToSheet({
      ngayThang: body.ngayThang || "",
      maPhieuYC: body.maPhieuYC || "",
      maNPL: body.maNPL,
      dvt: body.dvt || "",
      dinhMuc: parseFloat(body.dinhMuc) || 0,
      slKHSX: parseFloat(body.slKHSX) || 0,
      tongNPLSX: parseFloat(body.tongNPLSX) || 0,
      maSPSuDung: body.maSPSuDung || "",
      mauSac: body.mauSac || "",
      xuongSX: body.xuongSX || "",
    });

    return NextResponse.json({
      success: true,
      message: "Thêm yêu cầu xuất kho NPL thành công",
    });
  } catch (error: any) {
    console.error("Error adding yeu cau xuat kho npl:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm yêu cầu xuất kho NPL",
      },
      { status: 500 }
    );
  }
}
