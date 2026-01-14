import { NextResponse } from "next/server";
import { updateNhapKhoNPLInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/nhap-kho-npl/update
 * Cập nhật nhập kho NPL
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, ...data } = body;

    if (rowIndex === undefined || rowIndex < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vị trí dòng không hợp lệ",
        },
        { status: 400 }
      );
    }

    await updateNhapKhoNPLInSheet(rowIndex, data);

    return NextResponse.json({
      success: true,
      message: "Cập nhật nhập kho NPL thành công",
    });
  } catch (error: any) {
    console.error("Error updating nhap kho NPL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật nhập kho NPL",
      },
      { status: 500 }
    );
  }
}
