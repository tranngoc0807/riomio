import { google } from "googleapis";

// Kiểm tra các biến môi trường cần thiết
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1";

if (!privateKey || !clientEmail || !spreadsheetId) {
  throw new Error(
    "Missing Google Sheets credentials. Please check your .env.local file."
  );
}

// Tạo Google Sheets client
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey!.replace(/\\n/g, "\n"), // Convert \n to actual newlines
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient as any });

  return sheets;
}

// Interface cho dữ liệu nhân viên
export interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string;
  birthday: string;
  cccd: string;
  address: string;
}

/**
 * Đọc dữ liệu nhân viên từ Google Sheets
 * ID được tự động generate, bỏ qua cột A (STT)
 * Header ở dòng 1, đọc dữ liệu từ dòng 2, cột B đến G
 */
export async function getEmployeesFromSheet(): Promise<Employee[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!B2:G`, // Header dòng 1, dữ liệu từ dòng 2, đọc cột B-G
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No employee data found in sheet.");
      return [];
    }

    // Chuyển đổi dữ liệu từ sheet thành Employee objects - ID tự động generate
    const employees: Employee[] = rows
      .map((row, index) => ({
        id: index + 1, // Auto-generate ID từ 1, 2, 3...
        name: row[0] || "",
        position: row[1] || "",
        phone: row[2] || "",
        birthday: row[3] || "",
        cccd: row[4] || "",
        address: row[5] || "",
      }))
      .filter((emp) => emp.name.trim() !== ""); // Lọc bỏ các dòng trống

    return employees;
  } catch (error) {
    console.error("Error reading from Google Sheets:", error);
    throw error;
  }
}

/**
 * Ghi dữ liệu nhân viên vào Google Sheets
 * @param employees - Mảng dữ liệu nhân viên
 * @param append - Nếu true, thêm vào cuối. Nếu false, ghi đè toàn bộ
 * Ghi vào cột B-G, từ dòng 2 trở đi
 */
export async function writeEmployeesToSheet(
  employees: Employee[],
  append: boolean = false
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Chuyển đổi Employee objects thành mảng 2D - ghi vào cột B-G
    const values = employees.map((emp) => [
      emp.name,
      emp.position,
      emp.phone,
      emp.birthday,
      emp.cccd,
      emp.address,
    ]);

    if (append) {
      // Thêm dữ liệu vào cuối sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!B2:G`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values,
        },
      });
    } else {
      // Xóa dữ liệu cũ và ghi mới (giữ lại header dòng 1)
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!B2:G`,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!B2:G`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values,
        },
      });
    }

    console.log(`Successfully wrote ${employees.length} employees to sheet.`);
  } catch (error) {
    console.error("Error writing to Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm một nhân viên mới vào Google Sheets
 * Tự động đánh STT vào cột A, ghi dữ liệu vào cột B-G
 * Header ở dòng 1, dữ liệu từ dòng 2 trở đi
 */
export async function addEmployeeToSheet(employee: Employee): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:G`, // Đọc toàn bộ từ A đến G
    });

    const allRows = response.data.values || [];

    // Bỏ qua header (dòng 1), tìm dòng cuối cùng có dữ liệu
    let lastDataRow = 1; // Dòng 1 là header
    for (let i = allRows.length - 1; i >= 1; i--) {
      // Kiểm tra xem dòng có dữ liệu không (kiểm tra cột B - name)
      if (allRows[i] && allRows[i][1] && allRows[i][1].toString().trim() !== "") {
        lastDataRow = i + 1; // +1 vì index 0-based -> row number 1-based
        break;
      }
    }

    // Dòng mới sẽ là dòng ngay sau dòng cuối cùng có dữ liệu
    const nextRow = lastDataRow + 1;

    // Đếm số nhân viên thực tế để đánh STT (không tính dòng 1 - header)
    const employeeRows = allRows.slice(1).filter(
      (row) => row && row[1] && row[1].toString().trim() !== ""
    );
    const sttNumber = employeeRows.length + 1;

    // Ghi cả STT (cột A) và dữ liệu nhân viên (cột B-G)
    const values = [
      [
        sttNumber, // Cột A: STT
        employee.name, // Cột B
        employee.position, // Cột C
        employee.phone, // Cột D
        employee.birthday, // Cột E
        employee.cccd, // Cột F
        employee.address, // Cột G
      ],
    ];

    // Ghi dữ liệu vào dòng mới
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${nextRow}:G${nextRow}`, // Ghi từ cột A đến G
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added employee: ${employee.name} with STT: ${sttNumber} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding employee to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin một nhân viên trong Google Sheets
 * ID được dùng để xác định vị trí dòng (ID = row index + 1)
 * Ghi vào cột B-G, bỏ qua cột A (STT)
 * Header ở dòng 1, dữ liệu từ dòng 2: ID 1 = dòng 2, ID 2 = dòng 3, etc.
 */
export async function updateEmployeeInSheet(
  employee: Employee
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = employee.id + 1;

    const values = [
      [
        employee.name,
        employee.position,
        employee.phone,
        employee.birthday,
        employee.cccd,
        employee.address,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!B${rowNumber}:G${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated employee: ${employee.name}`);
  } catch (error) {
    console.error("Error updating employee in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa một nhân viên khỏi Google Sheets
 * ID được dùng để xác định vị trí dòng (ID = row index + 1)
 * Header ở dòng 1, dữ liệu từ dòng 2: ID 1 = dòng 2, ID 2 = dòng 3, etc.
 */
export async function deleteEmployeeFromSheet(
  employeeId: number
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = employeeId + 1;

    // Lấy sheetId để xóa dòng - dùng sheet đầu tiên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const firstSheet = sheetMetadata.data.sheets?.[0];
    if (!firstSheet || firstSheet.properties?.sheetId === undefined) {
      console.error("First sheet:", firstSheet);
      throw new Error("Cannot find sheet to delete row");
    }

    const sheetId = firstSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber, // exclusive
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted employee with ID: ${employeeId}`);
  } catch (error) {
    console.error("Error deleting employee from Google Sheets:", error);
    throw error;
  }
}
