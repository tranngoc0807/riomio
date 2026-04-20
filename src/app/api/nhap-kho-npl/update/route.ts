import { NextResponse } from "next/server";
import { updateNhapKhoNPLInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/nhap-kho-npl/update
 * Cập nhật nhập kho NPL
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, id, ...data } = body;

    // Accept either rowIndex (0-based) or id (1-based)
    const effectiveRowIndex =
      typeof rowIndex === "number" ? rowIndex : typeof id === "number" ? id - 1 : undefined;

    if (effectiveRowIndex === undefined || effectiveRowIndex < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vị trí dòng không hợp lệ",
        },
        { status: 400 }
      );
    }

    await updateNhapKhoNPLInSheet(effectiveRowIndex, data);

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
