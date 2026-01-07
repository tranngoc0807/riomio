import { NextRequest, NextResponse } from "next/server";
import { updateThuChiInSheet, ThuChi } from "@/lib/googleSheets";

/**
 * PUT /api/thu-chi/update
 * Cập nhật thu chi trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - cần có id và ngày tháng
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID thu chi",
        },
        { status: 400 }
      );
    }

    if (!body.date) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền Ngày tháng",
        },
        { status: 400 }
      );
    }

    const thuChi: ThuChi = {
      id: body.id,
      code: body.code || "",  // Giữ nguyên mã khi update
      date: body.date,
      accountName: body.accountName || "",
      nccNpl: body.nccNpl || "",
      workshop: body.workshop || "",
      shippingCost: body.shippingCost || 0,
      salesIncome: body.salesIncome || 0,
      otherIncome: body.otherIncome || 0,
      otherExpense: body.otherExpense || 0,
      entity: body.entity || "",
      content: body.content || "",
      category: body.category || "",
      totalIncome: body.totalIncome || 0,
      totalExpense: body.totalExpense || 0,
      note: body.note || "",
    };

    await updateThuChiInSheet(thuChi);

    return NextResponse.json({
      success: true,
      message: "Thu chi updated successfully",
      data: thuChi,
    });
  } catch (error: any) {
    console.error("Error updating thu chi:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update thu chi in Google Sheets",
      },
      { status: 500 }
    );
  }
}
