import { NextRequest, NextResponse } from "next/server";
import { addXuatKhoNPLToSheet } from "@/lib/googleSheets";

/**
 * POST /api/xuat-kho-npl/add
 * Thêm phiếu xuất kho NPL mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.maPhieu || !body.maNPL) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền đầy đủ Mã phiếu và Mã NPL",
        },
        { status: 400 }
      );
    }

    const xuatKhoData = {
      maPhieu: body.maPhieu,
      ngayThang: body.ngayThang || "",
      nguoiNhap: body.nguoiNhap || "",
      noiDung: body.noiDung || "",
      maSP: body.maSP || "",
      lenhSX: body.lenhSX || "",
      xuongSX: body.xuongSX || "",
      maNPL: body.maNPL,
      dvt: body.dvt || "",
      soLuong: body.soLuong || 0,
      donGia: body.donGia || 0,
      thanhTien: body.thanhTien || 0,
      loaiChiPhi: body.loaiChiPhi || "",
      ghiChu: body.ghiChu || "",
      tonThucTe: body.tonThucTe || 0,
    };

    await addXuatKhoNPLToSheet(xuatKhoData);

    return NextResponse.json({
      success: true,
      message: "Xuất kho NPL added successfully",
      data: xuatKhoData,
    });
  } catch (error: any) {
    console.error("Error adding xuat kho NPL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add xuat kho NPL to Google Sheets",
      },
      { status: 500 }
    );
  }
}
