import { NextRequest, NextResponse } from "next/server";
import {
  getDinhMucSXFromSheet,
  addDinhMucSXToSheet,
  updateDinhMucSXInSheet,
  deleteDinhMucSXFromSheet,
  DinhMucSX,
} from "@/lib/googleSheets";
import { logSheetEdit } from "@/lib/editHistory";

const TABLE_KEY = "dinh-muc-sx";
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME_DINH_MUC_SAN_XUAT || "Định mức sản xuất";

export async function GET() {
  try {
    const data = await getDinhMucSXFromSheet();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.maSP) {
      return NextResponse.json({ success: false, error: "Vui lòng điền Mã SP" }, { status: 400 });
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
    logSheetEdit({
      action: "add",
      tableKey: TABLE_KEY,
      sheetName: SHEET_NAME,
      newData: dinhMuc,
    });
    return NextResponse.json({ success: true, message: "Thêm định mức sản xuất thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Thiếu ID định mức sản xuất" }, { status: 400 });
    }
    if (!body.maSP) {
      return NextResponse.json({ success: false, error: "Vui lòng điền Mã SP" }, { status: 400 });
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
    const before = await getDinhMucSXFromSheet();
    const oldRow = before.find((d) => d.id === dinhMuc.id) ?? null;
    await updateDinhMucSXInSheet(dinhMuc);
    logSheetEdit({
      action: "update",
      tableKey: TABLE_KEY,
      sheetName: SHEET_NAME,
      recordId: dinhMuc.id,
      oldData: oldRow as unknown as Record<string, unknown> | null,
      newData: dinhMuc as unknown as Record<string, unknown>,
    });
    return NextResponse.json({ success: true, message: "Cập nhật định mức sản xuất thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID định mức sản xuất" }, { status: 400 });
    }
    const itemId = parseInt(id, 10);
    const before = await getDinhMucSXFromSheet();
    const oldRow = before.find((d) => d.id === itemId) ?? null;
    await deleteDinhMucSXFromSheet(itemId);
    logSheetEdit({
      action: "delete",
      tableKey: TABLE_KEY,
      sheetName: SHEET_NAME,
      recordId: itemId,
      oldData: oldRow as unknown as Record<string, unknown> | null,
    });
    return NextResponse.json({ success: true, message: "Xóa định mức sản xuất thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
