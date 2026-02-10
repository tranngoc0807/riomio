import { NextRequest, NextResponse } from "next/server";
import { deleteTonKhoNPLNgayFromSheet } from "@/lib/googleSheets";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");

    if (rowIndex === null || rowIndex === undefined) {
      return NextResponse.json(
        { success: false, error: "rowIndex là bắt buộc" },
        { status: 400 }
      );
    }

    await deleteTonKhoNPLNgayFromSheet(Number(rowIndex));

    return NextResponse.json({ success: true, message: "Đã xóa thành công" });
  } catch (error: any) {
    console.error("Error deleting ton kho NPL ngay:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi xóa dữ liệu" },
      { status: 500 }
    );
  }
}
