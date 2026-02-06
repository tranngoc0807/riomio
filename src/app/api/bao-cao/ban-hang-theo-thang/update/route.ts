import { NextRequest, NextResponse } from "next/server";
import { updateBaoCaoBanHangTheoThang } from "@/lib/googleSheets";

/**
 * PUT /api/bao-cao/ban-hang-theo-thang/update
 * Cập nhật dữ liệu báo cáo bán hàng theo tháng
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowIndex, thang, nam, doanhThu, tienVon, loiNhuan } = body;

    if (!rowIndex || rowIndex < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Row index không hợp lệ",
        },
        { status: 400 }
      );
    }

    if (!thang || !nam) {
      return NextResponse.json(
        {
          success: false,
          error: "Tháng và năm là bắt buộc",
        },
        { status: 400 }
      );
    }

    await updateBaoCaoBanHangTheoThang(rowIndex, {
      thang: parseInt(thang),
      nam: parseInt(nam),
      doanhThu: parseFloat(doanhThu) || 0,
      tienVon: parseFloat(tienVon) || 0,
      loiNhuan: parseFloat(loiNhuan) || 0,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật báo cáo thành công",
    });
  } catch (error: any) {
    console.error("Error updating bao cao ban hang theo thang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật báo cáo",
      },
      { status: 500 }
    );
  }
}
