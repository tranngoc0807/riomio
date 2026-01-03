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

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // Tìm sheet có tên khớp với sheetName
    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetName
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetName}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

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

    console.log(`Successfully deleted employee with ID: ${employeeId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting employee from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// ACCOUNT MANAGEMENT (Quản lý tài khoản)
// ============================================

const spreadsheetIdTaiKhoan = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN;
const sheetNameTaiKhoan = process.env.GOOGLE_SHEET_NAME_TAI_KHOAN || "TaiKhoan";

if (!spreadsheetIdTaiKhoan) {
  console.warn("Missing GOOGLE_SPREADSHEET_ID_TAI_KHOAN in .env.local");
}

// Interface cho dữ liệu tài khoản
export interface Account {
  id: number;
  accountNumber: string;
  ownerName: string;
  type: string; // Loại tài khoản (cash/bank)
}

/**
 * Đọc dữ liệu tài khoản từ Google Sheets
 * ID được tự động generate, bỏ qua cột A (STT)
 * Header ở dòng 1, đọc dữ liệu từ dòng 2, cột B đến D
 */
export async function getAccountsFromSheet(): Promise<Account[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTaiKhoan,
      range: `${sheetNameTaiKhoan}!B2:D`, // Header dòng 1, dữ liệu từ dòng 2, đọc cột B-D
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No account data found in sheet.");
      return [];
    }

    // Chuyển đổi dữ liệu từ sheet thành Account objects - ID tự động generate
    const accounts: Account[] = rows
      .map((row, index) => ({
        id: index + 1, // Auto-generate ID từ 1, 2, 3...
        accountNumber: row[0] || "",
        ownerName: row[1] || "",
        type: row[2] || "", // Cột D: Loại tài khoản
      }))
      .filter((acc) => acc.accountNumber.trim() !== ""); // Lọc bỏ các dòng trống

    return accounts;
  } catch (error) {
    console.error("Error reading accounts from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm một tài khoản mới vào Google Sheets
 * Tự động đánh STT vào cột A, ghi dữ liệu vào cột B-D
 * Header ở dòng 1, dữ liệu từ dòng 2 trở đi
 */
export async function addAccountToSheet(account: Account): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTaiKhoan,
      range: `${sheetNameTaiKhoan}!A:D`, // Đọc toàn bộ từ A đến D
    });

    const allRows = response.data.values || [];

    // Bỏ qua header (dòng 1), tìm dòng cuối cùng có dữ liệu
    let lastDataRow = 1; // Dòng 1 là header
    for (let i = allRows.length - 1; i >= 1; i--) {
      // Kiểm tra xem dòng có dữ liệu không (kiểm tra cột B - accountNumber)
      if (allRows[i] && allRows[i][1] && allRows[i][1].toString().trim() !== "") {
        lastDataRow = i + 1; // +1 vì index 0-based -> row number 1-based
        break;
      }
    }

    // Dòng mới sẽ là dòng ngay sau dòng cuối cùng có dữ liệu
    const nextRow = lastDataRow + 1;

    // Đếm số tài khoản thực tế để đánh STT (không tính dòng 1 - header)
    const accountRows = allRows.slice(1).filter(
      (row) => row && row[1] && row[1].toString().trim() !== ""
    );
    const sttNumber = accountRows.length + 1;

    // Ghi cả STT (cột A) và dữ liệu tài khoản (cột B-D)
    const values = [
      [
        sttNumber, // Cột A: STT
        account.accountNumber, // Cột B
        account.ownerName, // Cột C
        account.type, // Cột D: Loại
      ],
    ];

    // Ghi dữ liệu vào dòng mới
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdTaiKhoan,
      range: `${sheetNameTaiKhoan}!A${nextRow}:D${nextRow}`, // Ghi từ cột A đến D
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added account: ${account.accountNumber} with STT: ${sttNumber} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding account to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin một tài khoản trong Google Sheets
 * ID được dùng để xác định vị trí dòng (ID = row index + 1)
 * Ghi vào cột B-D, bỏ qua cột A (STT)
 * Header ở dòng 1, dữ liệu từ dòng 2: ID 1 = dòng 2, ID 2 = dòng 3, etc.
 */
export async function updateAccountInSheet(account: Account): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = account.id + 1;

    const values = [
      [
        account.accountNumber,
        account.ownerName,
        account.type, // Cột D: Loại
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdTaiKhoan,
      range: `${sheetNameTaiKhoan}!B${rowNumber}:D${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated account: ${account.accountNumber}`);
  } catch (error) {
    console.error("Error updating account in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa một tài khoản khỏi Google Sheets
 * ID được dùng để xác định vị trí dòng (ID = row index + 1)
 * Header ở dòng 1, dữ liệu từ dòng 2: ID 1 = dòng 2, ID 2 = dòng 3, etc.
 */
export async function deleteAccountFromSheet(accountId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = accountId + 1;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdTaiKhoan,
    });

    // Tìm sheet có tên khớp với sheetNameTaiKhoan
    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameTaiKhoan
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameTaiKhoan}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdTaiKhoan,
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

    console.log(`Successfully deleted account with ID: ${accountId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting account from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// CUSTOMER MANAGEMENT (Quản lý khách hàng)
// ============================================

const spreadsheetIdKhachHang = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameKhachHang = process.env.GOOGLE_SHEET_NAME_KHACH_HANG || "DSKhachHang";

// Interface cho khách hàng
export interface Customer {
  id: number;
  name: string;
  category: string;
  phone: string;
  address: string;
}

/**
 * Đọc danh sách khách hàng từ Google Sheets
 * Sheet: DSKhachHang
 * Cột B: Khách hàng, C: Phân Loại, D: SĐT, E: Địa chỉ
 */
export async function getCustomersFromSheet(): Promise<Customer[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `${sheetNameKhachHang}!B2:E`, // Đọc từ dòng 2, cột B đến E
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No customer data found in sheet.");
      return [];
    }

    const customers: Customer[] = rows
      .map((row, index) => ({
        id: index + 1,
        name: row[0] || "",
        category: row[1] || "",
        phone: row[2] || "",
        address: row[3] || "",
      }))
      .filter((customer) => customer.name.trim() !== "");

    return customers;
  } catch (error) {
    console.error("Error reading customers from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm khách hàng mới vào Google Sheets
 */
export async function addCustomerToSheet(customer: Customer): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = customer.id + 1;

    // Ghi STT vào cột A và data vào cột B-E
    const values = [
      [
        customer.id, // STT vào cột A
        customer.name,
        customer.category,
        customer.phone,
        customer.address,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `${sheetNameKhachHang}!A${rowNumber}:E${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added customer with ID: ${customer.id}`);
  } catch (error) {
    console.error("Error adding customer to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin khách hàng trong Google Sheets
 */
export async function updateCustomerInSheet(customer: Customer): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = customer.id + 1;

    // Cập nhật cột B-E (không cập nhật cột A - STT)
    const values = [
      [
        customer.name,
        customer.category,
        customer.phone,
        customer.address,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `${sheetNameKhachHang}!B${rowNumber}:E${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated customer with ID: ${customer.id}`);
  } catch (error) {
    console.error("Error updating customer in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa khách hàng khỏi Google Sheets
 */
export async function deleteCustomerFromSheet(customerId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = customerId + 1;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdKhachHang,
    });

    // Tìm sheet có tên khớp với sheetNameKhachHang
    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameKhachHang
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameKhachHang}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdKhachHang,
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

    console.log(`Successfully deleted customer with ID: ${customerId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting customer from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// SALES PROGRAM MANAGEMENT (Quản lý chương trình bán hàng)
// ============================================

const spreadsheetIdCTBanHang = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameCTBanHang = process.env.GOOGLE_SHEET_NAME_CHUONG_TRINH_BAN_HANG || "CTBanHang";

// Interface cho chương trình bán hàng
export interface SalesProgram {
  id: number;
  code: string;
  discount: string;
  type: "percent" | "fixed";
}

/**
 * Đọc danh sách chương trình bán hàng từ Google Sheets
 * Sheet: CTBanHang
 * Cột B: Mã chương trình, C: Chiết khấu
 */
export async function getSalesProgramsFromSheet(): Promise<SalesProgram[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdCTBanHang,
      range: `${sheetNameCTBanHang}!B2:C`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No sales program data found in sheet.");
      return [];
    }

    const programs: SalesProgram[] = rows
      .map((row, index) => {
        const discount = row[1] || "";
        // Determine type based on discount format
        const isPercent = discount.includes("%");

        return {
          id: index + 1,
          code: row[0] || "",
          discount: discount,
          type: isPercent ? "percent" as const : "fixed" as const,
        };
      })
      .filter((program) => program.code.trim() !== "");

    return programs;
  } catch (error) {
    console.error("Error reading sales programs from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm chương trình bán hàng mới vào Google Sheets
 */
export async function addSalesProgramToSheet(program: SalesProgram): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdCTBanHang,
      range: `${sheetNameCTBanHang}!A:C`,
    });

    const allRows = response.data.values || [];

    // Bỏ qua header (dòng 1), tìm dòng cuối cùng có dữ liệu
    let lastDataRow = 1;
    for (let i = allRows.length - 1; i >= 1; i--) {
      if (allRows[i] && allRows[i][1] && allRows[i][1].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Đếm số chương trình thực tế để đánh STT
    const programRows = allRows.slice(1).filter(
      (row) => row && row[1] && row[1].toString().trim() !== ""
    );
    const sttNumber = programRows.length + 1;

    // Ghi cả STT (cột A) và dữ liệu (cột B-C)
    const values = [
      [
        sttNumber,
        program.code,
        program.discount,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdCTBanHang,
      range: `${sheetNameCTBanHang}!A${nextRow}:C${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added sales program: ${program.code}`);
  } catch (error) {
    console.error("Error adding sales program to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật chương trình bán hàng trong Google Sheets
 */
export async function updateSalesProgramInSheet(program: SalesProgram): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = program.id + 1;

    const values = [
      [
        program.code,
        program.discount,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdCTBanHang,
      range: `${sheetNameCTBanHang}!B${rowNumber}:C${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated sales program: ${program.code}`);
  } catch (error) {
    console.error("Error updating sales program in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa chương trình bán hàng khỏi Google Sheets
 */
export async function deleteSalesProgramFromSheet(programId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = programId + 1;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdCTBanHang,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameCTBanHang
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameCTBanHang}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdCTBanHang,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted sales program with ID: ${programId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting sales program from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// ORDER MANAGEMENT (Quản lý đơn hàng)
// ============================================

const spreadsheetIdDonHang = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameDonHang = process.env.GOOGLE_SHEET_NAME_DON_HANG || "DonHang";

// Interface cho đơn hàng
export interface Order {
  id: number;
  code: string;           // Mã Đơn hàng (A)
  date: string;           // Ngày Đặt (B)
  customer: string;       // Khách hàng (C)
  productCode: string;    // Mã SP (D)
  image: string;          // Hình ảnh (E)
  items: number;          // SL (F)
  productPrice: number;   // Giá Sỉ (G)
  subtotal: number;       // Tiền Hàng (H)
  salesProgram: string;   // Chương trình BH (I)
  discount: string;       // Chiết Khấu (J)
  priceAfterDiscount: number; // Đơn giá sau chiết khấu (K)
  subtotalAfterDiscount: number; // Tiền hàng sau chiết khấu (L)
  paymentDiscount: string; // CK thanh toán (M)
  total: number;          // Khách phải trả (N)
  salesUser: string;      // User bán hàng (O)
  status: "completed" | "processing" | "pending" | "shipping"; // Tình trạng đơn hàng (P)
  notes: string;          // Ghi chú (Q)
  // Deprecated fields for backward compatibility
  freeItems?: string;
  paymentStatus?: "paid" | "partial" | "unpaid";
}

/**
 * Đọc danh sách đơn hàng từ Google Sheets
 * Sheet: DonHang
 */
export async function getOrdersFromSheet(): Promise<Order[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDonHang,
      range: `${sheetNameDonHang}!A2:Q`, // Đọc từ dòng 2, tất cả các cột (A-Q)
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No order data found in sheet.");
      return [];
    }

    const orders: Order[] = rows.map((row, index) => {
      // Map status (P - column 15)
      const statusText = (row[15] || "").toLowerCase();
      let status: Order["status"] = "pending";
      if (statusText.includes("hoàn thành")) status = "completed";
      else if (statusText.includes("đang xử lý")) status = "processing";
      else if (statusText.includes("đang giao")) status = "shipping";

      return {
        id: index + 1,
        code: row[0] || "",                    // A - Mã Đơn hàng
        date: row[1] || "",                    // B - Ngày Đặt
        customer: row[2] || "",                // C - Khách hàng
        productCode: row[3] || "",             // D - Mã SP
        image: row[4] || "",                   // E - Hình ảnh
        items: parseInt(row[5]) || 0,          // F - SL
        productPrice: parseFloat((row[6] || "0").toString().replace(/\./g, "")) || 0, // G - Giá Sỉ
        subtotal: parseFloat((row[7] || "0").toString().replace(/\./g, "")) || 0, // H - Tiền Hàng
        salesProgram: row[8] || "",            // I - Chương trình BH
        discount: row[9] || "",                // J - Chiết Khấu
        priceAfterDiscount: parseFloat((row[10] || "0").toString().replace(/\./g, "")) || 0, // K - Đơn giá sau chiết khấu
        subtotalAfterDiscount: parseFloat((row[11] || "0").toString().replace(/\./g, "")) || 0, // L - Tiền hàng sau chiết khấu
        paymentDiscount: row[12] || "",        // M - CK thanh toán
        total: parseFloat((row[13] || "0").toString().replace(/\./g, "")) || 0, // N - Khách phải trả
        salesUser: row[14] || "",              // O - User bán hàng
        status,                                // P - Tình trạng đơn hàng
        notes: row[16] || "",                  // Q - Ghi chú
      };
    }).filter((order) => order.code.trim() !== "");

    return orders;
  } catch (error) {
    console.error("Error reading orders from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm đơn hàng mới vào Google Sheets
 */
export async function addOrderToSheet(order: Order): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Map status to Vietnamese
    const statusMap: Record<string, string> = {
      completed: "Hoàn thành",
      processing: "Đang xử lý",
      pending: "Chờ xử lý",
      shipping: "Đang giao",
    };

    // Ghi data vào sheet (sử dụng append để thêm vào cuối)
    const values = [
      [
        order.code,                                      // A - Mã Đơn hàng
        order.date,                                      // B - Ngày Đặt
        order.customer,                                  // C - Khách hàng
        order.productCode || "",                         // D - Mã SP
        order.image || "",                               // E - Hình ảnh
        order.items,                                     // F - SL
        order.productPrice ? formatNumberVN(order.productPrice) : "", // G - Giá Sỉ
        order.subtotal ? formatNumberVN(order.subtotal) : "", // H - Tiền Hàng
        order.salesProgram || "",                        // I - Chương trình BH
        order.discount || "",                            // J - Chiết Khấu
        order.priceAfterDiscount ? formatNumberVN(order.priceAfterDiscount) : "", // K - Đơn giá sau chiết khấu
        order.subtotalAfterDiscount ? formatNumberVN(order.subtotalAfterDiscount) : "", // L - Tiền hàng sau chiết khấu
        order.paymentDiscount || "",                     // M - CK thanh toán
        formatNumberVN(order.total),                     // N - Khách phải trả
        order.salesUser || "",                           // O - User bán hàng
        statusMap[order.status],                         // P - Tình trạng đơn hàng
        order.notes || "",                               // Q - Ghi chú
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdDonHang,
      range: `${sheetNameDonHang}!A:Q`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added order: ${order.code}`);
  } catch (error) {
    console.error("Error adding order to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật đơn hàng trong Google Sheets
 */
export async function updateOrderInSheet(order: Order): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = order.id + 1;

    // Map status to Vietnamese
    const statusMap: Record<string, string> = {
      completed: "Hoàn thành",
      processing: "Đang xử lý",
      pending: "Chờ xử lý",
      shipping: "Đang giao",
    };

    const values = [
      [
        order.code,                                      // A - Mã Đơn hàng
        order.date,                                      // B - Ngày Đặt
        order.customer,                                  // C - Khách hàng
        order.productCode || "",                         // D - Mã SP
        order.image || "",                               // E - Hình ảnh
        order.items,                                     // F - SL
        order.productPrice ? formatNumberVN(order.productPrice) : "", // G - Giá Sỉ
        order.subtotal ? formatNumberVN(order.subtotal) : "", // H - Tiền Hàng
        order.salesProgram || "",                        // I - Chương trình BH
        order.discount || "",                            // J - Chiết Khấu
        order.priceAfterDiscount ? formatNumberVN(order.priceAfterDiscount) : "", // K - Đơn giá sau chiết khấu
        order.subtotalAfterDiscount ? formatNumberVN(order.subtotalAfterDiscount) : "", // L - Tiền hàng sau chiết khấu
        order.paymentDiscount || "",                     // M - CK thanh toán
        formatNumberVN(order.total),                     // N - Khách phải trả
        order.salesUser || "",                           // O - User bán hàng
        statusMap[order.status],                         // P - Tình trạng đơn hàng
        order.notes || "",                               // Q - Ghi chú
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdDonHang,
      range: `${sheetNameDonHang}!A${rowNumber}:Q${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated order: ${order.code}`);
  } catch (error) {
    console.error("Error updating order in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa đơn hàng khỏi Google Sheets
 */
export async function deleteOrderFromSheet(orderId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = orderId + 1;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdDonHang,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameDonHang
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameDonHang}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdDonHang,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted order with ID: ${orderId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting order from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// SUPPLIER MANAGEMENT (Quản lý nhà cung cấp)
// ============================================

const spreadsheetIdNCC = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameNCC = process.env.GOOGLE_SHEET_NAME_DON_HANG_NCCNPL || "NCCNPL";

// Interface cho nhà cung cấp
export interface Supplier {
  id: number;
  name: string;       // NCC (Tên nhà cung cấp)
  material: string;   // Chất liệu
  address: string;    // Địa chỉ
  contact: string;    // Liên hệ
  phone: string;      // Điện thoại
  note: string;       // Ghi chú
}

/**
 * Đọc danh sách nhà cung cấp từ Google Sheets
 * Sheet: NCCNPL
 * Cột B: NCC, C: Chất liệu, D: Địa chỉ, E: Liên hệ, F: Điện thoại, G: Ghi chú
 */
export async function getSuppliersFromSheet(): Promise<Supplier[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNCC,
      range: `${sheetNameNCC}!B2:G`, // Đọc từ dòng 2, cột B đến G
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No supplier data found in sheet.");
      return [];
    }

    const suppliers: Supplier[] = rows
      .map((row, index) => ({
        id: index + 1,
        name: row[0] || "",
        material: row[1] || "",
        address: row[2] || "",
        contact: row[3] || "",
        phone: row[4] || "",
        note: row[5] || "",
      }))
      .filter((supplier) => supplier.name.trim() !== "");

    return suppliers;
  } catch (error) {
    console.error("Error reading suppliers from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm nhà cung cấp mới vào Google Sheets
 * Tự động đánh STT vào cột A, ghi dữ liệu vào cột B-G
 */
export async function addSupplierToSheet(supplier: Supplier): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNCC,
      range: `${sheetNameNCC}!A:G`,
    });

    const allRows = response.data.values || [];

    // Bỏ qua header (dòng 1), tìm dòng cuối cùng có dữ liệu
    let lastDataRow = 1;
    for (let i = allRows.length - 1; i >= 1; i--) {
      if (allRows[i] && allRows[i][1] && allRows[i][1].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Đếm số nhà cung cấp thực tế để đánh STT
    const supplierRows = allRows.slice(1).filter(
      (row) => row && row[1] && row[1].toString().trim() !== ""
    );
    const sttNumber = supplierRows.length + 1;

    // Ghi cả STT (cột A) và dữ liệu (cột B-G)
    const values = [
      [
        sttNumber,
        supplier.name,
        supplier.material,
        supplier.address,
        supplier.contact,
        supplier.phone,
        supplier.note,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNCC,
      range: `${sheetNameNCC}!A${nextRow}:G${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added supplier: ${supplier.name} with STT: ${sttNumber} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding supplier to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin nhà cung cấp trong Google Sheets
 */
export async function updateSupplierInSheet(supplier: Supplier): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = supplier.id + 1;

    const values = [
      [
        supplier.name,
        supplier.material,
        supplier.address,
        supplier.contact,
        supplier.phone,
        supplier.note,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNCC,
      range: `${sheetNameNCC}!B${rowNumber}:G${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated supplier: ${supplier.name}`);
  } catch (error) {
    console.error("Error updating supplier in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa nhà cung cấp khỏi Google Sheets
 */
export async function deleteSupplierFromSheet(supplierId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = supplierId + 1;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdNCC,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameNCC
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameNCC}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdNCC,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted supplier with ID: ${supplierId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting supplier from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// WORKSHOP MANAGEMENT (Quản lý xưởng sản xuất)
// ============================================

const spreadsheetIdXuongSX = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameXuongSX = process.env.GOOGLE_SHEET_NAME_XUONG_SAN_XUAT || "XuongSX";

// Interface cho xưởng sản xuất
export interface Workshop {
  id: number;
  name: string;       // Mã xưởng (Tên xưởng)
  phone: string;      // Điện thoại
  address: string;    // Địa chỉ
  manager: string;    // Người phụ trách
  note: string;       // Ghi chú
}

/**
 * Đọc danh sách xưởng sản xuất từ Google Sheets
 * Sheet: XuongSX
 * Cột B: Mã xưởng, C: Điện thoại, D: Địa chỉ, E: Người phụ trách, F: Ghi chú
 */
export async function getWorkshopsFromSheet(): Promise<Workshop[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdXuongSX,
      range: `${sheetNameXuongSX}!B2:F`, // Đọc từ dòng 2, cột B đến F
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No workshop data found in sheet.");
      return [];
    }

    const workshops: Workshop[] = rows
      .map((row, index) => ({
        id: index + 1,
        name: row[0] || "",
        phone: row[1] || "",
        address: row[2] || "",
        manager: row[3] || "",
        note: row[4] || "",
      }))
      .filter((workshop) => workshop.name.trim() !== "");

    return workshops;
  } catch (error) {
    console.error("Error reading workshops from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm xưởng sản xuất mới vào Google Sheets
 * Tự động đánh STT vào cột A, ghi dữ liệu vào cột B-F
 */
export async function addWorkshopToSheet(workshop: Workshop): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdXuongSX,
      range: `${sheetNameXuongSX}!A:F`,
    });

    const allRows = response.data.values || [];

    // Bỏ qua header (dòng 1), tìm dòng cuối cùng có dữ liệu
    let lastDataRow = 1;
    for (let i = allRows.length - 1; i >= 1; i--) {
      if (allRows[i] && allRows[i][1] && allRows[i][1].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Đếm số xưởng thực tế để đánh STT
    const workshopRows = allRows.slice(1).filter(
      (row) => row && row[1] && row[1].toString().trim() !== ""
    );
    const sttNumber = workshopRows.length + 1;

    // Ghi cả STT (cột A) và dữ liệu (cột B-F)
    const values = [
      [
        sttNumber,
        workshop.name,
        workshop.phone,
        workshop.address,
        workshop.manager,
        workshop.note,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdXuongSX,
      range: `${sheetNameXuongSX}!A${nextRow}:F${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added workshop: ${workshop.name} with STT: ${sttNumber} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding workshop to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin xưởng sản xuất trong Google Sheets
 */
export async function updateWorkshopInSheet(workshop: Workshop): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = workshop.id + 1;

    const values = [
      [
        workshop.name,
        workshop.phone,
        workshop.address,
        workshop.manager,
        workshop.note,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdXuongSX,
      range: `${sheetNameXuongSX}!B${rowNumber}:F${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated workshop: ${workshop.name}`);
  } catch (error) {
    console.error("Error updating workshop in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa xưởng sản xuất khỏi Google Sheets
 */
export async function deleteWorkshopFromSheet(workshopId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = workshopId + 1;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdXuongSX,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameXuongSX
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameXuongSX}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdXuongSX,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted workshop with ID: ${workshopId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting workshop from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// MATERIAL MANAGEMENT (Quản lý nguyên phụ liệu)
// ============================================

const spreadsheetIdNPL = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameNPL = process.env.GOOGLE_SHEET_NAME_NGUYEN_PHU_LIEU || "NPL";

// Interface cho nguyên phụ liệu
export interface Material {
  id: number;
  code: string;          // Mã NPL
  name: string;          // Tên NPL
  supplier: string;      // Nhà cung cấp
  info: string;          // Thông tin NPL
  unit: string;          // ĐVT
  priceBeforeTax: number; // Đơn giá chưa thuế
  taxRate: number;       // Thuế suất
  priceWithTax: number;  // Đơn giá có thuế
  image: string;         // Hình ảnh
  note: string;          // Ghi chú
}

/**
 * Đọc danh sách nguyên phụ liệu từ Google Sheets
 * Sheet: NPL
 * Cột B: Mã NPL, C: Tên NPL, D: Nhà cung cấp, E: Thông tin NPL, F: ĐVT,
 * G: Đơn giá chưa thuế, H: Thuế suất, I: Đơn giá có thuế, J: Hình ảnh, K: Ghi chú
 */
export async function getMaterialsFromSheet(): Promise<Material[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNPL,
      range: `${sheetNameNPL}!B2:K`, // Đọc từ dòng 2, cột B đến K
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No material data found in sheet.");
      return [];
    }

    // Helper function to parse price values (remove thousand separators)
    const parsePrice = (value: any): number => {
      if (!value) return 0;
      // Remove thousand separators (. , or spaces) and parse
      const cleaned = value.toString().replace(/[,.\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const materials: Material[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: row[0] || "",
        name: row[1] || "",
        supplier: row[2] || "",
        info: row[3] || "",
        unit: row[4] || "",
        priceBeforeTax: parsePrice(row[5]),
        taxRate: parseFloat(row[6]?.toString().replace(/[%\s]/g, '')) || 0,
        priceWithTax: parsePrice(row[7]),
        image: row[8] || "",
        note: row[9] || "",
      }))
      .filter((material) =>
        // Bỏ qua header row và những dòng hoàn toàn trống
        // Cho phép dòng có code rỗng nhưng phải có name
        (material.code.trim() !== "" || material.name.trim() !== "") &&
        material.code !== "Mã NPL" &&
        !material.code.toLowerCase().includes("mã npl") &&
        material.name !== "Tên NPL"
      );

    return materials;
  } catch (error) {
    console.error("Error reading materials from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm nguyên phụ liệu mới vào Google Sheets
 * Tự động đánh STT vào cột A, ghi dữ liệu vào cột B-K
 */
export async function addMaterialToSheet(material: Material): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNPL,
      range: `${sheetNameNPL}!A:K`,
    });

    const allRows = response.data.values || [];

    // Bỏ qua header (dòng 1), tìm dòng cuối cùng có dữ liệu
    let lastDataRow = 1;
    for (let i = allRows.length - 1; i >= 1; i--) {
      if (allRows[i] && allRows[i][1] && allRows[i][1].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Đếm số nguyên phụ liệu thực tế để đánh STT
    const materialRows = allRows.slice(1).filter(
      (row) => row && row[1] && row[1].toString().trim() !== ""
    );
    const sttNumber = materialRows.length + 1;

    // Ghi cả STT (cột A) và dữ liệu (cột B-K)
    const values = [
      [
        sttNumber,
        material.code,
        material.name,
        material.supplier,
        material.info,
        material.unit,
        material.priceBeforeTax,
        material.taxRate,
        material.priceWithTax,
        material.image,
        material.note,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNPL,
      range: `${sheetNameNPL}!A${nextRow}:K${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added material: ${material.name} with STT: ${sttNumber} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding material to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin nguyên phụ liệu trong Google Sheets
 */
export async function updateMaterialInSheet(material: Material): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = material.id + 1;

    const values = [
      [
        material.code,
        material.name,
        material.supplier,
        material.info,
        material.unit,
        material.priceBeforeTax,
        material.taxRate,
        material.priceWithTax,
        material.image,
        material.note,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNPL,
      range: `${sheetNameNPL}!B${rowNumber}:K${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated material: ${material.name}`);
  } catch (error) {
    console.error("Error updating material in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa nguyên phụ liệu khỏi Google Sheets
 */
export async function deleteMaterialFromSheet(materialId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 2, ID 2 = dòng 3, etc.
    const rowNumber = materialId + 1;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdNPL,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameNPL
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameNPL}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdNPL,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted material with ID: ${materialId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting material from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// LOAN MANAGEMENT (Quản lý khoản vay)
// ============================================

const spreadsheetIdKhoanVay = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameKhoanVay = process.env.GOOGLE_SHEET_NAME_KHOAN_VAY || "KhoanVay";

// Interface cho khoản vay
export interface Loan {
  id: number;
  code: string;
  lender: string;
  amount: number;
  remaining: number;
  interestRate: string;
  interestType: string;
  monthlyInterest: number;
  dueDate: string;
  status: string;
}

/**
 * Đọc danh sách khoản vay từ Google Sheets
 * Sheet: KhoanVay
 * Cột A: Mã món vay, B: Chủ nợ, C: Dư nợ gốc hiện tại, D: Lãi suất,
 * E: Kiểu tính lãi, F: Góc tính lãi, G: Dư tinh tiền lãi phải trả tháng này,
 * H: Ngày đến hạn trả lãi, I: Trạng thái
 */
export async function getLoansFromSheet(): Promise<Loan[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKhoanVay,
      range: `${sheetNameKhoanVay}!A2:I`, // Đọc từ dòng 2, cột A đến I
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No loan data found in sheet.");
      return [];
    }

    const loans: Loan[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: row[0] || "",
        lender: row[1] || "",
        remaining: parseFloat(row[2]?.replace(/[,\.]/g, "") || "0"),
        interestRate: row[3] || "",
        interestType: row[4] || "",
        amount: parseFloat(row[5]?.replace(/[,\.]/g, "") || "0"),
        monthlyInterest: parseFloat(row[6]?.replace(/[,\.]/g, "") || "0"),
        dueDate: row[7] || "",
        status: row[8] || "",
      }))
      .filter((loan) => loan.code.trim() !== "");

    return loans;
  } catch (error) {
    console.error("Error reading loans from Google Sheets:", error);
    throw error;
  }
}

/**
 * Format number with Vietnamese thousand separator (dots)
 */
function formatNumberVN(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Thêm khoản vay mới vào Google Sheets
 */
export async function addLoanToSheet(loan: Loan): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Ghi data vào cột A-I (append vào cuối sheet)
    // Format numbers with dots as thousand separators for Vietnamese format
    const values = [
      [
        loan.code,
        loan.lender,
        formatNumberVN(loan.remaining),
        loan.interestRate,
        loan.interestType,
        formatNumberVN(loan.amount),
        formatNumberVN(loan.monthlyInterest),
        loan.dueDate,
        loan.status,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdKhoanVay,
      range: `${sheetNameKhoanVay}!A:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added loan with code: ${loan.code}`);
  } catch (error) {
    console.error("Error adding loan to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin khoản vay trong Google Sheets
 */
export async function updateLoanInSheet(loan: Loan): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Tìm row number dựa trên code
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKhoanVay,
      range: `${sheetNameKhoanVay}!A:A`,
    });

    const rows = response.data.values || [];
    let rowNumber = -1;

    // Tìm row có code khớp (bắt đầu từ row 2 vì row 1 là header)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === loan.code) {
        rowNumber = i + 1; // +1 vì Google Sheets bắt đầu từ 1
        break;
      }
    }

    if (rowNumber === -1) {
      throw new Error(`Loan with code ${loan.code} not found`);
    }

    // Cập nhật cột A-I
    // Format numbers with dots as thousand separators for Vietnamese format
    const values = [
      [
        loan.code,
        loan.lender,
        formatNumberVN(loan.remaining),
        loan.interestRate,
        loan.interestType,
        formatNumberVN(loan.amount),
        formatNumberVN(loan.monthlyInterest),
        loan.dueDate,
        loan.status,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdKhoanVay,
      range: `${sheetNameKhoanVay}!A${rowNumber}:I${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated loan with code: ${loan.code}`);
  } catch (error) {
    console.error("Error updating loan in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa khoản vay khỏi Google Sheets
 */
export async function deleteLoanFromSheet(loanCode: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Tìm row number dựa trên code
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKhoanVay,
      range: `${sheetNameKhoanVay}!A:A`,
    });

    const rows = response.data.values || [];
    let rowNumber = -1;

    // Tìm row có code khớp (bắt đầu từ row 2 vì row 1 là header)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === loanCode) {
        rowNumber = i + 1; // +1 vì Google Sheets bắt đầu từ 1
        break;
      }
    }

    if (rowNumber === -1) {
      throw new Error(`Loan with code ${loanCode} not found`);
    }

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdKhoanVay,
    });

    // Tìm sheet có tên khớp với sheetNameKhoanVay
    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameKhoanVay
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameKhoanVay}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdKhoanVay,
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

    console.log(`Successfully deleted loan with code: ${loanCode} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting loan from Google Sheets:", error);
    throw error;
  }
}
