import { NextRequest, NextResponse } from "next/server";
import { addDSNCCHinhInToSheet } from "@/lib/googleSheets";

/**
 * POST /api/ds-ncc-hinh-in/add
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ncc) {
      return NextResponse.json(
        { success: false, error: "Tên NCC là bắt buộc" },
        { status: 400 },
      );
    }

    const ncc = {
      ncc: body.ncc || "",
      dienThoai: body.dienThoai || "",
      diaChi: body.diaChi || "",
      nguoiPhuTrach: body.nguoiPhuTrach || "",
      ghiChu: body.ghiChu || "",
    };

    await addDSNCCHinhInToSheet(ncc);

    return NextResponse.json({
      success: true,
      message: "Thêm NCC hình in thành công",
      data: ncc,
    });
  } catch (error: any) {
    console.error("Error adding DS NCC hinh in:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm NCC hình in",
      },
      { status: 500 },
    );
  }
}
