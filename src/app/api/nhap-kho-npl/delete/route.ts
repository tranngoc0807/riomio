import { NextResponse } from "next/server";
import { deleteNhapKhoNPLFromSheet } from "@/lib/googleSheets";

/**
 * DELETE /api/nhap-kho-npl/delete
 * Xoá nhập kho NPL. Accepts ?rowIndex=N (0-based) or ?id=N (1-based).
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndexParam = searchParams.get("rowIndex");
    const idParam = searchParams.get("id");

    let effectiveRowIndex: number | null = null;
    if (rowIndexParam !== null) {
      effectiveRowIndex = parseInt(rowIndexParam);
    } else if (idParam !== null) {
      const id = parseInt(idParam);
      if (!isNaN(id)) effectiveRowIndex = id - 1;
    }

    if (effectiveRowIndex === null || isNaN(effectiveRowIndex) || effectiveRowIndex < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vị trí dòng không hợp lệ",
        },
        { status: 400 }
      );
    }

    await deleteNhapKhoNPLFromSheet(effectiveRowIndex);

    return NextResponse.json({
      success: true,
      message: "Xoá nhập kho NPL thành công",
    });
  } catch (error: any) {
    console.error("Error deleting nhap kho NPL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xoá nhập kho NPL",
      },
      { status: 500 }
    );
  }
}
