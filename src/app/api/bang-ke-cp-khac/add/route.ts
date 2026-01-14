import { NextRequest, NextResponse } from "next/server";
import { addChiPhiKhacToSheet } from "@/lib/googleSheets";

/**
 * POST /api/bang-ke-cp-khac/add
 * Thêm chi phí khác mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { ngay, noiDung, chiHoXuong, soChoMa, soTien, phanBo, doiTacVC } = body;

    // Validate required fields
    if (!ngay && !noiDung) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Ngày hoặc Nội dung",
        },
        { status: 400 }
      );
    }

    await addChiPhiKhacToSheet({
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
      message: "Thêm chi phí khác thành công",
    });
  } catch (error: any) {
    console.error("Error adding chi phi khac:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể thêm chi phí khác",
      },
      { status: 500 }
    );
  }
}
