/**
 * Script để seed data vào sheet ChamCong
 * Chạy: node scripts/seed-cham-cong.js
 */

const { google } = require("googleapis");
require("dotenv").config({ path: ".env.local" });

const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN;
const sheetNameChamCong = process.env.GOOGLE_SHEET_NAME_CHAM_CONG || "ChamCong";

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

async function getSheetId(sheets, spreadsheetId, sheetName) {
  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = response.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );
    return sheet?.properties?.sheetId ?? null;
  } catch (error) {
    console.error("Error getting sheet ID:", error);
    return null;
  }
}

async function seedData() {
  console.log("🚀 Starting seed process...");
  console.log("📊 Sheet:", sheetNameChamCong);
  console.log("📋 Spreadsheet ID:", spreadsheetId);

  try {
    const sheets = await getGoogleSheetsClient();
    console.log("✅ Connected to Google Sheets");

    // Clear sheet
    console.log("🧹 Clearing existing data...");
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetNameChamCong}'!A1:AK100`,
    });

    // Row 1: Selection dropdowns - mặc định tháng 1/2025 (khớp với fake data)
    const row1 = [
      "Chọn tháng:",
      1,
      "Chọn năm:",
      2025,  // Khớp với fake data
      ...Array(32).fill(""),
    ];

    // Row 2: Headers
    const row2 = [
      "STT",
      "Họ Và Tên",
      "Chức Vụ",
      ...Array.from({ length: 31 }, (_, i) => i + 1),
      "Tổng",
    ];

    // Row 3: QUERY formula - lấy dữ liệu từ row 51+ và filter theo tháng/năm
    // Columns: A=STT, B=HoTen, C=ChucVu, D=Thang, E=Nam, F-AJ=Ngay1-31, AK=TongCong
    const queryFormula = `=IFERROR(QUERY(A51:AK200, "SELECT A,B,C,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG,AH,AI,AJ,AK WHERE D="&B1&" AND E="&D1, 0), "Không có dữ liệu cho tháng này")`;

    // Row 50: Data headers
    const dataHeaders = [
      "STT",
      "HoTen",
      "ChucVu",
      "Thang",
      "Nam",
      ...Array.from({ length: 31 }, (_, i) => `Ngay${i + 1}`),
      "TongCong",
    ];

    // Fake data - lấy từ danh sách nhân viên thực tế
    const employees = [
      { name: "Hoàng Việt", position: "Giám đốc" },
      { name: "Hà Bình", position: "Tổng hợp" },
      { name: "Trịnh Thị Hồng", position: "Kế toán" },
      { name: "Lê Thị Thanh Thúy", position: "Partten" },
      { name: "Trần Thị Quý", position: "May mẫu" },
      { name: "Nguyễn Thị Thuận", position: "Thiết kế" },
      { name: "Dương Thị Bích", position: "Quản lý đơn hàng" },
      { name: "Phạm Hoài Phương", position: "Sale sỉ" },
      { name: "Đỗ Thị Hương Giang", position: "Sale sàn" },
      { name: "Nguyễn Thị Thu Phương", position: "Thủ kho" },
    ];

    const thang = 1;
    const nam = 2025;  // Khớp với dropdown mặc định

    console.log(`📝 Generating fake data for ${employees.length} employees...`);

    const fakeDataRows = employees.map((emp, index) => {
      const days = [];
      let tongCong = 0;

      for (let day = 1; day <= 31; day++) {
        const date = new Date(nam, thang - 1, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isWeekend) {
          days.push("O");
        } else {
          const rand = Math.random();
          if (rand < 0.85) {
            days.push("P");
            tongCong++;
          } else if (rand < 0.95) {
            days.push("L");
            tongCong++;
          } else {
            days.push("A");
          }
        }
      }

      return [index + 1, emp.name, emp.position, thang, nam, ...days, tongCong];
    });

    // Build all values
    const allValues = [
      row1,
      row2,
      [queryFormula],
      ...Array(46).fill([""]),
      dataHeaders,
      ...fakeDataRows,
    ];

    console.log("📤 Writing data to sheet...");
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetNameChamCong}'!A1:AK${allValues.length}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: allValues },
    });

    // Add dropdowns
    console.log("🔽 Adding dropdown validations...");
    const sheetId = await getSheetId(sheets, spreadsheetId, sheetNameChamCong);

    if (sheetId !== null) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              setDataValidation: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 1,
                  endColumnIndex: 2,
                },
                rule: {
                  condition: {
                    type: "ONE_OF_LIST",
                    values: Array.from({ length: 12 }, (_, i) => ({
                      userEnteredValue: String(i + 1),
                    })),
                  },
                  showCustomUi: true,
                  strict: true,
                },
              },
            },
            {
              setDataValidation: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 3,
                  endColumnIndex: 4,
                },
                rule: {
                  condition: {
                    type: "ONE_OF_LIST",
                    values: ["2023", "2024", "2025", "2026"].map((y) => ({
                      userEnteredValue: y,
                    })),
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

    console.log("✅ Done! Check your Google Sheet.");
    console.log(`📊 Created data for ${employees.length} employees, month ${thang}/${nam}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedData();
