import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG;
const sheetName = "Theo dõi công nợ từng khách hàng";

interface CongNoRow {
  id: number;
  date: string;
  orderCode: string;
  productAmount: number;
  payment: number;
  balance: number;
}

/**
 * GET /api/cong-no-kh
 * Lấy dữ liệu công nợ khách hàng từ sheet "Theo dõi công nợ từng khách hàng"
 */
export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc dữ liệu từ sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A1:E100`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        customer: "",
      });
    }

    // Lấy tên khách hàng từ row 3, cột B
    let customerName = "";
    if (rows[2] && rows[2][1]) {
      customerName = rows[2][1].toString().trim();
    }

    // Tìm header row (row có "Ngày tháng")
    let dataStartIndex = 5;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const firstCell = rows[i]?.[0]?.toString().toLowerCase() || "";
      if (firstCell.includes("ngày")) {
        dataStartIndex = i + 1;
        break;
      }
    }

    const congNoData: CongNoRow[] = [];

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
      const balanceStr = row[4]?.toString() || "";

      if (!dateStr ||
          balanceStr.includes("#VALUE!") ||
          balanceStr.includes("#REF!") ||
          dateStr.includes("0()")) continue;

      congNoData.push({
        id: i + 1,
        date: dateStr,
        orderCode: row[1]?.toString().trim() || "",
        productAmount: parseNumber(row[2]),
        payment: parseNumber(row[3]),
        balance: parseNumber(row[4]),
      });
    }

    return NextResponse.json({
      success: true,
      data: congNoData,
      customer: customerName,
    });
  } catch (error: any) {
    console.error("Error fetching cong no KH:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch công nợ khách hàng",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cong-no-kh
 * Cập nhật khách hàng được chọn (thay đổi dropdown ở cell B3)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer } = body;

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer is required" },
        { status: 400 }
      );
    }

    const sheets = await getGoogleSheetsClient();

    // Cập nhật cell B3 với tên khách hàng mới
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[customer]],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã chọn khách hàng: ${customer}`,
    });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update customer",
      },
      { status: 500 }
    );
  }
}
