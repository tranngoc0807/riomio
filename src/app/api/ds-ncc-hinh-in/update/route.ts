import { NextRequest, NextResponse } from "next/server";
import { updateDSNCCHinhInInSheet, DSNCCHinhIn } from "@/lib/googleSheets";

/**
 * PUT /api/ds-ncc-hinh-in/update
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ID là bắt buộc" },
        { status: 400 },
      );
    }

    if (!body.ncc) {
      return NextResponse.json(
        { success: false, error: "Tên NCC là bắt buộc" },
        { status: 400 },
      );
    }

    const ncc: DSNCCHinhIn = {
      id: body.id,
      stt: parseInt(body.stt) || body.id,
      ncc: body.ncc || "",
      dienThoai: body.dienThoai || "",
      diaChi: body.diaChi || "",
      nguoiPhuTrach: body.nguoiPhuTrach || "",
      ghiChu: body.ghiChu || "",
    };

    await updateDSNCCHinhInInSheet(ncc);

    return NextResponse.json({
      success: true,
      message: "Cập nhật NCC hình in thành công",
      data: ncc,
    });
  } catch (error: any) {
    console.error("Error updating DS NCC hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật NCC hình in",
      },
      { status: 500 },
    );
  }
}
