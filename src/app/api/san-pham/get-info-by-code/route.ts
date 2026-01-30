import { NextRequest, NextResponse } from "next/server";
import {
  getDonGiaGiaCongFromSheet,
  getDinhMucSXFromSheet,
  getSoLuongCatFromSheet,
  getBangKeLSXFromSheet,
  getBangKeGiaCongFromSheet,
} from "@/lib/googleSheets";

/**
 * GET /api/san-pham/get-info-by-code?code=RM001
 * Lấy thông tin tự động fill cho sản phẩm dựa trên mã SP
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã sản phẩm không được để trống",
        },
        { status: 400 }
      );
    }

    // Lấy dữ liệu từ các bảng
    const [donGiaGiaCongList, dinhMucList, soLuongCatList, bangKeLSXList, bangKeGiaCongList] = await Promise.all([
      getDonGiaGiaCongFromSheet(),
      getDinhMucSXFromSheet(),
      getSoLuongCatFromSheet(),
      getBangKeLSXFromSheet(),
      getBangKeGiaCongFromSheet(),
    ]);

    // Tìm thông tin trong Đơn giá gia công để lấy Xưởng SX
    const giaCongInfo = donGiaGiaCongList.find((item) => item.maSP === code);

    // Tìm thông tin trong Định mức sản xuất
    const dinhMucInfo = dinhMucList.find((item) => item.maSP === code);

    // Tính tổng số lượng cắt từ bảng "Số lượng cắt"
    const totalCutQuantity = soLuongCatList
      .filter((item) => item.maSP === code)
      .reduce((sum, item) => sum + (item.soLuongCat || 0), 0);

    // Lấy số lượng kế hoạch từ bảng "Bảng kê LSX" (cột Tổng SL)
    const bangKeLSXInfo = bangKeLSXList.find((item) => item.maSP === code);
    const plannedQuantity = bangKeLSXInfo?.tongSL || 0;

    // Tính tổng số lượng nhập kho từ bảng "Bảng kê gia công" (cột Số lượng)
    const warehouseQuantity = bangKeGiaCongList
      .filter((item) => item.maSP === code)
      .reduce((sum, item) => sum + (item.soLuong || 0), 0);

    // Chuẩn bị dữ liệu trả về
    const result = {
      workshop: giaCongInfo?.xuongSX || "",
      mainFabricQuota: dinhMucInfo?.vaiChinh || "",
      accentFabricQuota1: dinhMucInfo?.vaiPhoi1 || "",
      accentFabricQuota2: dinhMucInfo?.vaiPhoi2 || "",
      materialsQuota1: dinhMucInfo?.phuLieu1 || "",
      materialsQuota2: dinhMucInfo?.phuLieu2 || "",
      accessoriesQuota: dinhMucInfo?.phuKien || "",
      otherQuota: dinhMucInfo?.khac || "",
      plannedQuantity: plannedQuantity, // Số lượng kế hoạch từ bảng "Bảng kê LSX"
      cutQuantity: totalCutQuantity, // Tổng số lượng cắt từ bảng "Số lượng cắt"
      warehouseQuantity: warehouseQuantity, // Tổng số lượng nhập kho từ bảng "Bảng kê gia công"
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching product info by code:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch product info",
      },
      { status: 500 }
    );
  }
}
