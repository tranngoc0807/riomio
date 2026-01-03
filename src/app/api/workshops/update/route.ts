import { NextRequest, NextResponse } from "next/server";
import { updateWorkshopInSheet, Workshop } from "@/lib/googleSheets";

/**
 * PUT /api/workshops/update
 * Cập nhật xưởng sản xuất trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Workshop ID is required",
        },
        { status: 400 }
      );
    }

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
      id: body.id,
      name: body.name,
      phone: body.phone || "",
      address: body.address || "",
      manager: body.manager || "",
      note: body.note || "",
    };

    await updateWorkshopInSheet(workshop);

    return NextResponse.json({
      success: true,
      message: "Workshop updated successfully",
      data: workshop,
    });
  } catch (error: any) {
    console.error("Error updating workshop:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update workshop in Google Sheets",
      },
      { status: 500 }
    );
  }
}
