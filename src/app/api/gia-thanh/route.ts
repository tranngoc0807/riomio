import { NextResponse } from "next/server";
import { getGiaThanhGiaBanFromSheet } from "@/lib/googleSheets";

/**
 * GET /api/gia-thanh
 * Lấy dữ liệu SL nhập kho từ Google Sheets (Giá thành giá bán)
 * Trả về slNhapKho theo Mã SP (gộp các hàng có cùng Mã SP)
 */
export async function GET() {
  try {
    const giaThanhList = await getGiaThanhGiaBanFromSheet();

    // Group by maSP and sum slNhapKho
    const groupedByMaSP: Record<string, number> = {};

    giaThanhList.forEach((item) => {
      const maSP = item.maSP.trim();
      if (maSP) {
        if (groupedByMaSP[maSP]) {
          groupedByMaSP[maSP] += item.slNhapKho;
        } else {
          groupedByMaSP[maSP] = item.slNhapKho;
        }
      }
    });

    // Convert to array format
    const result = Object.entries(groupedByMaSP).map(([maSP, slNhapKho]) => ({
      maSP,
      slNhapKho,
    }));

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error: any) {
    console.error("Error fetching Gia Thanh:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch Gia Thanh from Google Sheets",
      },
      { status: 500 }
    );
  }
}
