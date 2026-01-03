import { NextRequest, NextResponse } from "next/server";
import { addWorkshopToSheet, Workshop } from "@/lib/googleSheets";

/**
 * POST /api/workshops/add
 * Thêm xưởng sản xuất mới vào Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Workshop name is required",
        },
        { status: 400 }
      );
    }

    const workshop: Workshop = {
      id: body.id || 0,
      name: body.name,
      phone: body.phone || "",
      address: body.address || "",
      manager: body.manager || "",
      note: body.note || "",
    };

    await addWorkshopToSheet(workshop);

    return NextResponse.json({
      success: true,
      message: "Workshop added successfully",
      data: workshop,
    });
  } catch (error: any) {
    console.error("Error adding workshop:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add workshop to Google Sheets",
      },
      { status: 500 }
    );
  }
}
