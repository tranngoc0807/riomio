import { NextRequest, NextResponse } from "next/server";
import { updatePhanBoCPKhacInSheet } from "@/lib/googleSheets";

/**
 * PUT /api/phan-bo-cp-khac/update
 * Cập nhật phân bổ chi phí khác trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, ngayThang, nguoiNhap, maPhieu, noiDung, maSP, soTien, loaiChiPhi } = body;

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

    await updatePhanBoCPKhacInSheet(rowIndex, {
      ngayThang: ngayThang || "",
      nguoiNhap: nguoiNhap || "",
      maPhieu: maPhieu || "",
      noiDung: noiDung || "",
      maSP: maSP || "",
      soTien: parseFloat(soTien) || 0,
      loaiChiPhi: loaiChiPhi || "",
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật phân bổ chi phí khác thành công",
    });
  } catch (error: any) {
    console.error("Error updating phan bo cp khac:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật phân bổ chi phí khác",
      },
      { status: 500 }
    );
  }
}
