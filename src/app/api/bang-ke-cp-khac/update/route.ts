import { NextRequest, NextResponse } from "next/server";
import { updateChiPhiKhacInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/bang-ke-cp-khac/update
 * Cập nhật chi phí khác trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, ngay, noiDung, chiHoXuong, soChoMa, soTien, phanBo, doiTacVC } = body;

    // Validate required fields
    if (id === undefined || id === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID để cập nhật",
        },
        { status: 400 }
      );
    }

    // id is 1-based from the data, convert to 0-based rowIndex
    const rowIndex = id - 1;

    await updateChiPhiKhacInSheet(rowIndex, {
      ngay: ngay || "",
      noiDung: noiDung || "",
      chiHoXuong: chiHoXuong || "",
      soChoMa: soChoMa || "",
      soTien: parseFloat(soTien) || 0,
      phanBo: phanBo || "",
      doiTacVC: doiTacVC || "",
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật chi phí khác thành công",
    });
  } catch (error: any) {
    console.error("Error updating chi phi khac:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật chi phí khác",
      },
      { status: 500 }
    );
  }
}
