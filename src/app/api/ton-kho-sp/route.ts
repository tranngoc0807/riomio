import { NextResponse } from "next/server";
import { getTonKhoSPFromSheet, getTonDauSPFromSheet, updateCellInSheet } from "@/lib/googleSheets";

/**
 * GET /api/ton-kho-sp
 * Lấy danh sách tồn kho sản phẩm (cả 2 bảng) từ Google Sheets (Tonkhosp)
 */
export async function GET() {
  try {
    const [tonKhoList, tonDauList] = await Promise.all([
      getTonKhoSPFromSheet(),
      getTonDauSPFromSheet(),
    ]);

    console.log("API GET - tonKhoList count:", tonKhoList.length);
    console.log("API GET - tonDauList count:", tonDauList.length);

    return NextResponse.json({
      success: true,
      data: {
        tonKho: tonKhoList,
        tonDau: tonDauList,
      },
    });
  } catch (error: any) {
    console.error("Error fetching ton kho SP:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch ton kho SP from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ton-kho-sp
 * Cập nhật tháng/năm hoặc ngày vào Google Sheets, sau đó lấy data mới
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { thangNam, denNgay } = body;

    // Update cells in Google Sheets (ignore protection errors since update still works)
    if (thangNam) {
      try {
        // Format: "2026-01" -> "1/2026"
        const [year, month] = thangNam.split('-');
        const formattedValue = `${parseInt(month)}/${year}`;
        await updateCellInSheet('C3', formattedValue);
      } catch (error: any) {
        console.warn("Warning updating C3 (might still succeed):", error.message);
        // Continue anyway - update often succeeds despite protection warnings
      }
    }

    if (denNgay) {
      try {
        // Format: "2025-12-31" -> "31/12/25"
        const [year, month, day] = denNgay.split('-');
        const formattedValue = `${parseInt(day)}/${parseInt(month)}/${year.slice(-2)}`;
        await updateCellInSheet('J3', formattedValue);
      } catch (error: any) {
        console.warn("Warning updating J3 (might still succeed):", error.message);
        // Continue anyway - update often succeeds despite protection warnings
      }
    }

    // Wait a bit for Google Sheets to recalculate
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Fetch updated data
    const [tonKhoList, tonDauList] = await Promise.all([
      getTonKhoSPFromSheet(),
      getTonDauSPFromSheet(),
    ]);

    console.log("API POST - tonKhoList count:", tonKhoList.length);
    console.log("API POST - tonDauList count:", tonDauList.length);

    return NextResponse.json({
      success: true,
      data: {
        tonKho: tonKhoList,
        tonDau: tonDauList,
      },
    });
  } catch (error: any) {
    console.error("Error updating ton kho SP:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update ton kho SP in Google Sheets",
      },
      { status: 500 }
    );
  }
}
