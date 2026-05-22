import { NextRequest, NextResponse } from "next/server";
import { addSupplierToSheet, Supplier } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

const SHEET = "Suppliers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Supplier name is required" },
        { status: 400 }
      );
    }

    const supplier: Supplier = {
      id: body.id || 0,
      name: body.name,
      material: body.material || "",
      address: body.address || "",
      contact: body.contact || "",
      phone: body.phone || "",
      note: body.note || "",
    };

    await addSupplierToSheet(supplier);

    logSheetEdit({
      action: "add",
      tableKey: "suppliers",
      sheetName: SHEET,
      recordId: supplier.id || null,
      newData: supplier as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      message: "Supplier added successfully",
      data: supplier,
    });
  } catch (error: any) {
    console.error("Error adding supplier:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add supplier" },
      { status: 500 }
    );
  }
}
