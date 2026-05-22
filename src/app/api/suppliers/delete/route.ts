import { NextRequest, NextResponse } from "next/server";
import { deleteSupplierFromSheet, getSuppliersFromSheet } from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

export async function DELETE(request: NextRequest) {
  try {
    // Accept id from query OR body for backward compat
    const url = new URL(request.url);
    let id = url.searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id ? String(body.id) : null;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const supplierId = parseInt(id);
    const before = await getSuppliersFromSheet();
    const oldRow = before.find((s) => s.id === supplierId) ?? null;

    await deleteSupplierFromSheet(supplierId);

    logSheetEdit({
      action: "delete",
      tableKey: "suppliers",
      sheetName: "Suppliers",
      recordId: supplierId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
