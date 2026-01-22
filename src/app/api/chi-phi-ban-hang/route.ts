import { NextResponse } from "next/server";
import {
  getChiPhiBanHangFromSheet,
  addChiPhiBanHang,
  updateChiPhiBanHang,
  deleteChiPhiBanHang,
  ChiPhiBanHang,
} from "@/lib/googleSheets";

/**
 * GET /api/chi-phi-ban-hang
 * Lấy danh sách chi phí bán hàng từ Google Sheets
 */
export async function GET() {
  try {
    const chiPhiList = await getChiPhiBanHangFromSheet();

    return NextResponse.json({
      success: true,
      data: chiPhiList,
    });
  } catch (error: any) {
    console.error("Error fetching chi phi ban hang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch chi phi ban hang from Google Sheets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chi-phi-ban-hang
 * Thêm chi phí bán hàng mới vào Google Sheets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ngayThang, noiDung, nguoiNhan, loaiChiPhi, soTien, ghiChu } = body;

    // Validation
    if (!ngayThang || !noiDung) {
      return NextResponse.json(
        { success: false, error: "Ngày tháng và nội dung là bắt buộc" },
        { status: 400 }
      );
    }

    await addChiPhiBanHang({
      ngayThang,
      noiDung,
      nguoiNhan: nguoiNhan || "",
      loaiChiPhi: loaiChiPhi || "",
      soTien: soTien || 0,
      ghiChu: ghiChu || "",
    });

    // Fetch updated list
    const chiPhiList = await getChiPhiBanHangFromSheet();

    return NextResponse.json({
      success: true,
      message: "Thêm chi phí thành công",
      data: chiPhiList,
    });
  } catch (error: any) {
    console.error("Error adding chi phi ban hang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add chi phi ban hang",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chi-phi-ban-hang
 * Cập nhật chi phí bán hàng trong Google Sheets
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, ngayThang, noiDung, nguoiNhan, loaiChiPhi, soTien, ghiChu } = body;

    // Validation
    if (!rowIndex || !ngayThang || !noiDung) {
      return NextResponse.json(
        { success: false, error: "Row index, ngày tháng và nội dung là bắt buộc" },
        { status: 400 }
      );
    }

    await updateChiPhiBanHang(rowIndex, {
      ngayThang,
      noiDung,
      nguoiNhan: nguoiNhan || "",
      loaiChiPhi: loaiChiPhi || "",
      soTien: soTien || 0,
      ghiChu: ghiChu || "",
    });

    // Fetch updated list
    const chiPhiList = await getChiPhiBanHangFromSheet();

    return NextResponse.json({
      success: true,
      message: "Cập nhật chi phí thành công",
      data: chiPhiList,
    });
  } catch (error: any) {
    console.error("Error updating chi phi ban hang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update chi phi ban hang",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chi-phi-ban-hang
 * Xóa chi phí bán hàng từ Google Sheets
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

    await deleteChiPhiBanHang(parseInt(rowIndex));

    // Fetch updated list
    const chiPhiList = await getChiPhiBanHangFromSheet();

    return NextResponse.json({
      success: true,
      message: "Xóa chi phí thành công",
      data: chiPhiList,
    });
  } catch (error: any) {
    console.error("Error deleting chi phi ban hang:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete chi phi ban hang",
      },
      { status: 500 }
    );
  }
}
