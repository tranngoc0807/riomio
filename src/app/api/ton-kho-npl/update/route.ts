import { NextRequest, NextResponse } from "next/server";
import { updateTonKhoNPLNgaySoLuong } from "@/lib/googleSheets";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, soLuong } = body;

    if (!id || soLuong === undefined) {
      return NextResponse.json(
        { success: false, error: "ID và số lượng là bắt buộc" },
        { status: 400 }
      );
    }

    await updateTonKhoNPLNgaySoLuong(parseInt(id), parseFloat(soLuong));

    return NextResponse.json({
      success: true,
      message: "Cập nhật số lượng thành công",
    });
  } catch (error: any) {
    console.error("Error updating ton kho NPL ngay:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật số lượng",
      },
      { status: 500 }
    );
  }
}
