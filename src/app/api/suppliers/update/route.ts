import { NextRequest, NextResponse } from "next/server";
import { updateSupplierInSheet, Supplier } from "@/lib/googleSheets";

/**
 * PUT /api/suppliers/update
 * Cập nhật nhà cung cấp trong Google Sheets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate dữ liệu
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier ID is required",
        },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier name is required",
        },
        { status: 400 }
      );
    }

    const supplier: Supplier = {
      id: body.id,
      name: body.name,
      material: body.material || "",
      address: body.address || "",
      contact: body.contact || "",
      phone: body.phone || "",
      note: body.note || "",
    };

    await updateSupplierInSheet(supplier);

    return NextResponse.json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error: any) {
    console.error("Error updating supplier:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update supplier in Google Sheets",
      },
      { status: 500 }
    );
  }
}
