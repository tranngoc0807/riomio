import { NextRequest, NextResponse } from "next/server";
import { addThuChiToSheet } from "@/lib/googleSheets";

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

    const thuChiData = {
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

    // Xác định loại: income (Thu) = PT, expense (Chi) = PC
    const isIncome = body.type === "income";

    // Mã sẽ được tự động tạo trong addThuChiToSheet
    const generatedCode = await addThuChiToSheet(thuChiData, isIncome);

    return NextResponse.json({
      success: true,
      message: "Thu chi added successfully",
      data: { ...thuChiData, code: generatedCode },
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
