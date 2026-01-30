import { NextRequest, NextResponse } from "next/server";
import {
  getDonGiaGiaCongFromSheet,
  getDinhMucSXFromSheet,
  getSoLuongCatFromSheet,
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
    const [donGiaGiaCongList, dinhMucList, soLuongCatList] = await Promise.all([
      getDonGiaGiaCongFromSheet(),
      getDinhMucSXFromSheet(),
      getSoLuongCatFromSheet(),
    ]);

    // Tìm thông tin trong Đơn giá gia công để lấy Xưởng SX
    const giaCongInfo = donGiaGiaCongList.find((item) => item.maSP === code);

    // Tìm thông tin trong Định mức sản xuất
    const dinhMucInfo = dinhMucList.find((item) => item.maSP === code);

    // Tính tổng số lượng cắt từ bảng "Số lượng cắt"
    const totalCutQuantity = soLuongCatList
      .filter((item) => item.maSP === code)
      .reduce((sum, item) => sum + (item.soLuongCat || 0), 0);

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
      plannedQuantity: 0, // Sẽ cập nhật sau khi có LSX
      cutQuantity: totalCutQuantity, // Tổng số lượng cắt từ bảng "Số lượng cắt"
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
