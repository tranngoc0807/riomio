import { NextRequest, NextResponse } from "next/server";
import { deleteBaoCaoBanHangTheoThang } from "@/lib/googleSheets";

/**
 * DELETE /api/bao-cao/ban-hang-theo-thang/delete
 * Xóa dữ liệu báo cáo bán hàng theo tháng
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");

    if (!rowIndex || parseInt(rowIndex) < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Row index không hợp lệ",
        },
        { status: 400 }
      );
    }

    await deleteBaoCaoBanHangTheoThang(parseInt(rowIndex));

    return NextResponse.json({
      success: true,
      message: "Xóa báo cáo thành công",
    });
  } catch (error: any) {
    console.error("Error deleting bao cao ban hang theo thang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa báo cáo",
      },
      { status: 500 }
    );
  }
}
