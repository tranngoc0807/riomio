import { NextRequest, NextResponse } from "next/server";
import { updateYeuCauXuatKhoNPLInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/yeu-cau-xuat-kho-npl/update
 * Cập nhật yêu cầu xuất kho NPL trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID là bắt buộc",
        },
        { status: 400 }
      );
    }

    await updateYeuCauXuatKhoNPLInSheet(parseInt(body.id), {
      ngayThang: body.ngayThang,
      maPhieuYC: body.maPhieuYC,
      maNPL: body.maNPL,
      dvt: body.dvt,
      dinhMuc: parseFloat(body.dinhMuc) || 0,
      slKHSX: parseFloat(body.slKHSX) || 0,
      tongNPLSX: parseFloat(body.tongNPLSX) || 0,
      maSPSuDung: body.maSPSuDung,
      mauSac: body.mauSac,
      xuongSX: body.xuongSX,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật yêu cầu xuất kho NPL thành công",
    });
  } catch (error: any) {
    console.error("Error updating yeu cau xuat kho npl:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật yêu cầu xuất kho NPL",
      },
      { status: 500 }
    );
  }
}
