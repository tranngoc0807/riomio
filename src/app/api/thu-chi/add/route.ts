import { NextRequest, NextResponse } from "next/server";
import { addThuChiToSheet, ThuChi } from "@/lib/googleSheets";

/**
 * POST /api/thu-chi/add
 * Thêm thu chi mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate - chỉ yêu cầu ngày tháng
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
      id: body.id || 0,
      date: body.date,
      accountName: body.accountName || "",
      nccNpl: body.nccNpl || "",
      workshop: body.workshop || "",
      shippingCost: body.shippingCost || 0,
      salesIncome: body.salesIncome || 0,
      otherIncome: body.otherIncome || 0,
      entity: body.entity || "",
      content: body.content || "",
      category: body.category || "",
      totalIncome: body.totalIncome || 0,
      totalExpense: body.totalExpense || 0,
      note: body.note || "",
    };

    await addThuChiToSheet(thuChi);

    return NextResponse.json({
      success: true,
      message: "Thu chi added successfully",
      data: thuChi,
    });
  } catch (error: any) {
    console.error("Error adding thu chi:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add thu chi to Google Sheets",
      },
      { status: 500 }
    );
  }
}
