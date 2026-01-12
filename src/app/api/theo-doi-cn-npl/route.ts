import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetName = process.env.GOOGLE_SHEET_NAME_THEO_DOI_CN || "Theo dõi CN từng NCC NPL";

interface CongNoNCCRow {
  id: number;
  date: string;
  maPhieu: string;
  tienNhap: number;
  thanhToan: number;
  duCuoi: number;
}

/**
 * GET /api/theo-doi-cn-npl
 * Lấy dữ liệu theo dõi công nợ từng NCC NPL từ sheet
 */
export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc dữ liệu từ sheet - lấy đủ cột A đến F
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A1:F100`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        nccNPL: "",
      });
    }

    // Lấy tên NCC NPL từ row 3, cột B
    let nccNPLName = "";
    if (rows[2] && rows[2][1]) {
      nccNPLName = rows[2][1].toString().trim();
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

    const congNoData: CongNoNCCRow[] = [];

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
      const duCuoiStr = row[5]?.toString() || "";

      // Skip invalid rows
      if (!dateStr ||
          duCuoiStr.includes("#VALUE!") ||
          duCuoiStr.includes("#REF!") ||
          dateStr.includes("#VALUE!")) continue;

      congNoData.push({
        id: i + 1,
        date: dateStr,
        maPhieu: row[1]?.toString().trim() || "",
        tienNhap: parseNumber(row[2]),
        thanhToan: parseNumber(row[3]),
        duCuoi: parseNumber(row[5]), // Cột F (index 5)
      });
    }

    return NextResponse.json({
      success: true,
      data: congNoData,
      nccNPL: nccNPLName,
    });
  } catch (error: any) {
    console.error("Error fetching theo doi CN NCC NPL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch theo dõi CN NCC NPL",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/theo-doi-cn-npl
 * Cập nhật NCC NPL được chọn (thay đổi dropdown ở cell B3)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nccNPL } = body;

    if (!nccNPL) {
      return NextResponse.json(
        { success: false, error: "NCC NPL is required" },
        { status: 400 }
      );
    }

    const sheets = await getGoogleSheetsClient();

    // Cập nhật cell B3 với tên NCC NPL mới
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[nccNPL]],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã chọn NCC NPL: ${nccNPL}`,
    });
  } catch (error: any) {
    console.error("Error updating NCC NPL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update NCC NPL",
      },
      { status: 500 }
    );
  }
}
