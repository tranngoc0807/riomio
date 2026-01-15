import { NextRequest, NextResponse } from "next/server";
import { deleteYeuCauXuatKhoNPLFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/yeu-cau-xuat-kho-npl/delete
 * Xóa yêu cầu xuất kho NPL từ Google Sheets
 */
export async function DELETE(request: NextRequest) {
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

    await deleteYeuCauXuatKhoNPLFromSheet(parseInt(body.id));

    return NextResponse.json({
      success: true,
      message: "Xóa yêu cầu xuất kho NPL thành công",
    });
  } catch (error: any) {
    console.error("Error deleting yeu cau xuat kho npl:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa yêu cầu xuất kho NPL",
      },
      { status: 500 }
    );
  }
}
