import { NextResponse } from "next/server";
import {
  getTaiKhoanOptionsFromSheet,
  getPhanLoaiThuChiOptionsFromSheet,
  getNCCNPLOptionsFromSheet,
  getXuongSXOptionsFromSheet,
  getVanChuyenOptionsFromSheet,
  getXuongSXToDoiTuongMapping,
  getKhachHangOptionsFromSheet,
} from "@/lib/googleSheets";

/**
 * GET /api/dong-tien-options
 * Lấy các options cho dropdown trong form dòng tiền
 */
export async function GET() {
  try {
    const [taiKhoanOptions, phanLoaiOptions, nccNPLOptions, xuongSXOptions, vanChuyenOptions, xuongSXToDoiTuongMapping, khachHangOptions] = await Promise.all([
      getTaiKhoanOptionsFromSheet(),
      getPhanLoaiThuChiOptionsFromSheet(),
      getNCCNPLOptionsFromSheet(),
      getXuongSXOptionsFromSheet(),
      getVanChuyenOptionsFromSheet(),
      getXuongSXToDoiTuongMapping(),
      getKhachHangOptionsFromSheet(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        taiKhoan: taiKhoanOptions,
        phanLoaiThuChi: phanLoaiOptions,
        nccNPL: nccNPLOptions,
        xuongSX: xuongSXOptions,
        vanChuyen: vanChuyenOptions,
        xuongSXToDoiTuong: xuongSXToDoiTuongMapping,
        khachHang: khachHangOptions,
      },
    });
  } catch (error: any) {
    console.error("Error fetching dropdown options:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dropdown options from Google Sheets",
      },
      { status: 500 }
    );
  }
}
