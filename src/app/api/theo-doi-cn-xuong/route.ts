import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetName = process.env.GOOGLE_SHEET_NAME_THEO_DOI_CN_XUONG || "Theo dõi CN từng xưởng SX";

interface CongNoXuongRow {
  id: number;
  date: string;
  noiDung: string;
  tienGiaCong: number;
  thanhToan: number;
  duCuoi: number;
}

/**
 * GET /api/theo-doi-cn-xuong
 * Lấy dữ liệu theo dõi công nợ từng xưởng SX từ sheet
 */
export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc dữ liệu từ sheet - lấy đủ cột A đến E
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A1:E100`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        xuongSX: "",
      });
    }

    // Lấy tên xưởng SX từ row 3, cột B
    let xuongSXName = "";
    if (rows[2] && rows[2][1]) {
      xuongSXName = rows[2][1].toString().trim();
    }

    // Tìm header row (row có "Ngày tháng")
    let dataStartIndex = 5; // Default row 6 (0-indexed = 5)
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const firstCell = rows[i]?.[0]?.toString().toLowerCase() || "";
      if (firstCell.includes("ngày")) {
        dataStartIndex = i + 1;
        break;
      }
    }

    const congNoData: CongNoXuongRow[] = [];

    const parseNumber = (val: any): number => {
      if (!val) return 0;
      if (typeof val === "number") {
        return Math.round(val);
      }
      const str = val.toString().replace(/\./g, "").replace(/,/g, "").replace(/[^\d-]/g, "");
      return parseInt(str) || 0;
    };

    for (let i = dataStartIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const dateStr = row[0]?.toString().trim() || "";
      const duCuoiStr = row[4]?.toString() || "";

      // Skip invalid rows
      if (!dateStr ||
          duCuoiStr.includes("#VALUE!") ||
          duCuoiStr.includes("#REF!") ||
          dateStr.includes("#VALUE!")) continue;

      congNoData.push({
        id: i + 1,
        date: dateStr,
        noiDung: row[1]?.toString().trim() || "",
        tienGiaCong: parseNumber(row[2]),
        thanhToan: parseNumber(row[3]),
        duCuoi: parseNumber(row[4]), // Cột E (index 4)
      });
    }

    return NextResponse.json({
      success: true,
      data: congNoData,
      xuongSX: xuongSXName,
    });
  } catch (error: any) {
    console.error("Error fetching theo doi CN xưởng SX:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch theo dõi CN xưởng SX",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/theo-doi-cn-xuong
 * Cập nhật xưởng SX được chọn (thay đổi dropdown ở cell B3)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { xuongSX } = body;

    if (!xuongSX) {
      return NextResponse.json(
        { success: false, error: "Xưởng SX is required" },
        { status: 400 }
      );
    }

    const sheets = await getGoogleSheetsClient();

    // Cập nhật cell B3 với tên xưởng SX mới
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[xuongSX]],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã chọn xưởng SX: ${xuongSX}`,
    });
  } catch (error: any) {
    console.error("Error updating xưởng SX:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update xưởng SX",
      },
      { status: 500 }
    );
  }
}
