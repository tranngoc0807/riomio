import { NextRequest, NextResponse } from "next/server";
import { addPhanBoCPKhacToSheet } from "@/lib/googleSheets";

/**
 * POST /api/phan-bo-cp-khac/add
 * Thêm phân bổ chi phí khác mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { ngayThang, nguoiNhap, maPhieu, noiDung, maSP, soTien, loaiChiPhi } = body;

    // Validate required fields
    if (!ngayThang && !maPhieu) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Ngày tháng hoặc Mã phiếu",
        },
        { status: 400 }
      );
    }

    await addPhanBoCPKhacToSheet({
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
      message: "Thêm phân bổ chi phí khác thành công",
    });
  } catch (error: any) {
    console.error("Error adding phan bo cp khac:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm phân bổ chi phí khác",
      },
      { status: 500 }
    );
  }
}
