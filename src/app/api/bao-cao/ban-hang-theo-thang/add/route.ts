import { NextRequest, NextResponse } from "next/server";
import { addBaoCaoBanHangTheoThang } from "@/lib/googleSheets";

/**
 * POST /api/bao-cao/ban-hang-theo-thang/add
 * Thêm dữ liệu báo cáo bán hàng theo tháng
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thang, nam, doanhThu, tienVon, loiNhuan } = body;

    if (!thang || !nam) {
      return NextResponse.json(
        {
          success: false,
          error: "Tháng và năm là bắt buộc",
        },
        { status: 400 }
      );
    }

    await addBaoCaoBanHangTheoThang({
      thang: parseInt(thang),
      nam: parseInt(nam),
      doanhThu: parseFloat(doanhThu) || 0,
      tienVon: parseFloat(tienVon) || 0,
      loiNhuan: parseFloat(loiNhuan) || 0,
    });

    return NextResponse.json({
      success: true,
      message: "Thêm báo cáo thành công",
    });
  } catch (error: any) {
    console.error("Error adding bao cao ban hang theo thang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm báo cáo",
      },
      { status: 500 }
    );
  }
}
