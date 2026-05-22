import { NextRequest, NextResponse } from "next/server";
import { updateSupplierInSheet, Supplier, getSuppliersFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Supplier name is required" },
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

    const before = await getSuppliersFromSheet();
    const oldRow = before.find((s) => s.id === supplier.id) ?? null;

    await updateSupplierInSheet(supplier);

    logSheetEdit({
      action: "update",
      tableKey: "suppliers",
      sheetName: "Suppliers",
      recordId: supplier.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: supplier as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update supplier" },
      { status: 500 }
    );
  }
}
