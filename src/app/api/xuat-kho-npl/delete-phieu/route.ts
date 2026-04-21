import { NextRequest, NextResponse } from "next/server";
import { deleteXuatKhoNPLByMaPhieuFromSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/xuat-kho-npl/delete-phieu?maPhieu=PXKNPL067
 * Xoá toàn bộ các dòng thuộc maPhieu trong 1 batchUpdate.
 */
export async function DELETE(request: NextRequest) {
  try {
    const maPhieu = request.nextUrl.searchParams.get("maPhieu");

    if (!maPhieu || !maPhieu.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing maPhieu parameter" },
        { status: 400 }
      );
    }

    const deletedCount = await deleteXuatKhoNPLByMaPhieuFromSheet(maPhieu);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} rows of ${maPhieu}`,
    });
  } catch (error: any) {
    console.error("Error deleting phieu xuat kho NPL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete phieu xuat kho NPL",
      },
      { status: 500 }
    );
  }
}
