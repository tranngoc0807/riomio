import { NextRequest, NextResponse } from "next/server";
import { updateTonKhoHinhInNgay, updateTonKhoHinhInThang } from "@/lib/googleSheets";

/**
 * PUT /api/ton-kho-hinh-in/update
 * Cập nhật số lượng tồn kho hình in
 * @param type - "ngay" hoặc "thang"
 * @param id - ID của item
 * @param value - Giá trị mới
 */
export async function PUT(request: NextRequest) {
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

    if (!body.type || !["ngay", "thang"].includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Type phải là 'ngay' hoặc 'thang'",
        },
        { status: 400 }
      );
    }

    if (body.value === undefined || body.value === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Giá trị là bắt buộc",
        },
        { status: 400 }
      );
    }

    const id = parseInt(body.id);
    const value = parseFloat(body.value) || 0;

    if (body.type === "ngay") {
      await updateTonKhoHinhInNgay(id, value);
    } else {
      await updateTonKhoHinhInThang(id, value);
    }

    return NextResponse.json({
      success: true,
      message: `Cập nhật tồn kho hình in ${body.type === "ngay" ? "đến ngày" : "theo tháng"} thành công`,
    });
  } catch (error: any) {
    console.error("Error updating ton kho hinh in:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật tồn kho hình in",
      },
      { status: 500 }
    );
  }
}
