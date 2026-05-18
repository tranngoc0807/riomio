import { NextRequest, NextResponse } from "next/server";
import {
  getDinhMucSXFromSheet,
  addDinhMucSXToSheet,
  updateDinhMucSXInSheet,
  deleteDinhMucSXFromSheet,
  DinhMucSX,
} from "@/lib/googleSheets";

/**
 * GET /api/dinh-muc-sx
 * Lấy dữ liệu định mức sản xuất từ Google Sheets
 */
export async function GET() {
  try {
    const data = await getDinhMucSXFromSheet();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching dinh muc sx:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dinh muc sx",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dinh-muc-sx
 * Thêm định mức sản xuất mới
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Mã SP",
        },
        { status: 400 }
      );
    }

    const dinhMuc: Omit<DinhMucSX, "id"> = {
      maSP: body.maSP,
      vaiChinh: body.vaiChinh || "",
      vaiPhoi1: body.vaiPhoi1 || "",
      vaiPhoi2: body.vaiPhoi2 || "",
      vaiPhoi3: body.vaiPhoi3 || "",
      vaiPhoi4: body.vaiPhoi4 || "",
      vaiPhoi5: body.vaiPhoi5 || "",
      phuLieu1: body.phuLieu1 || "",
      phuLieu2: body.phuLieu2 || "",
      phuLieu3: body.phuLieu3 || "",
      phuLieu4: body.phuLieu4 || "",
      phuLieu5: body.phuLieu5 || "",
      phuKien1: body.phuKien1 || "",
      phuKien2: body.phuKien2 || "",
      phuKien3: body.phuKien3 || "",
      phuKien4: body.phuKien4 || "",
      phuKien5: body.phuKien5 || "",
      khac: body.khac || "",
    };

    await addDinhMucSXToSheet(dinhMuc);

    return NextResponse.json({
      success: true,
      message: "Thêm định mức sản xuất thành công",
    });
  } catch (error: any) {
    console.error("Error adding dinh muc sx:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add dinh muc sx",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dinh-muc-sx
 * Cập nhật định mức sản xuất
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID định mức sản xuất",
        },
        { status: 400 }
      );
    }

    if (!body.maSP) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Mã SP",
        },
        { status: 400 }
      );
    }

    const dinhMuc: DinhMucSX = {
      id: body.id,
      maSP: body.maSP,
      vaiChinh: body.vaiChinh || "",
      vaiPhoi1: body.vaiPhoi1 || "",
      vaiPhoi2: body.vaiPhoi2 || "",
      vaiPhoi3: body.vaiPhoi3 || "",
      vaiPhoi4: body.vaiPhoi4 || "",
      vaiPhoi5: body.vaiPhoi5 || "",
      phuLieu1: body.phuLieu1 || "",
      phuLieu2: body.phuLieu2 || "",
      phuLieu3: body.phuLieu3 || "",
      phuLieu4: body.phuLieu4 || "",
      phuLieu5: body.phuLieu5 || "",
      phuKien1: body.phuKien1 || "",
      phuKien2: body.phuKien2 || "",
      phuKien3: body.phuKien3 || "",
      phuKien4: body.phuKien4 || "",
      phuKien5: body.phuKien5 || "",
      khac: body.khac || "",
    };

    await updateDinhMucSXInSheet(dinhMuc);

    return NextResponse.json({
      success: true,
      message: "Cập nhật định mức sản xuất thành công",
    });
  } catch (error: any) {
    console.error("Error updating dinh muc sx:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update dinh muc sx",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dinh-muc-sx
 * Xóa định mức sản xuất
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID định mức sản xuất",
        },
        { status: 400 }
      );
    }

    await deleteDinhMucSXFromSheet(parseInt(id, 10));

    return NextResponse.json({
      success: true,
      message: "Xóa định mức sản xuất thành công",
    });
  } catch (error: any) {
    console.error("Error deleting dinh muc sx:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete dinh muc sx",
      },
      { status: 500 }
    );
  }
}
