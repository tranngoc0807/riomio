import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN;
const sheetNameChamCong = process.env.GOOGLE_SHEET_NAME_CHAM_CONG || "ChamCong";

/**
 * GET /api/cham-cong/seed
 * Tạo cấu trúc sheet với dropdown chọn tháng/năm và fake data
 * (Dùng GET để có thể gọi từ browser)
 */
export async function GET() {
  return seedData();
}

/**
 * POST /api/cham-cong/seed
 * Tạo cấu trúc sheet với dropdown chọn tháng/năm và fake data
 */
export async function POST() {
  return seedData();
}

async function seedData() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Clear toàn bộ sheet trước
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: `'${sheetNameChamCong}'!A1:AL100`,
    });

    // ===== ROW 1: Selection dropdowns =====
    const row1 = [
      "Chọn tháng:",
      1, // B1 - giá trị mặc định
      "Chọn năm:",
      2025, // D1 - giá trị mặc định
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    ];

    // ===== ROW 2: Headers cho view =====
    const row2 = [
      "STT",
      "Mã NV",
      "Họ Tên",
      ...Array.from({ length: 31 }, (_, i) => i + 1), // 1-31
      "Tổng",
    ];

    // ===== ROW 3: QUERY formula để filter data =====
    // QUERY sẽ lấy data từ row 51+ và filter theo tháng/năm đã chọn
    // Columns: A=STT, B=HoTen, C=ChucVu, D=Thang, E=Nam, F-AJ=Ngay1-31, AK=TongCong
    const queryFormula = `=IFERROR(QUERY(A51:AK200, "SELECT A,B,C,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG,AH,AI,AJ,AK WHERE D="&B1&" AND E="&D1, 0), "Không có dữ liệu cho tháng này")`;

    // ===== ROW 50: Headers cho data storage =====
    const dataHeaders = [
      "STT",
      "MaNV",
      "HoTen",
      "Thang",
      "Nam",
      ...Array.from({ length: 31 }, (_, i) => `Ngay${i + 1}`),
      "TongCong",
    ];

    // ===== Fake data cho tháng 1/2025 =====
    const employees = [
      { id: 1, name: "Nguyễn Văn An" },
      { id: 2, name: "Trần Thị Bình" },
      { id: 3, name: "Lê Văn Cường" },
      { id: 4, name: "Phạm Thị Dung" },
      { id: 5, name: "Hoàng Văn Em" },
      { id: 6, name: "Vũ Thị Phương" },
      { id: 7, name: "Đặng Văn Giang" },
      { id: 8, name: "Bùi Thị Hoa" },
      { id: 9, name: "Ngô Văn Ích" },
      { id: 10, name: "Đỗ Thị Kim" },
    ];

    const thang = 1;
    const nam = 2025;

    const fakeDataRows = employees.map((emp, index) => {
      const days: string[] = [];
      let tongCong = 0;

      for (let day = 1; day <= 31; day++) {
        const date = new Date(nam, thang - 1, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isWeekend) {
          days.push("O"); // Nghỉ cuối tuần
        } else {
          const rand = Math.random();
          if (rand < 0.85) {
            days.push("P"); // 85% có mặt
            tongCong++;
          } else if (rand < 0.95) {
            days.push("L"); // 10% đi muộn
            tongCong++;
          } else {
            days.push("A"); // 5% vắng
          }
        }
      }

      return [
        index + 1, // STT
        emp.id,    // MaNV
        emp.name,  // HoTen
        thang,     // Thang
        nam,       // Nam
        ...days,   // Ngay1-Ngay31
        tongCong,  // TongCong
      ];
    });

    // Ghi tất cả vào sheet
    const allValues = [
      row1,                    // Row 1: Selection
      row2,                    // Row 2: Headers
      [queryFormula],          // Row 3: Query formula
      ...Array(46).fill([""]), // Row 4-49: Empty
      dataHeaders,             // Row 50: Data headers
      ...fakeDataRows,         // Row 51+: Data
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `'${sheetNameChamCong}'!A1:AK${allValues.length}`,
      valueInputOption: "USER_ENTERED", // Để QUERY formula hoạt động
      requestBody: {
        values: allValues,
      },
    });

    // Tạo Data Validation cho dropdown tháng (B1)
    const sheetId = await getSheetId(sheets, spreadsheetId!, sheetNameChamCong);

    if (sheetId !== null) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [
            // Dropdown cho Tháng (B1)
            {
              setDataValidation: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 1,
                  endColumnIndex: 2,
                },
                rule: {
                  condition: {
                    type: "ONE_OF_LIST",
                    values: Array.from({ length: 12 }, (_, i) => ({ userEnteredValue: String(i + 1) })),
                  },
                  showCustomUi: true,
                  strict: true,
                },
              },
            },
            // Dropdown cho Năm (D1)
            {
              setDataValidation: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 3,
                  endColumnIndex: 4,
                },
                rule: {
                  condition: {
                    type: "ONE_OF_LIST",
                    values: [
                      { userEnteredValue: "2023" },
                      { userEnteredValue: "2024" },
                      { userEnteredValue: "2025" },
                      { userEnteredValue: "2026" },
                    ],
                  },
                  showCustomUi: true,
                  strict: true,
                },
              },
            },
          ],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã tạo cấu trúc sheet với dropdown và ${employees.length} nhân viên cho tháng ${thang}/${nam}`,
    });
  } catch (error: any) {
    console.error("Error seeding attendance data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to seed attendance data",
      },
      { status: 500 }
    );
  }
}

// Helper function để lấy sheet ID
async function getSheetId(sheets: any, spreadsheetId: string, sheetName: string): Promise<number | null> {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const sheet = response.data.sheets?.find(
      (s: any) => s.properties?.title === sheetName
    );

    return sheet?.properties?.sheetId ?? null;
  } catch (error) {
    console.error("Error getting sheet ID:", error);
    return null;
  }
}
