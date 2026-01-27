import { NextResponse } from "next/server";
import {
  getDongTienFromSheet,
  addDongTienToSheet,
  updateDongTienInSheet,
  deleteDongTienFromSheet,
} from "@/lib/googleSheets";

/**
 * GET /api/dong-tien
 * Lấy danh sách dòng tiền từ Google Sheets
 */
export async function GET() {
  try {
    const dongTienList = await getDongTienFromSheet();

    return NextResponse.json({
      success: true,
      data: dongTienList,
    });
  } catch (error: any) {
    console.error("Error fetching cash flow data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch cash flow data from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dong-tien
 * Thêm dòng tiền mới vào Google Sheets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ngayThang,
      tenTK,
      nccNPL,
      xuongSX,
      chiVanChuyen,
      thuTienHang,
      thuKhac,
      chiKhac,
      maPhieuThu,
      maPhieuChi,
      doiTuong,
      noiDung,
      phanLoaiThuChi,
      tongThu,
      tongChi,
      ghiChu,
    } = body;

    // Validate required dropdown fields
    if (!tenTK || !nccNPL || !chiVanChuyen || !thuTienHang || !phanLoaiThuChi) {
      return NextResponse.json(
        { success: false, error: "Các trường dropdown là bắt buộc" },
        { status: 400 }
      );
    }

    await addDongTienToSheet({
      ngayThang: ngayThang || "",
      tenTK,
      nccNPL,
      xuongSX: xuongSX || "",
      chiVanChuyen,
      thuTienHang,
      thuKhac: thuKhac || "",
      chiKhac: chiKhac || "",
      maPhieuThu: maPhieuThu || "",
      maPhieuChi: maPhieuChi || "",
      doiTuong: doiTuong || "",
      noiDung: noiDung || "",
      phanLoaiThuChi,
      tongThu: tongThu || "",
      tongChi: tongChi || "",
      ghiChu: ghiChu || "",
    });

    // Fetch updated data
    const dongTienList = await getDongTienFromSheet();

    return NextResponse.json({
      success: true,
      message: "Thêm dòng tiền thành công",
      data: dongTienList,
    });
  } catch (error: any) {
    console.error("Error adding cash flow:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add cash flow to Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dong-tien
 * Cập nhật dòng tiền trong Google Sheets
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      rowIndex,
      ngayThang,
      tenTK,
      nccNPL,
      xuongSX,
      chiVanChuyen,
      thuTienHang,
      thuKhac,
      chiKhac,
      maPhieuThu,
      maPhieuChi,
      doiTuong,
      noiDung,
      phanLoaiThuChi,
      tongThu,
      tongChi,
      ghiChu,
    } = body;

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "Row index là bắt buộc" },
        { status: 400 }
      );
    }

    // Validate required dropdown fields
    if (!tenTK || !nccNPL || !chiVanChuyen || !thuTienHang || !phanLoaiThuChi) {
      return NextResponse.json(
        { success: false, error: "Các trường dropdown là bắt buộc" },
        { status: 400 }
      );
    }

    await updateDongTienInSheet(parseInt(rowIndex), {
      ngayThang: ngayThang || "",
      tenTK,
      nccNPL,
      xuongSX: xuongSX || "",
      chiVanChuyen,
      thuTienHang,
      thuKhac: thuKhac || "",
      chiKhac: chiKhac || "",
      maPhieuThu: maPhieuThu || "",
      maPhieuChi: maPhieuChi || "",
      doiTuong: doiTuong || "",
      noiDung: noiDung || "",
      phanLoaiThuChi,
      tongThu: tongThu || "",
      tongChi: tongChi || "",
      ghiChu: ghiChu || "",
    });

    // Fetch updated data
    const dongTienList = await getDongTienFromSheet();

    return NextResponse.json({
      success: true,
      message: "Cập nhật dòng tiền thành công",
      data: dongTienList,
    });
  } catch (error: any) {
    console.error("Error updating cash flow:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update cash flow in Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dong-tien
 * Xóa dòng tiền khỏi Google Sheets
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get("rowIndex");

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: "Row index là bắt buộc" },
        { status: 400 }
      );
    }

    await deleteDongTienFromSheet(parseInt(rowIndex));

    // Fetch updated data
    const dongTienList = await getDongTienFromSheet();

    return NextResponse.json({
      success: true,
      message: "Xóa dòng tiền thành công",
      data: dongTienList,
    });
  } catch (error: any) {
    console.error("Error deleting cash flow:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete cash flow from Google Sheets",
      },
      { status: 500 }
    );
  }
}
