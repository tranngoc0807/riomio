import { google } from "googleapis";
import { translateApiError } from "./apiError";

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

/**
 * Monkey-patch từng method API mà chúng ta hay dùng trên sheets client
 * để mỗi khi Promise reject, lỗi sẽ được dịch sang tiếng Việt thân thiện
 * (quota exceeded, 403, timeout, v.v.) rồi mới throw tiếp.
 *
 * Làm trực tiếp trên instance mới tạo — không phá invariant của Proxy
 * và không ảnh hưởng các instance khác (mỗi lần gọi getGoogleSheetsClient
 * sinh ra instance mới).
 */
function patchMethodWithErrorTranslation(obj: any, methodName: string) {
  if (!obj || typeof obj[methodName] !== "function") return;
  const original = obj[methodName];
  try {
    obj[methodName] = function (...args: any[]) {
      try {
        const result = original.apply(this, args);
        if (result && typeof result.then === "function") {
          return result.catch((err: any) => {
            throw new Error(translateApiError(err));
          });
        }
        return result;
      } catch (err) {
        throw new Error(translateApiError(err));
      }
    };
  } catch {
    // Nếu thuộc tính là read-only thì bỏ qua, không crash
  }
}

function patchSheetsForErrorTranslation(sheets: any) {
  try {
    const values = sheets?.spreadsheets?.values;
    if (values) {
      for (const m of [
        "get",
        "update",
        "append",
        "clear",
        "batchGet",
        "batchUpdate",
        "batchClear",
        "batchGetByDataFilter",
        "batchUpdateByDataFilter",
        "batchClearByDataFilter",
      ]) {
        patchMethodWithErrorTranslation(values, m);
      }
    }
    const spreadsheets = sheets?.spreadsheets;
    if (spreadsheets) {
      for (const m of [
        "get",
        "getByDataFilter",
        "batchUpdate",
        "create",
      ]) {
        patchMethodWithErrorTranslation(spreadsheets, m);
      }
    }
  } catch {
    // Không muốn việc patch gây crash ngay khi khởi tạo client
  }
}

// Tạo Google Sheets client
export async function getGoogleSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey!.replace(/\\n/g, "\n"), // Convert \n to actual newlines
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient as any });

    patchSheetsForErrorTranslation(sheets);
    return sheets;
  } catch (err) {
    throw new Error(translateApiError(err));
  }
}

// Constants cho nhân viên lương
const spreadsheetIdNhanVienLuong = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_LUONG || "";
const sheetNameNhanVienLuong = process.env.GOOGLE_SHEET_NAME_NHAN_VIEN_LUONG || "Nhân viên";
const sheetNameBangChamCong = process.env.GOOGLE_SHEET_NAME_BANG_CHAM_CONG || "Bảng chấm công";
const sheetNameBangChamCongDiMuon = process.env.GOOGLE_SHEET_NAME_BANG_CHAM_CONG_DI_MUON || "Bảng chấm đi muộn";
const sheetNameBangChamCongThemGio = process.env.GOOGLE_SHEET_NAME_BANG_CHAM_CONG_THEM_GIO || "Bảng chấm thêm giờ";
const sheetNameBangNghiPhep = process.env.GOOGLE_SHEET_NAME_BANG_CHAM_CONG_NGHI_PHEP || "Ngày phép";

/**
 * Parse số theo format Việt Nam
 * VD: "1.620" hoặc "1620" -> 1620 (dấu chấm là phân cách hàng nghìn)
 * VD: "1,5" -> 1.5 (dấu phẩy là decimal)
 */
function parseVietnameseNumber(val: string | number | undefined): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;

  let str = String(val).trim();

  // Nếu có cả dấu chấm và dấu phẩy, xử lý theo format Việt Nam
  // VD: "1.234,56" -> 1234.56
  if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, ""); // Bỏ dấu chấm (hàng nghìn)
    str = str.replace(",", "."); // Thay phẩy thành chấm (decimal)
  }
  // Nếu chỉ có dấu chấm và theo sau là đúng 3 chữ số -> đó là hàng nghìn
  // VD: "1.620" -> 1620
  else if (/^\d+\.\d{3}$/.test(str) || /^\d+\.\d{3}\.\d{3}$/.test(str)) {
    str = str.replace(/\./g, "");
  }
  // Nếu chỉ có dấu phẩy -> thay thành chấm
  // VD: "1,5" -> 1.5
  else if (str.includes(",") && !str.includes(".")) {
    str = str.replace(",", ".");
  }
  // Còn lại giữ nguyên (đã là format chuẩn)

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Interface cho dữ liệu nhân viên
export interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  gender: string;
  employmentStatus: string;
  birthday: string;
  cccd: string;
  cccdDate: string;
  cccdPlace: string;
  hometown: string;
  address: string;
  contractType: string;
  bankAccount: string;
  luongCoBan: string;
  phone: string; // Kept for backward compatibility
  email: string;
}

/**
 * Đọc dữ liệu nhân viên từ Google Sheets
 * ID được tự động generate, bỏ qua cột A (STT)
 * Header ở dòng 5, đọc dữ liệu từ dòng 6, cột B đến O
 * B: Họ và tên, C: Vị trí, D: Bộ phận, E: Giới tính, F: Tình trạng lao động,
 * G: Ngày sinh, H: CCCD, I: Ngày cấp, J: Nơi Cấp, K: Quê Quán,
 * L: Địa chỉ hiện tại, M: Loại hợp đồng, N: Mức lương cơ bản, O: Email
 */
export async function getEmployeesFromSheet(): Promise<Employee[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `${sheetNameNhanVienLuong}!B6:O`, // Header dòng 5, dữ liệu từ dòng 6, đọc cột B-O
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
        department: row[2] || "",
        gender: row[3] || "",
        employmentStatus: row[4] || "",
        birthday: row[5] || "",
        cccd: row[6] || "",
        cccdDate: row[7] || "",
        cccdPlace: row[8] || "",
        hometown: row[9] || "",
        address: row[10] || "",
        contractType: row[11] || "",
        luongCoBan: row[12] || "",
        bankAccount: "", // Not available in this sheet
        phone: "", // Phone not available in this sheet
        email: row[13] || "",
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

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data (từ dòng 6 trở đi)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `${sheetNameNhanVienLuong}!B6:O`, // Đọc từ B6 đến O
    });

    const allRows = response.data.values || [];

    // Tìm dòng cuối cùng có dữ liệu
    let lastDataRowIndex = -1;
    for (let i = allRows.length - 1; i >= 0; i--) {
      // Kiểm tra xem dòng có dữ liệu không (kiểm tra cột B - name)
      if (allRows[i] && allRows[i][0] && allRows[i][0].toString().trim() !== "") {
        lastDataRowIndex = i;
        break;
      }
    }

    // Dòng mới sẽ là dòng ngay sau dòng cuối cùng có dữ liệu
    // Data bắt đầu từ dòng 6, nên dòng mới = 6 + lastDataRowIndex + 1
    const nextRow = lastDataRowIndex >= 0 ? 6 + lastDataRowIndex + 1 : 6;

    // Ghi dữ liệu nhân viên (cột B-O, 14 cột)
    // B: Họ và tên, C: Vị trí, D: Bộ phận, E: Giới tính, F: Tình trạng lao động,
    // G: Ngày sinh, H: CCCD, I: Ngày cấp, J: Nơi Cấp, K: Quê Quán,
    // L: Địa chỉ hiện tại, M: Loại hợp đồng, N: Tài khoản, O: Email
    const values = [
      [
        employee.name,             // B: Họ và tên
        employee.position,         // C: Vị trí
        employee.department,       // D: Bộ phận
        employee.gender,           // E: Giới tính
        employee.employmentStatus, // F: Tình trạng lao động
        employee.birthday,         // G: Ngày sinh
        employee.cccd,             // H: CCCD
        employee.cccdDate,         // I: Ngày cấp
        employee.cccdPlace,        // J: Nơi Cấp
        employee.hometown,         // K: Quê Quán
        employee.address,          // L: Địa chỉ hiện tại
        employee.contractType,     // M: Loại hợp đồng
        employee.bankAccount,      // N: Tài khoản
        employee.email,            // O: Email
      ],
    ];

    // Ghi dữ liệu vào dòng mới
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `${sheetNameNhanVienLuong}!B${nextRow}:O${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added employee: ${employee.name} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding employee to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin một nhân viên trong Google Sheets
 * ID được dùng để xác định vị trí dòng
 * Header ở dòng 5, dữ liệu từ dòng 6: ID 1 = dòng 6, ID 2 = dòng 7, etc.
 * Ghi vào cột B-O
 */
export async function updateEmployeeInSheet(
  employee: Employee
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc.
    const rowNumber = employee.id + 5;

    const values = [
      [
        employee.name,             // B: Họ và tên
        employee.position,         // C: Vị trí
        employee.department,       // D: Bộ phận
        employee.gender,           // E: Giới tính
        employee.employmentStatus, // F: Tình trạng lao động
        employee.birthday,         // G: Ngày sinh
        employee.cccd,             // H: CCCD
        employee.cccdDate,         // I: Ngày cấp
        employee.cccdPlace,        // J: Nơi Cấp
        employee.hometown,         // K: Quê Quán
        employee.address,          // L: Địa chỉ hiện tại
        employee.contractType,     // M: Loại hợp đồng
        employee.bankAccount,      // N: Tài khoản
        employee.email,            // O: Email
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `${sheetNameNhanVienLuong}!B${rowNumber}:O${rowNumber}`,
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
 * ID được dùng để xác định vị trí dòng
 * Header ở dòng 5, dữ liệu từ dòng 6: ID 1 = dòng 6, ID 2 = dòng 7, etc.
 */
export async function deleteEmployeeFromSheet(
  employeeId: number
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc.
    const rowNumber = employeeId + 5;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
    });

    // Tìm sheet có tên khớp với sheetNameNhanVienLuong
    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameNhanVienLuong
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameNhanVienLuong}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdNhanVienLuong,
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

const spreadsheetIdKhachHang = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG || "1bIXymFQLB6BJgYDS5qJYQl0SRUu7TtL_4XzzO0LPSis";
const sheetNameKhachHang = process.env.GOOGLE_SHEET_NAME_KHACH_HANG || "DS KH";
const sheetNameTheoDoiCongNoKH = process.env.GOOGLE_SHEET_NAME_CONG_NO_KH || "Theo dõi công nợ từng khách hàng";

/**
 * Lấy công nợ "cũ" của 1 khách hàng — tức là dư cuối TRƯỚC khi tính đơn hiện tại.
 *
 * Cơ chế:
 * 1) Ghi tên KH vào ô B3 của sheet "Theo dõi công nợ từng khách hàng" để filter.
 * 2) Đọc cột B (Nội dung) + cột E (Dư cuối) từ dòng 6.
 * 3) Nếu `excludeOrderCode` truyền vào và tìm thấy trong cột B → trả về Dư cuối của
 *    dòng NGAY TRƯỚC dòng đó (= nợ cũ trước khi cộng/trừ đơn này).
 * 4) Nếu không tìm thấy (vd đơn chưa lưu vào sheet) → fallback: trả về Dư cuối của
 *    dòng cuối cùng có nội dung.
 *
 * Lưu ý: sheet này dùng B3 làm filter chung — không an toàn nếu nhiều user gọi
 * song song cho các KH khác nhau (B3 sẽ chồng nhau).
 */
export async function getCustomerCurrentDebt(
  customerName: string,
  excludeOrderCode?: string,
): Promise<number> {
  console.log(
    "[customer-debt] called with:",
    JSON.stringify(customerName),
    "exclude:",
    JSON.stringify(excludeOrderCode),
  );
  if (!customerName) return 0;
  const sheets = await getGoogleSheetsClient();

  // 1) Ghi tên KH vào B3 để filter sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetIdKhachHang,
    range: `'${sheetNameTheoDoiCongNoKH}'!B3`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[customerName]] },
  });
  console.log("[customer-debt] wrote B3 OK");

  // Delay nhỏ để Google Sheets recalc các công thức tham chiếu B3
  await new Promise((r) => setTimeout(r, 500));

  // 2) Đọc cột B-E (Nội dung + Tiền hàng + Thanh toán + Dư cuối)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetIdKhachHang,
    range: `'${sheetNameTheoDoiCongNoKH}'!B6:E`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = response.data.values || [];

  // Parse số: hỗ trợ cả raw number và format string VN
  const parseDuCuoi = (cell: any): number => {
    if (cell == null || String(cell).trim() === "") return 0;
    const cleaned = String(cell).replace(/\./g, "").replace(/,/g, ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  // Lấy các dòng có Nội dung (cột B = row[0])
  const validRows = rows
    .map((row) => ({
      noiDung: String(row?.[0] || "").trim(),
      duCuoi: row?.[3],
    }))
    .filter((r) => r.noiDung !== "");

  console.log(
    "[customer-debt] valid rows:",
    validRows.length,
    "last 3:",
    validRows.slice(-3),
  );

  if (validRows.length === 0) return 0;

  // Nếu truyền excludeOrderCode → tìm hàng đó và lấy Dư cuối của hàng TRƯỚC nó
  if (excludeOrderCode) {
    const code = excludeOrderCode.trim();
    const matchIndex = validRows.findIndex((r) => r.noiDung === code);
    if (matchIndex > 0) {
      const prev = validRows[matchIndex - 1];
      const num = parseDuCuoi(prev.duCuoi);
      console.log("[customer-debt] match index:", matchIndex, "prev duCuoi:", num);
      return num;
    }
    if (matchIndex === 0) {
      console.log("[customer-debt] first entry, no debt before");
      return 0;
    }
    console.log("[customer-debt] orderCode not found, fallback to last");
  }

  // Fallback: Dư cuối của dòng cuối cùng có nội dung
  const last = parseDuCuoi(validRows[validRows.length - 1].duCuoi);
  console.log("[customer-debt] fallback last duCuoi:", last);
  return last;
}

// Interface cho khách hàng
export interface Customer {
  id: number;
  name: string;
  category: string;
  cccd: string;
  phone: string;
  address: string;
  shippingInfo: string;
  birthday: string;
  notes: string;
  rowIndex: number; // Actual row number in sheet
}

/**
 * Đọc danh sách khách hàng từ Google Sheets
 * Sheet: DS KH
 * Row 5: Header (Khách hàng | Phân Loại KH | CCCD/MST | Điện thoại | Địa chỉ | Thông tin gửi hàng | Sinh nhật | Ghi chú)
 * Data starts at row 6
 */
export async function getCustomersFromSheet(): Promise<Customer[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `'${sheetNameKhachHang}'!B6:I`, // Đọc từ dòng 6 (bỏ qua header row 5), cột B đến I
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
        cccd: row[2] || "",
        phone: row[3] || "",
        address: row[4] || "",
        shippingInfo: row[5] || "",
        birthday: row[6] || "",
        notes: row[7] || "",
        rowIndex: index + 6, // Row 6 is first data row
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
export async function addCustomerToSheet(customer: Omit<Customer, 'id'>): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get current customers to determine next STT
    const currentCustomers = await getCustomersFromSheet();
    const nextSTT = currentCustomers.length + 1;

    // Data vào cột B-I (STT tự động được tính bởi Google Sheets formula)
    const values = [
      [
        customer.name,
        customer.category,
        customer.cccd,
        customer.phone,
        customer.address,
        customer.shippingInfo,
        customer.birthday,
        customer.notes,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `'${sheetNameKhachHang}'!B6:I`,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added customer: ${customer.name}`);
  } catch (error) {
    console.error("Error adding customer to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin khách hàng trong Google Sheets
 */
export async function updateCustomerInSheet(rowIndex: number, customer: Omit<Customer, 'id' | 'rowIndex'>): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Cập nhật cột B-I (không cập nhật cột A - STT)
    const values = [
      [
        customer.name,
        customer.category,
        customer.cccd,
        customer.phone,
        customer.address,
        customer.shippingInfo,
        customer.birthday,
        customer.notes,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `'${sheetNameKhachHang}'!B${rowIndex}:I${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated customer at row ${rowIndex}`);
  } catch (error) {
    console.error("Error updating customer in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa khách hàng khỏi Google Sheets (clear row content)
 */
export async function deleteCustomerFromSheet(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Clear the row content from B to I (không xóa STT ở cột A)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `'${sheetNameKhachHang}'!B${rowIndex}:I${rowIndex}`,
    });

    console.log(`Successfully cleared customer data at row ${rowIndex}`);
  } catch (error) {
    console.error("Error deleting customer from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// DEBT TRACKING DETAIL (Theo dõi công nợ từng khách hàng chi tiết)
// ============================================

const sheetNameCongNoDetail = process.env.GOOGLE_SHEET_NAME_CONG_NO_KH || "Theo dõi công nợ từng khách hàng";

// Interface cho giao dịch công nợ chi tiết
export interface CongNoTransaction {
  ngayThang: string;     // Ngày tháng
  maDonHang: string;     // Mã đơn hàng
  tienHang: number;      // Tiền hàng
  thanhToan: number;     // Thanh toán
  duCuoi: number;        // Dư cuối
}

export interface CongNoDetailData {
  selectedCustomer: string;
  transactions: CongNoTransaction[];
}

/**
 * Đọc tên khách hàng đang được chọn từ cell B3
 */
export async function getSelectedCustomerForCongNo(): Promise<string> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `'${sheetNameCongNoDetail}'!B3`,
    });

    const value = response.data.values?.[0]?.[0] || "";
    return value;
  } catch (error) {
    console.error("Error reading selected customer from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật khách hàng được chọn vào cell B3
 */
export async function setSelectedCustomerForCongNo(customerName: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `'${sheetNameCongNoDetail}'!B3`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[customerName]],
      },
    });

    console.log(`Successfully set selected customer to: ${customerName}`);
  } catch (error) {
    console.error("Error setting selected customer in Google Sheets:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu công nợ chi tiết từ Google Sheets
 * Sheet: Theo dõi công nợ từng khách hàng
 * Row 5: Header (Ngày tháng | Mã đơn hàng | Tiền hàng | Thanh toán | Dư cuối)
 * Data starts at row 6
 */
export async function getCongNoDetailFromSheet(): Promise<CongNoDetailData> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc khách hàng đang được chọn
    const selectedCustomer = await getSelectedCustomerForCongNo();

    // Đọc dữ liệu giao dịch từ A6:E
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKhachHang,
      range: `'${sheetNameCongNoDetail}'!A6:E`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No debt tracking data found in sheet.");
      return {
        selectedCustomer,
        transactions: [],
      };
    }

    const transactions: CongNoTransaction[] = rows
      .map((row) => ({
        ngayThang: row[0] || "",
        maDonHang: row[1] || "",
        tienHang: parseFloat(String(row[2]).replace(/\./g, "").replace(",", ".")) || 0,
        thanhToan: parseFloat(String(row[3]).replace(/\./g, "").replace(",", ".")) || 0,
        duCuoi: parseFloat(String(row[4]).replace(/\./g, "").replace(",", ".")) || 0,
      }))
      .filter((transaction) => transaction.ngayThang.trim() !== "");

    return {
      selectedCustomer,
      transactions,
    };
  } catch (error) {
    console.error("Error reading debt tracking data from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// CASH FLOW (Dòng tiền)
// ============================================

const spreadsheetIdDongTien = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_DONG_TIEN || "1a8ebfB2KVQvrNYqoP5MNnn_gXhhxVH_8sJalPcNpMC8";
const sheetNameDongTien = process.env.GOOGLE_SHEET_NAME_DONG_TIEN || "Dòng tiền";
const sheetNameTaiKhoanDongTien = process.env.GOOGLE_SHEET_NAME_TAI_KHOAN || "Thông tin tài khoản";

// Interface cho dòng tiền
export interface DongTien {
  id: number;
  ngayThang: string;         // A - Ngày tháng
  tenTK: string;             // B - Tên TK
  nccNPL: string;            // C - NCC NPL
  xuongSX: string;           // D - Xưởng SX
  chiVanChuyen: string;      // E - Chi vận chuyển
  thuTienHang: string;       // F - Thu tiền hàng
  thuKhac: number;           // G - Thu khác
  chiKhac: number;           // H - Chi khác
  // I - Mã phiếu thu,chi (display column, skipped)
  doiTuong: string;          // J - Đối tượng
  noiDung: string;           // K - Nội dung
  phanLoaiThuChi: string;    // L - Phân loại thu chi
  tongThu: number;           // M - Tổng thu
  tongChi: number;           // N - Tổng chi
  ghiChu: string;            // O - Ghi chú
  maPhieuThu: string;        // P - Mã phiếu thu
  maPhieuChi: string;        // Q - Mã phiếu chi
  rowIndex: number;          // Actual row number in sheet
}

/**
 * Đọc dữ liệu dòng tiền từ Google Sheets
 * Sheet: Dòng tiền
 * Row 5: Header
 * Data starts at row 6
 */
export async function getDongTienFromSheet(): Promise<DongTien[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameDongTien}'!A6:Q`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No cash flow data found in sheet.");
      return [];
    }

    const dongTienList: DongTien[] = rows
      .map((row, index) => {
        // Format date to DD/MM/YYYY if it's in YYYY-MM-DD format
        let formattedDate = row[0] || "";
        if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = formattedDate.split('-');
          formattedDate = `${day}/${month}/${year}`;
        }

        return {
          id: index + 1,
          ngayThang: formattedDate,           // A
          tenTK: row[1] || "",                 // B
          nccNPL: row[2] || "",                // C
          xuongSX: row[3] || "",               // D
          chiVanChuyen: row[4] || "",          // E
          thuTienHang: row[5] || "",           // F
          thuKhac: parseFloat(String(row[6]).replace(/\./g, "").replace(",", ".")) || 0,    // G
          chiKhac: parseFloat(String(row[7]).replace(/\./g, "").replace(",", ".")) || 0,    // H
          // Skip row[8] - Column I (Mã phiếu thu,chi display)
          doiTuong: row[9] || "",              // J
          noiDung: row[10] || "",              // K
          phanLoaiThuChi: row[11] || "",       // L
          tongThu: parseFloat(String(row[12]).replace(/\./g, "").replace(",", ".")) || 0,   // M
          tongChi: parseFloat(String(row[13]).replace(/\./g, "").replace(",", ".")) || 0,   // N
          ghiChu: row[14] || "",               // O
          maPhieuThu: row[15] || "",           // P
          maPhieuChi: row[16] || "",           // Q
          rowIndex: index + 6, // Row 6 is first data row
        };
      })
      .filter((item) => item.ngayThang.trim() !== "");

    return dongTienList;
  } catch (error) {
    console.error("Error reading cash flow from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm dòng tiền mới vào Google Sheets
 */
export async function addDongTienToSheet(dongTien: Omit<DongTien, 'id' | 'rowIndex'>): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Format date to DD/MM/YYYY if it's in YYYY-MM-DD format
    let formattedDate = dongTien.ngayThang;
    if (dongTien.ngayThang && dongTien.ngayThang.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dongTien.ngayThang.split('-');
      formattedDate = `${day}/${month}/${year}`;
    }

    const values = [
      [
        formattedDate,             // A
        dongTien.tenTK,            // B
        dongTien.nccNPL,           // C
        dongTien.xuongSX,          // D
        dongTien.chiVanChuyen,     // E
        dongTien.thuTienHang,      // F
        dongTien.thuKhac,          // G
        dongTien.chiKhac,          // H
        dongTien.maPhieuThu || dongTien.maPhieuChi,  // I - Mã phiếu thu,chi (display)
        dongTien.doiTuong,         // J
        dongTien.noiDung,          // K
        dongTien.phanLoaiThuChi,   // L
        dongTien.tongThu,          // M
        dongTien.tongChi,          // N
        dongTien.ghiChu,           // O
        dongTien.maPhieuThu,       // P
        dongTien.maPhieuChi,       // Q
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameDongTien}'!A6:Q`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added cash flow entry`);
  } catch (error) {
    console.error("Error adding cash flow to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật dòng tiền trong Google Sheets
 */
export async function updateDongTienInSheet(rowIndex: number, dongTien: Omit<DongTien, 'id' | 'rowIndex'>): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Format date to DD/MM/YYYY if it's in YYYY-MM-DD format
    let formattedDate = dongTien.ngayThang;
    if (dongTien.ngayThang && dongTien.ngayThang.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dongTien.ngayThang.split('-');
      formattedDate = `${day}/${month}/${year}`;
    }

    const values = [
      [
        formattedDate,             // A
        dongTien.tenTK,            // B
        dongTien.nccNPL,           // C
        dongTien.xuongSX,          // D
        dongTien.chiVanChuyen,     // E
        dongTien.thuTienHang,      // F
        dongTien.thuKhac,          // G
        dongTien.chiKhac,          // H
        dongTien.maPhieuThu || dongTien.maPhieuChi,  // I - Mã phiếu thu,chi (display)
        dongTien.doiTuong,         // J
        dongTien.noiDung,          // K
        dongTien.phanLoaiThuChi,   // L
        dongTien.tongThu,          // M
        dongTien.tongChi,          // N
        dongTien.ghiChu,           // O
        dongTien.maPhieuThu,       // P
        dongTien.maPhieuChi,       // Q
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameDongTien}'!A${rowIndex}:Q${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated cash flow at row ${rowIndex}`);
  } catch (error) {
    console.error("Error updating cash flow in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa dòng tiền khỏi Google Sheets (clear row content)
 */
export async function deleteDongTienFromSheet(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameDongTien}'!A${rowIndex}:O${rowIndex}`,
    });

    console.log(`Successfully cleared cash flow data at row ${rowIndex}`);
  } catch (error) {
    console.error("Error deleting cash flow from Google Sheets:", error);
    throw error;
  }
}

/**
 * Lấy danh sách tài khoản từ sheet "Thông tin tài khoản"
 * Header ở row 5, data từ row 6, cột B (Tên TK)
 */
export async function getTaiKhoanOptionsFromSheet(): Promise<string[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameTaiKhoanDongTien}'!B6:B`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No account data found in sheet.");
      return [];
    }

    // Lọc các giá trị không rỗng và loại bỏ trùng lặp
    const uniqueAccounts = Array.from(new Set(
      rows
        .map(row => row[0])
        .filter(value => value && value.trim() !== "")
    ));

    return uniqueAccounts;
  } catch (error) {
    console.error("Error fetching accounts from Google Sheets:", error);
    throw error;
  }
}

/**
 * Lấy danh sách phân loại thu chi từ sheet "Phân loại thu, chi"
 * Header ở row 5, data từ row 6, cột C (Nội dung)
 */
export async function getPhanLoaiThuChiOptionsFromSheet(): Promise<string[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNamePhanLoaiThuChi}'!C6:C`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No category data found in sheet.");
      return [];
    }

    // Lọc các giá trị không rỗng và loại bỏ trùng lặp
    const uniqueCategories = Array.from(new Set(
      rows
        .map(row => row[0])
        .filter(value => value && value.trim() !== "")
    ));

    return uniqueCategories;
  } catch (error) {
    console.error("Error fetching categories from Google Sheets:", error);
    throw error;
  }
}

/**
 * Lấy danh sách NCC NPL từ sheet "NCC NPL"
 * Header ở row 2, data từ row 3, cột B (Tên NCC)
 */
export async function getNCCNPLOptionsFromSheet(): Promise<string[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetIdNCC = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
    const sheetNameNCC = process.env.GOOGLE_SHEET_NAME_DON_HANG_NCCNPL || "NCC NPL";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNCC,
      range: `'${sheetNameNCC}'!B6:B`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No NCC NPL data found in sheet.");
      return [];
    }

    // Lọc các giá trị không rỗng và loại bỏ trùng lặp
    const uniqueNCCs = Array.from(new Set(
      rows
        .map(row => row[0])
        .filter(value => value && value.trim() !== "")
    ));

    return uniqueNCCs;
  } catch (error) {
    console.error("Error fetching NCC NPL from Google Sheets:", error);
    throw error;
  }
}

/**
 * Lấy danh sách Xưởng SX từ sheet "Xưởng SX"
 * Header ở row 5, data từ row 6, cột B (Tên xưởng)
 */
export async function getXuongSXOptionsFromSheet(): Promise<string[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetIdXuongSX = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
    const sheetNameXuongSX = process.env.GOOGLE_SHEET_NAME_XUONG_SAN_XUAT || "Xưởng SX";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdXuongSX,
      range: `'${sheetNameXuongSX}'!B6:B`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No Xuong SX data found in sheet.");
      return [];
    }

    // Lọc các giá trị không rỗng và loại bỏ trùng lặp
    const uniqueXuongs = Array.from(new Set(
      rows
        .map(row => row[0])
        .filter(value => value && value.trim() !== "")
    ));

    return uniqueXuongs;
  } catch (error) {
    console.error("Error fetching Xuong SX from Google Sheets:", error);
    throw error;
  }
}

/**
 * Lấy danh sách Đối tác vận chuyển từ sheet "Đối tác vận chuyển"
 * Header ở row 5, data từ row 6, cột B (Đối tác vận chuyển)
 */
export async function getVanChuyenOptionsFromSheet(): Promise<string[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetIdVanChuyen = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_DONG_TIEN;
    const sheetNameVanChuyen = process.env.GOOGLE_SHEET_NAME_VAN_CHUYEN || "Đối tác vận chuyển";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdVanChuyen,
      range: `'${sheetNameVanChuyen}'!B6:B`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No Van Chuyen data found in sheet.");
      return [];
    }

    // Lọc các giá trị không rỗng và loại bỏ trùng lặp
    const uniqueVanChuyens = Array.from(new Set(
      rows
        .map(row => row[0])
        .filter(value => value && value.trim() !== "")
    ));

    return uniqueVanChuyens;
  } catch (error) {
    console.error("Error fetching Van Chuyen from Google Sheets:", error);
    throw error;
  }
}

/**
 * Lấy mapping giữa Xưởng SX và Đối tượng từ sheet "Xưởng SX"
 * Trả về object với key là tên xưởng, value là đối tượng tương ứng
 */
export async function getXuongSXToDoiTuongMapping(): Promise<Record<string, string>> {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetIdXuongSX = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
    const sheetNameXuongSX = process.env.GOOGLE_SHEET_NAME_XUONG_SAN_XUAT || "Xưởng SX";

    // Lấy cả cột B (Tên xưởng) và cột C (Đối tượng) - giả sử Đối tượng ở cột C
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdXuongSX,
      range: `'${sheetNameXuongSX}'!B6:C`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No Xuong SX mapping data found in sheet.");
      return {};
    }

    // Tạo mapping object
    const mapping: Record<string, string> = {};
    rows.forEach((row) => {
      const xuongName = row[0]; // Cột B
      const doiTuong = row[1];  // Cột C
      if (xuongName && xuongName.trim() !== "") {
        mapping[xuongName] = doiTuong || "";
      }
    });

    return mapping;
  } catch (error) {
    console.error("Error fetching Xuong SX to Doi Tuong mapping from Google Sheets:", error);
    throw error;
  }
}

/**
 * Lấy danh sách khách hàng từ sheet "DS KH"
 * Trả về danh sách tên khách hàng cho dropdown
 */
export async function getKhachHangOptionsFromSheet(): Promise<string[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetIdBanHang = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG;
    const sheetNameKhachHang = process.env.GOOGLE_SHEET_NAME_KHACH_HANG || "DS KH";

    // Lấy cột B (Tên khách hàng) từ hàng 6 trở đi
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBanHang,
      range: `'${sheetNameKhachHang}'!B6:B`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No customer data found in sheet.");
      return [];
    }

    // Lọc các giá trị không rỗng và loại bỏ trùng lặp
    const uniqueCustomers = Array.from(new Set(
      rows
        .map(row => row[0])
        .filter(value => value && value.trim() !== "")
    ));

    return uniqueCustomers;
  } catch (error) {
    console.error("Error fetching customers from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// ACCOUNT MANAGEMENT (Quản lý tài khoản)
// ============================================

// Interface cho tài khoản
export interface TaiKhoan {
  id: number;
  taiKhoan: string;      // B - Tên tài khoản
  rowIndex: number;      // Actual row number in sheet
}

/**
 * Đọc danh sách tài khoản từ Google Sheets
 * Sheet: Thông tin tài khoản
 * Row 5: Header
 * Data starts at row 6
 */
export async function getTaiKhoanListFromSheet(): Promise<TaiKhoan[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameTaiKhoanDongTien}'!B6:B`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No account data found in sheet.");
      return [];
    }

    const taiKhoanList: TaiKhoan[] = rows
      .map((row, index) => ({
        id: index + 1,
        taiKhoan: row[0] || "",
        rowIndex: index + 6, // Row 6 is first data row
      }))
      .filter((item) => item.taiKhoan.trim() !== "");

    return taiKhoanList;
  } catch (error) {
    console.error("Error reading accounts from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm tài khoản mới vào Google Sheets
 */
export async function addTaiKhoanToSheet(taiKhoan: Omit<TaiKhoan, 'id' | 'rowIndex'>): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [
      [
        "", // Column A (STT) - leave empty, will be auto-numbered in sheet if needed
        taiKhoan.taiKhoan,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameTaiKhoanDongTien}'!A6:B`,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added account: ${taiKhoan.taiKhoan}`);
  } catch (error) {
    console.error("Error adding account to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật tài khoản trong Google Sheets
 */
export async function updateTaiKhoanInSheet(rowIndex: number, taiKhoan: Omit<TaiKhoan, 'id' | 'rowIndex'>): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [
      [
        "", // Column A (STT) - keep as is
        taiKhoan.taiKhoan,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameTaiKhoanDongTien}'!A${rowIndex}:B${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated account at row ${rowIndex}`);
  } catch (error) {
    console.error("Error updating account in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa tài khoản khỏi Google Sheets (clear row content)
 */
export async function deleteTaiKhoanFromSheet(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameTaiKhoanDongTien}'!A${rowIndex}:B${rowIndex}`,
    });

    console.log(`Successfully cleared account data at row ${rowIndex}`);
  } catch (error) {
    console.error("Error deleting account from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// SALES PROGRAM MANAGEMENT (Quản lý chương trình bán hàng)
// ============================================

const spreadsheetIdCTBanHang = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG || spreadsheetId;
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
// ORDER MANAGEMENT (Quản lý đơn hàng - Sheet "Bán hàng")
// ============================================

const spreadsheetIdBanHang = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG || spreadsheetId;
const sheetNameBanHang = process.env.GOOGLE_SHEET_NAME_BAN_HANG || "Bán hàng";

// Interface cho đơn hàng (16 cột A-P)
export interface Order {
  id: number;
  code: string;           // Mã đơn hàng (A)
  date: string;           // Ngày đặt (B)
  customer: string;       // Khách hàng (C)
  productCode: string;    // Mã SP (D)
  image: string;          // Hình ảnh (E)
  items: number;          // SL (F)
  productPrice: number;   // Giá sỉ (G)
  subtotal: number;       // Tiền hàng (H)
  salesProgram: string;   // Chương trình BH (I)
  discount: string;       // Chiết khấu (J)
  priceAfterDiscount: number; // Đơn giá sau CK (K)
  subtotalAfterDiscount: number; // Tiền hàng sau chiết khấu (L)
  paymentDiscount: string; // CK thanh toán (M)
  total: number;          // Khách phải trả (N)
  salesUser: string;      // User bán hàng (O)
  notes: string;          // Ghi chú (P)
  // Deprecated fields for backward compatibility
  color?: string;
  size?: string;
  status?: "completed" | "processing" | "pending" | "shipping";
  freeItems?: string;
  paymentStatus?: "paid" | "partial" | "unpaid";
}

/**
 * Đọc danh sách đơn hàng từ Google Sheets
 * Sheet: Bán hàng (16 cột A-P), dữ liệu bắt đầu từ dòng 6
 */
export async function getOrdersFromSheet(): Promise<Order[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBanHang,
      range: `'${sheetNameBanHang}'!A6:P`, // Đọc từ dòng 6, các cột A-P (16 cột)
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No order data found in sheet.");
      return [];
    }

    const orders: Order[] = rows.map((row, index) => {
      return {
        id: index + 1, // ID 1 = row 6, ID 2 = row 7, etc.
        code: row[0] || "",                    // A - Mã đơn hàng
        date: row[1] || "",                    // B - Ngày đặt
        customer: row[2] || "",                // C - Khách hàng
        productCode: row[3] || "",             // D - Mã SP
        image: row[4] || "",                   // E - Hình ảnh
        items: parseInt(row[5]) || 0,          // F - SL
        productPrice: parseFloat((row[6] || "0").toString().replace(/\./g, "").replace(/,/g, ".")) || 0, // G - Giá sỉ
        subtotal: parseFloat((row[7] || "0").toString().replace(/\./g, "").replace(/,/g, ".")) || 0, // H - Tiền hàng
        salesProgram: row[8] || "",            // I - Chương trình BH
        discount: row[9] || "",                // J - Chiết khấu
        priceAfterDiscount: parseFloat((row[10] || "0").toString().replace(/\./g, "").replace(/,/g, ".")) || 0, // K - Đơn giá sau CK
        subtotalAfterDiscount: parseFloat((row[11] || "0").toString().replace(/\./g, "").replace(/,/g, ".")) || 0, // L - Tiền hàng sau chiết khấu
        paymentDiscount: row[12] || "",        // M - CK thanh toán
        total: parseFloat((row[13] || "0").toString().replace(/\./g, "").replace(/,/g, ".")) || 0, // N - Khách phải trả
        salesUser: row[14] || "",              // O - User bán hàng
        notes: row[15] || "",                  // P - Ghi chú
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
 * Sheet: Bán hàng (16 cột A-P), dữ liệu bắt đầu từ dòng 6
 * Tìm dòng cuối cùng có data thật (cột A có mã đơn hàng) rồi thêm vào sau đó
 */
export async function addOrderToSheet(order: Order): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc cột A để tìm dòng cuối cùng có data thật (không phải công thức #N/A)
    const colAResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBanHang,
      range: `'${sheetNameBanHang}'!A6:A`,
    });

    const colAData = colAResponse.data.values || [];

    // Tìm dòng cuối cùng có mã đơn hàng thật (bắt đầu bằng MIO hoặc có nội dung)
    let lastDataRowIndex = -1;
    for (let i = colAData.length - 1; i >= 0; i--) {
      const cellValue = (colAData[i]?.[0] || "").toString().trim();
      // Kiểm tra nếu ô có giá trị thật (không rỗng, không phải #N/A, #REF!, etc.)
      if (cellValue && !cellValue.startsWith("#") && cellValue.length > 0) {
        lastDataRowIndex = i;
        break;
      }
    }

    // Tính toán row number để insert (row 6 + lastDataRowIndex + 1)
    // Nếu không có data nào, insert vào row 6
    const nextRowNumber = lastDataRowIndex >= 0 ? (6 + lastDataRowIndex + 1) : 6;

    const values = [
      [
        order.code,                                      // A - Mã đơn hàng
        order.date,                                      // B - Ngày đặt
        order.customer,                                  // C - Khách hàng
        order.productCode || "",                         // D - Mã SP
        order.image || "",                               // E - Hình ảnh
        order.items,                                     // F - SL
        order.productPrice ? formatNumberVN(order.productPrice) : "", // G - Giá sỉ
        order.subtotal ? formatNumberVN(order.subtotal) : "", // H - Tiền hàng
        order.salesProgram || "",                        // I - Chương trình BH
        order.discount || "",                            // J - Chiết khấu
        order.priceAfterDiscount ? formatNumberVN(order.priceAfterDiscount) : "", // K - Đơn giá sau CK
        order.subtotalAfterDiscount ? formatNumberVN(order.subtotalAfterDiscount) : "", // L - Tiền hàng sau chiết khấu
        order.paymentDiscount || "",                     // M - CK thanh toán
        formatNumberVN(order.total),                     // N - Khách phải trả
        order.salesUser || "",                           // O - User bán hàng
        order.notes || "",                               // P - Ghi chú
      ],
    ];

    // Sử dụng update thay vì append để ghi vào đúng vị trí
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdBanHang,
      range: `'${sheetNameBanHang}'!A${nextRowNumber}:P${nextRowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added order: ${order.code} at row ${nextRowNumber}`);
  } catch (error) {
    console.error("Error adding order to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật đơn hàng trong Google Sheets
 * Sheet: Bán hàng (16 cột A-P), dữ liệu bắt đầu từ dòng 6
 */
export async function updateOrderInSheet(order: Order): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc.
    const rowNumber = order.id + 5;

    const values = [
      [
        order.code,                                      // A - Mã đơn hàng
        order.date,                                      // B - Ngày đặt
        order.customer,                                  // C - Khách hàng
        order.productCode || "",                         // D - Mã SP
        order.image || "",                               // E - Hình ảnh
        order.items,                                     // F - SL
        order.productPrice ? formatNumberVN(order.productPrice) : "", // G - Giá sỉ
        order.subtotal ? formatNumberVN(order.subtotal) : "", // H - Tiền hàng
        order.salesProgram || "",                        // I - Chương trình BH
        order.discount || "",                            // J - Chiết khấu
        order.priceAfterDiscount ? formatNumberVN(order.priceAfterDiscount) : "", // K - Đơn giá sau CK
        order.subtotalAfterDiscount ? formatNumberVN(order.subtotalAfterDiscount) : "", // L - Tiền hàng sau chiết khấu
        order.paymentDiscount || "",                     // M - CK thanh toán
        formatNumberVN(order.total),                     // N - Khách phải trả
        order.salesUser || "",                           // O - User bán hàng
        order.notes || "",                               // P - Ghi chú
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdBanHang,
      range: `'${sheetNameBanHang}'!A${rowNumber}:P${rowNumber}`,
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
 * Cập nhật nhiều đơn hàng cùng lúc trong Google Sheets (batch)
 * Sử dụng batchUpdate để ghi tất cả trong 1 request
 */
export async function batchUpdateOrdersInSheet(orders: Order[]): Promise<void> {
  try {
    if (orders.length === 0) return;

    const sheets = await getGoogleSheetsClient();

    const data = orders.map((order) => {
      const rowNumber = order.id + 5;
      return {
        range: `'${sheetNameBanHang}'!A${rowNumber}:P${rowNumber}`,
        values: [
          [
            order.code,
            order.date,
            order.customer,
            order.productCode || "",
            order.image || "",
            order.items,
            order.productPrice ? formatNumberVN(order.productPrice) : "",
            order.subtotal ? formatNumberVN(order.subtotal) : "",
            order.salesProgram || "",
            order.discount || "",
            order.priceAfterDiscount ? formatNumberVN(order.priceAfterDiscount) : "",
            order.subtotalAfterDiscount ? formatNumberVN(order.subtotalAfterDiscount) : "",
            order.paymentDiscount || "",
            formatNumberVN(order.total),
            order.salesUser || "",
            order.notes || "",
          ],
        ],
      };
    });

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetIdBanHang,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data,
      },
    });

    console.log(`Successfully batch updated ${orders.length} orders`);
  } catch (error) {
    console.error("Error batch updating orders in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa đơn hàng khỏi Google Sheets
 * Sheet: Bán hàng, dữ liệu bắt đầu từ dòng 6
 */
export async function deleteOrderFromSheet(orderId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc.
    const rowNumber = orderId + 5;

    // Lấy sheetId để xóa dòng - tìm sheet theo tên
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdBanHang,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameBanHang
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameBanHang}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdBanHang,
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

const spreadsheetIdNCC = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT || spreadsheetId;
const sheetNameNCC = process.env.GOOGLE_SHEET_NAME_DON_HANG_NCCNPL || "NCC NPL";

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
      range: `'${sheetNameNCC}'!B6:G`, // Đọc từ dòng 6, cột B đến G (header ở dòng 5)
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
      range: `'${sheetNameNCC}'!A:G`,
    });

    const allRows = response.data.values || [];

    // Bỏ qua header (dòng 1-5), dữ liệu bắt đầu từ dòng 6
    let lastDataRow = 5; // Header ở dòng 5
    for (let i = allRows.length - 1; i >= 5; i--) {
      if (allRows[i] && allRows[i][1] && allRows[i][1].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Đếm số nhà cung cấp thực tế để đánh STT (bỏ qua 5 dòng đầu)
    const supplierRows = allRows.slice(5).filter(
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
      range: `'${sheetNameNCC}'!A${nextRow}:G${nextRow}`,
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

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc. (header ở dòng 5)
    const rowNumber = supplier.id + 5;

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
      range: `'${sheetNameNCC}'!B${rowNumber}:G${rowNumber}`,
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

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc. (header ở dòng 5)
    const rowNumber = supplierId + 5;

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

const spreadsheetIdXuongSX = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT || spreadsheetId;
const sheetNameXuongSX = process.env.GOOGLE_SHEET_NAME_XUONG_SAN_XUAT || "Xưởng SX";

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
 * Sheet: Xưởng SX (header row 5, data từ row 6)
 * Cột B: Mã xưởng, C: Điện thoại, D: Địa chỉ, E: Người phụ trách, F: Ghi chú
 */
export async function getWorkshopsFromSheet(): Promise<Workshop[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdXuongSX,
      range: `'${sheetNameXuongSX}'!B6:F`, // Header row 5, data từ row 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No workshop data found in sheet.");
      return [];
    }

    const workshops: Workshop[] = rows
      .map((row, index) => ({
        id: index + 1, // id=1 → row 6, id=2 → row 7...
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
 * Header row 5, data từ row 6
 * Tự động đánh STT vào cột A, ghi dữ liệu vào cột B-F
 */
export async function addWorkshopToSheet(workshop: Workshop): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc dữ liệu từ row 6 để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdXuongSX,
      range: `'${sheetNameXuongSX}'!A6:F`,
    });

    const dataRows = response.data.values || [];

    // Tìm dòng cuối cùng có dữ liệu (cột B - Mã xưởng)
    let lastDataIndex = -1;
    for (let i = dataRows.length - 1; i >= 0; i--) {
      if (dataRows[i] && dataRows[i][1] && dataRows[i][1].toString().trim() !== "") {
        lastDataIndex = i;
        break;
      }
    }

    // Row 6 là index 0, nên nextRow = 6 + lastDataIndex + 1
    const nextRow = lastDataIndex === -1 ? 6 : (6 + lastDataIndex + 1);

    // Đếm số xưởng thực tế để đánh STT
    const workshopRows = dataRows.filter(
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
      range: `'${sheetNameXuongSX}'!A${nextRow}:F${nextRow}`,
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
 * Header row 5, data từ row 6
 */
export async function updateWorkshopInSheet(workshop: Workshop): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc.
    const rowNumber = workshop.id + 5;

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
      range: `'${sheetNameXuongSX}'!B${rowNumber}:F${rowNumber}`,
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
 * Header row 5, data từ row 6
 */
export async function deleteWorkshopFromSheet(workshopId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc.
    const rowNumber = workshopId + 5;

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

const spreadsheetIdNPL = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT || spreadsheetId;
const sheetNameNPL = process.env.GOOGLE_SHEET_NAME_NGUYEN_PHU_LIEU_RIOMIO || "Mã NPL";

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
    // taxRate ghi dưới dạng "8%" để Sheets parse đúng bất kể cột có format % hay không
    const values = [
      [
        sttNumber,
        material.code,
        material.name,
        material.supplier,
        material.info,
        material.unit,
        material.priceBeforeTax,
        `${material.taxRate}%`,
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
        `${material.taxRate}%`,
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
// PHÂN LOẠI THU CHI (Categories for Thu Chi)
// ============================================

const sheetNamePhanLoaiThuChi = process.env.GOOGLE_SHEET_NAME_PHAN_LOAI_THU_CHI_RIOMIO || "Phân loại thu, chi";

// Interface cho phân loại thu chi
export interface PhanLoaiThuChi {
  id: number;
  loaiPhieu: string;    // Loại phiếu: "Phiếu thu" hoặc "Phiếu chi"
  noiDung: string;      // Nội dung phân loại
}

/**
 * Đọc danh sách phân loại thu chi từ Google Sheets
 */
export async function getPhanLoaiThuChiFromSheet(): Promise<PhanLoaiThuChi[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetNamePhanLoaiThuChi}!A2:C`, // STT, Loại phiếu, Nội dung
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No phan loai thu chi data found in sheet.");
      return [];
    }

    const phanLoaiList: PhanLoaiThuChi[] = rows
      .map((row, index) => ({
        id: index + 1,
        loaiPhieu: row[1] || "",
        noiDung: row[2] || "",
      }))
      .filter((item) =>
        item.noiDung.trim() !== "" &&
        item.loaiPhieu.trim() !== ""
      );

    return phanLoaiList;
  } catch (error) {
    console.error("Error reading phan loai thu chi from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// THU CHI MANAGEMENT (Quản lý thu chi hàng ngày)
// ============================================

const spreadsheetIdThuChi = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameThuChi = process.env.GOOGLE_SHEET_NAME_THU_CHI || "ThuChi";

// Interface cho thu chi
export interface ThuChi {
  id: number;
  code: string;           // Mã Thu Chi (Cột A) - PT001, PC001...
  date: string;           // Ngày tháng (Cột B)
  accountName: string;    // Tên TK (Cột C)
  nccNpl: string;         // NCC NPL (Cột D)
  workshop: string;       // Xưởng SX (Cột E)
  shippingCost: number;   // Chi vận chuyển (Cột F)
  salesIncome: number;    // Thu tiền hàng (Cột G)
  otherIncome: number;    // Thu khác (Cột H)
  otherExpense: number;   // Chi khác (Cột I)
  entity: string;         // Đối tượng (Cột J)
  content: string;        // Nội dung (Cột K)
  category: string;       // Phân loại thu chi (Cột L)
  totalIncome: number;    // Tổng thu (Cột M)
  totalExpense: number;   // Tổng chi (Cột N)
  note: string;           // Ghi chú (Cột O)
}

// Helper function to parse price values
const parseThuChiPrice = (value: any): number => {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[,.\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Đọc danh sách thu chi từ Google Sheets
 */
export async function getThuChiFromSheet(): Promise<ThuChi[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdThuChi,
      range: `${sheetNameThuChi}!A2:O`, // Đọc từ dòng 2, cột A đến O
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No thu chi data found in sheet.");
      return [];
    }

    const thuChiList: ThuChi[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: row[0] || "",           // Cột A: Mã Thu Chi
        date: row[1] || "",           // Cột B: Ngày tháng
        accountName: row[2] || "",    // Cột C: Tên TK
        nccNpl: row[3] || "",         // Cột D: NCC NPL
        workshop: row[4] || "",       // Cột E: Xưởng SX
        shippingCost: parseThuChiPrice(row[5]),  // Cột F: Chi vận chuyển
        salesIncome: parseThuChiPrice(row[6]),   // Cột G: Thu tiền hàng
        otherIncome: parseThuChiPrice(row[7]),   // Cột H: Thu khác
        otherExpense: parseThuChiPrice(row[8]),  // Cột I: Chi khác
        entity: row[9] || "",         // Cột J: Đối tượng
        content: row[10] || "",       // Cột K: Nội dung
        category: row[11] || "",      // Cột L: Phân loại thu chi
        totalIncome: parseThuChiPrice(row[12]),  // Cột M: Tổng thu
        totalExpense: parseThuChiPrice(row[13]), // Cột N: Tổng chi
        note: row[14] || "",          // Cột O: Ghi chú
      }))
      .filter((item) =>
        // Bỏ qua header và dòng trống - kiểm tra ngày tháng hoặc mã
        (item.date.trim() !== "" || item.code.trim() !== "") &&
        item.date !== "Ngày tháng" &&
        !item.date.toLowerCase().includes("ngày") &&
        item.code !== "Mã Thu Chi"
      );

    return thuChiList;
  } catch (error) {
    console.error("Error reading thu chi from Google Sheets:", error);
    throw error;
  }
}

/**
 * Tạo mã thu chi tự động (PT001, PC001, ...)
 */
function generateThuChiCode(existingCodes: string[], isIncome: boolean): string {
  const prefix = isIncome ? "PT" : "PC";

  // Lọc các mã có cùng prefix và lấy số lớn nhất
  const relevantCodes = existingCodes
    .filter(code => code && code.startsWith(prefix))
    .map(code => {
      const numPart = code.replace(prefix, "");
      return parseInt(numPart, 10);
    })
    .filter(num => !isNaN(num));

  const maxNum = relevantCodes.length > 0 ? Math.max(...relevantCodes) : 0;
  const nextNum = maxNum + 1;

  // Format số với padding 3 chữ số (001, 002, ...)
  return `${prefix}${nextNum.toString().padStart(3, "0")}`;
}

/**
 * Thêm thu chi mới vào Google Sheets
 * @param thuChi - Dữ liệu thu chi
 * @param isIncome - true = Phiếu Thu (PT), false = Phiếu Chi (PC)
 */
export async function addThuChiToSheet(thuChi: Omit<ThuChi, "id" | "code"> & { code?: string }, isIncome: boolean): Promise<string> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối và các mã hiện có
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdThuChi,
      range: `${sheetNameThuChi}!A:O`,
    });

    const allRows = response.data.values || [];

    // Lấy tất cả mã hiện có (cột A)
    const existingCodes = allRows.slice(1).map(row => row[0] || "");

    // Tạo mã tự động: PT = Phiếu Thu, PC = Phiếu Chi
    const code = generateThuChiCode(existingCodes, isIncome);

    // Tìm dòng cuối có dữ liệu
    let lastDataRow = 1;
    for (let i = allRows.length - 1; i >= 1; i--) {
      if (allRows[i] && allRows[i][0] && allRows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    const values = [
      [
        code,                       // Cột A: Mã Thu Chi
        thuChi.date,                // Cột B: Ngày tháng
        thuChi.accountName,         // Cột C: Tên TK
        thuChi.nccNpl,              // Cột D: NCC NPL
        thuChi.workshop,            // Cột E: Xưởng SX
        thuChi.shippingCost || "",  // Cột F: Chi vận chuyển
        thuChi.salesIncome || "",   // Cột G: Thu tiền hàng
        thuChi.otherIncome || "",   // Cột H: Thu khác
        thuChi.otherExpense || "",  // Cột I: Chi khác
        thuChi.entity,              // Cột J: Đối tượng
        thuChi.content,             // Cột K: Nội dung
        thuChi.category,            // Cột L: Phân loại thu chi
        thuChi.totalIncome || "",   // Cột M: Tổng thu
        thuChi.totalExpense || "",  // Cột N: Tổng chi
        thuChi.note,                // Cột O: Ghi chú
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdThuChi,
      range: `${sheetNameThuChi}!A${nextRow}:O${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added thu chi with code ${code} at row: ${nextRow}`);
    return code;
  } catch (error) {
    console.error("Error adding thu chi to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật thu chi trong Google Sheets
 */
export async function updateThuChiInSheet(thuChi: ThuChi): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowNumber = thuChi.id + 1; // ID 1 = dòng 2

    const values = [
      [
        thuChi.code,                // Cột A: Mã Thu Chi (giữ nguyên)
        thuChi.date,                // Cột B: Ngày tháng
        thuChi.accountName,         // Cột C: Tên TK
        thuChi.nccNpl,              // Cột D: NCC NPL
        thuChi.workshop,            // Cột E: Xưởng SX
        thuChi.shippingCost || "",  // Cột F: Chi vận chuyển
        thuChi.salesIncome || "",   // Cột G: Thu tiền hàng
        thuChi.otherIncome || "",   // Cột H: Thu khác
        thuChi.otherExpense || "",  // Cột I: Chi khác
        thuChi.entity,              // Cột J: Đối tượng
        thuChi.content,             // Cột K: Nội dung
        thuChi.category,            // Cột L: Phân loại thu chi
        thuChi.totalIncome || "",   // Cột M: Tổng thu
        thuChi.totalExpense || "",  // Cột N: Tổng chi
        thuChi.note,                // Cột O: Ghi chú
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdThuChi,
      range: `${sheetNameThuChi}!A${rowNumber}:O${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated thu chi ID: ${thuChi.id}`);
  } catch (error) {
    console.error("Error updating thu chi in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa thu chi khỏi Google Sheets
 */
export async function deleteThuChiFromSheet(thuChiId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowNumber = thuChiId + 1;

    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdThuChi,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameThuChi
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      throw new Error(`Cannot find sheet named "${sheetNameThuChi}"`);
    }

    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdThuChi,
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

    console.log(`Successfully deleted thu chi ID: ${thuChiId}`);
  } catch (error) {
    console.error("Error deleting thu chi from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// KE HOACH SAN XUAT MANAGEMENT (Quản lý kế hoạch sản xuất)
// ============================================

const spreadsheetIdKeHoachSX = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameKeHoachSX = process.env.GOOGLE_SHEET_NAME_BANG_KE_LSX || "Bảng kê LSX";

// Interface cho kế hoạch sản xuất
export interface KeHoachSX {
  id: number;
  lsxCode: string;        // LSX số (Cột A)
  workshop: string;       // Xưởng SX (Cột B)
  orderDate: string;      // Ngày gửi lệnh (Cột C)
  completionDate: string; // Ngày hoàn thành (Cột D)
  productCode: string;    // Mã SP (Cột E)
  productName: string;    // Tên SP (Cột F)
  size: string;           // Size (Cột G)
  mainFabric: string;     // Vải chính (Cột H)
  color: string;          // Màu sắc (Cột I)
  image: string;          // Hình ảnh (Cột J)
  // Sizes cho trẻ em (Cột K-Y)
  size0_1: number;        // 0/1
  size1_2: number;        // 1/2
  size2_3: number;        // 2/3
  size3_4: number;        // 3/4
  size4_5: number;        // 4/5
  size5_6: number;        // 5/6
  size6_7: number;        // 6/7
  size7_8: number;        // 7/8
  size8_9: number;        // 8/9
  size9_10: number;       // 9/10
  size10_11: number;      // 10/11
  size11_12: number;      // 11/12
  size12_13: number;      // 12/13
  size13_14: number;      // 13/14
  size14_15: number;      // 14/15
  // Sizes cho người lớn (Cột Z-AE)
  sizeXS: number;
  sizeS: number;
  sizeM: number;
  sizeL: number;
  sizeXL: number;
  sizeXXL: number;
  totalQuantity: number;  // Tổng SL (Cột AF)
  note: string;           // Ghi chú (Cột AG)
}

// Helper function to parse quantity values
const parseQuantity = (value: any): number => {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[,.\s]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper: chuẩn hoá date về dd/MM/yyyy để ghi xuống sheet (locale Việt Nam)
const formatDateForSheet = (value: string): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  // yyyy-MM-dd → dd/MM/yyyy
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  // Đã ở dạng d/M/yyyy hoặc dd/MM/yyyy → giữ nguyên
  return trimmed;
};

/**
 * Đọc danh sách kế hoạch sản xuất từ Google Sheets
 */
export async function getKeHoachSXFromSheet(): Promise<KeHoachSX[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKeHoachSX,
      range: `'${sheetNameKeHoachSX}'!A6:AG`, // Đọc từ dòng 6 đến cột AG (header ở dòng 5)
      valueRenderOption: "FORMATTED_VALUE", // Get evaluated value instead of formula
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No ke hoach SX data found in sheet.");
      return [];
    }

    const keHoachList: KeHoachSX[] = rows
      .map((row, index) => {
        // Parse all sizes - Sheet mới: K=0/1, L=1/2, ..., AD=XL, AE=XXL, AF=Tổng SL, AG=Ghi chú
        const size0_1 = parseQuantity(row[10]);  // K
        const size1_2 = parseQuantity(row[11]);  // L
        const size2_3 = parseQuantity(row[12]);  // M
        const size3_4 = parseQuantity(row[13]);  // N
        const size4_5 = parseQuantity(row[14]);  // O
        const size5_6 = parseQuantity(row[15]);  // P
        const size6_7 = parseQuantity(row[16]);  // Q
        const size7_8 = parseQuantity(row[17]);  // R
        const size8_9 = parseQuantity(row[18]);  // S
        const size9_10 = parseQuantity(row[19]); // T
        const size10_11 = parseQuantity(row[20]); // U
        const size11_12 = parseQuantity(row[21]); // V
        const size12_13 = parseQuantity(row[22]); // W
        const size13_14 = parseQuantity(row[23]); // X
        const size14_15 = parseQuantity(row[24]); // Y
        const sizeXS = parseQuantity(row[25]);   // Z
        const sizeS = parseQuantity(row[26]);    // AA
        const sizeM = parseQuantity(row[27]);    // AB
        const sizeL = parseQuantity(row[28]);    // AC
        const sizeXL = parseQuantity(row[29]);   // AD
        const sizeXXL = parseQuantity(row[30]);  // AE

        // Calculate total from all sizes
        const calculatedTotal = size0_1 + size1_2 + size2_3 + size3_4 +
          size4_5 + size5_6 + size6_7 + size7_8 + size8_9 + size9_10 +
          size10_11 + size11_12 + size12_13 + size13_14 + size14_15 +
          sizeXS + sizeS + sizeM + sizeL + sizeXL + sizeXXL;

        return {
          id: index + 1,
          lsxCode: row[0] || "",        // A: LSX số
          workshop: row[1] || "",        // B: Xưởng SX
          orderDate: row[2] || "",       // C: Ngày gửi lệnh
          completionDate: row[3] || "",  // D: Ngày hoàn thành
          productCode: row[4] || "",     // E: Mã SP
          productName: row[5] || "",     // F: Tên SP
          size: row[6] || "",            // G: Size
          mainFabric: row[7] || "",      // H: Vải chính
          color: row[8] || "",           // I: Màu sắc
          image: row[9] || "",           // J: Hình ảnh
          // Sizes cho trẻ em (K-Y)
          size0_1,
          size1_2,
          size2_3,
          size3_4,
          size4_5,
          size5_6,
          size6_7,
          size7_8,
          size8_9,
          size9_10,
          size10_11,
          size11_12,
          size12_13,
          size13_14,
          size14_15,
          // Sizes cho người lớn (Z-AE)
          sizeXS,
          sizeS,
          sizeM,
          sizeL,
          sizeXL,
          sizeXXL,
          // AF: Tổng SL, AG: Ghi chú
          totalQuantity: parseQuantity(row[31]) || calculatedTotal,
          note: row[32] || "",
        };
      })
      .filter((item) =>
        // Bỏ qua header và dòng trống
        item.lsxCode.trim() !== "" &&
        item.lsxCode !== "LSX số" &&
        !item.lsxCode.toLowerCase().includes("lsx số")
      );

    return keHoachList;
  } catch (error) {
    console.error("Error reading ke hoach SX from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm kế hoạch sản xuất mới vào Google Sheets
 */
export async function addKeHoachSXToSheet(keHoach: KeHoachSX): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKeHoachSX,
      range: `'${sheetNameKeHoachSX}'!A:AG`,
    });

    const allRows = response.data.values || [];

    // Tìm dòng cuối có dữ liệu (data bắt đầu từ dòng 6, header dòng 5)
    let lastDataRow = 5;
    for (let i = allRows.length - 1; i >= 5; i--) {
      if (allRows[i] && allRows[i][0] && allRows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = Math.max(lastDataRow + 1, 6);

    const values = [
      [
        keHoach.lsxCode,        // A: LSX số
        keHoach.workshop,        // B: Xưởng SX
        formatDateForSheet(keHoach.orderDate),       // C: Ngày gửi lệnh
        formatDateForSheet(keHoach.completionDate),  // D: Ngày hoàn thành
        keHoach.productCode,     // E: Mã SP
        keHoach.productName,     // F: Tên SP
        keHoach.size,            // G: Size
        keHoach.mainFabric,      // H: Vải chính
        keHoach.color,           // I: Màu sắc
        keHoach.image,           // J: Hình ảnh
        // Sizes cho trẻ em (K-Y)
        keHoach.size0_1 || "",   // K: 0/1
        keHoach.size1_2 || "",   // L: 1/2
        keHoach.size2_3 || "",   // M: 2/3
        keHoach.size3_4 || "",   // N: 3/4
        keHoach.size4_5 || "",   // O: 4/5
        keHoach.size5_6 || "",   // P: 5/6
        keHoach.size6_7 || "",   // Q: 6/7
        keHoach.size7_8 || "",   // R: 7/8
        keHoach.size8_9 || "",   // S: 8/9
        keHoach.size9_10 || "",  // T: 9/10
        keHoach.size10_11 || "", // U: 10/11
        keHoach.size11_12 || "", // V: 11/12
        keHoach.size12_13 || "", // W: 12/13
        keHoach.size13_14 || "", // X: 13/14
        keHoach.size14_15 || "", // Y: 14/15
        // Sizes cho người lớn (Z-AE)
        keHoach.sizeXS || "",    // Z: XS
        keHoach.sizeS || "",     // AA: S
        keHoach.sizeM || "",     // AB: M
        keHoach.sizeL || "",     // AC: L
        keHoach.sizeXL || "",    // AD: XL
        keHoach.sizeXXL || "",   // AE: XXL
        keHoach.totalQuantity || "", // AF: Tổng SL
        keHoach.note,            // AG: Ghi chú
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdKeHoachSX,
      range: `'${sheetNameKeHoachSX}'!A${nextRow}:AG${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added ke hoach SX at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding ke hoach SX to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật kế hoạch sản xuất trong Google Sheets
 */
export async function updateKeHoachSXInSheet(keHoach: KeHoachSX): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowNumber = keHoach.id + 5; // Data bắt đầu từ dòng 6 (header dòng 5), ID 1 = dòng 6

    const values = [
      [
        keHoach.lsxCode,        // A: LSX số
        keHoach.workshop,        // B: Xưởng SX
        formatDateForSheet(keHoach.orderDate),       // C: Ngày gửi lệnh
        formatDateForSheet(keHoach.completionDate),  // D: Ngày hoàn thành
        keHoach.productCode,     // E: Mã SP
        keHoach.productName,     // F: Tên SP
        keHoach.size,            // G: Size
        keHoach.mainFabric,      // H: Vải chính
        keHoach.color,           // I: Màu sắc
        keHoach.image,           // J: Hình ảnh
        // Sizes cho trẻ em (K-Y)
        keHoach.size0_1 || "",   // K: 0/1
        keHoach.size1_2 || "",   // L: 1/2
        keHoach.size2_3 || "",   // M: 2/3
        keHoach.size3_4 || "",   // N: 3/4
        keHoach.size4_5 || "",   // O: 4/5
        keHoach.size5_6 || "",   // P: 5/6
        keHoach.size6_7 || "",   // Q: 6/7
        keHoach.size7_8 || "",   // R: 7/8
        keHoach.size8_9 || "",   // S: 8/9
        keHoach.size9_10 || "",  // T: 9/10
        keHoach.size10_11 || "", // U: 10/11
        keHoach.size11_12 || "", // V: 11/12
        keHoach.size12_13 || "", // W: 12/13
        keHoach.size13_14 || "", // X: 13/14
        keHoach.size14_15 || "", // Y: 14/15
        // Sizes cho người lớn (Z-AE)
        keHoach.sizeXS || "",    // Z: XS
        keHoach.sizeS || "",     // AA: S
        keHoach.sizeM || "",     // AB: M
        keHoach.sizeL || "",     // AC: L
        keHoach.sizeXL || "",    // AD: XL
        keHoach.sizeXXL || "",   // AE: XXL
        keHoach.totalQuantity || "", // AF: Tổng SL
        keHoach.note,            // AG: Ghi chú
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdKeHoachSX,
      range: `'${sheetNameKeHoachSX}'!A${rowNumber}:AG${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated ke hoach SX ID: ${keHoach.id}`);
  } catch (error) {
    console.error("Error updating ke hoach SX in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa kế hoạch sản xuất khỏi Google Sheets
 */
export async function deleteKeHoachSXFromSheet(keHoachId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowNumber = keHoachId + 5; // Data bắt đầu từ dòng 6, ID 1 = dòng 6

    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdKeHoachSX,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameKeHoachSX
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      throw new Error(`Cannot find sheet named "${sheetNameKeHoachSX}"`);
    }

    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdKeHoachSX,
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

    console.log(`Successfully deleted ke hoach SX ID: ${keHoachId}`);
  } catch (error) {
    console.error("Error deleting ke hoach SX from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// LOAN MANAGEMENT (Quản lý khoản vay)
// ============================================

const spreadsheetIdKhoanVay = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_DONG_TIEN || "1a8ebfB2KVQvrNYqoP5MNnn_gXhhxVH_8sJalPcNpMC8";
const sheetNameKhoanVay = process.env.GOOGLE_SHEET_NAME_DANH_SACH_MON_VAY || "Danh sách món vay";

// Interface cho khoản vay
export interface Loan {
  id: number;
  code: string;                    // A - Mã món vay
  lender: string;                  // B - Người cho vay
  category: string;                // C - Phân loại
  maturityDate: string;            // D - Ngày đáo hạn
  principalAmount: number;         // E - Số tiền vay gốc ban đầu
  initialInterestRate: string;     // F - Lãi suất ban đầu
  interestType: string;            // G - Loại lãi suất
  interestPaymentDate: string;     // H - Ngày trả lãi quy định
  paymentTerm: string;             // I - Kỳ hạn trả lãi
  status: string;                  // J - Trạng thái
  disbursementDate: string;        // K - Ngày giải ngân
  purpose: string;                 // L - Mục đích vay
}

/**
 * Đọc danh sách khoản vay từ Google Sheets
 * Sheet: Danh sách món vay
 * Row 5: Headers
 * Data starts at row 6
 * Cột A: Mã món vay, B: Người cho vay, C: Phân loại, D: Ngày đáo hạn,
 * E: Số tiền vay gốc ban đầu, F: Lãi suất ban đầu, G: Loại lãi suất,
 * H: Ngày trả lãi quy định, I: Kỳ hạn trả lãi, J: Trạng thái,
 * K: Ngày giải ngân, L: Mục đích vay
 */
export async function getLoansFromSheet(): Promise<Loan[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdKhoanVay,
      range: `'${sheetNameKhoanVay}'!A6:L`, // Đọc từ dòng 6, cột A đến L
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No loan data found in sheet.");
      return [];
    }

    const loans: Loan[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: row[0] || "",                                              // A - Mã món vay
        lender: row[1] || "",                                            // B - Người cho vay
        category: row[2] || "",                                          // C - Phân loại
        maturityDate: row[3] || "",                                      // D - Ngày đáo hạn
        principalAmount: parseFloat(row[4]?.replace(/[,\.]/g, "") || "0"), // E - Số tiền vay gốc
        initialInterestRate: row[5] || "",                               // F - Lãi suất ban đầu
        interestType: row[6] || "",                                      // G - Loại lãi suất
        interestPaymentDate: row[7] || "",                               // H - Ngày trả lãi quy định
        paymentTerm: row[8] || "",                                       // I - Kỳ hạn trả lãi
        status: row[9] || "",                                            // J - Trạng thái
        disbursementDate: row[10] || "",                                 // K - Ngày giải ngân
        purpose: row[11] || "",                                          // L - Mục đích vay
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
 * Convert date from yyyy-mm-dd to dd/mm/yyyy format
 */
function formatDateVN(dateStr: string): string {
  if (!dateStr) return "";
  // Check if already in dd/mm/yyyy format
  if (dateStr.includes("/")) return dateStr;
  // Convert from yyyy-mm-dd to dd/mm/yyyy
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Thêm khoản vay mới vào Google Sheets
 */
export async function addLoanToSheet(loan: Loan): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Ghi data vào cột A-L (append vào cuối sheet)
    // Format numbers with dots as thousand separators for Vietnamese format
    const values = [
      [
        loan.code,                                 // A - Mã món vay
        loan.lender,                              // B - Người cho vay
        loan.category,                            // C - Phân loại
        loan.maturityDate,                        // D - Ngày đáo hạn
        formatNumberVN(loan.principalAmount),     // E - Số tiền vay gốc
        loan.initialInterestRate,                 // F - Lãi suất ban đầu
        loan.interestType,                        // G - Loại lãi suất
        loan.interestPaymentDate,                 // H - Ngày trả lãi quy định
        loan.paymentTerm,                         // I - Kỳ hạn trả lãi
        loan.status,                              // J - Trạng thái
        loan.disbursementDate,                    // K - Ngày giải ngân
        loan.purpose,                             // L - Mục đích vay
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdKhoanVay,
      range: `'${sheetNameKhoanVay}'!A6:L`,
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
      range: `'${sheetNameKhoanVay}'!A6:A`,
    });

    const rows = response.data.values || [];
    let rowNumber = -1;

    // Tìm row có code khớp (data bắt đầu từ row 6)
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === loan.code) {
        rowNumber = i + 6; // +6 vì data bắt đầu từ row 6
        break;
      }
    }

    if (rowNumber === -1) {
      throw new Error(`Loan with code ${loan.code} not found`);
    }

    // Cập nhật cột A-L
    // Format numbers with dots as thousand separators for Vietnamese format
    const values = [
      [
        loan.code,                                 // A - Mã món vay
        loan.lender,                              // B - Người cho vay
        loan.category,                            // C - Phân loại
        loan.maturityDate,                        // D - Ngày đáo hạn
        formatNumberVN(loan.principalAmount),     // E - Số tiền vay gốc
        loan.initialInterestRate,                 // F - Lãi suất ban đầu
        loan.interestType,                        // G - Loại lãi suất
        loan.interestPaymentDate,                 // H - Ngày trả lãi quy định
        loan.paymentTerm,                         // I - Kỳ hạn trả lãi
        loan.status,                              // J - Trạng thái
        loan.disbursementDate,                    // K - Ngày giải ngân
        loan.purpose,                             // L - Mục đích vay
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdKhoanVay,
      range: `'${sheetNameKhoanVay}'!A${rowNumber}:L${rowNumber}`,
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
      range: `'${sheetNameKhoanVay}'!A6:A`,
    });

    const rows = response.data.values || [];
    let rowNumber = -1;

    // Tìm row có code khớp (data bắt đầu từ row 6)
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === loanCode) {
        rowNumber = i + 6; // +6 vì data bắt đầu từ row 6
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

// ============================================
// LICH SU THANH TOAN MANAGEMENT (Quản lý lịch sử thanh toán)
// ============================================

const spreadsheetIdLichSuThanhToan = process.env.GOOGLE_SPREADSHEET_ID_TAI_KHOAN || spreadsheetId;
const sheetNameLichSuThanhToan = process.env.GOOGLE_SHEET_NAME_LICH_SU_THANH_TOAN || "LichSuThanhToan";

// Interface cho lịch sử thanh toán
export interface PaymentHistory {
  id: number;
  transactionDate: string;  // Ngày giao dịch (Cột A)
  loanCode: string;         // Mã món vay (Cột B)
  transactionType: string;  // Loại giao dịch (Cột C)
  amountIn: number;         // Số tiền thu (Cột D)
  amountOut: number;        // Số tiền chi (Cột E)
}

/**
 * Đọc danh sách lịch sử thanh toán từ Google Sheets
 */
export async function getPaymentHistoryFromSheet(): Promise<PaymentHistory[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLichSuThanhToan,
      range: `${sheetNameLichSuThanhToan}!A2:E`, // Đọc từ dòng 2
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No payment history data found in sheet.");
      return [];
    }

    const paymentHistory: PaymentHistory[] = rows
      .map((row, index) => ({
        id: index + 1,
        transactionDate: row[0] || "",
        loanCode: row[1] || "",
        transactionType: row[2] || "",
        amountIn: parseFloat(row[3]?.replace(/[,\.]/g, "") || "0"),
        amountOut: parseFloat(row[4]?.replace(/[,\.]/g, "") || "0"),
      }))
      .filter((item) =>
        item.transactionDate.trim() !== "" &&
        item.transactionDate !== "Ngày giao dịch" &&
        !item.transactionDate.toLowerCase().includes("ngày giao dịch")
      );

    return paymentHistory;
  } catch (error) {
    console.error("Error reading payment history from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm lịch sử thanh toán mới vào Google Sheets
 */
export async function addPaymentHistoryToSheet(payment: PaymentHistory): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLichSuThanhToan,
      range: `${sheetNameLichSuThanhToan}!A:E`,
    });

    const allRows = response.data.values || [];

    // Tìm dòng cuối có dữ liệu
    let lastDataRow = 1;
    for (let i = allRows.length - 1; i >= 1; i--) {
      if (allRows[i] && allRows[i][0] && allRows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    const values = [
      [
        formatDateVN(payment.transactionDate),
        payment.loanCode.toUpperCase(),
        payment.transactionType,
        payment.amountIn > 0 ? formatNumberVN(payment.amountIn) : "",
        payment.amountOut > 0 ? formatNumberVN(payment.amountOut) : "",
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLichSuThanhToan,
      range: `${sheetNameLichSuThanhToan}!A${nextRow}:E${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added payment history at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding payment history to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật lịch sử thanh toán trong Google Sheets
 */
export async function updatePaymentHistoryInSheet(payment: PaymentHistory): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowNumber = payment.id + 1; // ID 1 = dòng 2

    const values = [
      [
        formatDateVN(payment.transactionDate),
        payment.loanCode.toUpperCase(),
        payment.transactionType,
        payment.amountIn > 0 ? formatNumberVN(payment.amountIn) : "",
        payment.amountOut > 0 ? formatNumberVN(payment.amountOut) : "",
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLichSuThanhToan,
      range: `${sheetNameLichSuThanhToan}!A${rowNumber}:E${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated payment history ID: ${payment.id}`);
  } catch (error) {
    console.error("Error updating payment history in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa lịch sử thanh toán khỏi Google Sheets
 */
export async function deletePaymentHistoryFromSheet(paymentId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowNumber = paymentId + 1;

    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdLichSuThanhToan,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameLichSuThanhToan
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      throw new Error(`Cannot find sheet named "${sheetNameLichSuThanhToan}"`);
    }

    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdLichSuThanhToan,
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

    console.log(`Successfully deleted payment history ID: ${paymentId}`);
  } catch (error) {
    console.error("Error deleting payment history from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// SAN PHAM MANAGEMENT (Quản lý phát triển sản phẩm)
// ============================================

const spreadsheetIdSanPham = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT || '16WCta5dfQGsUhSO0oMRWvQNSU-VzwiyWpTctKEDwaHc';
const sheetNameSanPham = process.env.GOOGLE_SHEET_NAME_MA_SP || "Mã SP";

// Interface cho sản phẩm phát triển
export interface SanPham {
  id: number;
  code: string;                  // Mã SP (Cột A)
  name: string;                  // Tên SP (Cột B)
  size: string;                  // Size (Cột C)
  mainFabric: string;            // Vải chính (Cột D)
  accentFabric: string;          // Vải phối (Cột E)
  otherMaterials: string;        // Phụ liệu khác (Cột F)
  productionOrder: string;       // Lệnh SX (Cột G)
  workshop: string;              // Xưởng SX (Cột H)
  mainFabricQuota: string;       // ĐM Vải chính (Cột I)
  accentFabricQuota1: string;    // ĐM Vải phối 1 (Cột J)
  accentFabricQuota2: string;    // ĐM Vải phối 2 (Cột K)
  materialsQuota1: string;       // ĐM Phụ liệu 1 (Cột L)
  materialsQuota2: string;       // ĐM Phụ liệu 2 (Cột M)
  accessoriesQuota: string;      // ĐM Phụ kiện (Cột N)
  otherQuota: string;            // ĐM Khác (Cột O)
  plannedQuantity: number;       // Số lượng kế hoạch (Cột P)
  cutQuantity: number;           // Số lượng cắt (Cột Q)
  warehouseQuantity: number;     // Số lượng nhập kho (Cột R)
  developmentStage: string;      // Công đoạn phát triển (Cột S)
  productionStage: string;       // Công đoạn sản xuất (Cột T)
  image: string;                 // Hình ảnh (Cột U)
}

/**
 * Đọc danh sách sản phẩm phát triển từ Google Sheets
 */
export async function getSanPhamFromSheet(): Promise<SanPham[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanPham,
      range: `'${sheetNameSanPham}'!A6:U`, // Đọc từ dòng 6, cột A đến U (21 cột)
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No san pham data found in sheet.");
      return [];
    }

    // Helper function to parse số lượng
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, "");
      return parseFloat(cleaned) || 0;
    };

    const sanPhams: SanPham[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: row[0] || "",                               // A: Mã SP
        name: row[1] || "",                               // B: Tên SP
        size: row[2] || "",                               // C: Size
        mainFabric: row[3] || "",                         // D: Vải chính
        accentFabric: row[4] || "",                       // E: Vải phối
        otherMaterials: row[5] || "",                     // F: Phụ liệu khác
        productionOrder: row[6] || "",                    // G: Lệnh SX
        workshop: row[7] || "",                           // H: Xưởng SX
        mainFabricQuota: row[8] || "",                    // I: ĐM Vải chính
        accentFabricQuota1: row[9] || "",                 // J: ĐM Vải phối 1
        accentFabricQuota2: row[10] || "",                // K: ĐM Vải phối 2
        materialsQuota1: row[11] || "",                   // L: ĐM Phụ liệu 1
        materialsQuota2: row[12] || "",                   // M: ĐM Phụ liệu 2
        accessoriesQuota: row[13] || "",                  // N: ĐM Phụ kiện
        otherQuota: row[14] || "",                        // O: ĐM Khác
        plannedQuantity: parseNumber(row[15]),            // P: Số lượng kế hoạch
        cutQuantity: parseNumber(row[16]),                // Q: Số lượng cắt
        warehouseQuantity: parseNumber(row[17]),          // R: Số lượng nhập kho
        developmentStage: row[18] || "",                  // S: Công đoạn phát triển
        productionStage: row[19] || "",                   // T: Công đoạn sản xuất
        image: row[20] || "",                             // U: Hình ảnh
      }))
      .filter((sp) => sp.code.trim() !== "" || sp.name.trim() !== "");

    return sanPhams;
  } catch (error) {
    console.error("Error reading san pham from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// MA SP LIST FOR CATALOG DROPDOWN
// Đọc sheet "Mã SP" trong spreadsheet RIOMIO_BAN_HANG (chứa Giá sỉ / Giá lẻ / Hình ảnh).
// ============================================
// Spreadsheet & sheet name dùng riêng cho dropdown này
const spreadsheetIdMaSPDropdown =
  process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG ||
  "1bIXymFQLB6BJgYDS5qJYQl0SRUu7TtL_4XzzO0LPSis";
const sheetNameMaSPDropdown = process.env.GOOGLE_SHEET_NAME_MA_SP || "Mã SP";

/**
 * Đọc reference list Màu sắc (cột O) và Size (cột P) trong sheet "Danh mục SP"
 * (RIOMIO_BAN_HANG). Trả về 2 array unique values.
 */
export async function getColorSizeListsFromSheet(): Promise<{
  colors: string[];
  sizes: string[];
}> {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId =
      process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG ||
      "1bIXymFQLB6BJgYDS5qJYQl0SRUu7TtL_4XzzO0LPSis";
    const sheetName =
      process.env.GOOGLE_SHEET_NAME_DANH_MUC_SP_RIOMIO || "Danh mục SP";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!O1:P`,
    });

    const rows = response.data.values || [];
    const colors = new Set<string>();
    const sizes = new Set<string>();

    for (const row of rows) {
      const c = String(row[0] || "").trim();
      const s = String(row[1] || "").trim();
      // Bỏ header / blank
      if (
        c &&
        c.toLowerCase() !== "màu sắc" &&
        c.toLowerCase() !== "mau sac"
      )
        colors.add(c);
      if (s && s.toLowerCase() !== "size") sizes.add(s);
    }

    const result = {
      colors: Array.from(colors),
      sizes: Array.from(sizes),
    };
    console.log(
      `[getColorSizeListsFromSheet] sheet="${sheetName}", colors=${result.colors.length}, sizes=${result.sizes.length}`,
    );
    return result;
  } catch (error) {
    console.error("Error reading Color/Size lists:", error);
    return { colors: [], sizes: [] };
  }
}

export interface MaSPListItem {
  code: string;
  name: string;
  size: string;
  color: string;
  workshop: string;
  wholesalePrice: number;
  retailPrice: number;
  image: string;
  sizeChart: string;
}

export async function getMaSPListFromSheet(): Promise<MaSPListItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdMaSPDropdown,
      range: `'${sheetNameMaSPDropdown}'!A1:Z`,
    });

    const rows = response.data.values;
    console.log(
      `[getMaSPListFromSheet] read ${rows?.length || 0} rows from sheet "${sheetNameMaSPDropdown}" (spreadsheet: ${spreadsheetIdMaSPDropdown.slice(0, 12)}...)`,
    );
    if (!rows || rows.length === 0) return [];

    const parsePrice = (v: any): number => {
      if (v === null || v === undefined || v === "") return 0;
      const cleaned = String(v).replace(/[^\d.-]/g, "").replace(/\.(?=\d{3})/g, "");
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    };

    const norm = (s: any) =>
      String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

    // Tìm header row: row đầu tiên có cell chứa "mã sp"
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const rowNormalized = (rows[i] || []).map(norm);
      if (rowNormalized.some((c) => c === "mã sp" || c === "ma sp")) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) {
      console.warn(`[getMaSPListFromSheet] Cannot find header row in sheet "${sheetNameSanPham}"`);
      return [];
    }

    const header = (rows[headerRowIdx] || []).map(norm);
    console.log(
      `[getMaSPListFromSheet] FULL HEADER (row ${headerRowIdx + 1}):`,
      header.map((h, i) => `${String.fromCharCode(65 + i)}=${JSON.stringify(h)}`).join(", "),
    );

    const findCol = (...candidates: string[]) => {
      for (const c of candidates) {
        const idx = header.findIndex((h) => h === norm(c));
        if (idx !== -1) return idx;
      }
      // Fallback: contains check
      for (const c of candidates) {
        const idx = header.findIndex((h) => h.includes(norm(c)));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colCode = findCol("mã sp", "ma sp");
    const colName = findCol("tên sp", "ten sp", "tên sản phẩm");
    const colColor = findCol("màu sắc", "mau sac", "màu");
    const colWorkshop = findCol("xưởng sx", "xuong sx", "xưởng");
    const colWholesale = findCol("giá sỉ", "gia si", "giá bán sỉ", "giá nhập sỉ", "sỉ");
    const colRetail = findCol("giá lẻ", "gia le", "giá bán lẻ", "giá nhập lẻ", "lẻ");
    const colImage = findCol("hình ảnh", "hinh anh", "ảnh", "image");
    // Trong sheet "Mã SP" master, cột header "Size" chứa dòng size (vd "6/7-10/11"),
    // chính là Dòng size sẽ auto-fill ở modal danh mục SP.
    const colSizeChart = findCol(
      "dòng size",
      "dong size",
      "size chart",
      "size",
      "kích thước",
    );
    const colSize = -1; // sheet master không có cột Size riêng

    console.log(
      `[getMaSPListFromSheet] header row=${headerRowIdx + 1}, cols: code=${colCode}, name=${colName}, color=${colColor}, workshop=${colWorkshop}, wholesale=${colWholesale}, retail=${colRetail}, image=${colImage}, sizeChart=${colSizeChart}`,
    );

    if (colCode === -1) {
      console.warn(`[getMaSPListFromSheet] Header has no Mã SP column`);
      return [];
    }

    const result: MaSPListItem[] = [];
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const code = String(row[colCode] || "").trim();
      if (!code || code.includes(" ") || norm(code) === "mã sp") continue;

      result.push({
        code,
        name: colName !== -1 ? String(row[colName] || "").trim() : "",
        size: colSize !== -1 ? String(row[colSize] || "").trim() : "",
        color: colColor !== -1 ? String(row[colColor] || "").trim() : "",
        workshop: colWorkshop !== -1 ? String(row[colWorkshop] || "").trim() : "",
        wholesalePrice: colWholesale !== -1 ? parsePrice(row[colWholesale]) : 0,
        retailPrice: colRetail !== -1 ? parsePrice(row[colRetail]) : 0,
        image: colImage !== -1 ? String(row[colImage] || "").trim() : "",
        sizeChart: colSizeChart !== -1 ? String(row[colSizeChart] || "").trim() : "",
      });
    }

    console.log(
      `[getMaSPListFromSheet] returning ${result.length} items, sample:`,
      result.slice(0, 2),
    );
    return result;
  } catch (error) {
    console.error("Error reading Mã SP list from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// SAN PHAM BAN HANG (Sản phẩm bán hàng - PhatTrienSanPhamBanHang)
// ============================================

const sheetNameSanPhamBanHang = process.env.GOOGLE_SHEET_NAME_SAN_PHAM_PHAT_TRIEN_BAN_HANG || "PhatTrienSanPhamBanHang";

// Interface cho sản phẩm bán hàng
export interface SanPhamBanHang {
  id: number;
  code: string;           // Mã SP (Cột A)
  name: string;           // Tên SP (Cột B)
  size: string;           // Size (Cột C) - VD: "0/1-7/8" hoặc "XS-XL"
  color: string;          // Màu sắc (Cột D)
  wholesalePrice: number; // Giá sỉ (Cột E)
  retailPrice: number;    // Giá lẻ (Cột F)
  image: string;          // Hình ảnh (Cột G)
}

/**
 * Đọc danh sách sản phẩm bán hàng từ Google Sheets (PhatTrienSanPhamBanHang)
 */
export async function getSanPhamBanHangFromSheet(): Promise<SanPhamBanHang[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanPham,
      range: `${sheetNameSanPhamBanHang}!A2:G`, // Đọc từ dòng 2, cột A đến G
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No san pham ban hang data found in sheet.");
      return [];
    }

    const sanPhams: SanPhamBanHang[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: row[0] || "",
        name: row[1] || "",
        size: row[2] || "",   // Cột C - Size
        color: row[3] || "",  // Cột D - Màu sắc
        wholesalePrice: parseFloat(String(row[4] || "0").replace(/[,.]/g, "")) || 0, // Cột E - Giá sỉ
        retailPrice: parseFloat(String(row[5] || "0").replace(/[,.]/g, "")) || 0,    // Cột F - Giá lẻ
        image: row[6] || "",  // Cột G - Hình ảnh
      }))
      .filter((sp) => sp.code.trim() !== "");

    return sanPhams;
  } catch (error) {
    console.error("Error reading san pham ban hang from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// TON KHO SAN PHAM (Tồn kho sản phẩm - Tonkhosp)
// ============================================

const spreadsheetIdTonKhoSP = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_KHO_HANG || "1Yqkk8sKkfKANFNwloyZr7lfR2sdLgYA9KAem_r9wII0";
const sheetNameTonKhoSP = process.env.GOOGLE_SHEET_NAME_TON_KHO_SP || "Tonkhosp";

// Interface cho tồn kho sản phẩm
export interface TonKhoSP {
  id: number;
  code: string;           // Mã SP (Cột B)
  nhapDauKy: number;      // Nhập đầu kỳ (Cột C)
  nhapTrongKy: number;    // Nhập trong kỳ (Cột D)
  xuatTrongKy: number;    // Xuất trong kỳ (Cột E)
  tonCuoiKy: number;      // Tồn cuối kỳ (Cột F)
}

/**
 * Đọc danh sách tồn kho sản phẩm từ Google Sheets (Tonkhosp)
 */
export async function getTonKhoSPFromSheet(): Promise<TonKhoSP[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameTonKhoSP}'!B16:F`, // Dữ liệu thực tế bắt đầu từ dòng 16
    });

    const rows = response.data.values;

    console.log("getTonKhoSPFromSheet - Raw rows:", rows ? rows.length : 0);
    console.log("getTonKhoSPFromSheet - First 5 rows:", rows?.slice(0, 5));

    if (!rows || rows.length === 0) {
      console.log("No ton kho SP data found in sheet.");
      return [];
    }

    const tonKhoList: TonKhoSP[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: row[0] || "",                                                           // Cột B - Mã SP
        nhapDauKy: parseFloat(String(row[1] || "0").replace(/[,.]/g, "")) || 0,       // Cột C - Nhập đầu kỳ
        nhapTrongKy: parseFloat(String(row[2] || "0").replace(/[,.]/g, "")) || 0,     // Cột D - Nhập trong kỳ
        xuatTrongKy: parseFloat(String(row[3] || "0").replace(/[,.]/g, "")) || 0,     // Cột E - Xuất trong kỳ
        tonCuoiKy: parseFloat(String(row[4] || "0").replace(/[,.]/g, "")) || 0,       // Cột F - Tồn cuối kỳ
      }))
      .filter((sp) => sp.code.trim() !== "");

    console.log("getTonKhoSPFromSheet - Processed list:", tonKhoList.length);
    console.log("getTonKhoSPFromSheet - First 5 items:", tonKhoList.slice(0, 5));

    return tonKhoList;
  } catch (error) {
    console.error("Error reading ton kho SP from Google Sheets:", error);
    throw error;
  }
}

// Interface cho tồn đầu sản phẩm (Bảng 2)
export interface TonDauSP {
  id: number;
  code: string;           // Mã SP (Cột I)
  tonDau: number;         // Tồn đầu (Cột J)
}

/**
 * Đọc danh sách tồn đầu sản phẩm từ Google Sheets (Tonkhosp - Bảng 2)
 * Bảng 2 ở cột H-J (STT, Mã SP, Tồn đầu) - data bắt đầu từ dòng 6
 */
export async function getTonDauSPFromSheet(): Promise<TonDauSP[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameTonKhoSP}'!I6:J`, // Dữ liệu thực tế bắt đầu từ dòng 6, cột I-J (bỏ qua cột H là STT)
    });

    const rows = response.data.values;

    console.log("getTonDauSPFromSheet - Raw rows:", rows ? rows.length : 0);
    console.log("getTonDauSPFromSheet - First 5 rows:", rows?.slice(0, 5));

    if (!rows || rows.length === 0) {
      console.log("No ton dau SP data found in sheet.");
      return [];
    }

    const tonDauList: TonDauSP[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: row[0] || "",                                                           // Cột I - Mã SP
        tonDau: parseFloat(String(row[1] || "0").replace(/[,.]/g, "")) || 0,         // Cột J - Tồn đầu
      }))
      .filter((sp) => sp.code.trim() !== "");

    console.log("getTonDauSPFromSheet - Processed list:", tonDauList.length);
    console.log("getTonDauSPFromSheet - First 5 items:", tonDauList.slice(0, 5));

    return tonDauList;
  } catch (error) {
    console.error("Error reading ton dau SP from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// XUẤT KHO SẢN PHẨM
// ============================================
const sheetNameXuatKhoSP = process.env.GOOGLE_SHEET_NAME_XUAT_KHO_SP || "Xuất kho SP";

export interface XuatKhoSP {
  id: number;
  maPXK: string;        // Cột A - Mã PXK
  ngayThang: string;    // Cột B - Ngày tháng
  maSP: string;         // Cột C - Mã SP
  soLuong: number;      // Cột D - Số lượng
  maDonHang: string;    // Cột E - Mã đơn hàng
  khachHang: string;    // Cột F - Khách hàng
  userThucHien: string; // Cột G - User thực hiện
  tonKho: number;       // Cột H - Tồn kho
}

export async function getXuatKhoSPFromSheet(): Promise<XuatKhoSP[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameXuatKhoSP}'!A6:H`, // Dữ liệu bắt đầu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    // Map với actual row index (dòng 6 = index 0, nên rowNumber = index + 6)
    const xuatKhoList: XuatKhoSP[] = rows
      .map((row, index) => ({
        id: index + 6, // Actual row number in sheet (row 6 = id 6)
        maPXK: row[0] || "",
        ngayThang: row[1] || "",
        maSP: row[2] || "",
        soLuong: parseInt(row[3]) || 0,
        maDonHang: row[4] || "",
        khachHang: row[5] || "",
        userThucHien: row[6] || "",
        tonKho: parseInt(row[7]) || 0,
      }))
      .filter((item) => item.maPXK || item.maSP); // Lọc dòng có mã PXK hoặc mã SP

    return xuatKhoList;
  } catch (error) {
    console.error("Error reading xuat kho SP from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm nhiều dòng xuất kho SP vào Google Sheets
 */
export async function addXuatKhoSPToSheet(data: {
  maPXK: string;
  ngayThang: string;
  maDonHang: string;
  khachHang: string;
  userThucHien: string;
  products: { maSP: string; soLuong: number }[];
}): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Format ngày: "2026-01-15" -> "15/01/2026"
    const [year, month, day] = data.ngayThang.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    // Tạo các dòng dữ liệu cho mỗi sản phẩm
    const rows = data.products.map((product) => [
      data.maPXK,
      formattedDate,
      product.maSP,
      product.soLuong,
      data.maDonHang,
      data.khachHang,
      data.userThucHien,
    ]);

    // Find the last row with data to append after it
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameXuatKhoSP}'!A:A`,
    });

    const lastRowWithData = existingData.data.values ? existingData.data.values.length : 5;
    const nextRow = Math.max(lastRowWithData + 1, 6); // At least row 6

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameXuatKhoSP}'!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows,
      },
    });
  } catch (error) {
    console.error("Error adding xuat kho SP:", error);
    throw error;
  }
}

/**
 * Cập nhật một dòng xuất kho SP
 */
export async function updateXuatKhoSPInSheet(
  rowNumber: number,
  data: {
    maPXK: string;
    ngayThang: string;
    maSP: string;
    soLuong: number;
    maDonHang: string;
    khachHang: string;
    userThucHien: string;
  }
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // rowNumber là số dòng thực tế trong sheet (1-indexed)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameXuatKhoSP}'!A${rowNumber}:G${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.maPXK,
          data.ngayThang,
          data.maSP,
          data.soLuong,
          data.maDonHang,
          data.khachHang,
          data.userThucHien,
        ]],
      },
    });
  } catch (error) {
    console.error("Error updating xuat kho SP:", error);
    throw error;
  }
}

/**
 * Xóa một dòng xuất kho SP
 */
export async function deleteXuatKhoSPFromSheet(rowNumber: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Lấy sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameXuatKhoSP
    );

    if (!sheet || !sheet.properties?.sheetId) {
      throw new Error("Sheet not found");
    }

    // rowNumber là số dòng thực tế trong sheet (1-indexed)
    // Google Sheets API dùng 0-indexed, nên startIndex = rowNumber - 1
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdTonKhoSP,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error deleting xuat kho SP:", error);
    throw error;
  }
}

// ============================================
// NHẬP KHO SẢN PHẨM (Nhập kho SP)
// ============================================

const sheetNameNhapKhoSP = process.env.GOOGLE_SHEET_NAME_NHAP_KHO_SP_RIOMIO || "Nhập kho SP";

// Interface cho nhập kho sản phẩm
export interface NhapKhoSP {
  id: number;
  maPNK: string;        // Cột A - Mã phiếu nhập kho
  ngayNhap: string;     // Cột B - Ngày nhập
  maSP: string;         // Cột C - Mã sản phẩm
  soLuong: number;      // Cột D - Số lượng
  ghiChu: string;       // Cột E - Ghi chú
  tonCuoi: number;      // Cột F - Tồn cuối
}

/**
 * Đọc danh sách nhập kho SP từ Google Sheets
 * Header ở dòng 5, dữ liệu bắt đầu từ dòng 6
 */
export async function getNhapKhoSPFromSheet(): Promise<NhapKhoSP[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameNhapKhoSP}'!A6:F`,
    });

    const rows = response.data.values;

    console.log("=== getNhapKhoSPFromSheet DEBUG ===");
    console.log("Total rows returned from sheet:", rows?.length || 0);

    if (!rows || rows.length === 0) {
      return [];
    }

    // Map với actual row index (dòng 6 = index 0, nên rowNumber = index + 6)
    const nhapKhoList: NhapKhoSP[] = rows
      .map((row, index) => ({
        id: index + 6, // Actual row number in sheet (row 6 = id 6)
        maPNK: row[0] || "",
        ngayNhap: row[1] || "",
        maSP: row[2] || "",
        soLuong: parseInt(row[3]) || 0,
        ghiChu: row[4] || "",
        tonCuoi: parseInt(row[5]) || 0,
      }))
      .filter((item) => item.maPNK || item.maSP); // Lọc dòng có mã PNK hoặc mã SP

    // Log first 5 items for debugging
    console.log("First 5 items with row IDs:", nhapKhoList.slice(0, 5).map(item => ({
      id: item.id,
      maPNK: item.maPNK,
      maSP: item.maSP
    })));
    console.log("Last 5 items with row IDs:", nhapKhoList.slice(-5).map(item => ({
      id: item.id,
      maPNK: item.maPNK,
      maSP: item.maSP
    })));

    return nhapKhoList;
  } catch (error) {
    console.error("Error reading nhap kho SP from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm nhiều dòng nhập kho SP vào Google Sheets
 */
export async function addNhapKhoSPToSheet(data: {
  maPNK: string;
  ngayNhap: string;
  products: { maSP: string; soLuong: number; ghiChu?: string }[];
}): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Format ngày: "2026-01-15" -> "15/01/2026"
    const [year, month, day] = data.ngayNhap.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    // Tạo rows cho mỗi sản phẩm
    const rows = data.products.map(product => [
      data.maPNK,
      formattedDate,
      product.maSP,
      product.soLuong,
      product.ghiChu || "",
      "", // Tồn cuối - để công thức trong sheet tự tính
    ]);

    // Find the last row with data to append after it
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameNhapKhoSP}'!A:A`,
    });

    const lastRowWithData = existingData.data.values ? existingData.data.values.length : 5;
    const nextRow = Math.max(lastRowWithData + 1, 6); // At least row 6

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameNhapKhoSP}'!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows,
      },
    });
  } catch (error) {
    console.error("Error adding nhap kho SP:", error);
    throw error;
  }
}

/**
 * Cập nhật một dòng nhập kho SP
 */
export async function updateNhapKhoSPInSheet(
  rowNumber: number,
  data: {
    maPNK: string;
    ngayNhap: string;
    maSP: string;
    soLuong: number;
    ghiChu: string;
  }
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // rowNumber là số dòng thực tế trong sheet (1-indexed)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameNhapKhoSP}'!A${rowNumber}:E${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.maPNK,
          data.ngayNhap,
          data.maSP,
          data.soLuong,
          data.ghiChu,
        ]],
      },
    });
  } catch (error) {
    console.error("Error updating nhap kho SP:", error);
    throw error;
  }
}

/**
 * Xóa một dòng nhập kho SP
 */
export async function deleteNhapKhoSPFromSheet(rowNumber: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    console.log("=== deleteNhapKhoSPFromSheet DEBUG ===");
    console.log("Requested to delete rowNumber:", rowNumber);

    // Đọc dữ liệu tại dòng đó trước khi xóa để verify
    const rowData = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameNhapKhoSP}'!A${rowNumber}:F${rowNumber}`,
    });
    console.log("Data at row", rowNumber, "before delete:", rowData.data.values);

    // Lấy sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdTonKhoSP,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameNhapKhoSP
    );

    if (!sheet || !sheet.properties?.sheetId) {
      throw new Error("Sheet not found");
    }

    console.log("Sheet found with sheetId:", sheet.properties.sheetId);
    console.log("Will delete row at 0-indexed position:", rowNumber - 1);

    // rowNumber là số dòng thực tế trong sheet (1-indexed)
    // Google Sheets API dùng 0-indexed, nên startIndex = rowNumber - 1
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdTonKhoSP,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log("Successfully deleted row", rowNumber, "from Nhap Kho SP sheet");
  } catch (error) {
    console.error("Error deleting nhap kho SP:", error);
    throw error;
  }
}

// ============================================
// CHI PHÍ BÁN HÀNG
// ============================================
const spreadsheetIdChiPhiBanHang = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG || "1bIXymFQLB6BJgYDS5qJYQl0SRUu7TtL_4XzzO0LPSis";
const sheetNameChiPhiBanHang = process.env.GOOGLE_SHEET_NAME_CHI_PHI_BAN_HANG || "Chi phí bán hàng";

export interface ChiPhiBanHang {
  id: number;
  ngayThang: string;      // Cột A - Ngày tháng
  nguoiChi: string;       // Cột B - Người chi
  noiDung: string;        // Cột C - Nội dung
  phanLoai: string;       // Cột D - Phân loại
  soTien: number;         // Cột E - Số tiền
  maPhieuChi: string;     // Cột F - Mã phiếu chi (PCBH##)
  rowIndex: number;       // Dòng trong sheet (để update/delete)
}

/**
 * Đọc danh sách chi phí bán hàng từ Google Sheets
 */
export async function getChiPhiBanHangFromSheet(): Promise<ChiPhiBanHang[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdChiPhiBanHang,
      range: `'${sheetNameChiPhiBanHang}'!A6:F`, // Data bắt đầu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    const chiPhiList: ChiPhiBanHang[] = rows
      .map((row, index) => ({
        id: index + 1,
        rowIndex: index + 6, // Dòng thực tế trong sheet
        ngayThang: row[0] || "",
        nguoiChi: row[1] || "",
        noiDung: row[2] || "",
        phanLoai: row[3] || "",
        soTien: parseFloat(String(row[4] || "0").replace(/[,.]/g, "")) || 0,
        maPhieuChi: row[5] || "",
      }))
      .filter((item) => item.ngayThang.trim() !== "" || item.noiDung.trim() !== "");

    return chiPhiList;
  } catch (error) {
    console.error("Error reading chi phi ban hang from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm chi phí bán hàng mới vào Google Sheets
 */
export async function addChiPhiBanHang(data: Omit<ChiPhiBanHang, "id" | "rowIndex">): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [[
      data.ngayThang,
      data.nguoiChi,
      data.noiDung,
      data.phanLoai,
      data.soTien,
      data.maPhieuChi,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdChiPhiBanHang,
      range: `'${sheetNameChiPhiBanHang}'!A6:F`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error adding chi phi ban hang:", error);
    throw error;
  }
}

/**
 * Cập nhật chi phí bán hàng trong Google Sheets
 */
export async function updateChiPhiBanHang(rowIndex: number, data: Omit<ChiPhiBanHang, "id" | "rowIndex">): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [[
      data.ngayThang,
      data.nguoiChi,
      data.noiDung,
      data.phanLoai,
      data.soTien,
      data.maPhieuChi,
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdChiPhiBanHang,
      range: `'${sheetNameChiPhiBanHang}'!A${rowIndex}:F${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error updating chi phi ban hang:", error);
    throw error;
  }
}

/**
 * Xóa chi phí bán hàng từ Google Sheets (clear dòng)
 */
export async function deleteChiPhiBanHang(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Clear the row content
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdChiPhiBanHang,
      range: `'${sheetNameChiPhiBanHang}'!A${rowIndex}:F${rowIndex}`,
    });
  } catch (error) {
    console.error("Error deleting chi phi ban hang:", error);
    throw error;
  }
}

/**
 * Cập nhật giá trị vào một cell cụ thể trong Google Sheets
 */
export async function updateCellInSheet(
  cell: string, // Ví dụ: "C3", "J3"
  value: string
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdTonKhoSP,
      range: `'${sheetNameTonKhoSP}'!${cell}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[value]],
      },
    });

    console.log(`Updated cell ${cell} with value: ${value}`);
  } catch (error) {
    console.error(`Error updating cell ${cell} in Google Sheets:`, error);
    throw error;
  }
}


// ============================================
// DANH MUC SAN PHAM (Danh mục SP - Mã SP đầy đủ)
// ============================================

const spreadsheetIdDanhMucSP = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG || "1bIXymFQLB6BJgYDS5qJYQl0SRUu7TtL_4XzzO0LPSis";
const sheetNameDanhMucSP = process.env.GOOGLE_SHEET_NAME_DANH_MUC_SP || "Danh mục SP";

// Interface cho danh mục sản phẩm (Mã SP đầy đủ + hình ảnh + giá)
export interface DanhMucSP {
  id: number;
  maSPDayDu: string;      // Mã SP đầy đủ (Cột F)
  image: string;          // Hình ảnh (Cột G)
  wholesalePrice: number; // Giá sỉ (Cột H)
  retailPrice: number;    // Giá lẻ (Cột I)
}

/**
 * Đọc danh sách Mã SP đầy đủ từ Google Sheets (Danh mục SP)
 * Header ở dòng 5, dữ liệu từ dòng 6
 * Cột F: Mã SP đầy đủ, Cột G: Hình ảnh, Cột H: Giá sỉ, Cột I: Giá lẻ
 */
export async function getDanhMucSPFromSheet(): Promise<DanhMucSP[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc cột F đến I từ dòng 6 (header ở dòng 5)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDanhMucSP,
      range: `'${sheetNameDanhMucSP}'!F6:I`, // Đọc cột F đến I từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No danh muc SP data found in sheet.");
      return [];
    }

    const danhMucList: DanhMucSP[] = rows
      .map((row, index) => ({
        id: index + 1,
        maSPDayDu: row[0] || "",                                                    // Cột F - Mã SP đầy đủ
        image: row[1] || "",                                                        // Cột G - Hình ảnh
        wholesalePrice: parseFloat(String(row[2] || "0").replace(/[,.]/g, "")) || 0, // Cột H - Giá sỉ
        retailPrice: parseFloat(String(row[3] || "0").replace(/[,.]/g, "")) || 0,    // Cột I - Giá lẻ
      }))
      .filter((sp) => sp.maSPDayDu.trim() !== "");

    return danhMucList;
  } catch (error) {
    console.error("Error reading danh muc SP from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm sản phẩm mới vào Google Sheets
 */
export async function addSanPhamToSheet(sanPham: SanPham): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối (bắt đầu từ dòng 6)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanPham,
      range: `'${sheetNameSanPham}'!A6:U`,
    });

    const allRows = response.data.values || [];

    // Tìm dòng cuối có dữ liệu (bắt đầu từ dòng 6)
    let lastDataRow = 5; // Dòng 5 là header, data bắt đầu từ dòng 6
    if (allRows.length > 0) {
      for (let i = allRows.length - 1; i >= 0; i--) {
        if (allRows[i] && allRows[i][0] && allRows[i][0].toString().trim() !== "") {
          lastDataRow = 6 + i; // 6 là dòng đầu tiên có data
          break;
        }
      }
    }

    const nextRow = lastDataRow + 1;

    const values = [
      [
        sanPham.code,
        sanPham.name,
        sanPham.size,
        sanPham.mainFabric,
        sanPham.accentFabric,
        sanPham.otherMaterials,
        sanPham.productionOrder,
        sanPham.workshop,
        sanPham.mainFabricQuota,
        sanPham.accentFabricQuota1,
        sanPham.accentFabricQuota2,
        sanPham.materialsQuota1,
        sanPham.materialsQuota2,
        sanPham.accessoriesQuota,
        sanPham.otherQuota,
        sanPham.plannedQuantity,
        sanPham.cutQuantity,
        sanPham.warehouseQuantity,
        sanPham.developmentStage,
        sanPham.productionStage,
        sanPham.image,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanPham,
      range: `'${sheetNameSanPham}'!A${nextRow}:U${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added san pham: ${sanPham.code} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding san pham to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật sản phẩm trong Google Sheets
 */
export async function updateSanPhamInSheet(sanPham: SanPham): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowNumber = sanPham.id + 5; // ID 1 = dòng 6 (vì data bắt đầu từ dòng 6)

    const values = [
      [
        sanPham.code,
        sanPham.name,
        sanPham.size,
        sanPham.mainFabric,
        sanPham.accentFabric,
        sanPham.otherMaterials,
        sanPham.productionOrder,
        sanPham.workshop,
        sanPham.mainFabricQuota,
        sanPham.accentFabricQuota1,
        sanPham.accentFabricQuota2,
        sanPham.materialsQuota1,
        sanPham.materialsQuota2,
        sanPham.accessoriesQuota,
        sanPham.otherQuota,
        sanPham.plannedQuantity,
        sanPham.cutQuantity,
        sanPham.warehouseQuantity,
        sanPham.developmentStage,
        sanPham.productionStage,
        sanPham.image,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanPham,
      range: `'${sheetNameSanPham}'!A${rowNumber}:U${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated san pham ID: ${sanPham.id}`);
  } catch (error) {
    console.error("Error updating san pham in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa sản phẩm khỏi Google Sheets
 */
export async function deleteSanPhamFromSheet(sanPhamId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowNumber = sanPhamId + 5; // ID 1 = dòng 6 (vì data bắt đầu từ dòng 6)

    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdSanPham,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameSanPham
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      throw new Error(`Cannot find sheet named "${sheetNameSanPham}"`);
    }

    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdSanPham,
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

    console.log(`Successfully deleted san pham ID: ${sanPhamId}`);
  } catch (error) {
    console.error("Error deleting san pham from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// SAN PHAM CATALOG MANAGEMENT (Quản lý danh mục sản phẩm)
// ============================================

const spreadsheetIdSanPhamCatalog = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG || "1bIXymFQLB6BJgYDS5qJYQl0SRUu7TtL_4XzzO0LPSis";
const sheetNameSanPhamCatalog = process.env.GOOGLE_SHEET_NAME_DANH_MUC_SP_RIOMIO || "SanPham";

// Interface cho danh mục sản phẩm
// Sheet "SanPham": A=STT, B=Mã SP, C=Hình in, D=Size, E=Màu sắc, F=Mã SP đầy đủ (formula),
// G=Hình ảnh, H=Giá sỉ, I=Giá lẻ, J=Dòng size, K=Tồn kho
export interface SanPhamCatalog {
  id: number;
  code: string;              // B - Mã SP (RBT1151)
  printPattern: string;      // C - Hình in (676)
  size: string;              // D - Size (3/4)
  color: string;             // E - Màu sắc (Xanh ghi)
  name: string;              // F - Mã SP đầy đủ (RBT1151 676 3/4 Xanh ghi)
  image: string;             // G - Hình ảnh
  wholesalePrice: number;    // H - Giá sỉ
  retailPrice: number;       // I - Giá lẻ
  sizeChart: string;         // J - Dòng size (3/4-10/11)
  tonKho: number;            // K - Tồn kho
  // Legacy fields retained for backward compat with downstream consumers:
  costPrice: number;
  mainFabric: string;
  accentFabric: string;
  otherMaterials: string;
  mainFabricQuota: string;
  accentFabricQuota: string;
  materialsQuota: string;
  accessoriesQuota: string;
  otherQuota: string;
  plannedQuantity: number;
  cutQuantity: number;
  warehouseQuantity: number;
  finalStatus: string;
  nplSyncStatus: string;
  productionStatus: string;
  warehouseEntry: string;
}

// Helper to parse price from Vietnamese format
const parsePriceCatalog = (value: any): number => {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[,.\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Đọc danh mục sản phẩm từ Google Sheets
 */
export async function getSanPhamCatalogFromSheet(): Promise<SanPhamCatalog[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanPhamCatalog,
      range: `'${sheetNameSanPhamCatalog}'!B6:K`, // B → K, dòng data từ row 6 (header ở row 5)
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No san pham catalog data found in sheet.");
      return [];
    }

    const products: SanPhamCatalog[] = rows
      .map((row, index) => ({
        id: index + 1,
        code: (row[0] || "").toString().trim(),         // B - Mã SP
        printPattern: (row[1] || "").toString().trim(), // C - Hình in
        size: (row[2] || "").toString().trim(),         // D - Size
        color: (row[3] || "").toString().trim(),        // E - Màu sắc
        name: (row[4] || "").toString().trim(),         // F - Mã SP đầy đủ
        image: row[5] || "",                            // G - Hình ảnh
        wholesalePrice: parsePriceCatalog(row[6]),      // H - Giá sỉ
        retailPrice: parsePriceCatalog(row[7]),         // I - Giá lẻ
        sizeChart: row[8] || "",                        // J - Dòng size
        tonKho: parsePriceCatalog(row[9]),              // K - Tồn kho
        costPrice: 0,
        mainFabric: "",
        accentFabric: "",
        otherMaterials: "",
        mainFabricQuota: "",
        accentFabricQuota: "",
        materialsQuota: "",
        accessoriesQuota: "",
        otherQuota: "",
        plannedQuantity: 0,
        cutQuantity: 0,
        warehouseQuantity: 0,
        finalStatus: "",
        nplSyncStatus: "",
        productionStatus: "",
        warehouseEntry: "",
      }))
      .filter((p) => p.name !== "" || p.code !== "");

    return products;
  } catch (error) {
    console.error("Error reading san pham catalog from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm sản phẩm mới vào danh mục
 */
export async function addSanPhamCatalogToSheet(product: SanPhamCatalog): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối và đếm STT
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanPhamCatalog,
      range: `${sheetNameSanPhamCatalog}!A:W`,
    });

    const allRows = response.data.values || [];

    // Tìm dòng cuối có dữ liệu
    let lastDataRow = 1;
    for (let i = allRows.length - 1; i >= 1; i--) {
      if (allRows[i] && allRows[i][1] && allRows[i][1].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Đếm số sản phẩm để đánh STT
    const productRows = allRows.slice(1).filter(
      (row) => row && row[1] && row[1].toString().trim() !== ""
    );
    const sttNumber = productRows.length + 1;

    // Size dạng "5/6" sẽ bị USER_ENTERED parse thành ngày → prefix "'" để force text
    const sizeValue = product.size && product.size.includes("/")
      ? `'${product.size}`
      : product.size;
    // Dòng size dạng "6/7-10/11" cũng cần force text
    const sizeChartValue = product.sizeChart && product.sizeChart.includes("/")
      ? `'${product.sizeChart}`
      : product.sizeChart;

    // Bỏ qua cột F (Mã SP đầy đủ) vì là ARRAYFORMULA — ghi vào sẽ chặn formula
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetIdSanPhamCatalog,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: `${sheetNameSanPhamCatalog}!A${nextRow}:E${nextRow}`,
            values: [[
              sttNumber,            // A - STT
              product.code,         // B - Mã SP
              product.printPattern, // C - Hình in
              sizeValue,            // D - Size
              product.color,        // E - Màu sắc
            ]],
          },
          {
            range: `${sheetNameSanPhamCatalog}!G${nextRow}:K${nextRow}`,
            values: [[
              product.image,                                                          // G - Hình ảnh
              product.wholesalePrice > 0 ? formatNumberVN(product.wholesalePrice) : "", // H - Giá sỉ
              product.retailPrice > 0 ? formatNumberVN(product.retailPrice) : "",     // I - Giá lẻ
              sizeChartValue,                                                         // J - Dòng size
              product.tonKho ?? 0,                                                    // K - Tồn kho (luôn gửi, kể cả 0)
            ]],
          },
        ],
      },
    });

    console.log(`Successfully added san pham catalog: ${product.name} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding san pham catalog to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật sản phẩm trong danh mục
 */
export async function updateSanPhamCatalogInSheet(product: SanPhamCatalog): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Data đọc từ B6 (header row 5), id=1 → row 6 → rowNumber = id + 5
    const rowNumber = product.id + 5;

    // Cập nhật từng cột riêng để không ghi đè cột có công thức (C, D, F, K)
    const data = [
      {
        range: `${sheetNameSanPhamCatalog}!B${rowNumber}`,
        values: [[product.name]], // B - Mã SP
      },
      {
        range: `${sheetNameSanPhamCatalog}!E${rowNumber}`,
        values: [[product.color]], // E - Màu sắc
      },
      {
        range: `${sheetNameSanPhamCatalog}!G${rowNumber}:J${rowNumber}`,
        values: [[
          product.image,                                                          // G - Hình ảnh
          product.wholesalePrice > 0 ? formatNumberVN(product.wholesalePrice) : "", // H - Giá sỉ
          product.retailPrice > 0 ? formatNumberVN(product.retailPrice) : "",     // I - Giá lẻ
          product.sizeChart,                                                      // J - Dòng size
        ]],
      },
    ];

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetIdSanPhamCatalog,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data,
      },
    });

    console.log(`Successfully updated san pham catalog ID: ${product.id}`);
  } catch (error) {
    console.error("Error updating san pham catalog in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa sản phẩm khỏi danh mục
 */
export async function deleteSanPhamCatalogFromSheet(productId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Data đọc từ B6 (header row 5), id=1 → row 6 → rowNumber = id + 5
    const rowNumber = productId + 5;

    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdSanPhamCatalog,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameSanPhamCatalog
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      throw new Error(`Cannot find sheet named "${sheetNameSanPhamCatalog}"`);
    }

    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdSanPhamCatalog,
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

    console.log(`Successfully deleted san pham catalog ID: ${productId}`);
  } catch (error) {
    console.error("Error deleting san pham catalog from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// SHIPPING UNIT MANAGEMENT (Quản lý đơn vị vận chuyển)
// ============================================

// Sheet: Đối tác vận chuyển trong RIOMIO_DONG_TIEN
// Header row 5, data từ row 6
const spreadsheetIdVanChuyen = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_DONG_TIEN || spreadsheetId;
const sheetNameVanChuyen = process.env.GOOGLE_SHEET_NAME_VAN_CHUYEN || "Đối tác vận chuyển";

// Interface cho đơn vị vận chuyển
export interface ShippingUnit {
  id: number;
  name: string;       // Tên đơn vị vận chuyển
  phone: string;      // Số điện thoại (không có trong sheet mới, giữ lại để tương thích UI)
  address: string;    // Địa chỉ (không có trong sheet mới)
  contact: string;    // Người liên hệ (không có trong sheet mới)
  note: string;       // Ghi chú (không có trong sheet mới)
}

/**
 * Đọc danh sách đơn vị vận chuyển từ Google Sheets
 * Sheet: Đối tác vận chuyển - Header row 5, data từ row 6
 * Columns: A=STT, B=Đối tác vận chuyển, C=SDT, D=Địa chỉ, E=Liên hệ, F=Ghi chú
 */
export async function getShippingUnitsFromSheet(): Promise<ShippingUnit[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc từ row 6 (header ở row 5)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdVanChuyen,
      range: `'${sheetNameVanChuyen}'!A6:F`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No shipping unit data found in sheet.");
      return [];
    }

    const shippingUnits: ShippingUnit[] = rows
      .map((row, index) => ({
        id: index + 1,
        name: row[1] || "",      // Column B - Đối tác vận chuyển
        phone: row[2] || "",     // Column C - SDT
        address: row[3] || "",   // Column D - Địa chỉ
        contact: row[4] || "",   // Column E - Liên hệ
        note: row[5] || "",      // Column F - Ghi chú
      }))
      .filter((unit) => unit.name.trim() !== "");

    return shippingUnits;
  } catch (error) {
    console.error("Error reading shipping units from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm đơn vị vận chuyển mới vào Google Sheets
 * Sheet: Đối tác vận chuyển - Header row 5, data từ row 6
 * Columns: A=STT, B=Đối tác vận chuyển, C=SDT, D=Địa chỉ, E=Liên hệ, F=Ghi chú
 */
export async function addShippingUnitToSheet(shippingUnit: ShippingUnit): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc data từ row 6 để tìm dòng cuối và STT lớn nhất
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdVanChuyen,
      range: `'${sheetNameVanChuyen}'!A6:B`,
    });

    const rows = response.data.values || [];

    // Tìm STT lớn nhất và dòng cuối có data
    let maxSTT = 0;
    let lastRowWithData = 5; // Header ở row 5
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[1] && row[1].toString().trim() !== "") {
        lastRowWithData = 6 + i;
        const stt = parseInt(row[0]) || 0;
        if (stt > maxSTT) maxSTT = stt;
      }
    }

    const newRowNumber = lastRowWithData + 1;
    const newSTT = maxSTT + 1;

    // Ghi vào dòng tiếp theo bằng update (không dùng append/INSERT_ROWS)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdVanChuyen,
      range: `'${sheetNameVanChuyen}'!A${newRowNumber}:F${newRowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          newSTT,
          shippingUnit.name,
          shippingUnit.phone || "",
          shippingUnit.address || "",
          shippingUnit.contact || "",
          shippingUnit.note || "",
        ]],
      },
    });

    console.log("Added shipping unit:", shippingUnit.name, "at row:", newRowNumber);
  } catch (error) {
    console.error("Error adding shipping unit:", error);
    throw error;
  }
}

/**
 * Cập nhật đơn vị vận chuyển trong Google Sheets
 * Header row 5, data từ row 6. id=1 -> row 6
 * Chỉ update cột B-F (giữ nguyên STT ở cột A)
 */
export async function updateShippingUnitInSheet(shippingUnit: ShippingUnit): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // id=1 corresponds to row 6 (first data row after header at row 5)
    const rowNumber = shippingUnit.id + 5;

    // Update cột B-F (bỏ qua cột A - STT)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdVanChuyen,
      range: `'${sheetNameVanChuyen}'!B${rowNumber}:F${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          shippingUnit.name,
          shippingUnit.phone || "",
          shippingUnit.address || "",
          shippingUnit.contact || "",
          shippingUnit.note || "",
        ]],
      },
    });

    console.log(`Successfully updated shipping unit ID: ${shippingUnit.id}`);
  } catch (error) {
    console.error("Error updating shipping unit in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa đơn vị vận chuyển khỏi Google Sheets
 * Header row 5, data từ row 6. id=1 -> row 6
 */
export async function deleteShippingUnitFromSheet(unitId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // id=1 corresponds to row 6 (first data row)
    const rowNumber = unitId + 5;

    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdVanChuyen,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameVanChuyen
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      throw new Error(`Cannot find sheet named "${sheetNameVanChuyen}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdVanChuyen,
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

    console.log(`Successfully deleted shipping unit with ID: ${unitId}`);
  } catch (error) {
    console.error("Error deleting shipping unit from Google Sheets:", error);
    throw error;
  }
}

// ==================== TỒN KHO (INVENTORY) ====================

// Sử dụng env variable đúng: GOOGLE_SHEET_NAME_TON_KHO_SP_RIOMIO_SANPHAM
const spreadsheetIdTonKhoSanPham = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_KHO_HANG || "1Yqkk8sKkfKANFNwloyZr7lfR2sdLgYA9KAem_r9wII0";
const sheetNameTonKhoSanPham = process.env.GOOGLE_SHEET_NAME_TON_KHO_SP_RIOMIO_SANPHAM || "Tồn kho SP";

// Interface cho dữ liệu tồn kho
export interface TonKhoItem {
  id: number;
  maSp: string; // Mã SP (cột B)
  tonDau: number; // Tồn đầu (cột C)
  nhap: number; // Nhập (cột D)
  xuat: number; // Xuất (cột E)
  tonCuoi: number; // Tồn cuối (cột F)
}

/**
 * Đọc dữ liệu tồn kho từ Google Sheets "Tồn kho SP"
 * Cột A: STT, B: Mã SP, C: Tồn đầu, D: Nhập, E: Xuất, F: Tồn cuối
 * Dữ liệu bắt đầu từ dòng 6 (header ở dòng 5)
 */
export async function getTonKhoFromSheet(): Promise<TonKhoItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    console.log("getTonKhoFromSheet - spreadsheetId:", spreadsheetIdTonKhoSanPham);
    console.log("getTonKhoFromSheet - sheetName:", sheetNameTonKhoSanPham);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSanPham,
      range: `'${sheetNameTonKhoSanPham}'!A6:F`, // Dữ liệu bắt đầu từ dòng 6
    });

    const rows = response.data.values;

    console.log("getTonKhoFromSheet - rows count:", rows?.length || 0);
    console.log("getTonKhoFromSheet - first 3 rows:", rows?.slice(0, 3));

    if (!rows || rows.length === 0) {
      console.log("No inventory data found in sheet.");
      return [];
    }

    // Chuyển đổi dữ liệu từ sheet thành TonKhoItem objects
    const tonKhoItems: TonKhoItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        maSp: (row[1] || "").toString().trim(), // Cột B: Mã SP (trim whitespace)
        tonDau: parseFloat(String(row[2] || "0").replace(/[,.]/g, "")) || 0, // Cột C: Tồn đầu
        nhap: parseFloat(String(row[3] || "0").replace(/[,.]/g, "")) || 0, // Cột D: Nhập
        xuat: parseFloat(String(row[4] || "0").replace(/[,.]/g, "")) || 0, // Cột E: Xuất
        tonCuoi: parseFloat(String(row[5] || "0").replace(/[,.]/g, "")) || 0, // Cột F: Tồn cuối
      }))
      .filter((item) => item.maSp !== ""); // Lọc bỏ các dòng trống

    console.log("getTonKhoFromSheet - processed items:", tonKhoItems.length);
    console.log("getTonKhoFromSheet - first 3 items:", tonKhoItems.slice(0, 3));

    return tonKhoItems;
  } catch (error) {
    console.error("Error reading inventory from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật ô tháng/năm filter trong sheet Tồn kho SP
 * C3 = tháng/năm (format: M/YYYY)
 */
export async function updateTonKhoSPDateCell(thangNam: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Convert thangNam (YYYY-MM) to sheet format (M/YYYY)
    const [year, month] = thangNam.split("-");
    const monthNum = parseInt(month, 10); // Remove leading zero
    const sheetDate = `${monthNum}/${year}`;

    console.log("Updating Tồn kho SP C3 with:", sheetDate);

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdTonKhoSanPham,
      range: `'${sheetNameTonKhoSanPham}'!C3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[sheetDate]],
      },
    });

    console.log("Successfully updated Tồn kho SP date cell");
  } catch (error) {
    console.error("Error updating Tồn kho SP date cell:", error);
    throw error;
  }
}

// ==================== CÔNG NỢ PHẢI THU KHÁCH HÀNG ====================

const sheetNameCongNo = process.env.GOOGLE_SHEET_NAME_CNPT_KH || "CNPT KH";

// Interface cho dữ liệu công nợ từ Google Sheet
export interface CongNoItem {
  id: number;
  khachHang: string; // Khách hàng
  duDauKy: number; // Dư đầu kì
  phatSinh: number; // Phát sinh
  thanhToan: number; // Thanh toán
  duCuoiKy: number; // Dư cuối kì
}

/**
 * Đọc dữ liệu công nợ phải thu khách hàng từ Google Sheets
 * Header ở dòng 5, dữ liệu từ dòng 6
 * Cột A: STT, B: Khách hàng, C: Dư đầu kì, D: Phát sinh, E: Thanh toán, F: Dư cuối kì
 */
export async function getCongNoFromSheet(): Promise<CongNoItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdTonKhoSP, // Same spreadsheet as inventory
      range: `'${sheetNameCongNo}'!B6:F`, // Cột B-F (Khách hàng đến Dư cuối kì), bỏ qua STT ở cột A
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No debt data found in sheet.");
      return [];
    }

    // Chuyển đổi dữ liệu từ sheet thành CongNoItem objects
    const congNoItems: CongNoItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        khachHang: row[0] || "", // Cột B: Khách hàng
        duDauKy: parseFloat(String(row[1]).replace(/\./g, "").replace(",", ".")) || 0, // Cột C: Dư đầu kì
        phatSinh: parseFloat(String(row[2]).replace(/\./g, "").replace(",", ".")) || 0, // Cột D: Phát sinh
        thanhToan: parseFloat(String(row[3]).replace(/\./g, "").replace(",", ".")) || 0, // Cột E: Thanh toán
        duCuoiKy: parseFloat(String(row[4]).replace(/\./g, "").replace(",", ".")) || 0, // Cột F: Dư cuối kì
      }))
      .filter((item) => item.khachHang.trim() !== ""); // Lọc bỏ các dòng trống

    return congNoItems;
  } catch (error) {
    console.error("Error reading debt from Google Sheets:", error);
    throw error;
  }
}

// ==================== LƯƠNG NHÂN VIÊN (SALARY) ====================

const sheetNameLuong = process.env.GOOGLE_SHEET_NAME_LUONG || "Lương";

// Interface cho dữ liệu lương từ Google Sheet
export interface LuongItem {
  id: number;
  hoTen: string; // Họ và tên
  chucVu: string; // Chức vụ
  luongCoBan: number; // Lương cơ bản
  ngayCong: number; // Ngày công
  luongThucTe: number; // Lương thực tế
  phuCapAnTrua: number; // Phụ cấp ăn trưa
  phuCapTrachNhiem: number; // Phụ cấp trách nhiệm
  tongLuong: number; // Tổng lương
  bhxh: number; // BHXH (8%)
  bhyt: number; // BHYT (1.5%)
  thucNhan: number; // Thực nhận
}

/**
 * Đọc dữ liệu lương nhân viên từ Google Sheets
 * Cột A: STT, B: Họ và tên, C: Chức vụ, D: Lương cơ bản, E: Ngày công,
 * F: Lương thực tế, G: Phụ cấp ăn trưa, H: Phụ cấp trách nhiệm,
 * I: Tổng lương, J: BHXH, K: BHYT, L: Thực nhận
 */
export async function getLuongFromSheet(): Promise<LuongItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId, // Default spreadsheet
      range: `'${sheetNameLuong}'!A2:L`, // Header dòng 1, dữ liệu từ dòng 2
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No salary data found in sheet.");
      return [];
    }

    // Helper function để parse số từ string có format VN (dấu . ngăn cách hàng nghìn)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      return parseFloat(cleaned) || 0;
    };

    // Chuyển đổi dữ liệu từ sheet thành LuongItem objects
    const luongItems: LuongItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        hoTen: row[1] || "", // Cột B: Họ và tên
        chucVu: row[2] || "", // Cột C: Chức vụ
        luongCoBan: parseNumber(row[3]), // Cột D: Lương cơ bản
        ngayCong: parseNumber(row[4]), // Cột E: Ngày công
        luongThucTe: parseNumber(row[5]), // Cột F: Lương thực tế
        phuCapAnTrua: parseNumber(row[6]), // Cột G: Phụ cấp ăn trưa
        phuCapTrachNhiem: parseNumber(row[7]), // Cột H: Phụ cấp trách nhiệm
        tongLuong: parseNumber(row[8]), // Cột I: Tổng lương
        bhxh: parseNumber(row[9]), // Cột J: BHXH (8%)
        bhyt: parseNumber(row[10]), // Cột K: BHYT (1.5%)
        thucNhan: parseNumber(row[11]), // Cột L: Thực nhận
      }))
      .filter((item) => item.hoTen.trim() !== ""); // Lọc bỏ các dòng trống

    return luongItems;
  } catch (error) {
    console.error("Error reading salary from Google Sheets:", error);
    throw error;
  }
}

// ==================== BẢNG KÊ TIỀN LƯƠNG (SALARY STATEMENT) ====================

const sheetNameBangKeTienLuong = process.env.GOOGLE_SHEET_NAME_BANG_KE_TIEN_LUONG || "Bảng kê tiền lương";
const spreadsheetIdRiomioLuong = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_LUONG || "";

// Interface cho dữ liệu Bảng kê tiền lương từ Google Sheet
export interface BangKeTienLuongItem {
  id: number;
  ngayBatDau: string; // A: Ngày bắt đầu
  ngayKetThuc: string; // B: Ngày kết thúc
  maPhieu: string; // C: Mã phiếu
  hoVaTen: string; // D: Họ và tên
  chucVu: string; // E: Chức vụ
  boPhan: string; // F: Bộ phận
  mucLuongCoBan: number; // G: Mức lương cơ bản
  thuongChuyenCan: number; // H: Thưởng chuyên cần
  quyLuong: number; // I: Quỹ lương
  phuCapAnTruaNgay: number; // J: Phụ cấp ăn trưa/ngày
  congThucTe: number; // K: Công thực tế
  diMuon: number; // L: Đi muộn
  lamThemGio: number; // M: Làm thêm giờ
  luongThucTe: number; // N: Lương thực tế
  truDiMuon: number; // O: Trừ đi muộn
  luongThemGio: number; // P: Lương thêm giờ
  phuCapAnTruaThang: number; // Q: Phụ cấp ăn trưa/tháng
  phuCapXangXeThang: number; // R: Phụ cấp xăng xe/tháng
  phuCapDienThoaiThang: number; // S: Phụ cấp điện thoại/tháng
  phuCapDocHaiNangNhocThang: number; // T: Phụ cấp độc hại, nặng nhọc/tháng
  phuCapTrangPhucThang: number; // U: Phụ cấp trang phục/tháng
  phuCapNhaOThang: number; // V: Phụ cấp nhà ở/tháng
  giuTreVaNuoiCon: number; // W: Giữ trẻ và nuôi con
  phuCapKhac: number; // X: Phụ cấp khác
  tongPhuCap: number; // Y: Tổng phụ cấp
  kpiSXVP: number; // Z: KPI SX, VP
  kpiSale: number; // AA: KPI Sale
  thuongSangKien: number; // AB: Thưởng sáng kiến
  congKhac: number; // AC: Cộng khác
  truBHYTBHXHBHTN: number; // AD: Trừ BHYT, BHXH, BHTN (NLĐ đóng 10,5%)
  truTNCN: number; // AE: Trừ TNCN
  truCongDoan: number; // AF: Trừ công đoàn
  truKhac: number; // AG: Trừ khác
  thucLinh: number; // AH: Thực lĩnh
  ghiChu: string; // AI: Ghi chú
}

/**
 * Đọc dữ liệu Bảng kê tiền lương từ Google Sheets
 * Sheet: "Bảng kê tiền lương" trong spreadsheet GOOGLE_SPREADSHEET_ID_RIOMIO_LUONG
 */
export async function getBangKeTienLuongFromSheet(): Promise<BangKeTienLuongItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdRiomioLuong,
      range: `'${sheetNameBangKeTienLuong}'!A6:AI`, // Header từ dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No data found in Bảng kê tiền lương sheet.");
      return [];
    }

    // Helper function để parse số từ string có format VN (dấu . ngăn cách hàng nghìn)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, "");
      return parseFloat(cleaned) || 0;
    };

    // Chuyển đổi dữ liệu từ sheet thành BangKeTienLuongItem objects
    const bangKeTienLuongItems: BangKeTienLuongItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngayBatDau: row[0] || "", // A: Ngày bắt đầu
        ngayKetThuc: row[1] || "", // B: Ngày kết thúc
        maPhieu: row[2] || "", // C: Mã phiếu
        hoVaTen: row[3] || "", // D: Họ và tên
        chucVu: row[4] || "", // E: Chức vụ
        boPhan: row[5] || "", // F: Bộ phận
        mucLuongCoBan: parseNumber(row[6]), // G: Mức lương cơ bản
        thuongChuyenCan: parseNumber(row[7]), // H: Thưởng chuyên cần
        quyLuong: parseNumber(row[8]), // I: Quỹ lương
        phuCapAnTruaNgay: parseNumber(row[9]), // J: Phụ cấp ăn trưa/ngày
        congThucTe: parseNumber(row[10]), // K: Công thực tế
        diMuon: parseNumber(row[11]), // L: Đi muộn
        lamThemGio: parseNumber(row[12]), // M: Làm thêm giờ
        luongThucTe: parseNumber(row[13]), // N: Lương thực tế
        truDiMuon: parseNumber(row[14]), // O: Trừ đi muộn
        luongThemGio: parseNumber(row[15]), // P: Lương thêm giờ
        phuCapAnTruaThang: parseNumber(row[16]), // Q: Phụ cấp ăn trưa/tháng
        phuCapXangXeThang: parseNumber(row[17]), // R: Phụ cấp xăng xe/tháng
        phuCapDienThoaiThang: parseNumber(row[18]), // S: Phụ cấp điện thoại/tháng
        phuCapDocHaiNangNhocThang: parseNumber(row[19]), // T: Phụ cấp độc hại, nặng nhọc/tháng
        phuCapTrangPhucThang: parseNumber(row[20]), // U: Phụ cấp trang phục/tháng
        phuCapNhaOThang: parseNumber(row[21]), // V: Phụ cấp nhà ở/tháng
        giuTreVaNuoiCon: parseNumber(row[22]), // W: Giữ trẻ và nuôi con
        phuCapKhac: parseNumber(row[23]), // X: Phụ cấp khác
        tongPhuCap: parseNumber(row[24]), // Y: Tổng phụ cấp
        kpiSXVP: parseNumber(row[25]), // Z: KPI SX, VP
        kpiSale: parseNumber(row[26]), // AA: KPI Sale
        thuongSangKien: parseNumber(row[27]), // AB: Thưởng sáng kiến
        congKhac: parseNumber(row[28]), // AC: Cộng khác
        truBHYTBHXHBHTN: parseNumber(row[29]), // AD: Trừ BHYT, BHXH, BHTN
        truTNCN: parseNumber(row[30]), // AE: Trừ TNCN
        truCongDoan: parseNumber(row[31]), // AF: Trừ công đoàn
        truKhac: parseNumber(row[32]), // AG: Trừ khác
        thucLinh: parseNumber(row[33]), // AH: Thực lĩnh
        ghiChu: row[34] || "", // AI: Ghi chú
      }))
      .filter((item) => item.hoVaTen.trim() !== ""); // Lọc bỏ các dòng trống

    return bangKeTienLuongItems;
  } catch (error) {
    console.error("Error reading Bảng kê tiền lương from Google Sheets:", error);
    throw error;
  }
}

// ==================== PHIẾU TÍNH LƯƠNG HÀNG THÁNG (MONTHLY SALARY SLIP) ====================

const sheetNamePhieuTinhLuongHangThang = process.env.GOOGLE_SHEET_NAME_PHIEU_TINH_LUONG_HANG_THANG || "Phiếu tính lương hàng tháng";

/**
 * Đọc dữ liệu Phiếu tính lương hàng tháng từ Google Sheets
 * Sheet: "Phiếu tính lương hàng tháng" trong spreadsheet GOOGLE_SPREADSHEET_ID_RIOMIO_LUONG
 * Mã phiếu ở cell B5, data từ row 9
 * Columns: A(STT), B(Họ và tên), C(Chức vụ), D(Bộ phận), E(Mức lương cơ bản), ... AG(Ghi chú)
 */
export async function getPhieuTinhLuongHangThangFromSheet(): Promise<BangKeTienLuongItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc mã phiếu từ cell B5
    const maPhieuResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdRiomioLuong,
      range: `'${sheetNamePhieuTinhLuongHangThang}'!B5`,
    });
    const maPhieu = maPhieuResponse.data.values?.[0]?.[0] || "";

    // Đọc data từ row 9
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdRiomioLuong,
      range: `'${sheetNamePhieuTinhLuongHangThang}'!A9:AG`, // Data từ dòng 9, A(STT) đến AG(Ghi chú)
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No data found in Phiếu tính lương hàng tháng sheet.");
      return [];
    }

    // Helper function để parse số từ string có format VN (dấu . ngăn cách hàng nghìn)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, "");
      return parseFloat(cleaned) || 0;
    };

    // Chuyển đổi dữ liệu từ sheet thành BangKeTienLuongItem objects
    // Mapping: A(0)=STT(skip), B(1)=Họ và tên, C(2)=Chức vụ, D(3)=Bộ phận, E(4)=Mức lương cơ bản, ...
    const phieuTinhLuongItems: BangKeTienLuongItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngayBatDau: "", // Không có trong sheet này
        ngayKetThuc: "", // Không có trong sheet này
        maPhieu: maPhieu, // Lấy từ cell B5
        hoVaTen: row[1] || "", // B: Họ và tên
        chucVu: row[2] || "", // C: Chức vụ
        boPhan: row[3] || "", // D: Bộ phận
        mucLuongCoBan: parseNumber(row[4]), // E: Mức lương cơ bản
        thuongChuyenCan: parseNumber(row[5]), // F: Thưởng chuyên cần
        quyLuong: parseNumber(row[6]), // G: Quỹ lương
        phuCapAnTruaNgay: parseNumber(row[7]), // H: Phụ cấp ăn trưa/ngày
        congThucTe: parseNumber(row[8]), // I: Công thực tế
        diMuon: parseNumber(row[9]), // J: Đi muộn
        lamThemGio: parseNumber(row[10]), // K: Làm thêm giờ
        luongThucTe: parseNumber(row[11]), // L: Lương thực tế
        truDiMuon: parseNumber(row[12]), // M: Trừ đi muộn
        luongThemGio: parseNumber(row[13]), // N: Lương thêm giờ
        phuCapAnTruaThang: parseNumber(row[14]), // O: Phụ cấp ăn trưa/tháng
        phuCapXangXeThang: parseNumber(row[15]), // P: Phụ cấp xăng xe/tháng
        phuCapDienThoaiThang: parseNumber(row[16]), // Q: Phụ cấp điện thoại/tháng
        phuCapDocHaiNangNhocThang: parseNumber(row[17]), // R: Phụ cấp độc hại, nặng nhọc/tháng
        phuCapTrangPhucThang: parseNumber(row[18]), // S: Phụ cấp trang phục/tháng
        phuCapNhaOThang: parseNumber(row[19]), // T: Phụ cấp nhà ở/tháng
        giuTreVaNuoiCon: parseNumber(row[20]), // U: Giữ trẻ và nuôi con
        phuCapKhac: parseNumber(row[21]), // V: Phụ cấp khác
        tongPhuCap: parseNumber(row[22]), // W: Tổng phụ cấp
        kpiSXVP: parseNumber(row[23]), // X: KPI SX, VP
        kpiSale: parseNumber(row[24]), // Y: KPI Sale
        thuongSangKien: parseNumber(row[25]), // Z: Thưởng sáng kiến
        congKhac: parseNumber(row[26]), // AA: Cộng khác
        truBHYTBHXHBHTN: parseNumber(row[27]), // AB: Trừ BHYT, BHXH, BHTN
        truTNCN: parseNumber(row[28]), // AC: Trừ TNCN
        truCongDoan: parseNumber(row[29]), // AD: Trừ công đoàn
        truKhac: parseNumber(row[30]), // AE: Trừ khác
        thucLinh: parseNumber(row[31]), // AF: Thực lĩnh
        ghiChu: row[32] || "", // AG: Ghi chú
      }))
      .filter((item) => item.hoVaTen.trim() !== ""); // Lọc bỏ các dòng trống

    return phieuTinhLuongItems;
  } catch (error) {
    console.error("Error reading Phiếu tính lương hàng tháng from Google Sheets:", error);
    throw error;
  }
}

// ==================== CHẤM CÔNG (ATTENDANCE) ====================

// Interface cho dữ liệu chấm công - theo cấu trúc sheet "Bảng chấm công"
// Header ở dòng 5, data từ dòng 6
// A: Ngày bắt đầu, B: Ngày kết thúc, C: Mã phiếu, D: Nhân viên
// E-AI: Ngày 1-31 (index 4-34), AJ: Công tháng (35), AK: Phép tháng (36)
// AL: Phép sử dụng (37), AM: Phép tồn (38), AN: Nghỉ lễ tính công (39), AO: Tổng công (40)
export interface ChamCongItem {
  id: number;
  ngayBatDau: string;    // A: Ngày bắt đầu (DD/MM/YYYY)
  ngayKetThuc: string;   // B: Ngày kết thúc
  maPhieu: string;       // C: Mã phiếu
  nhanVien: string;      // D: Nhân viên
  days: (number | string)[]; // E-AI: Array 31 phần tử cho 31 ngày, giá trị: 1, 0.5, NP, NL, "", etc.
  congThang: number;     // AJ: Công tháng (index 35)
  phepThang: number;     // AK: Phép tháng (index 36)
  phepSuDung: number;    // AL: Phép sử dụng (index 37)
  phepTon: number;       // AM: Phép tồn (index 38)
  nghiLeTinhCong: number; // AN: Nghỉ lễ tính công (index 39)
  tongCong: number;      // AO: Tổng công (index 40)
  thang: number;         // Computed from ngayBatDau
  nam: number;           // Computed from ngayBatDau
}

// Trạng thái chấm công
export type AttendanceStatus = "1" | "0.5" | "NP" | "NL" | "";

/**
 * Đọc dữ liệu chấm công từ Google Sheets theo tháng/năm
 * Sheet: "Bảng chấm công" trong spreadsheet RIOMIO_LUONG
 * Header ở dòng 5, data từ dòng 6
 * Cấu trúc cột:
 * A: Ngày bắt đầu (0), B: Ngày kết thúc (1), C: Mã phiếu (2), D: Nhân viên (3)
 * E-AI: Ngày 1-31 (index 4-34)
 * AJ: Công tháng (35), AK: Phép tháng (36), AL: Phép sử dụng (37)
 * AM: Phép tồn (38), AN: Nghỉ lễ tính công (39), AO: Tổng công (40)
 */
export async function getChamCongFromSheet(
  thang: number,
  nam: number
): Promise<ChamCongItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc data từ row 6 (A6:AP) - bỏ qua row 5 là header
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangChamCong}'!A6:AP500`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No attendance data found in sheet.");
      return [];
    }

    // Parse date from DD/MM/YYYY format
    const parseDate = (dateStr: string): { month: number; year: number } => {
      if (!dateStr) return { month: 0, year: 0 };
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return { month: parseInt(parts[1]) || 0, year: parseInt(parts[2]) || 0 };
      }
      return { month: 0, year: 0 };
    };

    // Parse number với định dạng châu Âu (dấu phẩy thay dấu chấm)
    const parseNumber = (val: string | undefined): number => {
      if (!val) return 0;
      // Thay dấu phẩy bằng dấu chấm để parse được số thập phân
      const normalized = val.toString().replace(",", ".");
      return parseFloat(normalized) || 0;
    };

    // Lọc theo tháng và năm (dựa vào cột A - Ngày bắt đầu)
    const chamCongItems: ChamCongItem[] = rows
      .map((row, index) => {
        const ngayBatDau = row[0] || "";
        const { month, year } = parseDate(ngayBatDau);

        return {
          id: index + 6, // Row number in sheet (starting from row 6)
          ngayBatDau: ngayBatDau,
          ngayKetThuc: row[1] || "",
          maPhieu: row[2] || "",
          nhanVien: row[3] || "",
          // Cột E-AI (index 4-34) = Ngày 1-31
          days: Array.from({ length: 31 }, (_, i) => {
            const val = row[4 + i]; // Bắt đầu từ index 4 (cột E = ngày 1)
            if (val === undefined || val === "") return "";
            // Handle NP, NL or numeric values
            if (typeof val === "string" && (val === "NP" || val === "NL" || val.match(/^[A-Za-z]+$/))) {
              return val;
            }
            const normalized = val.toString().replace(",", ".");
            const num = parseFloat(normalized);
            return isNaN(num) ? val : num;
          }),
          congThang: parseNumber(row[35]),   // AJ: Công tháng (index 35)
          phepThang: parseNumber(row[36]),   // AK: Phép tháng (index 36)
          phepSuDung: parseNumber(row[37]),  // AL: Phép sử dụng (index 37)
          phepTon: parseNumber(row[38]),     // AM: Phép tồn (index 38)
          nghiLeTinhCong: parseNumber(row[39]), // AN: Nghỉ lễ tính công (index 39)
          tongCong: parseNumber(row[40]),    // AO: Tổng công (index 40)
          thang: month,
          nam: year,
        };
      })
      .filter((item) => {
        // Lọc những dòng có tên nhân viên và khớp tháng/năm
        return item.nhanVien.trim() !== "" && item.thang === thang && item.nam === nam;
      });

    return chamCongItems;
  } catch (error) {
    console.error("Error reading attendance from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật một ô chấm công trong Google Sheets
 * @param rowNumber Số dòng trong sheet (row 6 = nhân viên đầu tiên)
 * @param dayIndex Ngày trong tháng (0-30 cho ngày 1-31)
 * @param value Giá trị mới (1, 0.5, NP, "")
 */
export async function updateChamCongCell(
  rowNumber: number,
  dayIndex: number,
  value: number | string
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Ngày 1-31 ở cột E-AI (index 4-34)
    // Ngày 1 = cột E (index 4), ngày 2 = cột F (index 5), ...
    const columnIndex = 4 + dayIndex; // 0-based, E=4

    // Tính column letter (A=0 -> 'A', Z=25 -> 'Z', AA=26, etc.)
    let columnLetter: string;
    if (columnIndex < 26) {
      columnLetter = String.fromCharCode(65 + columnIndex); // A-Z
    } else {
      // AA, AB, AC... (index 26 = AA)
      columnLetter = 'A' + String.fromCharCode(65 + (columnIndex - 26));
    }

    const range = `'${sheetNameBangChamCong}'!${columnLetter}${rowNumber}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[value === "" ? "" : value]],
      },
    });

    console.log(`Updated attendance at ${range} to ${value}`);
  } catch (error) {
    console.error("Error updating attendance cell:", error);
    throw error;
  }
}

/**
 * Lưu dữ liệu chấm công vào Google Sheets
 * Sheet: "Bảng chấm công" trong spreadsheet RIOMIO_LUONG
 * Chức năng này hiện tại chưa được sử dụng - chỉ đọc dữ liệu từ sheet
 */
export async function saveChamCongToSheet(
  data: ChamCongItem[]
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();
    const thang = data[0]?.thang;
    const nam = data[0]?.nam;

    // Chuyển data thành rows để ghi vào sheet
    // Cột A-D: Ngày bắt đầu, Ngày kết thúc, Mã phiếu, Nhân viên
    // Cột E-AI: Ngày 1-31
    // Cột AJ-AO: Công tháng, Phép tháng, Phép sử dụng, Phép tồn, Nghỉ lễ tính công, Tổng công
    const newRows = data.map((item) => [
      item.ngayBatDau,
      item.ngayKetThuc,
      item.maPhieu,
      item.nhanVien,
      ...item.days,
      // Summary columns
      item.congThang || 0,
      item.phepThang || 0,
      item.phepSuDung || 0,
      item.phepTon || 0,
      item.nghiLeTinhCong || 0,
      item.tongCong || 0,
    ]);

    // Tìm dòng cuối cùng có dữ liệu
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangChamCong}'!A6:A500`,
    });

    const existingRows = existingResponse.data.values || [];
    const nextRow = 6 + existingRows.length;

    // Ghi dữ liệu mới vào dòng tiếp theo
    if (newRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdNhanVienLuong,
        range: `'${sheetNameBangChamCong}'!A${nextRow}:AP`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: newRows,
        },
      });
    }

    return {
      success: true,
      message: `Đã lưu chấm công tháng ${thang}/${nam} thành công!`,
    };
  } catch (error) {
    console.error("Error saving attendance to Google Sheets:", error);
    throw error;
  }
}

// ============================================
// CHẤM CÔNG ĐI MUỘN (Late Attendance)
// ============================================

export interface DiMuonItem {
  id: number;
  ngayBatDau: string;    // A: Ngày bắt đầu (DD/MM/YYYY)
  ngayKetThuc: string;   // B: Ngày kết thúc
  maPhieu: string;       // C: Mã phiếu
  nhanVien: string;      // D: Nhân viên
  days: (number | string)[]; // E-AI: Array 31 phần tử cho 31 ngày, giá trị: số phút đi muộn
  diMuonPhut: number;    // AJ: Đi muộn (phút)
  diMuonNgay: number;    // AK: Đi muộn (ngày)
  thang: number;
  nam: number;
}

/**
 * Lấy dữ liệu chấm công đi muộn theo tháng/năm
 */
export async function getDiMuonFromSheet(thang: number, nam: number): Promise<DiMuonItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangChamCongDiMuon}'!A6:AK500`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No late attendance data found in sheet.");
      return [];
    }

    const diMuonData: DiMuonItem[] = [];

    rows.forEach((row, index) => {
      const ngayBatDau = row[0] || "";

      if (!ngayBatDau) return;

      // Parse date to get month/year
      const dateParts = ngayBatDau.split("/");
      if (dateParts.length >= 3) {
        const rowThang = parseInt(dateParts[1]);
        const rowNam = parseInt(dateParts[2]);

        if (rowThang === thang && rowNam === nam) {
          // Days are in columns E-AI (index 4-34)
          const days: (number | string)[] = [];
          for (let i = 0; i < 31; i++) {
            const cellValue = row[4 + i];
            if (cellValue === undefined || cellValue === "") {
              days.push("");
            } else {
              const numValue = parseVietnameseNumber(cellValue);
              days.push(numValue === 0 && String(cellValue).trim() !== "0" ? cellValue : numValue);
            }
          }

          diMuonData.push({
            id: index + 6,
            ngayBatDau,
            ngayKetThuc: row[1] || "",
            maPhieu: row[2] || "",
            nhanVien: row[3] || "",
            days,
            diMuonPhut: parseVietnameseNumber(row[35]),
            diMuonNgay: parseVietnameseNumber(row[36]),
            thang,
            nam,
          });
        }
      }
    });

    return diMuonData;
  } catch (error) {
    console.error("Error reading late attendance from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật một ô chấm công đi muộn
 */
export async function updateDiMuonCell(
  rowNumber: number,
  dayIndex: number,
  value: number | string
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Days start at column E (index 4)
    const columnIndex = 4 + dayIndex;
    const columnLetter = String.fromCharCode(65 + Math.floor(columnIndex / 26) - (columnIndex >= 26 ? 1 : 0)) +
      (columnIndex >= 26 ? String.fromCharCode(65 + (columnIndex % 26)) : String.fromCharCode(65 + columnIndex));

    const range = `'${sheetNameBangChamCongDiMuon}'!${columnLetter}${rowNumber}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[value === "" ? "" : value]],
      },
    });
  } catch (error) {
    console.error("Error updating late attendance cell:", error);
    throw error;
  }
}

/**
 * Lưu dữ liệu chấm công đi muộn
 */
export async function saveDiMuonToSheet(
  data: DiMuonItem[]
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();
    const thang = data[0]?.thang;
    const nam = data[0]?.nam;

    // Columns: A-D (dates, code, employee), E-AI (31 days), AJ-AK (summary)
    const newRows = data.map((item) => [
      item.ngayBatDau,
      item.ngayKetThuc,
      item.maPhieu,
      item.nhanVien,
      ...item.days,
      item.diMuonPhut || 0,
      item.diMuonNgay || 0,
    ]);

    // Find the last row with data
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangChamCongDiMuon}'!A6:A500`,
    });

    const existingRows = existingResponse.data.values || [];
    const nextRow = 6 + existingRows.length;

    if (newRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdNhanVienLuong,
        range: `'${sheetNameBangChamCongDiMuon}'!A${nextRow}:AK`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: newRows,
        },
      });
    }

    return {
      success: true,
      message: `Đã lưu chấm công đi muộn tháng ${thang}/${nam} thành công!`,
    };
  } catch (error) {
    console.error("Error saving late attendance to Google Sheets:", error);
    throw error;
  }
}

// ============================================
// CHẤM CÔNG THÊM GIỜ (Overtime Attendance)
// ============================================

export interface ThemGioItem {
  id: number;
  ngayBatDau: string;    // A: Ngày bắt đầu (DD/MM/YYYY)
  ngayKetThuc: string;   // B: Ngày kết thúc
  maPhieu: string;       // C: Mã phiếu
  nhanVien: string;      // D: Nhân viên
  days: (number | string)[]; // E-AI: Array 31 phần tử cho 31 ngày, giá trị: số phút thêm giờ
  themGioPhut: number;   // AJ: Thêm giờ (phút)
  themGioNgay: number;   // AK: Thêm giờ (ngày)
  thang: number;
  nam: number;
}

/**
 * Lấy dữ liệu chấm công thêm giờ theo tháng/năm
 */
export async function getThemGioFromSheet(thang: number, nam: number): Promise<ThemGioItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangChamCongThemGio}'!A6:AK500`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No overtime attendance data found in sheet.");
      return [];
    }

    const themGioData: ThemGioItem[] = [];

    rows.forEach((row, index) => {
      const ngayBatDau = row[0] || "";

      if (!ngayBatDau) return;

      // Parse date to get month/year
      const dateParts = ngayBatDau.split("/");
      if (dateParts.length >= 3) {
        const rowThang = parseInt(dateParts[1]);
        const rowNam = parseInt(dateParts[2]);

        if (rowThang === thang && rowNam === nam) {
          // Days are in columns E-AI (index 4-34)
          const days: (number | string)[] = [];
          for (let i = 0; i < 31; i++) {
            const cellValue = row[4 + i];
            if (cellValue === undefined || cellValue === "") {
              days.push("");
            } else {
              const numValue = parseVietnameseNumber(cellValue);
              days.push(numValue === 0 && String(cellValue).trim() !== "0" ? cellValue : numValue);
            }
          }

          themGioData.push({
            id: index + 6,
            ngayBatDau,
            ngayKetThuc: row[1] || "",
            maPhieu: row[2] || "",
            nhanVien: row[3] || "",
            days,
            themGioPhut: parseVietnameseNumber(row[35]),
            themGioNgay: parseVietnameseNumber(row[36]),
            thang,
            nam,
          });
        }
      }
    });

    return themGioData;
  } catch (error) {
    console.error("Error reading overtime attendance from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật một ô chấm công thêm giờ
 */
export async function updateThemGioCell(
  rowNumber: number,
  dayIndex: number,
  value: number | string
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Days start at column E (index 4)
    const columnIndex = 4 + dayIndex;
    const columnLetter = String.fromCharCode(65 + Math.floor(columnIndex / 26) - (columnIndex >= 26 ? 1 : 0)) +
      (columnIndex >= 26 ? String.fromCharCode(65 + (columnIndex % 26)) : String.fromCharCode(65 + columnIndex));

    const range = `'${sheetNameBangChamCongThemGio}'!${columnLetter}${rowNumber}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[value === "" ? "" : value]],
      },
    });
  } catch (error) {
    console.error("Error updating overtime attendance cell:", error);
    throw error;
  }
}

/**
 * Lưu dữ liệu chấm công thêm giờ
 */
export async function saveThemGioToSheet(
  data: ThemGioItem[]
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();
    const thang = data[0]?.thang;
    const nam = data[0]?.nam;

    // Columns: A-D (dates, code, employee), E-AI (31 days), AJ-AK (summary)
    const newRows = data.map((item) => [
      item.ngayBatDau,
      item.ngayKetThuc,
      item.maPhieu,
      item.nhanVien,
      ...item.days,
      item.themGioPhut || 0,
      item.themGioNgay || 0,
    ]);

    // Find the last row with data
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangChamCongThemGio}'!A6:A500`,
    });

    const existingRows = existingResponse.data.values || [];
    const nextRow = 6 + existingRows.length;

    if (newRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdNhanVienLuong,
        range: `'${sheetNameBangChamCongThemGio}'!A${nextRow}:AK`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: newRows,
        },
      });
    }

    return {
      success: true,
      message: `Đã lưu chấm công thêm giờ tháng ${thang}/${nam} thành công!`,
    };
  } catch (error) {
    console.error("Error saving overtime attendance to Google Sheets:", error);
    throw error;
  }
}

/**
 * Xoá phiếu đi muộn theo rowNumber
 */
export async function deleteDiMuonRow(rowNumber: number): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get spreadsheet info to find the sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameBangChamCongDiMuon
    );

    if (!sheet || !sheet.properties?.sheetId) {
      throw new Error("Không tìm thấy sheet Bảng chấm đi muộn");
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    return {
      success: true,
      message: `Đã xoá phiếu đi muộn thành công!`,
    };
  } catch (error) {
    console.error("Error deleting late attendance row:", error);
    throw error;
  }
}

/**
 * Cập nhật toàn bộ row phiếu đi muộn
 */
export async function updateDiMuonRow(
  rowNumber: number,
  data: DiMuonItem
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowValues = [
      data.ngayBatDau,
      data.ngayKetThuc,
      data.maPhieu,
      data.nhanVien,
      ...data.days,
      data.diMuonPhut || 0,
      data.diMuonNgay || 0,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangChamCongDiMuon}'!A${rowNumber}:AK${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });

    return {
      success: true,
      message: `Đã cập nhật phiếu đi muộn thành công!`,
    };
  } catch (error) {
    console.error("Error updating late attendance row:", error);
    throw error;
  }
}

/**
 * Xoá phiếu thêm giờ theo rowNumber
 */
export async function deleteThemGioRow(rowNumber: number): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get spreadsheet info to find the sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameBangChamCongThemGio
    );

    if (!sheet || !sheet.properties?.sheetId) {
      throw new Error("Không tìm thấy sheet Bảng chấm thêm giờ");
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    return {
      success: true,
      message: `Đã xoá phiếu thêm giờ thành công!`,
    };
  } catch (error) {
    console.error("Error deleting overtime attendance row:", error);
    throw error;
  }
}

/**
 * Cập nhật toàn bộ row phiếu thêm giờ
 */
export async function updateThemGioRow(
  rowNumber: number,
  data: ThemGioItem
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowValues = [
      data.ngayBatDau,
      data.ngayKetThuc,
      data.maPhieu,
      data.nhanVien,
      ...data.days,
      data.themGioPhut || 0,
      data.themGioNgay || 0,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangChamCongThemGio}'!A${rowNumber}:AK${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });

    return {
      success: true,
      message: `Đã cập nhật phiếu thêm giờ thành công!`,
    };
  } catch (error) {
    console.error("Error updating overtime attendance row:", error);
    throw error;
  }
}

// ============================================
// NGHỈ PHÉP (Leave Management)
// ============================================

export interface NghiPhepItem {
  id: number;
  ngayBatDau: string;    // A: Ngày bắt đầu (DD/MM/YYYY)
  ngayKetThuc: string;   // B: Ngày kết thúc
  maPhieu: string;       // C: Mã phiếu
  nhanVien: string;      // D: Nhân viên
  phepThang: number;     // E: Phép tháng
  suDung: number;        // F: Sử dụng
  tonPhep: number;       // G: Tồn phép
  thang: number;
  nam: number;
}

/**
 * Lấy dữ liệu nghỉ phép theo tháng/năm
 */
export async function getNghiPhepFromSheet(thang: number, nam: number): Promise<NghiPhepItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangNghiPhep}'!A6:G500`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No leave data found in sheet.");
      return [];
    }

    const nghiPhepData: NghiPhepItem[] = [];

    rows.forEach((row, index) => {
      const ngayBatDau = row[0] || "";

      if (!ngayBatDau) return;

      // Parse date to get month/year
      const dateParts = ngayBatDau.split("/");
      if (dateParts.length >= 3) {
        const rowThang = parseInt(dateParts[1]);
        const rowNam = parseInt(dateParts[2]);

        if (rowThang === thang && rowNam === nam) {
          const parseNumber = (val: string | undefined): number => {
            if (!val) return 0;
            const num = parseFloat(String(val).replace(",", "."));
            return isNaN(num) ? 0 : num;
          };

          nghiPhepData.push({
            id: index + 6,
            ngayBatDau,
            ngayKetThuc: row[1] || "",
            maPhieu: row[2] || "",
            nhanVien: row[3] || "",
            phepThang: parseNumber(row[4]),
            suDung: parseNumber(row[5]),
            tonPhep: parseNumber(row[6]),
            thang,
            nam,
          });
        }
      }
    });

    return nghiPhepData;
  } catch (error) {
    console.error("Error reading leave data from Google Sheets:", error);
    throw error;
  }
}

/**
 * Lưu dữ liệu nghỉ phép
 */
export async function saveNghiPhepToSheet(
  data: NghiPhepItem[]
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();
    const thang = data[0]?.thang;
    const nam = data[0]?.nam;

    // Columns: A-D (dates, code, employee), E-G (summary)
    const newRows = data.map((item) => [
      item.ngayBatDau,
      item.ngayKetThuc,
      item.maPhieu,
      item.nhanVien,
      item.phepThang || 0,
      item.suDung || 0,
      item.tonPhep || 0,
    ]);

    // Find the last row with data
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangNghiPhep}'!A6:A500`,
    });

    const existingRows = existingResponse.data.values || [];
    const nextRow = 6 + existingRows.length;

    if (newRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdNhanVienLuong,
        range: `'${sheetNameBangNghiPhep}'!A${nextRow}:G`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: newRows,
        },
      });
    }

    return {
      success: true,
      message: `Đã lưu nghỉ phép tháng ${thang}/${nam} thành công!`,
    };
  } catch (error) {
    console.error("Error saving leave data to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật một dòng nghỉ phép
 * rowNumber: số dòng trong sheet (id)
 * phepThang: số phép tháng mới
 * suDung: số phép sử dụng mới
 */
export async function updateNghiPhepRow(
  rowNumber: number,
  phepThang: number,
  suDung: number
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const tonPhep = phepThang - suDung;

    // Update columns E, F, G (phepThang, suDung, tonPhep)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBangNghiPhep}'!E${rowNumber}:G${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[phepThang, suDung, tonPhep]],
      },
    });
  } catch (error) {
    console.error("Error updating leave row:", error);
    throw error;
  }
}

// ============================================
// BẢO HIỂM (Insurance)
// ============================================

const sheetNameBaoHiemTyLe = process.env.GOOGLE_SHEET_NAME_BAO_HIEM_TY_LE || "Tỷ lệ % đóng BH";
const sheetNameBaoHiem = process.env.GOOGLE_SHEET_NAME_BAO_HIEM || "Bảo hiểm";

// Interface cho tỷ lệ bảo hiểm
export interface BaoHiemTyLe {
  id: number;
  batDau: string;
  ketThuc: string;
  loaiBH: string;
  bhxhDN: number;
  bhxhNV: number;
  bhytDN: number;
  bhytNV: number;
  bhtnDN: number;
  bhtnNV: number;
}

// Interface cho bảo hiểm nhân viên
export interface BaoHiemNhanVien {
  id: number;
  maPhieu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  hoTen: string;
  chucVu: string;
  boPhan: string;
  mucLuongCoBan: number;
  bhxhDN: number;
  bhxhNV: number;
  bhytDN: number;
  bhytNV: number;
  bhtnDN: number;
  bhtnNV: number;
  tongDN: number;
  tongNV: number;
  ghiChu: string;
  // Tỷ lệ % áp dụng (cột Q-Y)
  loaiBH: string;
  tyLeBhxhDN: number;
  tyLeBhxhNV: number;
  tyLeBhytDN: number;
  tyLeBhytNV: number;
  tyLeBhtnDN: number;
  tyLeBhtnNV: number;
  tyLeTongDN: number;
  tyLeTongNV: number;
  thang: number;
  nam: number;
}

/**
 * Lấy dữ liệu tỷ lệ bảo hiểm
 */
export async function getBaoHiemTyLeFromSheet(): Promise<BaoHiemTyLe[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBaoHiemTyLe}'!A6:I100`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No insurance rate data found.");
      return [];
    }

    const parsePercent = (val: string | undefined): number => {
      if (!val) return 0;
      const str = String(val).replace(",", ".").replace("%", "");
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const result: BaoHiemTyLe[] = [];

    rows.forEach((row, index) => {
      if (!row[0]) return;

      result.push({
        id: index + 6,
        batDau: row[0] || "",
        ketThuc: row[1] || "",
        loaiBH: row[2] || "",
        bhxhDN: parsePercent(row[3]),
        bhxhNV: parsePercent(row[4]),
        bhytDN: parsePercent(row[5]),
        bhytNV: parsePercent(row[6]),
        bhtnDN: parsePercent(row[7]),
        bhtnNV: parsePercent(row[8]),
      });
    });

    return result;
  } catch (error) {
    console.error("Error reading insurance rate data:", error);
    throw error;
  }
}

/**
 * Lưu tỷ lệ bảo hiểm mới
 */
export async function saveBaoHiemTyLeToSheet(
  data: Omit<BaoHiemTyLe, "id">
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Find next empty row
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBaoHiemTyLe}'!A6:A100`,
    });

    const existingRows = existingResponse.data.values || [];
    const nextRow = 6 + existingRows.length;

    const newRow = [
      data.batDau,
      data.ketThuc,
      data.loaiBH,
      `${data.bhxhDN}%`,
      `${data.bhxhNV}%`,
      `${data.bhytDN}%`,
      `${data.bhytNV}%`,
      `${data.bhtnDN}%`,
      `${data.bhtnNV}%`,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBaoHiemTyLe}'!A${nextRow}:I${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow],
      },
    });

    return {
      success: true,
      message: "Đã lưu tỷ lệ bảo hiểm thành công!",
    };
  } catch (error) {
    console.error("Error saving insurance rate:", error);
    throw error;
  }
}

/**
 * Lấy dữ liệu bảo hiểm nhân viên theo tháng/năm
 */
export async function getBaoHiemFromSheet(thang: number, nam: number): Promise<BaoHiemNhanVien[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Read columns A-Y (including percentage rates)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBaoHiem}'!A6:Y500`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No insurance data found.");
      return [];
    }

    const parseNumber = (val: string | undefined): number => {
      if (!val) return 0;
      const str = String(val).replace(/,/g, "").replace(/\./g, "");
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const parsePercent = (val: string | undefined): number => {
      if (!val) return 0;
      const str = String(val).replace(",", ".").replace("%", "");
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const result: BaoHiemNhanVien[] = [];

    rows.forEach((row, index) => {
      const ngayBatDau = row[1] || "";
      if (!ngayBatDau) return;

      // Parse date to get month/year
      const dateParts = ngayBatDau.split("/");
      if (dateParts.length >= 3) {
        const rowThang = parseInt(dateParts[1]);
        const rowNam = parseInt(dateParts[2]);

        if (rowThang === thang && rowNam === nam) {
          result.push({
            id: index + 6,
            maPhieu: row[0] || "",
            ngayBatDau,
            ngayKetThuc: row[2] || "",
            hoTen: row[3] || "",
            chucVu: row[4] || "",
            boPhan: row[5] || "",
            mucLuongCoBan: parseNumber(row[6]),
            bhxhDN: parseNumber(row[7]),
            bhxhNV: parseNumber(row[8]),
            bhytDN: parseNumber(row[9]),
            bhytNV: parseNumber(row[10]),
            bhtnDN: parseNumber(row[11]),
            bhtnNV: parseNumber(row[12]),
            tongDN: parseNumber(row[13]),
            tongNV: parseNumber(row[14]),
            ghiChu: row[15] || "",
            // Tỷ lệ % (cột Q-Y, index 16-24)
            loaiBH: row[16] || "",
            tyLeBhxhDN: parsePercent(row[17]),
            tyLeBhxhNV: parsePercent(row[18]),
            tyLeBhytDN: parsePercent(row[19]),
            tyLeBhytNV: parsePercent(row[20]),
            tyLeBhtnDN: parsePercent(row[21]),
            tyLeBhtnNV: parsePercent(row[22]),
            tyLeTongDN: parsePercent(row[23]),
            tyLeTongNV: parsePercent(row[24]),
            thang,
            nam,
          });
        }
      }
    });

    return result;
  } catch (error) {
    console.error("Error reading insurance data:", error);
    throw error;
  }
}

/**
 * Lưu dữ liệu bảo hiểm nhân viên
 */
export async function saveBaoHiemToSheet(
  data: BaoHiemNhanVien[]
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Find next empty row
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBaoHiem}'!A6:A500`,
    });

    const existingRows = existingResponse.data.values || [];
    const nextRow = 6 + existingRows.length;

    const newRows = data.map((item) => [
      item.maPhieu,
      item.ngayBatDau,
      item.ngayKetThuc,
      item.hoTen,
      item.chucVu,
      item.boPhan,
      item.mucLuongCoBan,
      item.bhxhDN,
      item.bhxhNV,
      item.bhytDN,
      item.bhytNV,
      item.bhtnDN,
      item.bhtnNV,
      item.tongDN,
      item.tongNV,
      item.ghiChu,
    ]);

    if (newRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdNhanVienLuong,
        range: `'${sheetNameBaoHiem}'!A${nextRow}:P${nextRow + newRows.length - 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: newRows,
        },
      });
    }

    return {
      success: true,
      message: `Đã lưu bảo hiểm cho ${data.length} nhân viên!`,
    };
  } catch (error) {
    console.error("Error saving insurance data:", error);
    throw error;
  }
}

/**
 * Cập nhật một dòng bảo hiểm nhân viên
 */
export async function updateBaoHiemRow(
  rowNumber: number,
  data: Partial<BaoHiemNhanVien>
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowData = [
      data.maPhieu || "",
      data.ngayBatDau || "",
      data.ngayKetThuc || "",
      data.hoTen || "",
      data.chucVu || "",
      data.boPhan || "",
      data.mucLuongCoBan || 0,
      data.bhxhDN || 0,
      data.bhxhNV || 0,
      data.bhytDN || 0,
      data.bhytNV || 0,
      data.bhtnDN || 0,
      data.bhtnNV || 0,
      data.tongDN || 0,
      data.tongNV || 0,
      data.ghiChu || "",
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBaoHiem}'!A${rowNumber}:P${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    return {
      success: true,
      message: "Đã cập nhật bảo hiểm thành công!",
    };
  } catch (error) {
    console.error("Error updating insurance row:", error);
    throw error;
  }
}

/**
 * Xoá một dòng bảo hiểm nhân viên
 */
export async function deleteBaoHiemRow(
  rowNumber: number
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameBaoHiem
    );

    if (!sheet?.properties?.sheetId) {
      throw new Error(`Sheet "${sheetNameBaoHiem}" not found`);
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    return {
      success: true,
      message: "Đã xoá bảo hiểm thành công!",
    };
  } catch (error) {
    console.error("Error deleting insurance row:", error);
    throw error;
  }
}

/**
 * Cập nhật tỷ lệ bảo hiểm
 */
export async function updateBaoHiemTyLeRow(
  rowNumber: number,
  data: Partial<BaoHiemTyLe>
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const rowData = [
      data.batDau || "",
      data.ketThuc || "",
      data.loaiBH || "Tỷ lệ",
      `${data.bhxhDN || 0}%`,
      `${data.bhxhNV || 0}%`,
      `${data.bhytDN || 0}%`,
      `${data.bhytNV || 0}%`,
      `${data.bhtnDN || 0}%`,
      `${data.bhtnNV || 0}%`,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameBaoHiemTyLe}'!A${rowNumber}:I${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    return {
      success: true,
      message: "Đã cập nhật tỷ lệ bảo hiểm thành công!",
    };
  } catch (error) {
    console.error("Error updating insurance rate row:", error);
    throw error;
  }
}

/**
 * Xoá tỷ lệ bảo hiểm
 */
export async function deleteBaoHiemTyLeRow(
  rowNumber: number
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameBaoHiemTyLe
    );

    if (!sheet?.properties?.sheetId) {
      throw new Error(`Sheet "${sheetNameBaoHiemTyLe}" not found`);
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    return {
      success: true,
      message: "Đã xoá tỷ lệ bảo hiểm thành công!",
    };
  } catch (error) {
    console.error("Error deleting insurance rate row:", error);
    throw error;
  }
}

// ============================================
// CƠ CHẾ LƯƠNG (Salary Structure)
// ============================================

const sheetNameCoCheLuong = process.env.GOOGLE_SHEET_NAME_CO_CHE_LUONG || "Cơ chế lương";

// Interface cho cơ chế lương
export interface CoCheLuong {
  id: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  maPhieu: string; // Mã phiếu như PTL01/26
  nhanVien: string;
  boPhan: string;
  mucLuongCoBan: number;
  thuongChuyenCan: number;
  phuCapAnTrua: number;
  phuCapXangXe: number;
  phuCapDienThoai: number;
  phuCapKhac1: number;
  phuCapTrangPhuc: number;
  phuCapNhaO: number;
  giuTreNuoiCon: number;
  phuCapKhac: number;
  thuongSangKien: number;
  luongPartime: number;
  ghiChu: string;
  thang: number;
  nam: number;
}

/**
 * Lấy dữ liệu cơ chế lương theo tháng/năm
 */
export async function getCoCheLuongFromSheet(thang: number, nam: number): Promise<CoCheLuong[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameCoCheLuong}'!A6:R500`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No salary structure data found.");
      return [];
    }

    const parseNumber = (val: string | undefined): number => {
      if (!val) return 0;
      if (String(val).startsWith('#')) return 0;
      const str = String(val).replace(/,/g, "").replace(/\./g, "");
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const result: CoCheLuong[] = [];

    rows.forEach((row, index) => {
      const ngayBatDau = row[0] || "";
      if (!ngayBatDau) return;

      // Parse date to get month/year
      const dateParts = ngayBatDau.split("/");
      if (dateParts.length >= 3) {
        const rowThang = parseInt(dateParts[1]);
        const rowNam = parseInt(dateParts[2]);

        if (rowThang === thang && rowNam === nam) {
          result.push({
            id: index + 6,
            ngayBatDau,
            ngayKetThuc: row[1] || "",
            maPhieu: row[2] || "",
            nhanVien: row[3] || "",
            boPhan: row[4] || "",
            mucLuongCoBan: parseNumber(row[5]),
            thuongChuyenCan: parseNumber(row[6]),
            phuCapAnTrua: parseNumber(row[7]),
            phuCapXangXe: parseNumber(row[8]),
            phuCapDienThoai: parseNumber(row[9]),
            phuCapKhac1: parseNumber(row[10]),
            phuCapTrangPhuc: parseNumber(row[11]),
            phuCapNhaO: parseNumber(row[12]),
            giuTreNuoiCon: parseNumber(row[13]),
            phuCapKhac: parseNumber(row[14]),
            thuongSangKien: parseNumber(row[15]),
            luongPartime: parseNumber(row[16]),
            ghiChu: row[17] || "",
            thang,
            nam,
          });
        }
      }
    });

    return result;
  } catch (error) {
    console.error("Error reading salary structure data:", error);
    throw error;
  }
}

/**
 * Lưu dữ liệu cơ chế lương
 */
export async function saveCoCheLuongToSheet(
  data: CoCheLuong[]
): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Find next empty row
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdNhanVienLuong,
      range: `'${sheetNameCoCheLuong}'!A6:A500`,
    });

    const existingRows = existingResponse.data.values || [];
    const nextRow = 6 + existingRows.length;

    const newRows = data.map((item) => [
      item.ngayBatDau,
      item.ngayKetThuc,
      item.maPhieu,
      item.nhanVien,
      item.boPhan,
      item.mucLuongCoBan,
      item.thuongChuyenCan,
      item.phuCapAnTrua,
      item.phuCapXangXe,
      item.phuCapDienThoai,
      item.phuCapKhac1,
      item.phuCapTrangPhuc,
      item.phuCapNhaO,
      item.giuTreNuoiCon,
      item.phuCapKhac,
      item.thuongSangKien,
      item.luongPartime,
      item.ghiChu,
    ]);

    if (newRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdNhanVienLuong,
        range: `'${sheetNameCoCheLuong}'!A${nextRow}:R${nextRow + newRows.length - 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: newRows,
        },
      });
    }

    return {
      success: true,
      message: `Đã lưu cơ chế lương cho ${data.length} nhân viên!`,
    };
  } catch (error) {
    console.error("Error saving salary structure data:", error);
    throw error;
  }
}

// ============================================
// NHẬP KHO NGUYÊN PHỤ LIỆU (Nhập kho NPL)
// ============================================

const spreadsheetIdSanXuat = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT || "16WCta5dfQGsUhSO0oMRWvQNSU-VzwiyWpTctKEDwaHc";
const sheetNameNhapKhoNPL = process.env.GOOGLE_SHEET_NAME_NHAP_KHO_NPL || "Nhập kho NPL";

// Interface cho nhập kho NPL
export interface NhapKhoNPL {
  id: number;
  maPNKNPL: string;       // Mã PNKNPL (Cột A)
  ngayThang: string;      // Ngày tháng (Cột B)
  nguoiNhap: string;      // Người nhập (Cột C)
  noiDung: string;        // Nội dung (Cột D)
  maNPL: string;          // Mã NPL (Cột E)
  ncc: string;            // NCC (Cột F)
  dvt: string;            // ĐVT (Cột G)
  soLuong: number;        // Số lượng (Cột H)
  donGiaSauThue: number;  // Đơn giá sau thuế (Cột I)
  thanhTien: number;      // Thành tiền (Cột J)
  ghiChu: string;         // Ghi chú (Cột K)
  tonThucTe: number;      // Tồn thực tế (Cột L)
}

/**
 * Đọc dữ liệu nhập kho NPL từ Google Sheets
 * Header ở dòng 5, dữ liệu từ dòng 6
 */
export async function getNhapKhoNPLFromSheet(): Promise<NhapKhoNPL[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameNhapKhoNPL}'!A6:L`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No nhap kho NPL data found in sheet.");
      return [];
    }

    // Helper function to parse number from Vietnamese format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      // Handle #N/A or error values
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const nhapKhoList: NhapKhoNPL[] = rows
      .map((row, index) => ({
        id: index + 1,
        maPNKNPL: row[0] || "",
        ngayThang: row[1] || "",
        nguoiNhap: row[2] || "",
        noiDung: row[3] || "",
        maNPL: row[4] || "",
        ncc: row[5] || "",
        dvt: row[6] || "",
        soLuong: parseNumberVN(row[7]),
        donGiaSauThue: parseNumberVN(row[8]),
        thanhTien: parseNumberVN(row[9]),
        ghiChu: row[10] || "",
        tonThucTe: parseNumberVN(row[11]),
      }))
      .filter((item) => item.maPNKNPL.trim() !== "" && !item.maPNKNPL.startsWith('#'));

    return nhapKhoList;
  } catch (error) {
    console.error("Error reading nhap kho NPL from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm nhập kho NPL mới vào Google Sheets
 */
export async function addNhapKhoNPLToSheet(data: Omit<NhapKhoNPL, 'id' | 'thanhTien' | 'tonThucTe'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get column A to find the last row with data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameNhapKhoNPL}'!A:A`,
    });

    const rows = response.data.values || [];
    let lastDataRow = 5; // Header at row 5, data starts at row 6
    for (let i = rows.length - 1; i >= 5; i--) {
      if (rows[i] && rows[i][0] && rows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Tính thành tiền = số lượng × đơn giá sau thuế
    const thanhTien = (data.soLuong || 0) * (data.donGiaSauThue || 0);

    // Lấy tồn kho thực tế từ sheet Tồn kho NPL
    let tonThucTe = 0;
    try {
      const tonKhoList = await getTonKhoNPLThangFromSheet();
      const tonKho = tonKhoList.find((t) => t.maNPL.trim() === data.maNPL.trim());
      tonThucTe = tonKho ? tonKho.tonCuoi : 0;
    } catch (e) {
      console.warn("Could not fetch ton kho NPL:", e);
    }

    // Write to the next row (columns A-L)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameNhapKhoNPL}'!A${nextRow}:L${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.maPNKNPL,
          data.ngayThang,
          data.nguoiNhap,
          data.noiDung,
          data.maNPL,
          data.ncc,
          data.dvt,
          data.soLuong,
          data.donGiaSauThue,
          thanhTien, // Thành tiền (tính toán)
          data.ghiChu,
          tonThucTe, // Tồn kho thực tế (từ sheet Tồn kho NPL)
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error adding nhap kho NPL:", error);
    throw error;
  }
}

/**
 * Cập nhật nhập kho NPL trong Google Sheets
 */
export async function updateNhapKhoNPLInSheet(rowIndex: number, data: Partial<NhapKhoNPL>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    const actualRow = rowIndex + 6; // Row 6 = index 0

    // Get current row data
    const currentResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameNhapKhoNPL}'!A${actualRow}:L${actualRow}`,
    });

    const currentRow = currentResponse.data.values?.[0] || [];

    // Helper to parse number
    const parseNum = (val: any): number => {
      if (!val) return 0;
      const cleaned = String(val).replace(/\./g, "").replace(",", ".");
      return parseFloat(cleaned) || 0;
    };

    const soLuong = data.soLuong ?? parseNum(currentRow[7]);
    const donGiaSauThue = data.donGiaSauThue ?? parseNum(currentRow[8]);
    const maNPL = data.maNPL ?? currentRow[4] ?? "";

    // Tính thành tiền
    const thanhTien = soLuong * donGiaSauThue;

    // Lấy tồn kho thực tế từ sheet Tồn kho NPL
    let tonThucTe = parseNum(currentRow[11]);
    try {
      const tonKhoList = await getTonKhoNPLThangFromSheet();
      const tonKho = tonKhoList.find((t) => t.maNPL.trim() === maNPL.trim());
      tonThucTe = tonKho ? tonKho.tonCuoi : 0;
    } catch (e) {
      console.warn("Could not fetch ton kho NPL:", e);
    }

    // Update with new values
    const updatedRow = [
      data.maPNKNPL ?? currentRow[0] ?? "",
      data.ngayThang ?? currentRow[1] ?? "",
      data.nguoiNhap ?? currentRow[2] ?? "",
      data.noiDung ?? currentRow[3] ?? "",
      maNPL,
      data.ncc ?? currentRow[5] ?? "",
      data.dvt ?? currentRow[6] ?? "",
      soLuong,
      donGiaSauThue,
      thanhTien, // Thành tiền (tính toán)
      data.ghiChu ?? currentRow[10] ?? "",
      tonThucTe, // Tồn kho thực tế
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameNhapKhoNPL}'!A${actualRow}:L${actualRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [updatedRow],
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating nhap kho NPL:", error);
    throw error;
  }
}

/**
 * Xoá nhập kho NPL từ Google Sheets
 */
export async function deleteNhapKhoNPLFromSheet(rowIndex: number): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    const actualRow = rowIndex + 6; // Row 6 = index 0

    // Clear the row data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameNhapKhoNPL}'!A${actualRow}:L${actualRow}`,
    });

    return true;
  } catch (error) {
    console.error("Error deleting nhap kho NPL:", error);
    throw error;
  }
}

// ============================================
// PHIẾU NHẬP KHO NPL (PNK NPL)
// ============================================

const sheetNamePhieuNhapNPL = process.env.GOOGLE_SHEET_NAME_PHIEU_NHAP_NPL || "PNK NPL";

// Interface cho phiếu nhập kho NPL
export interface PhieuNhapNPL {
  id: number;
  stt: number;              // STT (Cột A)
  maNPL: string;            // Mã nguyên phụ liệu (Cột B)
  dvt: string;              // ĐVT (Cột C)
  soLuong: number;          // Số lượng (Cột D)
  ghiChu: string;           // Ghi chú (Cột E)
}

/**
 * Đọc dữ liệu phiếu nhập kho NPL từ Google Sheets
 * Header ở dòng 6, dữ liệu từ dòng 7
 */
export async function getPhieuNhapNPLFromSheet(): Promise<PhieuNhapNPL[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNamePhieuNhapNPL}'!A7:E`, // Header dòng 6, dữ liệu từ dòng 7
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No phieu nhap kho NPL data found in sheet.");
      return [];
    }

    // Helper function to parse number from Vietnamese format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const phieuNhapList: PhieuNhapNPL[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseInt(row[0]) || index + 1,
        maNPL: row[1] || "",
        dvt: row[2] || "",
        soLuong: parseNumberVN(row[3]),
        ghiChu: row[4] || "",
      }))
      .filter((item) => item.maNPL.trim() !== "");

    return phieuNhapList;
  } catch (error) {
    console.error("Error reading phieu nhap kho NPL from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// XUẤT KHO NGUYÊN PHỤ LIỆU (Xuất kho NPL)
// ============================================

const sheetNameXuatKhoNPL = process.env.GOOGLE_SHEET_NAME_XUAT_KHO_NPL || "Xuất kho NPL";

// Interface cho xuất kho NPL
export interface XuatKhoNPL {
  id: number;
  maPhieu: string;          // Mã phiếu (Cột A)
  ngayThang: string;        // Ngày tháng (Cột B)
  nguoiNhap: string;        // Người nhập (Cột C)
  noiDung: string;          // Nội dung (Cột D)
  maSP: string;             // Mã SP (Cột E)
  lenhSX: string;           // Lệnh SX (Cột F)
  xuongSX: string;          // Xưởng sản xuất (Cột G)
  maNPL: string;            // Mã NPL (Cột H)
  dvt: string;              // ĐVT (Cột I)
  soLuong: number;          // Số lượng (Cột J)
  donGia: number;           // Đơn giá (Cột K)
  thanhTien: number;        // Thành tiền (Cột L)
  loaiChiPhi: string;       // Loại chi phí (Cột M)
  ghiChu: string;           // Ghi chú (Cột N)
  tonThucTe: number;        // Tồn thực tế (Cột O)
}

/**
 * Đọc dữ liệu xuất kho NPL từ Google Sheets
 * Header ở dòng 5, dữ liệu từ dòng 6
 */
export async function getXuatKhoNPLFromSheet(): Promise<XuatKhoNPL[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameXuatKhoNPL}'!A6:O`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No xuat kho NPL data found in sheet.");
      return [];
    }

    // Helper function to parse number from Vietnamese format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const xuatKhoList: XuatKhoNPL[] = rows
      .map((row, index) => ({
        id: index + 1,
        maPhieu: row[0] || "",
        ngayThang: row[1] || "",
        nguoiNhap: row[2] || "",
        noiDung: row[3] || "",
        maSP: row[4] || "",
        lenhSX: row[5] || "",
        xuongSX: row[6] || "",
        maNPL: row[7] || "",
        dvt: row[8] || "",
        soLuong: parseNumberVN(row[9]),
        donGia: parseNumberVN(row[10]),
        thanhTien: parseNumberVN(row[11]),
        loaiChiPhi: row[12] || "",
        ghiChu: row[13] || "",
        tonThucTe: parseNumberVN(row[14]),
      }))
      .filter((item) => item.maPhieu.trim() !== "" && !item.maPhieu.startsWith('#'));

    return xuatKhoList;
  } catch (error) {
    console.error("Error reading xuat kho NPL from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm phiếu xuất kho NPL mới vào Google Sheets
 */
export async function addXuatKhoNPLToSheet(data: {
  maPhieu: string;
  ngayThang: string;
  nguoiNhap: string;
  noiDung: string;
  maSP: string;
  lenhSX: string;
  xuongSX: string;
  maNPL: string;
  dvt: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  loaiChiPhi: string;
  ghiChu: string;
  tonThucTe: number;
}): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameXuatKhoNPL}'!A:O`,
    });

    const allRows = response.data.values || [];

    // Tìm dòng cuối cùng có dữ liệu (bỏ qua header dòng 1-5)
    let lastDataRow = 5;
    for (let i = allRows.length - 1; i >= 5; i--) {
      if (allRows[i] && allRows[i][0] && allRows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Ghi dữ liệu (cột A-O)
    const values = [
      [
        data.maPhieu,
        data.ngayThang,
        data.nguoiNhap,
        data.noiDung,
        data.maSP,
        data.lenhSX,
        data.xuongSX,
        data.maNPL,
        data.dvt,
        data.soLuong,
        data.donGia,
        data.thanhTien,
        data.loaiChiPhi,
        data.ghiChu,
        data.tonThucTe,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameXuatKhoNPL}'!A${nextRow}:O${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Xuất kho NPL added at row ${nextRow}`);
  } catch (error) {
    console.error("Error adding xuat kho NPL to Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa phiếu xuất kho NPL từ Google Sheets
 */
export async function deleteXuatKhoNPLFromSheet(id: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameXuatKhoNPL}'!A6:O`,
    });

    const rows = response.data.values || [];

    if (id < 1 || id > rows.length) {
      throw new Error(`Invalid ID: ${id}`);
    }

    // Row number in sheet (header ở dòng 5, data từ dòng 6)
    const rowNumber = id + 5;

    // Resolve sheetId theo tên sheet thay vì hardcode 0
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdSanXuat,
    });
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameXuatKhoNPL
    );
    if (!sheet || sheet.properties?.sheetId === undefined || sheet.properties?.sheetId === null) {
      throw new Error(`Cannot find sheet named "${sheetNameXuatKhoNPL}" to delete row`);
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdSanXuat,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Xuất kho NPL deleted at row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting xuat kho NPL from Google Sheets:", error);
    throw error;
  }
}

/**
 * Xoá toàn bộ các dòng có maPhieu khớp trong 1 batchUpdate.
 * Deletes được sắp xếp từ dưới lên để không bị shift row.
 */
export async function deleteXuatKhoNPLByMaPhieuFromSheet(
  maPhieu: string
): Promise<number> {
  try {
    if (!maPhieu || !maPhieu.trim()) {
      throw new Error("maPhieu is required");
    }

    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameXuatKhoNPL}'!A6:O`,
    });

    const rows = response.data.values || [];

    // Tìm tất cả index (0-based trong vùng A6:O) có maPhieu khớp
    const matchedIndices: number[] = [];
    rows.forEach((row, index) => {
      const cell = (row?.[0] || "").toString().trim();
      if (cell === maPhieu.trim()) {
        matchedIndices.push(index);
      }
    });

    if (matchedIndices.length === 0) {
      return 0;
    }

    // Resolve sheetId theo tên
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdSanXuat,
    });
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameXuatKhoNPL
    );
    if (!sheet || sheet.properties?.sheetId === undefined || sheet.properties?.sheetId === null) {
      throw new Error(`Cannot find sheet named "${sheetNameXuatKhoNPL}"`);
    }
    const sheetId = sheet.properties.sheetId;

    // Xây dựng requests xoá theo thứ tự GIẢM DẦN (từ dưới lên)
    // để index của các request phía sau không bị dịch chuyển.
    const requests = matchedIndices
      .slice()
      .sort((a, b) => b - a)
      .map((idx) => {
        const rowNumber = idx + 6; // A6:O → index 0 = row 6
        return {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        };
      });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdSanXuat,
      requestBody: { requests },
    });

    console.log(
      `Deleted ${matchedIndices.length} rows of maPhieu=${maPhieu} from Xuất kho NPL`
    );
    return matchedIndices.length;
  } catch (error) {
    console.error(
      "Error deleting xuat kho NPL by maPhieu from Google Sheets:",
      error
    );
    throw error;
  }
}

/**
 * Cập nhật item xuất kho NPL trong Google Sheets
 */
export async function updateXuatKhoNPLInSheet(id: number, data: Partial<XuatKhoNPL>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    const actualRow = id + 5; // Row 6 = id 1

    const currentResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameXuatKhoNPL}'!A${actualRow}:O${actualRow}`,
    });

    const currentRow = currentResponse.data.values?.[0] || [];

    const parseNum = (val: any): number => {
      if (!val) return 0;
      const cleaned = String(val).replace(/\./g, "").replace(",", ".");
      return parseFloat(cleaned) || 0;
    };

    const soLuong = data.soLuong ?? parseNum(currentRow[9]);
    const donGia = data.donGia ?? parseNum(currentRow[10]);
    const thanhTien = soLuong * donGia;

    const updatedRow = [
      currentRow[0] ?? "",   // maPhieu
      currentRow[1] ?? "",   // ngayThang
      currentRow[2] ?? "",   // nguoiNhap
      currentRow[3] ?? "",   // noiDung
      currentRow[4] ?? "",   // maSP
      currentRow[5] ?? "",   // lenhSX
      currentRow[6] ?? "",   // xuongSX
      currentRow[7] ?? "",   // maNPL
      currentRow[8] ?? "",   // dvt
      soLuong,               // soLuong
      donGia,                // donGia
      thanhTien,             // thanhTien
      data.loaiChiPhi ?? currentRow[12] ?? "", // loaiChiPhi
      data.ghiChu ?? currentRow[13] ?? "",     // ghiChu
      currentRow[14] ?? "",  // tonThucTe
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat,
      range: `'${sheetNameXuatKhoNPL}'!A${actualRow}:O${actualRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] },
    });

    return true;
  } catch (error) {
    console.error("Error updating xuat kho NPL:", error);
    throw error;
  }
}

// ===================== PHIEU XUAT KHO NPL (PXK NPL) =====================
const spreadsheetIdSanXuat5 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNamePhieuXuatNPL = process.env.GOOGLE_SHEET_NAME_PHIEU_XUAT_NPL || "PXK NPL";

// Interface cho phiếu xuất kho NPL
export interface PhieuXuatNPL {
  id: number;
  stt: number;           // STT (Cột A)
  maNPL: string;         // Mã nguyên phụ liệu (Cột B)
  dvt: string;           // ĐVT (Cột C)
  soLuong: number;       // Số lượng (Cột D)
  ghiChu: string;        // Ghi chú (Cột E)
}

/**
 * Đọc dữ liệu phiếu xuất kho NPL từ Google Sheets
 * Header ở dòng 6, dữ liệu từ dòng 7, cột A đến E
 */
export async function getPhieuXuatNPLFromSheet(): Promise<PhieuXuatNPL[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat5,
      range: `'${sheetNamePhieuXuatNPL}'!A7:E`, // Header dòng 6, dữ liệu từ dòng 7
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No phieu xuat kho NPL data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const phieuXuatList: PhieuXuatNPL[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        maNPL: row[1] || "",
        dvt: row[2] || "",
        soLuong: parseNumberVN(row[3]),
        ghiChu: row[4] || "",
      }))
      .filter((item) => item.maNPL.trim() !== "" && !item.maNPL.startsWith('#'));

    return phieuXuatList;
  } catch (error) {
    console.error("Error reading phieu xuat kho NPL from Google Sheets:", error);
    throw error;
  }
}

// ===================== TỒN KHO NPL (Tồn kho NPL kho công ty) =====================
const spreadsheetIdSanXuat6 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameTonKhoNPL = process.env.GOOGLE_SHEET_NAME_TON_KHO_NPL || "Tồn kho NPL kho công ty";
const sheetNameTonKhoNPLXuongSX = process.env.GOOGLE_SHEET_NAME_TON_KHO_NPL_XUONG_SX || "Tồn kho NPL xưởng SX";

// Interface cho tồn kho NPL theo tháng (Bảng 1 - Cột A-H)
export interface TonKhoNPLThang {
  id: number;
  stt: number;             // STT (Cột A)
  maNPL: string;           // Mã nguyên phụ liệu (Cột B)
  tonDau: number;          // Tồn đầu (Cột C)
  nhapKho: number;         // Nhập kho (Cột D)
  xuatKho: number;         // Xuất kho (Cột E)
  tonCuoi: number;         // Tồn cuối (Cột F)
  donGiaSauThue: number;   // Đơn giá sau thuế (Cột G)
  giaTriTon: number;       // Giá trị tồn sau thuế (Cột H)
}

// Interface cho tồn kho NPL đến ngày (Bảng 2 - Cột J-L)
export interface TonKhoNPLNgay {
  id: number;
  stt: number;             // STT (Cột J)
  maSP: string;            // Mã SP (Cột K)
  soLuong: number;         // Số lượng (Cột L)
}

// Interface cho tồn kho NPL xưởng SX (Bảng 3 - sheet riêng)
export interface TonKhoNPLXuongSX {
  id: number;
  ngayThang: string;       // Ngày tháng (Cột A)
  xuongSX: string;         // Xưởng SX thừa NPL (Cột B)
  tenNPL: string;          // Tên NPL (Cột C)
  dvt: string;             // ĐVT (Cột D)
  soLuong: number;         // Số lượng (Cột E)
  donGia: number;          // Đơn giá (Cột F)
  thanhTien: number;       // Thành tiền (Cột G)
}

/**
 * Đọc dữ liệu tồn kho NPL theo tháng từ Google Sheets (Bảng 1)
 * Header ở dòng 5, dữ liệu từ dòng 6, cột A đến H
 */
export async function getTonKhoNPLThangFromSheet(): Promise<TonKhoNPLThang[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat6,
      range: `'${sheetNameTonKhoNPL}'!A6:H`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No ton kho NPL thang data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const tonKhoList: TonKhoNPLThang[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        maNPL: row[1] || "",
        tonDau: parseNumberVN(row[2]),
        nhapKho: parseNumberVN(row[3]),
        xuatKho: parseNumberVN(row[4]),
        tonCuoi: parseNumberVN(row[5]),
        donGiaSauThue: parseNumberVN(row[6]),
        giaTriTon: parseNumberVN(row[7]),
      }))
      .filter((item) => item.maNPL.trim() !== "" && !item.maNPL.startsWith('#'));

    return tonKhoList;
  } catch (error) {
    console.error("Error reading ton kho NPL thang from Google Sheets:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu tồn kho NPL đến ngày từ Google Sheets (Bảng 2)
 * Header ở dòng 5, dữ liệu từ dòng 6, cột J đến L
 */
export async function getTonKhoNPLNgayFromSheet(): Promise<TonKhoNPLNgay[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat6,
      range: `'${sheetNameTonKhoNPL}'!J6:L`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No ton kho NPL ngay data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const tonKhoNgayList: TonKhoNPLNgay[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        maSP: row[1] || "",
        soLuong: parseNumberVN(row[2]),
      }))
      .filter((item) => item.maSP.trim() !== "" && !item.maSP.startsWith('#'));

    return tonKhoNgayList;
  } catch (error) {
    console.error("Error reading ton kho NPL ngay from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật số lượng tồn kho NPL đến ngày trong Google Sheets
 * Cột L, dữ liệu từ dòng 6
 */
export async function updateTonKhoNPLNgaySoLuong(
  id: number,
  soLuong: number
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const rowNumber = id + 5; // id=1 → row 6

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat6,
      range: `'${sheetNameTonKhoNPL}'!L${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[soLuong]],
      },
    });
  } catch (error) {
    console.error("Error updating ton kho NPL ngay so luong:", error);
    throw error;
  }
}

/**
 * Cập nhật ô ngày/tháng filter trong sheet Tồn kho NPL
 * C3 = tháng/năm cho bảng 1 (format: M/YY)
 * L3 = ngày cho bảng 2 (format: D/M/YYYY)
 */
export async function updateTonKhoNPLDateCells(params: {
  thangNam?: string; // Format: "YYYY-MM"
  denNgay?: string;  // Format: "YYYY-MM-DD"
}): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const { thangNam, denNgay } = params;

    const updates: { range: string; values: any[][] }[] = [];

    // Convert thangNam (YYYY-MM) to sheet format (M/YY)
    if (thangNam) {
      const [year, month] = thangNam.split("-");
      const shortYear = year.slice(-2); // Get last 2 digits
      const monthNum = parseInt(month, 10); // Remove leading zero
      const sheetDateThang = `${monthNum}/${shortYear}`;

      updates.push({
        range: `'${sheetNameTonKhoNPL}'!C3`,
        values: [[sheetDateThang]],
      });
      console.log("Updating C3 with:", sheetDateThang);
    }

    // Convert denNgay (YYYY-MM-DD) to sheet format (D/M/YYYY)
    if (denNgay) {
      const [year, month, day] = denNgay.split("-");
      const dayNum = parseInt(day, 10); // Remove leading zero
      const monthNum = parseInt(month, 10); // Remove leading zero
      const sheetDateNgay = `${dayNum}/${monthNum}/${year}`;

      updates.push({
        range: `'${sheetNameTonKhoNPL}'!L3`,
        values: [[sheetDateNgay]],
      });
      console.log("Updating L3 with:", sheetDateNgay);
    }

    // Batch update all cells
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetIdSanXuat6,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: updates,
        },
      });
      console.log("Successfully updated date cells in Tồn kho NPL sheet");
    }
  } catch (error) {
    console.error("Error updating ton kho NPL date cells:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu tồn kho NPL xưởng SX từ Google Sheets
 * Header ở dòng 5, dữ liệu từ dòng 6, cột A đến G
 */
export async function getTonKhoNPLXuongSXFromSheet(): Promise<TonKhoNPLXuongSX[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat6,
      range: `'${sheetNameTonKhoNPLXuongSX}'!A6:G`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No ton kho NPL xuong SX data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const tonKhoList: TonKhoNPLXuongSX[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngayThang: row[0] || "",
        xuongSX: row[1] || "",
        tenNPL: row[2] || "",
        dvt: row[3] || "",
        soLuong: parseNumberVN(row[4]),
        donGia: parseNumberVN(row[5]),
        thanhTien: parseNumberVN(row[6]),
      }))
      .filter((item) => item.tenNPL.trim() !== "" && !item.tenNPL.startsWith('#'));

    return tonKhoList;
  } catch (error) {
    console.error("Error reading ton kho NPL xuong SX from Google Sheets:", error);
    throw error;
  }
}

// ===================== CNPT NCC NPL (Công nợ phải trả NCC NPL) =====================
const spreadsheetIdSanXuat7 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameCNPTNCCNPL = process.env.GOOGLE_SHEET_NAME_CNPT_NCC_NPL || "CNPT NCC NPL";

// Interface cho công nợ phải trả NCC NPL theo tháng (Bảng 1 - Cột A-F)
export interface CNPTNCCNPLThang {
  id: number;
  stt: number;             // STT (Cột A)
  nccNPL: string;          // NCC NPL (Cột B)
  duDauKi: number;         // Dư đầu kì (Cột C)
  phatSinh: number;        // Phát sinh (Cột D)
  thanhToan: number;       // Thanh toán (Cột E)
  duCuoiKi: number;        // Dư cuối kì (Cột F)
}

// Interface cho bảng kê số dư đầu kì đến ngày (Bảng 2 - Cột H-J)
export interface CNPTNCCNPLNgay {
  id: number;
  stt: number;             // STT (Cột H)
  nccNPL: string;          // NCC NPL (Cột I)
  soTien: number;          // Số tiền (Cột J)
}

/**
 * Đọc dữ liệu công nợ phải trả NCC NPL theo tháng từ Google Sheets (Bảng 1)
 * Header ở dòng 5, dữ liệu từ dòng 6, cột A đến F
 */
export async function getCNPTNCCNPLThangFromSheet(): Promise<CNPTNCCNPLThang[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat7,
      range: `'${sheetNameCNPTNCCNPL}'!A6:F`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No CNPT NCC NPL thang data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const cnptList: CNPTNCCNPLThang[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        nccNPL: row[1] || "",
        duDauKi: parseNumberVN(row[2]),
        phatSinh: parseNumberVN(row[3]),
        thanhToan: parseNumberVN(row[4]),
        duCuoiKi: parseNumberVN(row[5]),
      }))
      .filter((item) => item.nccNPL.trim() !== "" && !item.nccNPL.startsWith('#'));

    return cnptList;
  } catch (error) {
    console.error("Error reading CNPT NCC NPL thang from Google Sheets:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu bảng kê số dư đầu kì đến ngày từ Google Sheets (Bảng 2)
 * Header ở dòng 5, dữ liệu từ dòng 6, cột H đến J
 */
export async function getCNPTNCCNPLNgayFromSheet(): Promise<CNPTNCCNPLNgay[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat7,
      range: `'${sheetNameCNPTNCCNPL}'!H6:J`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No CNPT NCC NPL ngay data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const cnptNgayList: CNPTNCCNPLNgay[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        nccNPL: row[1] || "",
        soTien: parseNumberVN(row[2]),
      }))
      .filter((item) => item.nccNPL.trim() !== "" && !item.nccNPL.startsWith('#'));

    return cnptNgayList;
  } catch (error) {
    console.error("Error reading CNPT NCC NPL ngay from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật ô ngày/tháng filter trong sheet CNPT NCC NPL
 * C3 = tháng/năm cho bảng 1 (format: M/YYYY)
 * J3 = ngày cho bảng 2 (format: D/M/YYYY)
 */
export async function updateCNPTNCCNPLDateCells(params: {
  thangNam?: string; // Format: "YYYY-MM"
  denNgay?: string;  // Format: "YYYY-MM-DD"
}): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const { thangNam, denNgay } = params;

    const updates: { range: string; values: any[][] }[] = [];

    // Convert thangNam (YYYY-MM) to sheet format (M/YYYY)
    if (thangNam) {
      const [year, month] = thangNam.split("-");
      const monthNum = parseInt(month, 10); // Remove leading zero
      const sheetDateThang = `${monthNum}/${year}`;

      updates.push({
        range: `'${sheetNameCNPTNCCNPL}'!C3`,
        values: [[sheetDateThang]],
      });
      console.log("Updating CNPT NCC NPL C3 with:", sheetDateThang);
    }

    // Convert denNgay (YYYY-MM-DD) to sheet format (D/M/YYYY)
    if (denNgay) {
      const [year, month, day] = denNgay.split("-");
      const dayNum = parseInt(day, 10); // Remove leading zero
      const monthNum = parseInt(month, 10); // Remove leading zero
      const sheetDateNgay = `${dayNum}/${monthNum}/${year}`;

      updates.push({
        range: `'${sheetNameCNPTNCCNPL}'!J3`,
        values: [[sheetDateNgay]],
      });
      console.log("Updating CNPT NCC NPL J3 with:", sheetDateNgay);
    }

    // Batch update all cells
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetIdSanXuat7,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: updates,
        },
      });
      console.log("Successfully updated date cells in CNPT NCC NPL sheet");
    }
  } catch (error) {
    console.error("Error updating CNPT NCC NPL date cells:", error);
    throw error;
  }
}

/**
 * Đọc giá trị ngày/tháng filter hiện tại từ sheet CNPT NCC NPL
 * C3 = tháng/năm cho bảng 1 (format trong sheet: M/YYYY hoặc 'M/YYYY)
 * J3 = ngày cho bảng 2 (format trong sheet: D/M/YYYY)
 * Returns: { thangNam: "YYYY-MM", denNgay: "YYYY-MM-DD" }
 */
export async function getCNPTNCCNPLDateCells(): Promise<{
  thangNam: string;
  denNgay: string;
}> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Read both cells C3 and J3
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetIdSanXuat7,
      ranges: [
        `'${sheetNameCNPTNCCNPL}'!C3`,
        `'${sheetNameCNPTNCCNPL}'!J3`,
      ],
    });

    const values = response.data.valueRanges;
    let thangNam = "";
    let denNgay = "";

    // Parse C3 (format: M/YYYY or 'M/YYYY) -> YYYY-MM
    if (values?.[0]?.values?.[0]?.[0]) {
      const c3Value = String(values[0].values[0][0]).replace(/^'/, ""); // Remove leading apostrophe if present
      const parts = c3Value.split("/");
      if (parts.length === 2) {
        const month = parts[0].padStart(2, "0");
        const year = parts[1];
        thangNam = `${year}-${month}`;
      }
    }

    // Parse J3 (format: D/M/YYYY) -> YYYY-MM-DD
    if (values?.[1]?.values?.[0]?.[0]) {
      const j3Value = String(values[1].values[0][0]);
      const parts = j3Value.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        denNgay = `${year}-${month}-${day}`;
      }
    }

    // Fallback to current date if parsing fails
    if (!thangNam) {
      const now = new Date();
      thangNam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!denNgay) {
      denNgay = new Date().toISOString().split("T")[0];
    }

    console.log("Read CNPT NCC NPL date cells:", { thangNam, denNgay });
    return { thangNam, denNgay };
  } catch (error) {
    console.error("Error reading CNPT NCC NPL date cells:", error);
    // Return current date as fallback
    const now = new Date();
    return {
      thangNam: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      denNgay: now.toISOString().split("T")[0],
    };
  }
}

// ===================== THEO DÕI CN TỪNG NCC NPL =====================
const spreadsheetIdSanXuat8 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameTheodoiCN = process.env.GOOGLE_SHEET_NAME_THEO_DOI_CN || "Theo dõi CN từng NCC NPL";

// Interface cho theo dõi CN theo tháng (Bảng 1 - Cột A-F)
export interface TheodoiCNThang {
  id: number;
  stt: number;             // STT (Cột A)
  nccNPL: string;          // NCC NPL (Cột B)
  duDauKi: number;         // Dư đầu kì (Cột C)
  phatSinh: number;        // Phát sinh (Cột D)
  thanhToan: number;       // Thanh toán (Cột E)
  duCuoiKi: number;        // Dư cuối kì (Cột F)
}

// Interface cho bảng kê số dư đầu kì đến ngày (Bảng 2 - Cột H-J)
export interface TheodoiCNNgay {
  id: number;
  stt: number;             // STT (Cột H)
  nccNPL: string;          // NCC NPL (Cột I)
  soTien: number;          // Số tiền (Cột J)
}

/**
 * Đọc dữ liệu theo dõi CN theo tháng từ Google Sheets (Bảng 1)
 * Header ở dòng 5, dữ liệu từ dòng 6, cột A đến F
 */
export async function getTheodoiCNThangFromSheet(): Promise<TheodoiCNThang[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat8,
      range: `'${sheetNameTheodoiCN}'!A6:F`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No theo doi CN thang data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const theodoiList: TheodoiCNThang[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        nccNPL: row[1] || "",
        duDauKi: parseNumberVN(row[2]),
        phatSinh: parseNumberVN(row[3]),
        thanhToan: parseNumberVN(row[4]),
        duCuoiKi: parseNumberVN(row[5]),
      }))
      .filter((item) => item.nccNPL.trim() !== "" && !item.nccNPL.startsWith('#'));

    return theodoiList;
  } catch (error) {
    console.error("Error reading theo doi CN thang from Google Sheets:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu bảng kê số dư đầu kì đến ngày từ Google Sheets (Bảng 2)
 * Header ở dòng 5, dữ liệu từ dòng 6, cột H đến J
 */
export async function getTheodoiCNNgayFromSheet(): Promise<TheodoiCNNgay[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat8,
      range: `'${sheetNameTheodoiCN}'!H6:J`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No theo doi CN ngay data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const theodoiNgayList: TheodoiCNNgay[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        nccNPL: row[1] || "",
        soTien: parseNumberVN(row[2]),
      }))
      .filter((item) => item.nccNPL.trim() !== "" && !item.nccNPL.startsWith('#'));

    return theodoiNgayList;
  } catch (error) {
    console.error("Error reading theo doi CN ngay from Google Sheets:", error);
    throw error;
  }
}

// ===================== ĐƠN GIÁ GIA CÔNG =====================
const spreadsheetIdSanXuat9 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameDonGiaGiaCong = process.env.GOOGLE_SHEET_NAME_DON_GIA_GIA_CONG || "Đơn giá gia công";

// Interface cho đơn giá gia công
export interface DonGiaGiaCong {
  id: number;
  maSPNhapKho: string;    // Mã SP nhập kho (Cột A)
  maSP: string;            // Mã SP (Cột B)
  mucLucSX: string;        // Mục lục sản xuất (Cột C)
  xuongSX: string;         // Xưởng sản xuất (Cột D)
  noiDungKhac: string;     // Nội dung khác (Cột E)
  donGia: number;          // Đơn giá (Cột F)
  nguoiNhap: string;       // Người nhập (Cột G)
  ghiChu: string;          // Ghi chú (Cột H)
}

/**
 * Đọc dữ liệu đơn giá gia công từ Google Sheets
 * Header ở dòng 5, dữ liệu từ dòng 6, cột A đến H
 */
export async function getDonGiaGiaCongFromSheet(): Promise<DonGiaGiaCong[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat9,
      range: `'${sheetNameDonGiaGiaCong}'!A6:H`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No don gia gia cong data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const donGiaList: DonGiaGiaCong[] = rows
      .map((row, index) => ({
        id: index + 1,
        maSPNhapKho: row[0] || "",
        maSP: row[1] || "",
        mucLucSX: row[2] || "",
        xuongSX: row[3] || "",
        noiDungKhac: row[4] || "",
        donGia: parseNumberVN(row[5]),
        nguoiNhap: row[6] || "",
        ghiChu: row[7] || "",
      }))
      .filter((item) => item.maSPNhapKho.trim() !== "" || item.maSP.trim() !== "");

    return donGiaList;
  } catch (error) {
    console.error("Error reading don gia gia cong from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm đơn giá gia công mới vào Google Sheets
 * Header row 5, data từ row 6
 * Columns: A-H (maSPNhapKho, maSP, mucLucSX, xuongSX, noiDungKhac, donGia, nguoiNhap, ghiChu)
 */
export async function addDonGiaGiaCongToSheet(donGia: Omit<DonGiaGiaCong, "id">): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc dữ liệu từ row 6 để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat9,
      range: `'${sheetNameDonGiaGiaCong}'!A6:H`,
    });

    const dataRows = response.data.values || [];

    // Tìm dòng cuối cùng có dữ liệu
    let lastDataIndex = -1;
    for (let i = dataRows.length - 1; i >= 0; i--) {
      if (dataRows[i] && (dataRows[i][0] || dataRows[i][1]) &&
          (dataRows[i][0]?.toString().trim() !== "" || dataRows[i][1]?.toString().trim() !== "")) {
        lastDataIndex = i;
        break;
      }
    }

    // Row 6 là index 0, nên nextRow = 6 + lastDataIndex + 1
    const nextRow = lastDataIndex === -1 ? 6 : (6 + lastDataIndex + 1);

    const values = [
      [
        donGia.maSPNhapKho,
        donGia.maSP,
        donGia.mucLucSX,
        donGia.xuongSX,
        donGia.noiDungKhac,
        donGia.donGia,
        donGia.nguoiNhap,
        donGia.ghiChu,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat9,
      range: `'${sheetNameDonGiaGiaCong}'!A${nextRow}:H${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added don gia gia cong: ${donGia.maSPNhapKho} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding don gia gia cong to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật đơn giá gia công trong Google Sheets
 * Header row 5, data từ row 6
 */
export async function updateDonGiaGiaCongInSheet(donGia: DonGiaGiaCong): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc.
    const rowNumber = donGia.id + 5;

    const values = [
      [
        donGia.maSPNhapKho,
        donGia.maSP,
        donGia.mucLucSX,
        donGia.xuongSX,
        donGia.noiDungKhac,
        donGia.donGia,
        donGia.nguoiNhap,
        donGia.ghiChu,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat9,
      range: `'${sheetNameDonGiaGiaCong}'!A${rowNumber}:H${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated don gia gia cong: ${donGia.maSPNhapKho}`);
  } catch (error) {
    console.error("Error updating don gia gia cong in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa đơn giá gia công khỏi Google Sheets
 * Header row 5, data từ row 6
 */
export async function deleteDonGiaGiaCongFromSheet(donGiaId: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // ID ánh xạ tới vị trí dòng: ID 1 = dòng 6, ID 2 = dòng 7, etc.
    const rowNumber = donGiaId + 5;

    // Lấy sheetId để xóa dòng
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdSanXuat9,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameDonGiaGiaCong
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      console.error("Available sheets:", sheetMetadata.data.sheets?.map(s => s.properties?.title));
      throw new Error(`Cannot find sheet named "${sheetNameDonGiaGiaCong}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdSanXuat9,
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

    console.log(`Successfully deleted don gia gia cong with ID: ${donGiaId} from row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting don gia gia cong from Google Sheets:", error);
    throw error;
  }
}

// ===================== BẢNG KÊ GIA CÔNG =====================
const spreadsheetIdSanXuat10 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameBangKeGiaCong = process.env.GOOGLE_SHEET_NAME_BANG_KE_GIA_CONG || "Bảng kê gia công";

// Interface cho bảng kê gia công
export interface BangKeGiaCong {
  id: number;
  maPGC: string;          // Mã PGC (Cột A)
  ngayThang: string;      // Ngày tháng (Cột B)
  maSPSX: string;         // Mã SP SX (Cột C)
  maSP: string;           // Mã SP (Cột D)
  xuongSX: string;        // Xưởng SX (Cột E)
  soLuong: number;        // Số lượng (Cột F)
  donGia: number;         // Đơn giá (Cột G)
  thanhTien: number;      // Thành tiền (Cột H)
  phanLoai: string;       // Phân loại (Cột I)
  doiSoat: string;        // Đối soát (Cột J)
  ghiChu: string;         // Ghi chú (Cột K)
}

/**
 * Đọc dữ liệu bảng kê gia công từ Google Sheets
 * Header ở dòng 5, dữ liệu từ dòng 6, cột A đến K
 */
export async function getBangKeGiaCongFromSheet(): Promise<BangKeGiaCong[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat10,
      range: `'${sheetNameBangKeGiaCong}'!A6:K`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No bang ke gia cong data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const bangKeList: BangKeGiaCong[] = rows
      .map((row, index) => ({
        id: index + 1,
        maPGC: row[0] || "",
        ngayThang: row[1] || "",
        maSPSX: row[2] || "",
        maSP: row[3] || "",
        xuongSX: row[4] || "",
        soLuong: parseNumberVN(row[5]),
        donGia: parseNumberVN(row[6]),
        thanhTien: parseNumberVN(row[7]),
        phanLoai: row[8] || "",
        doiSoat: row[9] || "",
        ghiChu: row[10] || "",
      }))
      .filter((item) => item.maPGC.trim() !== "");

    return bangKeList;
  } catch (error) {
    console.error("Error reading bang ke gia cong from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm bảng kê gia công mới vào Google Sheets
 */
export async function addBangKeGiaCongToSheet(data: Omit<BangKeGiaCong, 'id' | 'thanhTien'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get column A to find the last row with data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat10,
      range: `'${sheetNameBangKeGiaCong}'!A:A`,
    });

    const rows = response.data.values || [];
    let lastDataRow = 5; // Header at row 5, data starts at row 6
    for (let i = rows.length - 1; i >= 5; i--) {
      if (rows[i] && rows[i][0] && rows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Calculate thanhTien
    const thanhTien = data.soLuong * data.donGia;

    // Format the new row: A-K columns
    const newRow = [
      data.maPGC,
      data.ngayThang,
      data.maSPSX,
      data.maSP,
      data.xuongSX,
      data.soLuong,
      data.donGia,
      thanhTien,
      data.phanLoai,
      data.doiSoat,
      data.ghiChu,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdSanXuat10,
      range: `'${sheetNameBangKeGiaCong}'!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow],
      },
    });

    return true;
  } catch (error) {
    console.error("Error adding bang ke gia cong:", error);
    throw error;
  }
}

/**
 * Xoá bảng kê gia công từ Google Sheets
 */
export async function deleteBangKeGiaCongFromSheet(rowIndex: number): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    const actualRow = rowIndex + 6; // Row 6 = index 0 (since data starts at row 6, header at row 5)

    // Clear the row data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdSanXuat10,
      range: `'${sheetNameBangKeGiaCong}'!A${actualRow}:K${actualRow}`,
    });

    return true;
  } catch (error) {
    console.error("Error deleting bang ke gia cong:", error);
    throw error;
  }
}

// ===================== PHIẾU GIA CÔNG =====================
const spreadsheetIdSanXuat11 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNamePhieuGiaCong = process.env.GOOGLE_SHEET_NAME_PHIEU_GIA_CONG || "Phiếu gia công";

// Interface cho chi tiết phiếu gia công
export interface PhieuGiaCongDetail {
  id: number;
  stt: number;             // STT (Cột A)
  maSanPham: string;       // Mã sản phẩm (Cột B)
  soLuong: number;         // Số lượng (Cột C)
  donGia: number;          // Đơn giá (Cột D)
  thanhTien: number;       // Thành tiền (Cột E)
  ghiChu: string;          // Ghi chú (Cột F)
}

// Interface cho thông tin header phiếu gia công
export interface PhieuGiaCongInfo {
  maPhieu: string;         // Mã phiếu (B3)
  ngay: string;            // Ngày (B4)
  xuongSX: string;         // Xưởng sản xuất (E3)
  tongSoLuong: number;     // Tổng số lượng (E4)
  details: PhieuGiaCongDetail[];
}

/**
 * Đọc dữ liệu phiếu gia công từ Google Sheets
 * Header info: Row 3-4, Data header: Row 6, Data: Row 7+
 */
export async function getPhieuGiaCongFromSheet(): Promise<PhieuGiaCongInfo> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu từ A1 đến F100
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat11,
      range: `'${sheetNamePhieuGiaCong}'!A1:F100`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return {
        maPhieu: "",
        ngay: "",
        xuongSX: "",
        tongSoLuong: 0,
        details: [],
      };
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Đọc thông tin header (Row 3 = index 2, Row 4 = index 3)
    const maPhieu = rows[2]?.[1]?.toString().trim() || "";
    const ngay = rows[3]?.[1]?.toString().trim() || "";
    const xuongSX = rows[2]?.[4]?.toString().trim() || "";
    const tongSoLuong = parseNumberVN(rows[3]?.[4]);

    // Đọc chi tiết từ row 7 (index 6)
    const details: PhieuGiaCongDetail[] = [];
    for (let i = 6; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const stt = parseNumberVN(row[0]);
      const maSanPham = row[1]?.toString().trim() || "";

      // Skip empty rows
      if (!maSanPham && stt === 0) continue;

      details.push({
        id: i + 1,
        stt: stt,
        maSanPham: maSanPham,
        soLuong: parseNumberVN(row[2]),
        donGia: parseNumberVN(row[3]),
        thanhTien: parseNumberVN(row[4]),
        ghiChu: row[5]?.toString().trim() || "",
      });
    }

    return {
      maPhieu,
      ngay,
      xuongSX,
      tongSoLuong,
      details,
    };
  } catch (error) {
    console.error("Error reading phieu gia cong from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật mã phiếu gia công được chọn (cell B3)
 */
export async function updatePhieuGiaCongSelection(maPhieu: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat11,
      range: `'${sheetNamePhieuGiaCong}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[maPhieu]],
      },
    });
  } catch (error) {
    console.error("Error updating phieu gia cong selection:", error);
    throw error;
  }
}

// ===================== CNPT XƯỞNG GIA CÔNG =====================
const spreadsheetIdSanXuat12 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameCNPTXuongGiaCong = process.env.GOOGLE_SHEET_NAME_CNPT_XUONG_GIA_CONG || "CNPT xưởng gia công";

// Interface cho bảng 1: Công nợ phải trả xưởng SX theo tháng (Cột A-G)
export interface CNPTXuongThang {
  id: number;
  stt: number;             // STT (Cột A)
  xuongSX: string;         // Xưởng SX (Cột B)
  duDau: number;           // Dư đầu (Cột C)
  tienGiaCong: number;     // Tiền gia công (Cột D)
  thanhToan: number;       // Thanh toán (Cột E)
  duCuoi: number;          // Dư cuối (Cột G)
}

// Interface cho bảng 2: Số dư đầu kì đến ngày (Cột H-K)
export interface CNPTXuongNgay {
  id: number;
  stt: number;             // STT (Cột H)
  xuongSX: string;         // Xưởng SX (Cột I)
  soTien: number;          // Số tiền (Cột K)
}

/**
 * Đọc dữ liệu CNPT xưởng gia công theo tháng từ Google Sheets (Bảng 1)
 * Header ở dòng 5, dữ liệu từ dòng 6, cột A đến F
 */
export async function getCNPTXuongThangFromSheet(): Promise<CNPTXuongThang[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat12,
      range: `'${sheetNameCNPTXuongGiaCong}'!A6:F`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No CNPT xuong thang data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const cnptList: CNPTXuongThang[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        xuongSX: row[1] || "",
        duDau: parseNumberVN(row[2]),
        tienGiaCong: parseNumberVN(row[3]),
        thanhToan: parseNumberVN(row[4]),
        duCuoi: parseNumberVN(row[5]), // Cột F (index 5)
      }))
      .filter((item) => item.xuongSX.trim() !== "" && !item.xuongSX.startsWith('#'));

    return cnptList;
  } catch (error) {
    console.error("Error reading CNPT xuong thang from Google Sheets:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu số dư đầu kì xưởng SX đến ngày từ Google Sheets (Bảng 2)
 * Header ở dòng 5, dữ liệu từ dòng 6, cột H đến J
 */
export async function getCNPTXuongNgayFromSheet(): Promise<CNPTXuongNgay[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat12,
      range: `'${sheetNameCNPTXuongGiaCong}'!H6:J`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No CNPT xuong ngay data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const cnptNgayList: CNPTXuongNgay[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        xuongSX: row[1] || "",
        soTien: parseNumberVN(row[2]), // Cột J (index 2 trong range H-J)
      }))
      .filter((item) => item.xuongSX.trim() !== "" && !item.xuongSX.startsWith('#'));

    return cnptNgayList;
  } catch (error) {
    console.error("Error reading CNPT xuong ngay from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật giá trị ngày/tháng filter trong sheet CNPT xưởng gia công
 * C3 = tháng/năm cho bảng 1 (format: M/YYYY)
 * J3 = ngày cho bảng 2 (format: D/M/YYYY)
 */
export async function updateCNPTXuongGiaCongDateCells(params: {
  thangNam?: string; // Format: "YYYY-MM"
  denNgay?: string;  // Format: "YYYY-MM-DD"
}): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const { thangNam, denNgay } = params;

    const updates: { range: string; values: any[][] }[] = [];

    // Convert thangNam (YYYY-MM) to sheet format (M/YYYY)
    if (thangNam) {
      const [year, month] = thangNam.split("-");
      const monthNum = parseInt(month, 10); // Remove leading zero
      const sheetDateThang = `${monthNum}/${year}`;

      updates.push({
        range: `'${sheetNameCNPTXuongGiaCong}'!C3`,
        values: [[sheetDateThang]],
      });
      console.log("Updating CNPT Xuong Gia Cong C3 with:", sheetDateThang);
    }

    // Convert denNgay (YYYY-MM-DD) to sheet format (D/M/YYYY)
    if (denNgay) {
      const [year, month, day] = denNgay.split("-");
      const dayNum = parseInt(day, 10); // Remove leading zero
      const monthNum = parseInt(month, 10); // Remove leading zero
      const sheetDateNgay = `${dayNum}/${monthNum}/${year}`;

      updates.push({
        range: `'${sheetNameCNPTXuongGiaCong}'!J3`,
        values: [[sheetDateNgay]],
      });
      console.log("Updating CNPT Xuong Gia Cong J3 with:", sheetDateNgay);
    }

    // Batch update all cells
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetIdSanXuat12,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: updates,
        },
      });
      console.log("Successfully updated date cells in CNPT Xuong Gia Cong sheet");
    }
  } catch (error) {
    console.error("Error updating CNPT Xuong Gia Cong date cells:", error);
    throw error;
  }
}

/**
 * Đọc giá trị ngày/tháng filter hiện tại từ sheet CNPT xưởng gia công
 * C3 = tháng/năm cho bảng 1 (format trong sheet: M/YYYY hoặc 'M/YYYY)
 * J3 = ngày cho bảng 2 (format trong sheet: D/M/YYYY)
 * Returns: { thangNam: "YYYY-MM", denNgay: "YYYY-MM-DD" }
 */
export async function getCNPTXuongGiaCongDateCells(): Promise<{
  thangNam: string;
  denNgay: string;
}> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Read both cells C3 and J3
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetIdSanXuat12,
      ranges: [
        `'${sheetNameCNPTXuongGiaCong}'!C3`,
        `'${sheetNameCNPTXuongGiaCong}'!J3`,
      ],
    });

    const values = response.data.valueRanges;
    let thangNam = "";
    let denNgay = "";

    // Parse C3 (format: M/YYYY or 'M/YYYY) -> YYYY-MM
    if (values?.[0]?.values?.[0]?.[0]) {
      const c3Value = String(values[0].values[0][0]).replace(/^'/, ""); // Remove leading apostrophe if present
      const parts = c3Value.split("/");
      if (parts.length === 2) {
        const month = parts[0].padStart(2, "0");
        const year = parts[1];
        thangNam = `${year}-${month}`;
      }
    }

    // Parse J3 (format: D/M/YYYY) -> YYYY-MM-DD
    if (values?.[1]?.values?.[0]?.[0]) {
      const j3Value = String(values[1].values[0][0]);
      const parts = j3Value.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        denNgay = `${year}-${month}-${day}`;
      }
    }

    // Fallback to current date if parsing fails
    if (!thangNam) {
      const now = new Date();
      thangNam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!denNgay) {
      denNgay = new Date().toISOString().split("T")[0];
    }

    console.log("Read CNPT Xuong Gia Cong date cells:", { thangNam, denNgay });
    return { thangNam, denNgay };
  } catch (error) {
    console.error("Error reading CNPT Xuong Gia Cong date cells:", error);
    // Return current date as fallback
    const now = new Date();
    return {
      thangNam: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      denNgay: now.toISOString().split("T")[0],
    };
  }
}

// ============================================
// DANH MỤC HÌNH IN
// ============================================

const spreadsheetIdSanXuat13 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameDanhMucHinhIn = process.env.GOOGLE_SHEET_NAME_DANH_MUC_HINH_IN || "Danh mục HI";

export interface DanhMucHinhIn {
  id: number;
  maHinhIn: string;
  thongTinHinhIn: string;
  hinhAnh: string;
  donGiaChuaThue: number;
  thueSuat: string;
  donGiaCoThue: number;
  maSPSuDung: string;
  xuongIn: string;
}

/**
 * Đọc danh mục hình in từ Google Sheets
 * Header dòng 5, dữ liệu từ dòng 6
 * Columns: A-H (Mã hình in, Thông tin hình in, Hình ảnh, Đơn giá chưa thuế, Thuế suất, Đơn giá có thuế, Mã SP sử dụng, Xưởng in)
 */
export async function getDanhMucHinhInFromSheet(): Promise<DanhMucHinhIn[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat13,
      range: `'${sheetNameDanhMucHinhIn}'!A6:H`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No danh muc hinh in data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const danhMucList: DanhMucHinhIn[] = rows
      .map((row, index) => ({
        id: index + 1,
        maHinhIn: row[0] || "",
        thongTinHinhIn: row[1] || "",
        hinhAnh: row[2] || "",
        donGiaChuaThue: parseNumberVN(row[3]),
        thueSuat: row[4] || "",
        donGiaCoThue: parseNumberVN(row[5]),
        maSPSuDung: row[6] || "",
        xuongIn: row[7] || "",
      }))
      .filter((item) => item.maHinhIn.trim() !== "" && !item.maHinhIn.startsWith('#'));

    return danhMucList;
  } catch (error) {
    console.error("Error reading danh muc hinh in from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm danh mục hình in mới vào Google Sheets
 */
export async function addDanhMucHinhInToSheet(
  danhMuc: Omit<DanhMucHinhIn, "id">
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Format number for Vietnamese format
    const formatNumberVN = (num: number): string => {
      if (!num || num === 0) return "";
      return num.toLocaleString("vi-VN");
    };

    const values = [
      [
        danhMuc.maHinhIn,
        danhMuc.thongTinHinhIn,
        danhMuc.hinhAnh || "",
        formatNumberVN(danhMuc.donGiaChuaThue),
        danhMuc.thueSuat || "",
        formatNumberVN(danhMuc.donGiaCoThue),
        danhMuc.maSPSuDung || "",
        danhMuc.xuongIn || "",
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdSanXuat13,
      range: `'${sheetNameDanhMucHinhIn}'!A6:H`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error adding danh muc hinh in to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật danh mục hình in trong Google Sheets
 */
export async function updateDanhMucHinhInInSheet(
  danhMuc: DanhMucHinhIn
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Row = id + 5 (header ở dòng 5, data từ dòng 6)
    const rowNumber = danhMuc.id + 5;

    // Format number for Vietnamese format
    const formatNumberVN = (num: number): string => {
      if (!num || num === 0) return "";
      return num.toLocaleString("vi-VN");
    };

    const values = [
      [
        danhMuc.maHinhIn,
        danhMuc.thongTinHinhIn,
        danhMuc.hinhAnh || "",
        formatNumberVN(danhMuc.donGiaChuaThue),
        danhMuc.thueSuat || "",
        formatNumberVN(danhMuc.donGiaCoThue),
        danhMuc.maSPSuDung || "",
        danhMuc.xuongIn || "",
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat13,
      range: `'${sheetNameDanhMucHinhIn}'!A${rowNumber}:H${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error updating danh muc hinh in in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa danh mục hình in khỏi Google Sheets
 */
export async function deleteDanhMucHinhInFromSheet(
  danhMucId: number
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdSanXuat13,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameDanhMucHinhIn
    );

    if (!sheet?.properties?.sheetId) {
      throw new Error("Sheet not found");
    }

    // Row = id + 5 (header ở dòng 5, data từ dòng 6)
    const rowIndex = danhMucId + 4; // 0-based index

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdSanXuat13,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error deleting danh muc hinh in from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// NHẬP KHO HÌNH IN
// ============================================

const spreadsheetIdSanXuat14 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameNhapKhoHinhIn = process.env.GOOGLE_SHEET_NAME_NHAP_KHO_HINH_IN || "Nhập kho HI";

export interface NhapKhoHinhIn {
  id: number;
  ngayThang: string;      // Cột A - Ngày tháng
  maHinhIn: string;       // Cột B - Mã hình in
  hinhAnh: string;        // Cột C - Hình ảnh
  soLuong: number;        // Cột D - Số lượng
}

/**
 * Đọc dữ liệu nhập kho hình in từ Google Sheets
 * Header dòng 5, dữ liệu từ dòng 6
 * Columns: A-D (Ngày tháng, Mã hình in, Hình ảnh, Số lượng)
 */
export async function getNhapKhoHinhInFromSheet(): Promise<NhapKhoHinhIn[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat14,
      range: `'${sheetNameNhapKhoHinhIn}'!A6:D`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No nhap kho hinh in data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const nhapKhoList: NhapKhoHinhIn[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngayThang: row[0] || "",
        maHinhIn: row[1] || "",
        hinhAnh: row[2] || "",
        soLuong: parseNumberVN(row[3]),
      }))
      .filter((item) => item.ngayThang.trim() !== "" && !item.ngayThang.startsWith('#') && item.maHinhIn.trim() !== "");

    return nhapKhoList;
  } catch (error) {
    console.error("Error reading nhap kho hinh in from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm nhập kho hình in vào Google Sheets
 * Tìm hàng trống đầu tiên (dựa trên cột A - Ngày tháng) để thêm dữ liệu
 */
export async function addNhapKhoHinhInToSheet(
  nhapKho: Omit<NhapKhoHinhIn, "id">
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // First, get all data in column A to find the first empty row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat14,
      range: `'${sheetNameNhapKhoHinhIn}'!A6:A`,
    });

    const rows = response.data.values || [];

    // Find first empty row (row with no date or empty date)
    let insertRowIndex = 6; // Default to row 6 if no data
    for (let i = 0; i < rows.length; i++) {
      const cellValue = rows[i]?.[0] || "";
      if (cellValue.trim() === "" || cellValue.startsWith("#")) {
        insertRowIndex = i + 6; // Convert to actual row number (data starts at row 6)
        break;
      }
      insertRowIndex = i + 7; // If all rows have data, insert after the last one
    }

    // Format number for Vietnamese locale
    const formatNumber = (num: number): string => {
      return num.toLocaleString("vi-VN");
    };

    const values = [
      [
        nhapKho.ngayThang,
        nhapKho.maHinhIn,
        nhapKho.hinhAnh,
        formatNumber(nhapKho.soLuong),
      ],
    ];

    // Use update instead of append to insert at the specific row
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat14,
      range: `'${sheetNameNhapKhoHinhIn}'!A${insertRowIndex}:D${insertRowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log(`Nhap kho hinh in added successfully at row ${insertRowIndex}`);
  } catch (error) {
    console.error("Error adding nhap kho hinh in to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật nhập kho hình in trong Google Sheets
 */
export async function updateNhapKhoHinhInInSheet(
  nhapKho: NhapKhoHinhIn
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Format number for Vietnamese locale
    const formatNumber = (num: number): string => {
      return num.toLocaleString("vi-VN");
    };

    // Row index = id + 5 (header at row 5, data starts at row 6)
    const rowIndex = nhapKho.id + 5;

    const values = [
      [
        nhapKho.ngayThang,
        nhapKho.maHinhIn,
        nhapKho.hinhAnh,
        formatNumber(nhapKho.soLuong),
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat14,
      range: `'${sheetNameNhapKhoHinhIn}'!A${rowIndex}:D${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log("Nhap kho hinh in updated successfully");
  } catch (error) {
    console.error("Error updating nhap kho hinh in in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa nhập kho hình in khỏi Google Sheets
 */
export async function deleteNhapKhoHinhInFromSheet(
  nhapKhoId: number
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Row index = id + 5 (header at row 5, data starts at row 6)
    const rowIndex = nhapKhoId + 5;

    // Clear the row content
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdSanXuat14,
      range: `'${sheetNameNhapKhoHinhIn}'!A${rowIndex}:D${rowIndex}`,
    });

    console.log("Nhap kho hinh in deleted successfully");
  } catch (error) {
    console.error("Error deleting nhap kho hinh in from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// CHI PHÍ HÌNH IN
// ============================================

const spreadsheetIdSanXuat15 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameChiPhiHinhIn = process.env.GOOGLE_SHEET_NAME_CHI_PHI_HINH_IN || "Chi phí HI";

export interface ChiPhiHinhIn {
  id: number;
  ngayThang: string;
  maHinhIn: string;
  soLuong: number;
  donGiaSauThue: number;
  thanhTien: number;
  maSPSuDung: string;
  ghiChu: string;
}

/**
 * Đọc dữ liệu chi phí hình in từ Google Sheets
 * Header dòng 5, dữ liệu từ dòng 6
 * Columns: A-G (Ngày tháng, Mã hình in, Số lượng, Đơn giá sau thuế, Thành tiền, Mã SP sử dụng, Ghi chú)
 */
export async function getChiPhiHinhInFromSheet(): Promise<ChiPhiHinhIn[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat15,
      range: `'${sheetNameChiPhiHinhIn}'!A6:G`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No chi phi hinh in data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const chiPhiList: ChiPhiHinhIn[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngayThang: row[0] || "",
        maHinhIn: row[1] || "",
        soLuong: parseNumberVN(row[2]),
        donGiaSauThue: parseNumberVN(row[3]),
        thanhTien: parseNumberVN(row[4]),
        maSPSuDung: row[5] || "",
        ghiChu: row[6] || "",
      }))
      .filter((item) => item.ngayThang.trim() !== "" && !item.ngayThang.startsWith('#') && item.maHinhIn.trim() !== "");

    return chiPhiList;
  } catch (error) {
    console.error("Error reading chi phi hinh in from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// XUẤT KHO HÌNH IN
// ============================================

const spreadsheetIdSanXuat16 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG;
const sheetNameXuatKhoHinhIn = process.env.GOOGLE_SHEET_NAME_XUAT_KHO_HINH_IN || "Xuất hình in";

export interface XuatKhoHinhIn {
  id: number;
  ngayThang: string;      // Cột A - Ngày đặt
  maHinhIn: string;       // Cột B - Mã hình in
  soLuong: number;        // Cột C - Tổng SL
}

/**
 * Đọc dữ liệu xuất hình in từ Google Sheets
 * Header dòng 5, dữ liệu từ dòng 6
 * Columns: A-C (Ngày đặt, Mã hình in, Tổng SL)
 */
export async function getXuatKhoHinhInFromSheet(): Promise<XuatKhoHinhIn[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat16,
      range: `'${sheetNameXuatKhoHinhIn}'!A6:C`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No xuat kho hinh in data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const xuatKhoList: XuatKhoHinhIn[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngayThang: row[0] || "",
        maHinhIn: row[1] || "",
        soLuong: parseNumberVN(row[2]),
      }))
      .filter((item) => item.ngayThang.trim() !== "" && !item.ngayThang.startsWith('#') && item.maHinhIn.trim() !== "");

    return xuatKhoList;
  } catch (error) {
    console.error("Error reading xuat kho hinh in from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm xuất kho hình in vào Google Sheets
 * Tìm hàng trống đầu tiên (dựa trên cột A - Ngày tháng) để thêm dữ liệu
 */
export async function addXuatKhoHinhInToSheet(
  xuatKho: Omit<XuatKhoHinhIn, "id">
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // First, get all data in column A to find the first empty row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat16,
      range: `'${sheetNameXuatKhoHinhIn}'!A6:A`,
    });

    const rows = response.data.values || [];

    // Find first empty row (row with no date or empty date)
    let insertRowIndex = 6; // Default to row 6 if no data
    for (let i = 0; i < rows.length; i++) {
      const cellValue = rows[i]?.[0] || "";
      if (cellValue.trim() === "" || cellValue.startsWith("#")) {
        insertRowIndex = i + 6; // Convert to actual row number (data starts at row 6)
        break;
      }
      insertRowIndex = i + 7; // If all rows have data, insert after the last one
    }

    // Format number for Vietnamese locale
    const formatNumber = (num: number): string => {
      return num.toLocaleString("vi-VN");
    };

    const values = [
      [
        xuatKho.ngayThang,
        xuatKho.maHinhIn,
        formatNumber(xuatKho.soLuong),
      ],
    ];

    // Use update instead of append to insert at the specific row
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat16,
      range: `'${sheetNameXuatKhoHinhIn}'!A${insertRowIndex}:C${insertRowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log(`Xuat kho hinh in added successfully at row ${insertRowIndex}`);
  } catch (error) {
    console.error("Error adding xuat kho hinh in to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật xuất kho hình in trong Google Sheets
 */
export async function updateXuatKhoHinhInInSheet(
  xuatKho: XuatKhoHinhIn
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Format number for Vietnamese locale
    const formatNumber = (num: number): string => {
      return num.toLocaleString("vi-VN");
    };

    // Row index = id + 5 (header at row 5, data starts at row 6)
    const rowIndex = xuatKho.id + 5;

    const values = [
      [
        xuatKho.ngayThang,
        xuatKho.maHinhIn,
        formatNumber(xuatKho.soLuong),
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat16,
      range: `'${sheetNameXuatKhoHinhIn}'!A${rowIndex}:C${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log("Xuat kho hinh in updated successfully");
  } catch (error) {
    console.error("Error updating xuat kho hinh in in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa xuất kho hình in khỏi Google Sheets
 */
export async function deleteXuatKhoHinhInFromSheet(
  xuatKhoId: number
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Row index = id + 5 (header at row 5, data starts at row 6)
    const rowIndex = xuatKhoId + 5;

    // Clear the row content
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdSanXuat16,
      range: `'${sheetNameXuatKhoHinhIn}'!A${rowIndex}:F${rowIndex}`,
    });

    console.log("Xuat kho hinh in deleted successfully");
  } catch (error) {
    console.error("Error deleting xuat kho hinh in from Google Sheets:", error);
    throw error;
  }
}

// ============================================
// TỒN KHO HÌNH IN
// ============================================

const spreadsheetIdSanXuat17 = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameTonKhoHinhIn = process.env.GOOGLE_SHEET_NAME_TON_KHO_HINH_IN || "Tồn kho HI";

// Bảng 1: Tồn kho theo tháng (A-E)
export interface TonKhoHinhInThang {
  id: number;
  maHI: string;
  duDauKi: number;
  nhapKho: number;
  xuatKho: number;
  duCuoiKi: number;
}

// Bảng 2: Số dư đầu kì đến ngày (G-H)
export interface TonKhoHinhInNgay {
  id: number;
  maHI: string;
  soLuong: number;
}

/**
 * Đọc dữ liệu tồn kho hình in theo tháng từ Google Sheets
 * Bảng 1: Columns A-E (Mã HI, Dư đầu kì, Nhập kho, Xuất kho, Dư cuối kì)
 * Header dòng 5, dữ liệu từ dòng 6
 * @param monthYear - Tháng/năm format "MM/YYYY" (e.g., "12/2025")
 */
export async function getTonKhoHinhInThangFromSheet(monthYear?: string): Promise<TonKhoHinhInThang[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Nếu có monthYear, cập nhật ô C3 trước khi đọc data
    if (monthYear) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdSanXuat17,
        range: `'${sheetNameTonKhoHinhIn}'!C3`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[monthYear]],
        },
      });
      // Đợi một chút để sheet tính toán lại
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat17,
      range: `'${sheetNameTonKhoHinhIn}'!A6:E`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No ton kho hinh in thang data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const tonKhoList: TonKhoHinhInThang[] = rows
      .map((row, index) => ({
        id: index + 1,
        maHI: row[0] || "",
        duDauKi: parseNumberVN(row[1]),
        nhapKho: parseNumberVN(row[2]),
        xuatKho: parseNumberVN(row[3]),
        duCuoiKi: parseNumberVN(row[4]),
      }))
      .filter((item) => item.maHI.trim() !== "" && !item.maHI.startsWith('#'));

    return tonKhoList;
  } catch (error) {
    console.error("Error reading ton kho hinh in thang from Google Sheets:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu số dư đầu kì hình in đến ngày từ Google Sheets
 * Bảng 2: Columns G-H (Mã HI, Số lượng)
 * Header dòng 5, dữ liệu từ dòng 6
 * @param toDate - Ngày đến format "DD/MM/YY" (e.g., "31/12/25")
 */
export async function getTonKhoHinhInNgayFromSheet(toDate?: string): Promise<TonKhoHinhInNgay[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Nếu có toDate, cập nhật ô I3 trước khi đọc data
    if (toDate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdSanXuat17,
        range: `'${sheetNameTonKhoHinhIn}'!I3`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[toDate]],
        },
      });
      // Đợi một chút để sheet tính toán lại
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdSanXuat17,
      range: `'${sheetNameTonKhoHinhIn}'!G6:H`, // Header dòng 5, dữ liệu từ dòng 6
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No ton kho hinh in ngay data found in sheet.");
      return [];
    }

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const tonKhoNgayList: TonKhoHinhInNgay[] = rows
      .map((row, index) => ({
        id: index + 1,
        maHI: row[0] || "",
        soLuong: parseNumberVN(row[1]),
      }))
      .filter((item) => item.maHI.trim() !== "" && !item.maHI.startsWith('#'));

    return tonKhoNgayList;
  } catch (error) {
    console.error("Error reading ton kho hinh in ngay from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật số lượng tồn kho hình in (bảng Số dư đầu kì đến ngày)
 * Column H: Số lượng
 * @param id - ID của item (row = id + 5)
 * @param soLuong - Số lượng mới
 */
export async function updateTonKhoHinhInNgay(id: number, soLuong: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = id + 5; // Data starts from row 6, id starts from 1

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat17,
      range: `'${sheetNameTonKhoHinhIn}'!H${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[soLuong]],
      },
    });

    console.log(`Updated ton kho hinh in ngay at row ${rowIndex}, soLuong: ${soLuong}`);
  } catch (error) {
    console.error("Error updating ton kho hinh in ngay:", error);
    throw error;
  }
}

/**
 * Cập nhật tồn kho hình in theo tháng
 * Column B: Dư đầu kì
 * @param id - ID của item (row = id + 5)
 * @param duDauKi - Dư đầu kì mới
 */
export async function updateTonKhoHinhInThang(id: number, duDauKi: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = id + 5; // Data starts from row 6, id starts from 1

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdSanXuat17,
      range: `'${sheetNameTonKhoHinhIn}'!B${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[duDauKi]],
      },
    });

    console.log(`Updated ton kho hinh in thang at row ${rowIndex}, duDauKi: ${duDauKi}`);
  } catch (error) {
    console.error("Error updating ton kho hinh in thang:", error);
    throw error;
  }
}

// ============================================
// LỆNH SẢN XUẤT (LSX)
// ============================================

const spreadsheetIdLSX = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_SAN_XUAT;
const sheetNameLSX = process.env.GOOGLE_SHEET_NAME_KE_HOACH_SAN_XUAT || "LSX";

export interface LSXDetail {
  id: number;
  stt: number;
  maSP: string;
  tenSP: string;
  dongSize: string;
  maVaiChinh: string;
  mauSac: string;
  hinhAnh: string;
  sizes: { [key: string]: number };
  tongSoLuong: number;
}

export interface LSXInfo {
  maLenh: string;
  ngayRaLenh: string;
  xuong: string;
  ngayHoanThanh: string;
  ghiChu: string;
  tongSLTrongLenh: number;
  details: LSXDetail[];
}

// Size column headers (H to AA)
const SIZE_COLUMNS = [
  "0/1", "1/2", "2/3", "3/4", "4/5", "5/6", "6/7", "7/8", "8/9", "9/10",
  "10/11", "11/12", "12/13", "13/14", "14/15", "XS", "S", "M", "L", "XL"
];

/**
 * Đọc thông tin Lệnh Sản Xuất từ Google Sheets
 * Header info: Row 3-5 (Mã lệnh B3, Ngày ra lệnh F3, Xưởng B4, Ngày hoàn thành F4, Ghi chú B5, Tổng SL F5)
 * Table header: Row 7
 * Table data: Row 8+
 */
export async function getLSXInfoFromSheet(): Promise<LSXInfo> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc header info (rows 3-5)
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameLSX}'!A3:F5`,
    });

    const headerRows = headerResponse.data.values || [];

    // Parse header info
    const maLenh = headerRows[0]?.[1] || ""; // B3
    const ngayRaLenh = headerRows[0]?.[4] || ""; // E3 (Ngày ra lệnh value is at column E/F)
    const xuong = headerRows[1]?.[1] || ""; // B4
    const ngayHoanThanh = headerRows[1]?.[4] || ""; // E4
    const ghiChu = headerRows[2]?.[1] || ""; // B5

    // Helper function to parse Vietnamese number format
    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const tongSLTrongLenh = parseNumberVN(headerRows[2]?.[4]); // E5

    // Đọc table data (từ row 8)
    const tableResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameLSX}'!A8:AB`, // A to AB (28 columns)
    });

    const tableRows = tableResponse.data.values || [];

    const details: LSXDetail[] = tableRows
      .map((row, index) => {
        // Parse sizes (columns H to AA, index 7 to 26)
        const sizes: { [key: string]: number } = {};
        SIZE_COLUMNS.forEach((sizeLabel, i) => {
          const value = parseNumberVN(row[7 + i]);
          if (value > 0) {
            sizes[sizeLabel] = value;
          }
        });

        return {
          id: index + 1,
          stt: parseNumberVN(row[0]),
          maSP: row[1] || "",
          tenSP: row[2] || "",
          dongSize: row[3] || "",
          maVaiChinh: row[4] || "",
          mauSac: row[5] || "",
          hinhAnh: row[6] || "",
          sizes,
          tongSoLuong: parseNumberVN(row[27]), // Column AB (index 27)
        };
      })
      .filter((item) => item.maSP.trim() !== "" && !item.maSP.startsWith('#'));

    return {
      maLenh,
      ngayRaLenh,
      xuong,
      ngayHoanThanh,
      ghiChu,
      tongSLTrongLenh,
      details,
    };
  } catch (error) {
    console.error("Error reading LSX info from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật mã lệnh LSX vào ô B3 để thay đổi lệnh sản xuất hiển thị
 */
export async function updateLSXMaLenh(maLenh: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameLSX}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[maLenh]],
      },
    });
  } catch (error) {
    console.error("Error updating LSX ma lenh:", error);
    throw error;
  }
}

// ==================== ĐỊNH MỨC SẢN XUẤT ====================
const sheetNameDinhMucSX = process.env.GOOGLE_SHEET_NAME_DINH_MUC_SAN_XUAT || "Định mức sản xuất";

export interface DinhMucSX {
  id: number;
  maSP: string;
  vaiChinh: string;
  vaiPhoi1: string;
  vaiPhoi2: string;
  vaiPhoi3: string;
  vaiPhoi4: string;
  vaiPhoi5: string;
  phuLieu1: string;
  phuLieu2: string;
  phuLieu3: string;
  phuLieu4: string;
  phuLieu5: string;
  phuKien1: string;
  phuKien2: string;
  phuKien3: string;
  phuKien4: string;
  phuKien5: string;
  khac: string;
}

/**
 * Lấy dữ liệu định mức sản xuất từ Google Sheets
 * Header row 5, data từ row 6
 * Columns: Mã SP (A), Vải chính (B), Vải phối 1-5 (C-G),
 *          Phụ liệu 1-5 (H-L), Phụ kiện 1-5 (M-Q), Khác (R)
 */
export async function getDinhMucSXFromSheet(): Promise<DinhMucSX[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDinhMucSX}'!A6:R`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    const data: DinhMucSX[] = rows
      .map((row, index) => ({
        id: index + 1,
        maSP: row[0] || "",
        vaiChinh: row[1] || "",
        vaiPhoi1: row[2] || "",
        vaiPhoi2: row[3] || "",
        vaiPhoi3: row[4] || "",
        vaiPhoi4: row[5] || "",
        vaiPhoi5: row[6] || "",
        phuLieu1: row[7] || "",
        phuLieu2: row[8] || "",
        phuLieu3: row[9] || "",
        phuLieu4: row[10] || "",
        phuLieu5: row[11] || "",
        phuKien1: row[12] || "",
        phuKien2: row[13] || "",
        phuKien3: row[14] || "",
        phuKien4: row[15] || "",
        phuKien5: row[16] || "",
        khac: row[17] || "",
      }))
      .filter((item) => item.maSP.trim() !== "");

    return data;
  } catch (error) {
    console.error("Error reading Dinh Muc SX from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm định mức sản xuất mới vào Google Sheets
 */
export async function addDinhMucSXToSheet(dinhMuc: Omit<DinhMucSX, "id">): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDinhMucSX}'!A:R`,
    });

    const allRows = response.data.values || [];

    // Tìm dòng cuối có dữ liệu (data bắt đầu từ dòng 6, header dòng 5)
    let lastDataRow = 5;
    for (let i = allRows.length - 1; i >= 5; i--) {
      if (allRows[i] && allRows[i][0] && allRows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = Math.max(lastDataRow + 1, 6);

    const values = [
      [
        dinhMuc.maSP,
        dinhMuc.vaiChinh,
        dinhMuc.vaiPhoi1,
        dinhMuc.vaiPhoi2,
        dinhMuc.vaiPhoi3,
        dinhMuc.vaiPhoi4,
        dinhMuc.vaiPhoi5,
        dinhMuc.phuLieu1,
        dinhMuc.phuLieu2,
        dinhMuc.phuLieu3,
        dinhMuc.phuLieu4,
        dinhMuc.phuLieu5,
        dinhMuc.phuKien1,
        dinhMuc.phuKien2,
        dinhMuc.phuKien3,
        dinhMuc.phuKien4,
        dinhMuc.phuKien5,
        dinhMuc.khac,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDinhMucSX}'!A${nextRow}:R${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added Dinh Muc SX at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding Dinh Muc SX to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật định mức sản xuất trong Google Sheets
 */
export async function updateDinhMucSXInSheet(dinhMuc: DinhMucSX): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // id 1 = dòng 6 (vì data bắt đầu từ dòng 6)
    const rowNumber = dinhMuc.id + 5;

    const values = [
      [
        dinhMuc.maSP,
        dinhMuc.vaiChinh,
        dinhMuc.vaiPhoi1,
        dinhMuc.vaiPhoi2,
        dinhMuc.vaiPhoi3,
        dinhMuc.vaiPhoi4,
        dinhMuc.vaiPhoi5,
        dinhMuc.phuLieu1,
        dinhMuc.phuLieu2,
        dinhMuc.phuLieu3,
        dinhMuc.phuLieu4,
        dinhMuc.phuLieu5,
        dinhMuc.phuKien1,
        dinhMuc.phuKien2,
        dinhMuc.phuKien3,
        dinhMuc.phuKien4,
        dinhMuc.phuKien5,
        dinhMuc.khac,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDinhMucSX}'!A${rowNumber}:R${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated Dinh Muc SX at row: ${rowNumber}`);
  } catch (error) {
    console.error("Error updating Dinh Muc SX in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa định mức sản xuất trong Google Sheets (clear row content)
 */
export async function deleteDinhMucSXFromSheet(id: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // id 1 = dòng 6 (vì data bắt đầu từ dòng 6)
    const rowNumber = id + 5;

    // Clear the row content
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDinhMucSX}'!A${rowNumber}:R${rowNumber}`,
    });

    console.log(`Successfully deleted Dinh Muc SX at row: ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting Dinh Muc SX from Google Sheets:", error);
    throw error;
  }
}

// ==================== PHIẾU ĐỊNH MỨC SẢN XUẤT ====================
const sheetNamePhieuDinhMucSX = process.env.GOOGLE_SHEET_NAME_PHIEU_DINH_MUC_SAN_XUAT || "Phiếu định mức SX";

export interface PhieuDinhMucSXData {
  maSP: string;
  items: {
    stt: number;
    noiDung: string;
    dinhMuc: string;
    ghiChu: string;
  }[];
}

/**
 * Lấy dữ liệu phiếu định mức sản xuất từ Google Sheets
 * B3: Mã SP
 * Bảng data từ row 6: STT (A), Nội dung (B), Định mức (C), Ghi chú (D)
 */
export async function getPhieuDinhMucSXFromSheet(): Promise<PhieuDinhMucSXData> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Lấy mã SP từ B3 và data từ A6:D15
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetIdLSX,
      ranges: [
        `'${sheetNamePhieuDinhMucSX}'!B3`,
        `'${sheetNamePhieuDinhMucSX}'!A6:D15`,
      ],
      valueRenderOption: "FORMATTED_VALUE",
    });

    const valueRanges = response.data.valueRanges || [];
    const maSP = valueRanges[0]?.values?.[0]?.[0] || "";
    const dataRows = valueRanges[1]?.values || [];

    const items = dataRows.map((row, index) => ({
      stt: index + 1,
      noiDung: row[1] || "",
      dinhMuc: row[2] || "",
      ghiChu: row[3] || "",
    }));

    return {
      maSP,
      items,
    };
  } catch (error) {
    console.error("Error reading Phieu Dinh Muc SX from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật mã SP trong phiếu định mức sản xuất (B3)
 * Sau khi cập nhật, các công thức trong sheet sẽ tự động tính toán lại
 */
export async function updatePhieuDinhMucSXMaSP(maSP: string): Promise<PhieuDinhMucSXData> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Cập nhật mã SP vào B3
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhieuDinhMucSX}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[maSP]],
      },
    });

    // Đợi một chút để formulas recalculate
    await new Promise(resolve => setTimeout(resolve, 500));

    // Đọc lại data sau khi cập nhật
    return await getPhieuDinhMucSXFromSheet();
  } catch (error) {
    console.error("Error updating Phieu Dinh Muc SX ma SP:", error);
    throw error;
  }
}

// ==================== YÊU CẦU XUẤT KHO NPL ====================
const sheetNameYeuCauXuatKhoNPL = process.env.GOOGLE_SHEET_NAME_YEU_CAU_XUAT_KHO_NPL || "Yêu cầu xuất kho NPL";

export interface YeuCauXuatKhoNPL {
  id: number;
  ngayThang: string;
  maPhieuYC: string;
  maNPL: string;
  dvt: string;
  dinhMuc: number;
  tyLeHaoHut: number; // Always 3% (0.03)
  slKHSX: number;
  slCanDung: number; // = dinhMuc * slKHSX * (1 + tyLeHaoHut)
  maSPSuDung: string;
  mauSac: string;
  xuongSX: string;
}

/**
 * Lấy dữ liệu bảng kê yêu cầu xuất kho NPL từ Google Sheets
 * Header row 5, data từ row 6
 * Columns: Ngày tháng (A), Mã phiếu YC (B), Mã NPL (C), ĐVT (D), Định mức (E),
 *          Tỷ lệ hao hụt (F), SL KH SX (G), SL cần dùng (H), Mã SP sử dụng (I), Màu sắc (J), Xưởng SX (K)
 */
export async function getYeuCauXuatKhoNPLFromSheet(): Promise<YeuCauXuatKhoNPL[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      const strValue = String(value).replace(/\./g, "").replace(",", ".");
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : num;
    };

    const parsePercent = (value: any): number => {
      if (!value) return 0.03; // Default 3%
      const strValue = String(value).replace("%", "").replace(",", ".").trim();
      const num = parseFloat(strValue);
      return isNaN(num) ? 0.03 : num / 100;
    };

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameYeuCauXuatKhoNPL}'!A6:K`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    const data: YeuCauXuatKhoNPL[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngayThang: row[0] || "",
        maPhieuYC: row[1] || "",
        maNPL: row[2] || "",
        dvt: row[3] || "",
        dinhMuc: parseNumberVN(row[4]),
        tyLeHaoHut: parsePercent(row[5]),
        slKHSX: parseNumberVN(row[6]),
        slCanDung: parseNumberVN(row[7]),
        maSPSuDung: row[8] || "",
        mauSac: row[9] || "",
        xuongSX: row[10] || "",
      }))
      .filter((item) => item.maPhieuYC.trim() !== "" || item.maNPL.trim() !== "");

    return data;
  } catch (error) {
    console.error("Error reading Yeu Cau Xuat Kho NPL from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm yêu cầu xuất kho NPL mới vào Google Sheets
 * Data từ row 6, columns A-K
 */
export async function addYeuCauXuatKhoNPLToSheet(data: Omit<YeuCauXuatKhoNPL, "id">): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối cùng có data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameYeuCauXuatKhoNPL}'!A:K`,
    });

    const allRows = response.data.values || [];

    // Tìm dòng cuối cùng có dữ liệu (bỏ qua header rows 1-5)
    let lastDataRow = 5;
    for (let i = allRows.length - 1; i >= 5; i--) {
      if (allRows[i] && (allRows[i][0] || allRows[i][1] || allRows[i][2])) {
        lastDataRow = i;
        break;
      }
    }

    const nextRow = lastDataRow + 2; // +2 vì index từ 0 và cần thêm 1 dòng mới

    // Format số theo định dạng VN
    const formatNumber = (num: number): string => {
      if (num === 0) return "";
      return num.toString().replace(".", ",");
    };

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameYeuCauXuatKhoNPL}'!A${nextRow}:K${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.ngayThang,
            data.maPhieuYC,
            data.maNPL,
            data.dvt,
            formatNumber(data.dinhMuc),
            "3%", // Tỷ lệ hao hụt always 3%
            formatNumber(data.slKHSX),
            formatNumber(data.slCanDung),
            data.maSPSuDung,
            data.mauSac,
            data.xuongSX,
          ],
        ],
      },
    });

    console.log(`Added yeu cau xuat kho NPL at row ${nextRow}`);
  } catch (error) {
    console.error("Error adding Yeu Cau Xuat Kho NPL to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật yêu cầu xuất kho NPL trong Google Sheets
 * @param id - ID của item (1-based, maps to row = id + 5)
 */
export async function updateYeuCauXuatKhoNPLInSheet(id: number, data: Partial<YeuCauXuatKhoNPL>): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Row index: data starts from row 6, id starts from 1
    const rowNumber = id + 5;

    // Format số theo định dạng VN
    const formatNumber = (num: number | undefined): string => {
      if (num === undefined || num === 0) return "";
      return num.toString().replace(".", ",");
    };

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameYeuCauXuatKhoNPL}'!A${rowNumber}:K${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.ngayThang || "",
            data.maPhieuYC || "",
            data.maNPL || "",
            data.dvt || "",
            formatNumber(data.dinhMuc),
            "3%", // Tỷ lệ hao hụt always 3%
            formatNumber(data.slKHSX),
            formatNumber(data.slCanDung),
            data.maSPSuDung || "",
            data.mauSac || "",
            data.xuongSX || "",
          ],
        ],
      },
    });

    console.log(`Updated yeu cau xuat kho NPL at row ${rowNumber}`);
  } catch (error) {
    console.error("Error updating Yeu Cau Xuat Kho NPL in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa yêu cầu xuất kho NPL trong Google Sheets
 * @param id - ID của item (1-based, maps to row = id + 5)
 */
export async function deleteYeuCauXuatKhoNPLFromSheet(id: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Row index: data starts from row 6, id starts from 1
    const rowNumber = id + 5;

    // Get sheet metadata to find sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdLSX,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameYeuCauXuatKhoNPL
    );

    if (!sheet || !sheet.properties?.sheetId) {
      throw new Error(`Cannot find sheet named "${sheetNameYeuCauXuatKhoNPL}" to delete row`);
    }

    // Delete row using batchUpdate
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdLSX,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-based index
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Deleted yeu cau xuat kho NPL at row ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting Yeu Cau Xuat Kho NPL from Google Sheets:", error);
    throw error;
  }
}

// ==================== PHIẾU YÊU CẦU XUẤT KHO NPL ====================
const sheetNamePhieuYCXKNPL = process.env.GOOGLE_SHEET_NAME_PHIEU_YEU_CAU_XUAT_KHO_NPL || "Phiếu yêu cầu XK NPL";

export interface PhieuYCXKNPLDetail {
  id: number;
  stt: number;
  maNPL: string;
  dvt: string;
  dinhMuc: number;
  slSX: number;
  tong: number;
  maSP: string;
}

export interface PhieuYCXKNPLInfo {
  maYeuCau: string;
  ngayThang: string;
  xuongSX: string;
  maSP: string;
  tenSP: string;
  dongSize: string;
  hinhAnh: string;
  details: PhieuYCXKNPLDetail[];
}

/**
 * Lấy dữ liệu phiếu yêu cầu xuất kho NPL từ Google Sheets
 * Header info rows 5-8, table header row 10, data từ row 11
 */
export async function getPhieuYCXKNPLFromSheet(): Promise<PhieuYCXKNPLInfo> {
  try {
    const sheets = await getGoogleSheetsClient();

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      const strValue = String(value).replace(/\./g, "").replace(",", ".");
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : num;
    };

    // Get header info (rows 5-8)
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhieuYCXKNPL}'!A5:G8`,
    });

    const headerRows = headerResponse.data.values || [];

    const maYeuCau = headerRows[0]?.[1] || ""; // B5
    const ngayThang = headerRows[1]?.[1] || ""; // B6
    const xuongSX = headerRows[2]?.[1] || ""; // B7
    const maSP = headerRows[0]?.[4] || ""; // E5
    const tenSP = headerRows[1]?.[4] || ""; // E6
    const dongSize = headerRows[2]?.[4] || ""; // E7
    const hinhAnh = ""; // Image not supported

    // Get table data (from row 11)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhieuYCXKNPL}'!A11:G`,
    });

    const rows = dataResponse.data.values || [];

    const details: PhieuYCXKNPLDetail[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        maNPL: row[1] || "",
        dvt: row[2] || "",
        dinhMuc: parseNumberVN(row[3]),
        slSX: parseNumberVN(row[4]),
        tong: parseNumberVN(row[5]),
        maSP: row[6] || "",
      }))
      .filter((item) => item.maNPL.trim() !== "");

    return {
      maYeuCau,
      ngayThang,
      xuongSX,
      maSP,
      tenSP,
      dongSize,
      hinhAnh,
      details,
    };
  } catch (error) {
    console.error("Error reading Phieu YC XK NPL from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật mã yêu cầu vào ô B5 để thay đổi phiếu hiển thị
 */
export async function updatePhieuYCXKNPLMaYeuCau(maYeuCau: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhieuYCXKNPL}'!B5`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[maYeuCau]],
      },
    });
  } catch (error) {
    console.error("Error updating Phieu YC XK NPL ma yeu cau:", error);
    throw error;
  }
}

// ==================== SỐ LƯỢNG CẮT ====================
const sheetNameSoLuongCat = process.env.GOOGLE_SHEET_NAME_SO_LUONG_CAT || "Số lượng cắt";

export interface SoLuongCat {
  id: number;
  maPhieuCat: string;
  maSP: string;
  lenhSanXuat: string;
  xuongSanXuat: string;
  mauSac: string;
  soLuongKeHoach: number;
  ngayCat: string;
  soLuongCat: number;
  slCatTruSlKH: number;
  tiLeCacMau: string;
  nguyenNhan1: string;
  soLuongNhapKho: number;
  slNKTruSlCat: number;
  nguyenNhan2: string;
  ghiChu: string;
}

/**
 * Lấy dữ liệu số lượng cắt từ Google Sheets
 * Header row 5, data từ row 6
 */
export async function getSoLuongCatFromSheet(): Promise<SoLuongCat[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      const strValue = String(value).replace(/\./g, "").replace(",", ".");
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : num;
    };

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameSoLuongCat}'!A6:O`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    // Columns: A-Mã phiếu, B-Mã SP, C-LSX, D-Xưởng SX, E-Màu sắc, F-SL KH, G-Ngày cắt, H-SL cắt,
    // I-SL cắt - SL KH, J-Tỉ lệ các màu, K-Nguyên nhân 1, L-SL NK, M-SL NK - SL cắt, N-Nguyên nhân 2, O-Ghi chú
    const data: SoLuongCat[] = rows
      .map((row, index) => ({
        id: index + 1,
        maPhieuCat: row[0] || "",
        maSP: row[1] || "",
        lenhSanXuat: row[2] || "",
        xuongSanXuat: row[3] || "",
        mauSac: row[4] || "",
        soLuongKeHoach: parseNumberVN(row[5]),
        ngayCat: row[6] || "",
        soLuongCat: parseNumberVN(row[7]),
        slCatTruSlKH: parseNumberVN(row[8]),
        tiLeCacMau: row[9] || "",
        nguyenNhan1: row[10] || "",
        soLuongNhapKho: parseNumberVN(row[11]),
        slNKTruSlCat: parseNumberVN(row[12]),
        nguyenNhan2: row[13] || "",
        ghiChu: row[14] || "",
      }))
      .filter((item) => item.maPhieuCat.trim() !== "" || item.maSP.trim() !== "");

    return data;
  } catch (error) {
    console.error("Error reading So Luong Cat from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm số lượng cắt mới vào Google Sheets
 */
export async function addSoLuongCatToSheet(data: Omit<SoLuongCat, 'id'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get column A to find the last row with data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameSoLuongCat}'!A:A`,
    });

    const rows = response.data.values || [];

    // Find the last row with actual data
    let lastDataRow = 5; // Header is at row 5, data starts at row 6
    for (let i = rows.length - 1; i >= 5; i--) {
      if (rows[i] && rows[i][0] && rows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1;
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Write to the next row
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameSoLuongCat}'!A${nextRow}:O${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.maPhieuCat,
          data.maSP,
          data.lenhSanXuat,
          data.xuongSanXuat,
          data.mauSac,
          data.soLuongKeHoach,
          data.ngayCat,
          data.soLuongCat,
          data.slCatTruSlKH,
          data.tiLeCacMau || "",
          data.nguyenNhan1,
          data.soLuongNhapKho,
          data.slNKTruSlCat,
          data.nguyenNhan2,
          data.ghiChu,
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error adding So Luong Cat:", error);
    throw error;
  }
}

/**
 * Cập nhật số lượng cắt trong Google Sheets
 * id là vị trí trong data (1-based), cần +5 để có row thực tế trong sheet
 */
export async function updateSoLuongCatInSheet(id: number, data: Omit<SoLuongCat, 'id'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    const actualRow = id + 5; // Data starts from row 6, id starts from 1

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameSoLuongCat}'!A${actualRow}:O${actualRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.maPhieuCat,
          data.maSP,
          data.lenhSanXuat,
          data.xuongSanXuat,
          data.mauSac,
          data.soLuongKeHoach,
          data.ngayCat,
          data.soLuongCat,
          data.slCatTruSlKH,
          data.tiLeCacMau || "",
          data.nguyenNhan1,
          data.soLuongNhapKho,
          data.slNKTruSlCat,
          data.nguyenNhan2,
          data.ghiChu,
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating So Luong Cat:", error);
    throw error;
  }
}

/**
 * Xóa số lượng cắt trong Google Sheets
 * id là vị trí trong data (1-based), cần +5 để có row thực tế trong sheet
 */
export async function deleteSoLuongCatFromSheet(id: number): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    const actualRow = id + 5; // Data starts from row 6, id starts from 1

    // Clear the row content (A to O = 15 columns including Ghi chú)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameSoLuongCat}'!A${actualRow}:O${actualRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error deleting So Luong Cat:", error);
    throw error;
  }
}

// ==================== PHIẾU BÁO SỐ LƯỢNG CẮT ====================
const sheetNamePhieuBaoSLCat = process.env.GOOGLE_SHEET_NAME_PHIEU_BAO_SO_LUONG_CAT || "Phiếu báo Sl cắt";

export interface PhieuBaoSLCatDetail {
  id: number;
  stt: number;
  maSP: string;
  lsx: string;
  xuongSX: string;
  mauSac: string;
  soLuong: number;
  ghiChu: string;
}

export interface PhieuBaoSLCatInfo {
  maPhieu: string;
  ngay: string;
  tongSoLuong: number;
  details: PhieuBaoSLCatDetail[];
}

/**
 * Lấy dữ liệu phiếu báo số lượng cắt từ Google Sheets
 * Header info rows 3-4, table header row 6, data từ row 7
 */
export async function getPhieuBaoSLCatFromSheet(): Promise<PhieuBaoSLCatInfo> {
  try {
    const sheets = await getGoogleSheetsClient();

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      const strValue = String(value).replace(/\./g, "").replace(",", ".");
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : num;
    };

    // Get header info (rows 3-4)
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhieuBaoSLCat}'!A3:G4`,
    });

    const headerRows = headerResponse.data.values || [];

    const maPhieu = headerRows[0]?.[1] || ""; // B3
    const ngay = headerRows[1]?.[1] || ""; // B4
    const tongSoLuong = parseNumberVN(headerRows[1]?.[3]); // D4

    // Get table data (from row 7)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhieuBaoSLCat}'!A7:G`,
    });

    const rows = dataResponse.data.values || [];

    const details: PhieuBaoSLCatDetail[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[0]),
        maSP: row[1] || "",
        lsx: row[2] || "",
        xuongSX: row[3] || "",
        mauSac: row[4] || "",
        soLuong: parseNumberVN(row[5]),
        ghiChu: row[6] || "",
      }))
      .filter((item) => item.maSP.trim() !== "");

    return {
      maPhieu,
      ngay,
      tongSoLuong,
      details,
    };
  } catch (error) {
    console.error("Error reading Phieu Bao SL Cat from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật mã phiếu vào ô B3 để thay đổi phiếu hiển thị
 */
export async function updatePhieuBaoSLCatMaPhieu(maPhieu: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhieuBaoSLCat}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[maPhieu]],
      },
    });
  } catch (error) {
    console.error("Error updating Phieu Bao SL Cat ma phieu:", error);
    throw error;
  }
}

// ==================== BẢNG KÊ LSX ====================
const sheetNameBangKeLSX = process.env.GOOGLE_SHEET_NAME_BANG_KE_LSX || "Bảng kê LSX";

export interface BangKeLSX {
  id: number;
  maSP: string;         // Mã sản phẩm
  xs: number;           // Số lượng size XS
  s: number;            // Số lượng size S
  m: number;            // Số lượng size M
  l: number;            // Số lượng size L
  xl: number;           // Số lượng size XL
  tongSL: number;       // Tổng số lượng
  ghiChu: string;       // Ghi chú
}

/**
 * Đọc dữ liệu Bảng kê LSX từ Google Sheets
 * Header ở dòng 5, dữ liệu từ dòng 6
 * Cột E: Mã SP, Cột AE: Tổng SL
 */
export async function getBangKeLSXFromSheet(): Promise<BangKeLSX[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameBangKeLSX}'!E6:AG`, // E=Mã SP, AF=Tổng SL, AG=Ghi chú
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No Bang Ke LSX data found in sheet.");
      return [];
    }

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      if (String(value).startsWith('#')) return 0;
      const cleaned = String(value).replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const data: BangKeLSX[] = rows
      .map((row, index) => {
        // E6:AG range, so:
        // row[0] = Cột E (Mã SP)
        // row[1-26] = Các cột size và thông tin khác
        // row[27] = Cột AF (Tổng SL) - từ E đến AF là 27 cột (E=0, F=1, ..., AF=27)
        // row[28] = Cột AG (Ghi chú)

        return {
          id: index + 1,
          maSP: row[0] || "",
          xs: parseNumberVN(row[19]), // Cột XS
          s: parseNumberVN(row[20]),  // Cột S
          m: parseNumberVN(row[21]),  // Cột M
          l: parseNumberVN(row[22]),  // Cột L
          xl: parseNumberVN(row[23]), // Cột XL
          tongSL: parseNumberVN(row[27]), // Cột AF (Tổng SL)
          ghiChu: row[28] || "", // Cột AG (Ghi chú)
        };
      })
      .filter((item) => item.maSP.trim() !== "");

    return data;
  } catch (error) {
    console.error("Error reading Bang Ke LSX from Google Sheets:", error);
    throw error;
  }
}

// ==================== GIÁ THÀNH & GIÁ BÁN ====================
const sheetNameGiaThanhGiaBan = process.env.GOOGLE_SHEET_NAME_GIA_THANH || "Giá thành&giá bán";

export interface GiaThanhGiaBan {
  id: number;
  maSP: string;
  maSPNhapKho: string;
  cpNPL: number;
  cpGiaCong: number;
  cpKhac: number;
  cpHinhIn: number;
  tongChiPhi: number;
  slKeHoach: number;
  slCat: number;
  slNhapKho: number;
  giaThanh: number;
  giaSi: number;
  giaLe: number;
}

/**
 * Lấy dữ liệu giá thành giá bán từ Google Sheets
 * Header row 5, data từ row 6
 */
export async function getGiaThanhGiaBanFromSheet(): Promise<GiaThanhGiaBan[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      const strValue = String(value).replace(/\./g, "").replace(",", ".");
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : num;
    };

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameGiaThanhGiaBan}'!A6:M`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    const data: GiaThanhGiaBan[] = rows
      .map((row, index) => ({
        id: index + 1,
        maSP: row[0] || "",
        maSPNhapKho: row[1] || "",
        cpNPL: parseNumberVN(row[2]),
        cpGiaCong: parseNumberVN(row[3]),
        cpKhac: parseNumberVN(row[4]),
        cpHinhIn: parseNumberVN(row[5]),
        tongChiPhi: parseNumberVN(row[6]),
        slKeHoach: parseNumberVN(row[7]),
        slCat: parseNumberVN(row[8]),
        slNhapKho: parseNumberVN(row[9]),
        giaThanh: parseNumberVN(row[10]),
        giaSi: parseNumberVN(row[11]),
        giaLe: parseNumberVN(row[12]),
      }))
      .filter((item) => item.maSP.trim() !== "" || item.maSPNhapKho.trim() !== "");

    return data;
  } catch (error) {
    console.error("Error reading Gia Thanh Gia Ban from Google Sheets:", error);
    throw error;
  }
}

// ==================== ĐIỀU CHỈNH GIÁ VỐN ====================
const sheetNameDieuChinhGiaVon = process.env.GOOGLE_SHEET_NAME_DIEU_CHINH_GIA_VON || "Điều chỉnh giá vốn";

export interface DieuChinhGiaVon {
  id: number;
  maSP: string;
  dieuChinhGiaVon: number;
  ghiChu: string;
}

/**
 * Lấy dữ liệu điều chỉnh giá vốn từ Google Sheets
 * Header row 5, data từ row 6
 */
export async function getDieuChinhGiaVonFromSheet(): Promise<DieuChinhGiaVon[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      const strValue = String(value).replace(/\./g, "").replace(",", ".");
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : num;
    };

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDieuChinhGiaVon}'!A6:C`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    const data: DieuChinhGiaVon[] = rows
      .map((row, index) => ({
        id: index + 1,
        maSP: row[0] || "",
        dieuChinhGiaVon: parseNumberVN(row[1]),
        ghiChu: row[2] || "",
      }))
      .filter((item) => item.maSP.trim() !== "");

    return data;
  } catch (error) {
    console.error("Error reading Dieu Chinh Gia Von from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm điều chỉnh giá vốn mới vào Google Sheets
 */
export async function addDieuChinhGiaVon(maSP: string, dieuChinhGiaVon: number, ghiChu: string = ""): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đọc toàn bộ dữ liệu để tìm dòng cuối
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDieuChinhGiaVon}'!A6:C`,
    });

    const allRows = response.data.values || [];
    const nextRow = allRows.length + 6; // Dữ liệu bắt đầu từ dòng 6

    const values = [[maSP, dieuChinhGiaVon, ghiChu]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDieuChinhGiaVon}'!A${nextRow}:C${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully added DieuChinhGiaVon for maSP: ${maSP} at row: ${nextRow}`);
  } catch (error) {
    console.error("Error adding DieuChinhGiaVon to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật điều chỉnh giá vốn trong Google Sheets
 */
export async function updateDieuChinhGiaVon(id: number, maSP: string, dieuChinhGiaVon: number, ghiChu: string = ""): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // id là index + 1, nên row number = id + 5 (vì data bắt đầu từ row 6)
    const rowNumber = id + 5;

    const values = [[maSP, dieuChinhGiaVon, ghiChu]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameDieuChinhGiaVon}'!A${rowNumber}:C${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated DieuChinhGiaVon id: ${id} at row: ${rowNumber}`);
  } catch (error) {
    console.error("Error updating DieuChinhGiaVon in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa điều chỉnh giá vốn từ Google Sheets
 */
export async function deleteDieuChinhGiaVon(id: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Lấy sheetId
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdLSX,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameDieuChinhGiaVon
    );

    if (!targetSheet?.properties?.sheetId) {
      throw new Error(`Sheet "${sheetNameDieuChinhGiaVon}" not found`);
    }

    const sheetId = targetSheet.properties.sheetId;
    const rowNumber = id + 5; // id là index + 1, data bắt đầu từ row 6

    // Xóa dòng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdLSX,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted DieuChinhGiaVon id: ${id} at row: ${rowNumber}`);
  } catch (error) {
    console.error("Error deleting DieuChinhGiaVon from Google Sheets:", error);
    throw error;
  }
}

// ==================== BẢNG KÊ CHI PHÍ KHÁC ====================
const sheetNameBangKeCPKhac = process.env.GOOGLE_SHEET_NAME_BANG_KE_CP_KHAC || "Bảng kê CP khác";

// Table 1: Bảng kê chi phí khác (columns A-H)
export interface ChiPhiKhacItem {
  id: number;
  ngay: string;
  noiDung: string;
  chiHoXuong: string;
  soChoMa: string;
  soTien: number;
  phanBo: string;
  doiTacVC: string;
}

// Table 2: Bảng kê tổng hợp cho đối tác vận chuyển (columns I-N)
export interface DoiTacVanChuyenItem {
  id: number;
  stt: number;
  doiTacVC: string;
  tienPhatSinh: number;
  thanhToan: number;
  congNo: number;
}

// Table 3: Bảng kê tổng hợp chi hộ xưởng (columns O-W)
export interface ChiHoXuongItem {
  id: number;
  xuongSX: string;
  tienPhatSinh: number;
  thanhToan: number;
  xuongNoRiomio: number;
}

export interface BangKeCPKhacData {
  chiPhiKhac: ChiPhiKhacItem[];
  doiTacVC: DoiTacVanChuyenItem[];
  chiHoXuong: ChiHoXuongItem[];
}

/**
 * Lấy dữ liệu bảng kê chi phí khác từ Google Sheets (3 bảng)
 * Header row 5, data từ row 6
 */
export async function getBangKeCPKhacFromSheet(): Promise<BangKeCPKhacData> {
  try {
    const sheets = await getGoogleSheetsClient();

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      const strValue = String(value).replace(/\./g, "").replace(",", ".");
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : num;
    };

    // Fetch all data in one request (columns A to W)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameBangKeCPKhac}'!A6:W`,
    });

    const rows = response.data.values || [];

    // Table 1: Chi phí khác (A-H)
    const chiPhiKhac: ChiPhiKhacItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngay: row[0] || "",
        noiDung: row[1] || "",
        chiHoXuong: row[2] || "",
        soChoMa: row[3] || "",
        soTien: parseNumberVN(row[4]),
        phanBo: row[5] || "",
        doiTacVC: row[6] || "",
      }))
      .filter((item) => item.ngay.trim() !== "" || item.noiDung.trim() !== "");

    // Table 2: Đối tác vận chuyển (I-N, indexes 8-13)
    const doiTacVC: DoiTacVanChuyenItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseNumberVN(row[8]),
        doiTacVC: row[9] || "",
        tienPhatSinh: parseNumberVN(row[10]),
        thanhToan: parseNumberVN(row[11]),
        congNo: parseNumberVN(row[12]),
      }))
      .filter((item) => item.doiTacVC.trim() !== "");

    // Table 3: Chi hộ xưởng (O-R, indexes 14-17)
    const chiHoXuong: ChiHoXuongItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        xuongSX: row[14] || "",
        tienPhatSinh: parseNumberVN(row[15]),
        thanhToan: parseNumberVN(row[16]),
        xuongNoRiomio: parseNumberVN(row[17]),
      }))
      .filter((item) => item.xuongSX.trim() !== "");

    return {
      chiPhiKhac,
      doiTacVC,
      chiHoXuong,
    };
  } catch (error) {
    console.error("Error reading Bang Ke CP Khac from Google Sheets:", error);
    throw error;
  }
}

// ==================== PHÂN BỔ CHI PHÍ KHÁC ====================
const sheetNamePhanBoCPKhac = process.env.GOOGLE_SHEET_NAME_PHAN_BO_CP_KHAC || "Phân bổ CP khác";

export interface PhanBoCPKhac {
  id: number;
  ngayThang: string;
  nguoiNhap: string;
  maPhieu: string;
  noiDung: string;
  maSP: string;
  soTien: number;
  loaiChiPhi: string;
}

/**
 * Lấy dữ liệu phân bổ chi phí khác từ Google Sheets
 * Header row 5, data từ row 6
 * Columns: Ngày tháng (A), Người nhập (B), Mã phiếu (C), Nội dung (D), Mã SP (E), Số tiền (F), Loại chi phí (G)
 */
export async function getPhanBoCPKhacFromSheet(): Promise<PhanBoCPKhac[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const parseNumberVN = (value: any): number => {
      if (!value) return 0;
      const strValue = String(value).replace(/\./g, "").replace(",", ".");
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : num;
    };

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhanBoCPKhac}'!A6:G`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    const data: PhanBoCPKhac[] = rows
      .map((row, index) => ({
        id: index + 1,
        ngayThang: row[0] || "",
        nguoiNhap: row[1] || "",
        maPhieu: row[2] || "",
        noiDung: row[3] || "",
        maSP: row[4] || "",
        soTien: parseNumberVN(row[5]),
        loaiChiPhi: row[6] || "",
      }))
      .filter((item) => item.ngayThang.trim() !== "" || item.maPhieu.trim() !== "");

    return data;
  } catch (error) {
    console.error("Error reading Phan Bo CP Khac from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm chi phí khác vào Google Sheets
 * Data từ row 6, columns A-G
 */
export async function addChiPhiKhacToSheet(data: Omit<ChiPhiKhacItem, 'id'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [
      [
        data.ngay,
        data.noiDung,
        data.chiHoXuong,
        data.soChoMa,
        data.soTien > 0 ? formatNumberVN(data.soTien) : "",
        data.phanBo,
        data.doiTacVC,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameBangKeCPKhac}'!A6:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log("Successfully added chi phi khac");
    return true;
  } catch (error) {
    console.error("Error adding chi phi khac to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật chi phí khác trong Google Sheets
 * rowIndex là index trong mảng (0-based), cần +6 để lấy row thực trong sheet
 */
export async function updateChiPhiKhacInSheet(rowIndex: number, data: Omit<ChiPhiKhacItem, 'id'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    const actualRow = rowIndex + 6; // Row 6 is first data row

    const values = [
      [
        data.ngay,
        data.noiDung,
        data.chiHoXuong,
        data.soChoMa,
        data.soTien > 0 ? formatNumberVN(data.soTien) : "",
        data.phanBo,
        data.doiTacVC,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameBangKeCPKhac}'!A${actualRow}:G${actualRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated chi phi khac at row ${actualRow}`);
    return true;
  } catch (error) {
    console.error("Error updating chi phi khac in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa chi phí khác khỏi Google Sheets
 */
export async function deleteChiPhiKhacFromSheet(rowIndex: number): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    const actualRow = rowIndex + 6;

    // Lấy sheetId
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdLSX,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNameBangKeCPKhac
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      throw new Error(`Cannot find sheet named "${sheetNameBangKeCPKhac}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdLSX,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: actualRow - 1,
                endIndex: actualRow,
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted chi phi khac at row ${actualRow}`);
    return true;
  } catch (error) {
    console.error("Error deleting chi phi khac from Google Sheets:", error);
    throw error;
  }
}

/**
 * Thêm phân bổ chi phí khác vào Google Sheets
 * Data từ row 6, columns A-G
 */
export async function addPhanBoCPKhacToSheet(data: Omit<PhanBoCPKhac, 'id'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [
      [
        data.ngayThang,
        data.nguoiNhap,
        data.maPhieu,
        data.noiDung,
        data.maSP,
        data.soTien > 0 ? formatNumberVN(data.soTien) : "",
        data.loaiChiPhi,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhanBoCPKhac}'!A6:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log("Successfully added phan bo cp khac");
    return true;
  } catch (error) {
    console.error("Error adding phan bo cp khac to Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật phân bổ chi phí khác trong Google Sheets
 */
export async function updatePhanBoCPKhacInSheet(rowIndex: number, data: Omit<PhanBoCPKhac, 'id'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    const actualRow = rowIndex + 6;

    const values = [
      [
        data.ngayThang,
        data.nguoiNhap,
        data.maPhieu,
        data.noiDung,
        data.maSP,
        data.soTien > 0 ? formatNumberVN(data.soTien) : "",
        data.loaiChiPhi,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNamePhanBoCPKhac}'!A${actualRow}:G${actualRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated phan bo cp khac at row ${actualRow}`);
    return true;
  } catch (error) {
    console.error("Error updating phan bo cp khac in Google Sheets:", error);
    throw error;
  }
}

/**
 * Xóa phân bổ chi phí khác khỏi Google Sheets
 */
export async function deletePhanBoCPKhacFromSheet(rowIndex: number): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    const actualRow = rowIndex + 6;

    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdLSX,
    });

    const targetSheet = sheetMetadata.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetNamePhanBoCPKhac
    );

    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      throw new Error(`Cannot find sheet named "${sheetNamePhanBoCPKhac}" to delete row`);
    }

    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdLSX,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: actualRow - 1,
                endIndex: actualRow,
              },
            },
          },
        ],
      },
    });

    console.log(`Successfully deleted phan bo cp khac at row ${actualRow}`);
    return true;
  } catch (error) {
    console.error("Error deleting phan bo cp khac from Google Sheets:", error);
    throw error;
  }
}

// ==================== MÃ SẢN PHẨM (PHÁT TRIỂN SẢN PHẨM) ====================
const sheetNameMaSP = process.env.GOOGLE_SHEET_NAME_MA_SP || "Mã SP";
const sheetNameChiTietMaSP = process.env.GOOGLE_SHEET_NAME_CHI_TIET_MA_SP || "Chi tiết Mã SP";

export interface MaSP {
  id: number;
  maSP: string;
  tenSP: string;
  size: string;
  vaiChinh: string;
  vaiPhoi: string;
  phuLieuKhac: string;
  lenhSX: string;
  xuongSX: string;
}

/**
 * Lấy dữ liệu mã sản phẩm từ Google Sheets
 * Header row 5, data từ row 6
 * Columns: Mã SP (A), Tên SP (B), Size (C), Vải chính (D), Vải phối (E), Phụ liệu khác (F), Lệnh SX (G), Xưởng SX (H)
 */
export async function getMaSPFromSheet(): Promise<MaSP[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameMaSP}'!A6:H`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    const data: MaSP[] = rows
      .map((row, index) => ({
        id: index + 1,
        maSP: row[0] || "",
        tenSP: row[1] || "",
        size: row[2] || "",
        vaiChinh: row[3] || "",
        vaiPhoi: row[4] || "",
        phuLieuKhac: row[5] || "",
        lenhSX: row[6] || "",
        xuongSX: row[7] || "",
      }))
      .filter((item) => item.maSP.trim() !== "");

    return data;
  } catch (error) {
    console.error("Error reading Ma SP from Google Sheets:", error);
    throw error;
  }
}

// ==================== CHI TIẾT MÃ SẢN PHẨM ====================
export interface ChiTietMaSP {
  maSP: string;
  tenSP: string;
  bangSizeSanXuat: string;
  hinhAnh: string;
  mauSacSanXuat: string;
  thuocTinhSize: string;
  giaBanLe: string;
  giaBanSi: string;
  giaVon: string;
  vaiChinh: string;
  vaiPhoi: string;
  phuLieuKhac: string;
  dinhMucVaiChinh: string;
  dinhMucVaiPhoi1: string;
  dinhMucVaiPhoi2: string;
  dinhMucPhuLieu1: string;
  dinhMucPhuLieu2: string;
  dinhMucPhuKien: string;
  dinhMucKhac: string;
  soLuongKeHoach: string;
  soLuongCat: string;
  soLuongNhapKho: string;
  cdFinal: string;
  cdDongBoNPL: string;
  cdSanXuat: string;
  nhapKho: string;
}

/**
 * Lấy chi tiết mã sản phẩm từ Google Sheets
 * Row 3: Mã SP
 * Row 5: Headers (STT, Chi tiết, Thông tin)
 * Row 6-30: Data
 */
export async function getChiTietMaSPFromSheet(): Promise<ChiTietMaSP | null> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get Mã SP from B3
    const maSPResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameChiTietMaSP}'!B3`,
    });

    const maSP = maSPResponse.data.values?.[0]?.[0] || "";

    // Get data from C6:C30 (Thông tin column)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameChiTietMaSP}'!C6:C30`,
    });

    const rows = dataResponse.data.values;

    if (!rows || rows.length === 0) {
      return null;
    }

    const getValue = (index: number) => rows[index]?.[0] || "";

    const data: ChiTietMaSP = {
      maSP,
      tenSP: getValue(0),
      bangSizeSanXuat: getValue(1),
      hinhAnh: getValue(2),
      mauSacSanXuat: getValue(3),
      thuocTinhSize: getValue(4),
      giaBanLe: getValue(5),
      giaBanSi: getValue(6),
      giaVon: getValue(7),
      vaiChinh: getValue(8),
      vaiPhoi: getValue(9),
      phuLieuKhac: getValue(10),
      dinhMucVaiChinh: getValue(11),
      dinhMucVaiPhoi1: getValue(12),
      dinhMucVaiPhoi2: getValue(13),
      dinhMucPhuLieu1: getValue(14),
      dinhMucPhuLieu2: getValue(15),
      dinhMucPhuKien: getValue(16),
      dinhMucKhac: getValue(17),
      soLuongKeHoach: getValue(18),
      soLuongCat: getValue(19),
      soLuongNhapKho: getValue(20),
      cdFinal: getValue(21),
      cdDongBoNPL: getValue(22),
      cdSanXuat: getValue(23),
      nhapKho: getValue(24),
    };

    return data;
  } catch (error) {
    console.error("Error reading Chi Tiet Ma SP from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật Mã SP trong sheet "Chi tiết Mã SP" và lấy dữ liệu mới
 * @param maSP - Mã sản phẩm cần xem chi tiết
 */
export async function updateAndGetChiTietMaSP(maSP: string): Promise<ChiTietMaSP | null> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Update Mã SP in cell B3
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameChiTietMaSP}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[maSP]],
      },
    });

    // Wait a moment for formulas to recalculate
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch the updated data
    return await getChiTietMaSPFromSheet();
  } catch (error) {
    console.error("Error updating and reading Chi Tiet Ma SP:", error);
    throw error;
  }
}

/**
 * Thêm mã sản phẩm mới vào Google Sheets
 * Tìm dòng cuối cùng có dữ liệu (maSP không trống) và thêm ngay sau đó
 */
export async function addMaSPToSheet(data: Omit<MaSP, 'id'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    // First, get column A to find the last row with actual data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameMaSP}'!A:A`,
    });

    const rows = response.data.values || [];

    // Find the last row with actual maSP data (not empty)
    let lastDataRow = 5; // Header is at row 5, data starts at row 6
    for (let i = rows.length - 1; i >= 5; i--) {
      if (rows[i] && rows[i][0] && rows[i][0].toString().trim() !== "") {
        lastDataRow = i + 1; // Convert to 1-based row number
        break;
      }
    }

    const nextRow = lastDataRow + 1;

    // Write to the next row after the last data row
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameMaSP}'!A${nextRow}:H${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.maSP,
          data.tenSP,
          data.size,
          data.vaiChinh,
          data.vaiPhoi,
          data.phuLieuKhac,
          data.lenhSX,
          data.xuongSX,
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error adding Ma SP:", error);
    throw error;
  }
}

/**
 * Cập nhật mã sản phẩm trong Google Sheets
 * rowIndex là vị trí trong data (0-based), cần +6 để có row thực tế trong sheet
 */
export async function updateMaSPInSheet(rowIndex: number, data: Omit<MaSP, 'id'>): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    const actualRow = rowIndex + 6; // Data starts from row 6

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameMaSP}'!A${actualRow}:H${actualRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.maSP,
          data.tenSP,
          data.size,
          data.vaiChinh,
          data.vaiPhoi,
          data.phuLieuKhac,
          data.lenhSX,
          data.xuongSX,
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating Ma SP:", error);
    throw error;
  }
}

/**
 * Xoá mã sản phẩm trong Google Sheets
 * rowIndex là vị trí trong data (0-based), cần +6 để có row thực tế trong sheet
 * Xoá nội dung dòng để giữ nguyên cấu trúc sheet và data validation
 */
export async function deleteMaSPFromSheet(rowIndex: number): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    const actualRow = rowIndex + 6; // Data starts from row 6

    // Clear the row content instead of deleting the row
    // This preserves the sheet structure and any data validation/dropdowns
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameMaSP}'!A${actualRow}:J${actualRow}`,
    });

    return true;
  } catch (error) {
    console.error("Error deleting Ma SP:", error);
    throw error;
  }
}

/**
 * Lấy chi tiết một mã sản phẩm theo mã SP
 */
export async function getMaSPById(maSP: string): Promise<MaSP | null> {
  try {
    const allData = await getMaSPFromSheet();
    return allData.find((item) => item.maSP === maSP) || null;
  } catch (error) {
    console.error("Error getting Ma SP by ID:", error);
    throw error;
  }
}

/**
 * Cập nhật chi tiết mã sản phẩm trong Google Sheets
 * Cập nhật trực tiếp vào cột C của sheet "Chi tiết Mã SP" (C6:C30)
 * Lưu ý: Chỉ hoạt động nếu cột C chứa giá trị, không phải công thức
 */
export async function updateChiTietMaSPInSheet(
  maSP: string,
  data: Partial<ChiTietMaSP>
): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Đầu tiên, cập nhật mã SP trong B3 để đảm bảo đúng sản phẩm
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdLSX,
      range: `'${sheetNameChiTietMaSP}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[maSP]],
      },
    });

    // Đợi formulas recalculate
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mapping các field với vị trí row trong sheet (C6-C30)
    const fieldToRowMap: { [key: string]: number } = {
      tenSP: 6,
      bangSizeSanXuat: 7,
      hinhAnh: 8,
      mauSacSanXuat: 9,
      thuocTinhSize: 10,
      giaBanLe: 11,
      giaBanSi: 12,
      giaVon: 13,
      vaiChinh: 14,
      vaiPhoi: 15,
      phuLieuKhac: 16,
      dinhMucVaiChinh: 17,
      dinhMucVaiPhoi1: 18,
      dinhMucVaiPhoi2: 19,
      dinhMucPhuLieu1: 20,
      dinhMucPhuLieu2: 21,
      dinhMucPhuKien: 22,
      dinhMucKhac: 23,
      soLuongKeHoach: 24,
      soLuongCat: 25,
      soLuongNhapKho: 26,
      cdFinal: 27,
      cdDongBoNPL: 28,
      cdSanXuat: 29,
      nhapKho: 30,
    };

    // Cập nhật từng field
    const updates: { range: string; values: string[][] }[] = [];

    for (const [field, value] of Object.entries(data)) {
      const row = fieldToRowMap[field];
      if (row && value !== undefined) {
        updates.push({
          range: `'${sheetNameChiTietMaSP}'!C${row}`,
          values: [[value]],
        });
      }
    }

    // Batch update tất cả các field
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetIdLSX,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: updates,
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating Chi Tiet Ma SP:", error);
    throw error;
  }
}

// ============================================
// BC QUỸ THEO NGÀY
// ============================================

// Sử dụng spreadsheetIdDongTien đã được định nghĩa ở trên
const sheetNameBCQuyTheoNgay = process.env.GOOGLE_SHEET_NAME_BC_QUY_THEO_NGAY || "BC quỹ theo ngày";

// Interface cho Bảng 1: Báo cáo quỹ
export interface BCQuyTable1Row {
  stt: string;
  taiKhoan: string;
  duDau: number;
  thu: number;
  chi: number;
  duCuoi: number;
}

// Interface cho Bảng 2: Bảng kê số dư quỹ đầu
export interface BCQuyTable2Row {
  stt: string;
  taiKhoan: string;
  soTien: number;
}

// Interface cho dữ liệu trả về
export interface BCQuyTheoNgayData {
  date1: string;
  date2: string;
  table1: BCQuyTable1Row[];
  table2: BCQuyTable2Row[];
}

/**
 * Đọc ngày từ cell C3 (Table 1) và J3 (Table 2)
 */
export async function getBCQuyTheoNgayDates(): Promise<{ date1: string; date2: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetIdDongTien,
      ranges: [
        `'${sheetNameBCQuyTheoNgay}'!C3`,
        `'${sheetNameBCQuyTheoNgay}'!J3`,
      ],
    });

    const valueRanges = response.data.valueRanges;
    const date1 = valueRanges?.[0]?.values?.[0]?.[0] || "";
    const date2 = valueRanges?.[1]?.values?.[0]?.[0] || "";

    return { date1, date2 };
  } catch (error) {
    console.error("Error reading BC Quy Theo Ngay dates:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu Bảng 1: Báo cáo quỹ (cột A-F từ hàng 6)
 */
export async function getBCQuyTable1(): Promise<BCQuyTable1Row[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCQuyTheoNgay}'!A6:F`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows
      .filter((row) => row[0] || row[1]) // Lọc bỏ dòng trống
      .map((row) => ({
        stt: row[0] || "",
        taiKhoan: row[1] || "",
        duDau: parseFloat(String(row[2] || "0").replace(/[,.]/g, "")) || 0,
        thu: parseFloat(String(row[3] || "0").replace(/[,.]/g, "")) || 0,
        chi: parseFloat(String(row[4] || "0").replace(/[,.]/g, "")) || 0,
        duCuoi: parseFloat(String(row[5] || "0").replace(/[,.]/g, "")) || 0,
      }));
  } catch (error) {
    console.error("Error reading BC Quy Table 1:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu Bảng 2: Bảng kê số dư quỹ đầu (cột H-K từ hàng 6)
 */
export async function getBCQuyTable2(): Promise<BCQuyTable2Row[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCQuyTheoNgay}'!H6:K`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows
      .filter((row) => row[0] || row[1]) // Lọc bỏ dòng trống
      .map((row) => ({
        stt: row[0] || "",
        taiKhoan: row[1] || "",
        soTien: parseFloat(String(row[3] || "0").replace(/[,.]/g, "")) || 0, // Cột K (index 3 trong range H-K)
      }));
  } catch (error) {
    console.error("Error reading BC Quy Table 2:", error);
    throw error;
  }
}

/**
 * Cập nhật ngày cho Bảng 1 (cell C3)
 */
export async function updateBCQuyDate1(date: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCQuyTheoNgay}'!C3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[date]],
      },
    });

    console.log(`Updated BC Quy date1 (C3) with value: ${date}`);
  } catch (error) {
    console.error("Error updating BC Quy date1:", error);
    throw error;
  }
}

/**
 * Cập nhật ngày cho Bảng 2 (cell J3)
 */
export async function updateBCQuyDate2(date: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCQuyTheoNgay}'!J3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[date]],
      },
    });

    console.log(`Updated BC Quy date2 (J3) with value: ${date}`);
  } catch (error) {
    console.error("Error updating BC Quy date2:", error);
    throw error;
  }
}

/**
 * Lấy toàn bộ dữ liệu BC quỹ theo ngày
 */
export async function getBCQuyTheoNgayData(): Promise<BCQuyTheoNgayData> {
  try {
    const [dates, table1, table2] = await Promise.all([
      getBCQuyTheoNgayDates(),
      getBCQuyTable1(),
      getBCQuyTable2(),
    ]);

    return {
      date1: dates.date1,
      date2: dates.date2,
      table1,
      table2,
    };
  } catch (error) {
    console.error("Error fetching BC Quy Theo Ngay data:", error);
    throw error;
  }
}

/**
 * Cập nhật ngày và lấy dữ liệu mới
 */
export async function updateDateAndGetBCQuyData(
  tableNumber: 1 | 2,
  date: string
): Promise<BCQuyTheoNgayData> {
  try {
    // Cập nhật ngày
    if (tableNumber === 1) {
      await updateBCQuyDate1(date);
    } else {
      await updateBCQuyDate2(date);
    }

    // Đợi sheet recalculate
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Lấy dữ liệu mới
    return await getBCQuyTheoNgayData();
  } catch (error) {
    console.error("Error updating date and fetching BC Quy data:", error);
    throw error;
  }
}

// ============================================
// BC QUỸ THEO THÁNG
// ============================================

const sheetNameBCQuyTheoThang = process.env.GOOGLE_SHEET_NAME_BC_QUY_THEO_THANG || "BC quỹ theo tháng";

// Interface cho dữ liệu BC quỹ theo tháng (giống BC theo ngày)
export interface BCQuyTheoThangData {
  date1: string; // Tháng: M/YYYY (vd: "1/2026")
  date2: string; // Ngày: dd/mm/yyyy (vd: "31/12/2025")
  table1: BCQuyTable1Row[];
  table2: BCQuyTable2Row[];
}

/**
 * Đọc ngày/tháng từ cell C3 (Table 1) và J3 (Table 2) - BC theo tháng
 */
export async function getBCQuyTheoThangDates(): Promise<{ date1: string; date2: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetIdDongTien,
      ranges: [
        `'${sheetNameBCQuyTheoThang}'!C3`,
        `'${sheetNameBCQuyTheoThang}'!J3`,
      ],
    });

    const valueRanges = response.data.valueRanges;
    const date1 = valueRanges?.[0]?.values?.[0]?.[0] || "";
    const date2 = valueRanges?.[1]?.values?.[0]?.[0] || "";

    return { date1, date2 };
  } catch (error) {
    console.error("Error reading BC Quy Theo Thang dates:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu Bảng 1: Báo cáo quỹ theo tháng (cột A-F từ hàng 6)
 */
export async function getBCQuyThangTable1(): Promise<BCQuyTable1Row[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCQuyTheoThang}'!A6:F`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows
      .filter((row) => row[0] || row[1])
      .map((row) => ({
        stt: row[0] || "",
        taiKhoan: row[1] || "",
        duDau: parseFloat(String(row[2] || "0").replace(/[,.]/g, "")) || 0,
        thu: parseFloat(String(row[3] || "0").replace(/[,.]/g, "")) || 0,
        chi: parseFloat(String(row[4] || "0").replace(/[,.]/g, "")) || 0,
        duCuoi: parseFloat(String(row[5] || "0").replace(/[,.]/g, "")) || 0,
      }));
  } catch (error) {
    console.error("Error reading BC Quy Thang Table 1:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu Bảng 2: Bảng kê số dư quỹ đầu kỳ (cột H-K từ hàng 6)
 */
export async function getBCQuyThangTable2(): Promise<BCQuyTable2Row[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCQuyTheoThang}'!H6:K`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows
      .filter((row) => row[0] || row[1])
      .map((row) => ({
        stt: row[0] || "",
        taiKhoan: row[1] || "",
        soTien: parseFloat(String(row[3] || "0").replace(/[,.]/g, "")) || 0,
      }));
  } catch (error) {
    console.error("Error reading BC Quy Thang Table 2:", error);
    throw error;
  }
}

/**
 * Cập nhật tháng cho Bảng 1 (cell C3) - BC theo tháng
 */
export async function updateBCQuyThangDate1(date: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCQuyTheoThang}'!C3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[date]],
      },
    });

    console.log(`Updated BC Quy Thang date1 (C3) with value: ${date}`);
  } catch (error) {
    console.error("Error updating BC Quy Thang date1:", error);
    throw error;
  }
}

/**
 * Cập nhật ngày cho Bảng 2 (cell J3) - BC theo tháng
 */
export async function updateBCQuyThangDate2(date: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCQuyTheoThang}'!J3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[date]],
      },
    });

    console.log(`Updated BC Quy Thang date2 (J3) with value: ${date}`);
  } catch (error) {
    console.error("Error updating BC Quy Thang date2:", error);
    throw error;
  }
}

/**
 * Lấy toàn bộ dữ liệu BC quỹ theo tháng
 */
export async function getBCQuyTheoThangData(): Promise<BCQuyTheoThangData> {
  try {
    const [dates, table1, table2] = await Promise.all([
      getBCQuyTheoThangDates(),
      getBCQuyThangTable1(),
      getBCQuyThangTable2(),
    ]);

    return {
      date1: dates.date1,
      date2: dates.date2,
      table1,
      table2,
    };
  } catch (error) {
    console.error("Error fetching BC Quy Theo Thang data:", error);
    throw error;
  }
}

/**
 * Cập nhật ngày/tháng và lấy dữ liệu mới - BC theo tháng
 */
export async function updateDateAndGetBCQuyThangData(
  tableNumber: 1 | 2,
  date: string
): Promise<BCQuyTheoThangData> {
  try {
    if (tableNumber === 1) {
      await updateBCQuyThangDate1(date);
    } else {
      await updateBCQuyThangDate2(date);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    return await getBCQuyTheoThangData();
  } catch (error) {
    console.error("Error updating date and fetching BC Quy Thang data:", error);
    throw error;
  }
}

// ============================================
// BC TỪNG TÀI KHOẢN
// ============================================

const sheetNameBCTungTaiKhoan = process.env.GOOGLE_SHEET_NAME_BC_TUNG_TAI_KHOAN || "BC từng tài khoản";
const sheetNameThongTinTaiKhoan = process.env.GOOGLE_SHEET_NAME_TAI_KHOAN || "Thông tin tài khoản";

// Interface cho dữ liệu BC từng tài khoản
export interface BCTungTaiKhoanRow {
  ngayThang: string;
  doiTuong: string;
  noiDung: string;
  phanLoai: string;
  thu: number;
  chi: number;
  duCuoi: number;
}

export interface BCTungTaiKhoanData {
  selectedAccount: string;
  accounts: string[];
  transactions: BCTungTaiKhoanRow[];
}

/**
 * Lấy danh sách tài khoản từ sheet "Thông tin tài khoản"
 * Đọc cột B từ hàng 2 (bỏ qua header)
 */
export async function getTaiKhoanOptionsForBC(): Promise<string[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameThongTinTaiKhoan}'!B2:B`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows
      .map((row) => row[0] || "")
      .filter((name) => name.trim() !== "" && name.trim().toLowerCase() !== "tài khoản");
  } catch (error) {
    console.error("Error fetching Tai Khoan options for BC:", error);
    throw error;
  }
}

/**
 * Đọc tài khoản đang được chọn từ cell B3
 */
export async function getSelectedAccountForBC(): Promise<string> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCTungTaiKhoan}'!B3`,
    });

    return response.data.values?.[0]?.[0] || "";
  } catch (error) {
    console.error("Error reading selected account for BC:", error);
    throw error;
  }
}

/**
 * Cập nhật tài khoản được chọn (cell B3)
 */
export async function updateSelectedAccountForBC(account: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCTungTaiKhoan}'!B3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[account]],
      },
    });

    console.log(`Updated BC Tung Tai Khoan selected account (B3) with value: ${account}`);
  } catch (error) {
    console.error("Error updating selected account for BC:", error);
    throw error;
  }
}

/**
 * Đọc dữ liệu giao dịch từ BC từng tài khoản (từ hàng 6, cột A-G)
 */
export async function getBCTungTaiKhoanTransactions(): Promise<BCTungTaiKhoanRow[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameBCTungTaiKhoan}'!A6:G`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows
      .filter((row) => row[0] || row[1] || row[2]) // Lọc bỏ dòng trống
      .map((row) => ({
        ngayThang: row[0] || "",
        doiTuong: row[1] || "",
        noiDung: row[2] || "",
        phanLoai: row[3] || "",
        thu: parseFloat(String(row[4] || "0").replace(/[,.]/g, "")) || 0,
        chi: parseFloat(String(row[5] || "0").replace(/[,.]/g, "")) || 0,
        duCuoi: parseFloat(String(row[6] || "0").replace(/[,.]/g, "")) || 0,
      }));
  } catch (error) {
    console.error("Error reading BC Tung Tai Khoan transactions:", error);
    throw error;
  }
}

/**
 * Lấy toàn bộ dữ liệu BC từng tài khoản
 */
export async function getBCTungTaiKhoanData(): Promise<BCTungTaiKhoanData> {
  try {
    const [selectedAccount, accounts, transactions] = await Promise.all([
      getSelectedAccountForBC(),
      getTaiKhoanOptionsForBC(),
      getBCTungTaiKhoanTransactions(),
    ]);

    return {
      selectedAccount,
      accounts,
      transactions,
    };
  } catch (error) {
    console.error("Error fetching BC Tung Tai Khoan data:", error);
    throw error;
  }
}

/**
 * Cập nhật tài khoản và lấy dữ liệu mới
 */
export async function updateAccountAndGetBCTungTaiKhoanData(
  account: string
): Promise<BCTungTaiKhoanData> {
  try {
    await updateSelectedAccountForBC(account);

    // Đợi sheet recalculate
    await new Promise((resolve) => setTimeout(resolve, 500));

    return await getBCTungTaiKhoanData();
  } catch (error) {
    console.error("Error updating account and fetching BC Tung Tai Khoan data:", error);
    throw error;
  }
}

// ============================================================
// DASHBOARD TIỀN VAY
// ============================================================

const sheetNameDashboard = process.env.GOOGLE_SHEET_NAME_DASHBOARD || "DASHBOARD";

export interface DashboardLoanData {
  tongDuNoToanCongTy: number;
  tongApLucLaiVayThangNay: number;
  duNoVayBank: number;
  duNoVayNgoai: number;
  canhBao: number;
  laiVayDaTra: number;
  laiConLai: number;
  gocDaTra: number;
  gocConLai: number;
}

/**
 * Lấy dữ liệu Dashboard tiền vay từ Google Sheets
 * Đọc từ row 6, columns A-I
 */
export async function getDashboardLoanData(): Promise<DashboardLoanData> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdDongTien,
      range: `'${sheetNameDashboard}'!A6:I6`,
    });

    const row = response.data.values?.[0] || [];

    const parseNumber = (val: string | undefined): number => {
      if (!val) return 0;
      const cleaned = val.toString().replace(/[.,\s]/g, "").replace(/đ/gi, "");
      return parseInt(cleaned) || 0;
    };

    return {
      tongDuNoToanCongTy: parseNumber(row[0]),
      tongApLucLaiVayThangNay: parseNumber(row[1]),
      duNoVayBank: parseNumber(row[2]),
      duNoVayNgoai: parseNumber(row[3]),
      canhBao: parseNumber(row[4]),
      laiVayDaTra: parseNumber(row[5]),
      laiConLai: parseNumber(row[6]),
      gocDaTra: parseNumber(row[7]),
      gocConLai: parseNumber(row[8]),
    };
  } catch (error) {
    console.error("Error fetching Dashboard Loan data:", error);
    throw error;
  }
}

// ============================================
// BÁO CÁO LÃI/LỖ & CÔNG NỢ
// ============================================

// Constants cho báo cáo
const spreadsheetIdBaoCao = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAO_CAO || "";
const sheetNameBCLaiLo = process.env.GOOGLE_SHEET_NAME_BC_LAI_LO || "BC Lãi/lỗ";
const sheetNameBCCongNoKH = process.env.GOOGLE_SHEET_NAME_BC_CONG_NO_KH || "BC công nợ khách hàng";
const sheetNameBCCongNoNCC = process.env.GOOGLE_SHEET_NAME_BC_CONG_NO_NCC_NPL || "BC công nợ phải trả NCC NPL";
const sheetNameBCCongNoXuong = process.env.GOOGLE_SHEET_NAME_BC_CONG_NO_XUONG_SX || "BC công nợ phải trả xưởng SX";
const sheetNameBCBanHangTheoThang = process.env.GOOGLE_SHEET_NAME_BC_BAN_HANG_THEO_THOI_GIAN || "BC bán hàng theo thời gian";
const sheetNameBCSanPham = process.env.GOOGLE_SHEET_NAME_BC_SAN_PHAM || "BC Sản phẩm";
const sheetNameBCNhanVien = process.env.GOOGLE_SHEET_NAME_BC_BAN_HANG_NHAN_VIEN || "BC BH Nhân viên";
const sheetNameBCKhachHang = process.env.GOOGLE_SHEET_NAME_BC_KHACH_HANG || "BC Khách hàng";

// Interface cho báo cáo lãi/lỗ
export interface BaoCaoLaiLoRow {
  stt: string;
  chiTieu: string;
  thangTruoc: number;
  thangNay: number;
  chenhLech: string;
  tyTrong: string;
}

export interface BaoCaoLaiLoData {
  year: number;
  month: number;
  rows: BaoCaoLaiLoRow[];
}

// Cập nhật tháng và năm vào sheet
export async function updateBaoCaoLaiLoMonthYear(year: number, month: number) {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetIdBaoCao,
      requestBody: {
        data: [
          {
            range: `${sheetNameBCLaiLo}!E3`,
            values: [[year]],
          },
          {
            range: `${sheetNameBCLaiLo}!E4`,
            values: [[month]],
          },
        ],
        valueInputOption: "USER_ENTERED",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating month/year:", error);
    throw error;
  }
}

// Lấy dữ liệu báo cáo lãi/lỗ
export async function getBaoCaoLaiLo() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format: 26.977.000,0)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      // Remove dots (thousands separator) and replace comma with dot (decimal separator)
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Lấy năm và tháng từ E3 và E4
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCLaiLo}!E3:E4`,
    });

    const headerRows = headerResponse.data.values || [];
    const year = parseInt(headerRows[0]?.[0] || "2026");
    const month = parseInt(headerRows[1]?.[0] || "1");

    // Lấy dữ liệu từ row 7 trở đi (STT, Chi tiêu, Tháng trước, Tháng nay, Chênh lệch, Tỷ trọng)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCLaiLo}!A7:F`,
    });

    const rows = dataResponse.data.values || [];
    const parsedRows: BaoCaoLaiLoRow[] = rows
      .filter((row) => row[0] || row[1]) // Có STT hoặc Chi tiêu
      .map((row) => ({
        stt: row[0] || "",
        chiTieu: row[1] || "",
        thangTruoc: parseNumber(row[2]),
        thangNay: parseNumber(row[3]),
        chenhLech: row[4] || "",
        tyTrong: row[5] || "",
      }));

    return {
      year,
      month,
      rows: parsedRows,
    };
  } catch (error) {
    console.error("Error fetching Bao Cao Lai Lo:", error);
    throw error;
  }
}

// ============================================
// BÁO CÁO CÔNG NỢ KHÁCH HÀNG
// ============================================

// Interface cho công nợ khách hàng
export interface BaoCaoCongNoKHRow {
  stt: number;
  khachHang: string;
  duDauKi: number;
  phatSinh: number;
  thanhToan: number;
  duCuoiKi: number;
}

export interface BaoCaoCongNoKHData {
  year: number;
  month: number;
  rows: BaoCaoCongNoKHRow[];
}

// Lấy dữ liệu báo cáo công nợ khách hàng
export async function getBaoCaoCongNoKH() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format: 26.977.000,0)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      // Remove dots (thousands separator) and replace comma with dot (decimal separator)
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Lấy tháng/năm từ D3 (format: "1/2026")
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCCongNoKH}!D3`,
    });

    const monthYearStr = headerResponse.data.values?.[0]?.[0] || "1/2026";
    const [monthStr, yearStr] = monthYearStr.split("/");
    const month = parseInt(monthStr) || 1;
    const year = parseInt(yearStr) || 2026;

    // Lấy dữ liệu từ row 6 trở đi (STT, Khách hàng, Dư đầu kì, Phát sinh, Thanh toán, Dư cuối kì)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCCongNoKH}!A6:F`,
    });

    const rows = dataResponse.data.values || [];
    const parsedRows: BaoCaoCongNoKHRow[] = rows
      .filter((row) => row[0] && row[1]) // Có STT và Khách hàng
      .map((row) => ({
        stt: parseInt(row[0]) || 0,
        khachHang: row[1] || "",
        duDauKi: parseNumber(row[2]),
        phatSinh: parseNumber(row[3]),
        thanhToan: parseNumber(row[4]),
        duCuoiKi: parseNumber(row[5]),
      }));

    return {
      year,
      month,
      rows: parsedRows,
    };
  } catch (error) {
    console.error("Error fetching Bao Cao Cong No KH:", error);
    throw error;
  }
}

// ============================================
// BÁO CÁO CÔNG NỢ PHẢI TRẢ NCC NPL
// ============================================

// Interface cho công nợ NCC NPL
export interface BaoCaoCongNoNCCRow {
  stt: number;
  nccNPL: string;
  duDauKi: number;
  phatSinh: number;
  thanhToan: number;
  duCuoiKi: number;
}

export interface BaoCaoCongNoNCCData {
  year: number;
  month: number;
  rows: BaoCaoCongNoNCCRow[];
}

// Lấy dữ liệu báo cáo công nợ phải trả NCC NPL
export async function getBaoCaoCongNoNCC() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format: 26.977.000,0)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      // Remove dots (thousands separator) and replace comma with dot (decimal separator)
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Lấy tháng/năm từ C3 (format: "1/2026")
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCCongNoNCC}!C3`,
    });

    const monthYearStr = headerResponse.data.values?.[0]?.[0] || "1/2026";
    const [monthStr, yearStr] = monthYearStr.split("/");
    const month = parseInt(monthStr) || 1;
    const year = parseInt(yearStr) || 2026;

    // Lấy dữ liệu từ row 6 trở đi (STT, NCC NPL, Dư đầu kì, Phát sinh, Thanh toán, Dư cuối kì)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCCongNoNCC}!A6:F`,
    });

    const rows = dataResponse.data.values || [];
    const parsedRows: BaoCaoCongNoNCCRow[] = rows
      .filter((row) => row[0] && row[1]) // Có STT và NCC NPL
      .map((row) => ({
        stt: parseInt(row[0]) || 0,
        nccNPL: row[1] || "",
        duDauKi: parseNumber(row[2]),
        phatSinh: parseNumber(row[3]),
        thanhToan: parseNumber(row[4]),
        duCuoiKi: parseNumber(row[5]),
      }));

    return {
      year,
      month,
      rows: parsedRows,
    };
  } catch (error) {
    console.error("Error fetching Bao Cao Cong No NCC:", error);
    throw error;
  }
}

// ============================================
// BÁO CÁO CÔNG NỢ PHẢI TRẢ XƯỞNG SX
// ============================================

// Interface cho công nợ xưởng SX
export interface BaoCaoCongNoXuongRow {
  stt: number;
  xuongSX: string;
  duDau: number;
  tienGiaCong: number;
  thanhToan: number;
  duCuoi: number;
}

export interface BaoCaoCongNoXuongData {
  year: number;
  month: number;
  rows: BaoCaoCongNoXuongRow[];
}

// Lấy dữ liệu báo cáo công nợ phải trả xưởng SX
export async function getBaoCaoCongNoXuong() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format: 26.977.000,0)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      // Remove dots (thousands separator) and replace comma with dot (decimal separator)
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Lấy tháng/năm từ C3 (format: "01/2026")
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCCongNoXuong}!C3`,
    });

    const monthYearStr = headerResponse.data.values?.[0]?.[0] || "01/2026";
    const [monthStr, yearStr] = monthYearStr.split("/");
    const month = parseInt(monthStr) || 1;
    const year = parseInt(yearStr) || 2026;

    // Lấy dữ liệu từ row 6 trở đi (STT, Xưởng SX, Dư đầu, Tiền gia công, Thanh toán, Dư cuối)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCCongNoXuong}!A6:F`,
    });

    const rows = dataResponse.data.values || [];
    const parsedRows: BaoCaoCongNoXuongRow[] = rows
      .filter((row) => row[0] && row[1]) // Có STT và Xưởng SX
      .map((row) => ({
        stt: parseInt(row[0]) || 0,
        xuongSX: row[1] || "",
        duDau: parseNumber(row[2]),
        tienGiaCong: parseNumber(row[3]),
        thanhToan: parseNumber(row[4]),
        duCuoi: parseNumber(row[5]),
      }));

    return {
      year,
      month,
      rows: parsedRows,
    };
  } catch (error) {
    console.error("Error fetching Bao Cao Cong No Xuong:", error);
    throw error;
  }
}

// ============================================
// BÁO CÁO BÁN HÀNG THEO THÁNG
// ============================================

// Interface cho báo cáo bán hàng theo tháng
export interface BaoCaoBanHangTheoThangRow {
  rowIndex: number; // Row index in sheet (starting from 6)
  thang: number;
  nam: number;
  doanhThu: number;
  tienVon: number;
  loiNhuan: number;
}

export interface BaoCaoBanHangTheoThangData {
  rows: BaoCaoBanHangTheoThangRow[];
}

// Lấy dữ liệu báo cáo bán hàng theo tháng
export async function getBaoCaoBanHangTheoThang() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format: 404.757.660)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      // Remove dots (thousands separator) and replace comma with dot (decimal separator)
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Lấy dữ liệu từ row 6 trở đi (Tháng, Năm, Doanh thu, Tiền vốn, Lợi nhuận)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCBanHangTheoThang}!A6:E`,
    });

    const rows = dataResponse.data.values || [];
    const parsedRows: BaoCaoBanHangTheoThangRow[] = rows
      .filter((row) => row[0] && row[1]) // Có tháng và năm
      .map((row, index) => ({
        rowIndex: index + 6, // Row 6 is the first data row
        thang: parseInt(row[0]) || 0,
        nam: parseInt(row[1]) || 0,
        doanhThu: parseNumber(row[2]),
        tienVon: parseNumber(row[3]),
        loiNhuan: parseNumber(row[4]),
      }));

    return {
      rows: parsedRows,
    };
  } catch (error) {
    console.error("Error fetching Bao Cao Ban Hang Theo Thang:", error);
    throw error;
  }
}

// Thêm dữ liệu báo cáo bán hàng theo tháng
export async function addBaoCaoBanHangTheoThang(data: {
  thang: number;
  nam: number;
  doanhThu: number;
  tienVon: number;
  loiNhuan: number;
}) {
  try {
    const sheets = await getGoogleSheetsClient();

    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCBanHangTheoThang}!A6:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[data.thang, data.nam, data.doanhThu, data.tienVon, data.loiNhuan]],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding Bao Cao Ban Hang Theo Thang:", error);
    throw error;
  }
}

// Cập nhật dữ liệu báo cáo bán hàng theo tháng
export async function updateBaoCaoBanHangTheoThang(
  rowIndex: number,
  data: {
    thang: number;
    nam: number;
    doanhThu: number;
    tienVon: number;
    loiNhuan: number;
  }
) {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCBanHangTheoThang}!A${rowIndex}:E${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[data.thang, data.nam, data.doanhThu, data.tienVon, data.loiNhuan]],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating Bao Cao Ban Hang Theo Thang:", error);
    throw error;
  }
}

// Xóa dữ liệu báo cáo bán hàng theo tháng
export async function deleteBaoCaoBanHangTheoThang(rowIndex: number) {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get spreadsheet info to find sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetIdBaoCao,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetNameBCBanHangTheoThang
    );

    if (!sheet?.properties?.sheetId) {
      throw new Error("Sheet not found");
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetIdBaoCao,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1, // 0-indexed
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting Bao Cao Ban Hang Theo Thang:", error);
    throw error;
  }
}

// ============================================
// BÁO CÁO DOANH THU THEO SẢN PHẨM
// ============================================

// Interface cho báo cáo doanh thu theo sản phẩm
export interface BaoCaoSanPhamRow {
  tenSanPham: string;
  soLuongBan: number;
  doanhThu: number;
  loiNhuanGop: number;
}

export interface BaoCaoSanPhamData {
  rows: BaoCaoSanPhamRow[];
}

// Lấy dữ liệu báo cáo doanh thu theo sản phẩm
export async function getBaoCaoSanPham() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format: 102.826.712)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      // Remove dots (thousands separator) and replace comma with dot (decimal separator)
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Lấy dữ liệu từ row 6 trở đi (Tên Sản phẩm, Số lượng bán, Doanh thu, Lợi nhuận góp)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCSanPham}!A6:D`,
    });

    const rows = dataResponse.data.values || [];
    const parsedRows: BaoCaoSanPhamRow[] = rows
      .filter((row) => row[0]) // Có tên sản phẩm
      .map((row) => ({
        tenSanPham: row[0] || "",
        soLuongBan: parseInt(row[1]) || 0,
        doanhThu: parseNumber(row[2]),
        loiNhuanGop: parseNumber(row[3]),
      }));

    return {
      rows: parsedRows,
    };
  } catch (error) {
    console.error("Error fetching Bao Cao San Pham:", error);
    throw error;
  }
}

// ============================================
// BÁO CÁO BÁN HÀNG THEO NHÂN VIÊN
// ============================================

// Interface cho báo cáo bán hàng theo nhân viên - theo tháng
export interface BaoCaoNhanVienTheoThangRow {
  stt: number;
  nhanVien: string;
  doanhThu: number;
  loiNhuanGop: number;
}

// Interface cho báo cáo bán hàng theo nhân viên - theo năm
export interface BaoCaoNhanVienTheoNamRow {
  stt: number;
  nhanVien: string;
  doanhThuNam: number;
  loiNhuanNam: number;
}

export interface BaoCaoNhanVienData {
  theoThang: {
    rows: BaoCaoNhanVienTheoThangRow[];
    thangBaoCao: string; // "1/2026"
    tongDoanhThu: number;
    tongLoiNhuan: number;
  };
  theoNam: {
    rows: BaoCaoNhanVienTheoNamRow[];
    namBaoCao: string; // "2026"
    tongDoanhThu: number;
    tongLoiNhuan: number;
  };
}

// Lấy dữ liệu báo cáo bán hàng theo nhân viên
export async function getBaoCaoNhanVien(thang?: string, nam?: string) {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format: 142.832.873)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      // Remove dots (thousands separator) and replace comma with dot (decimal separator)
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Cập nhật tháng/năm báo cáo nếu có (D3 cho tháng, I3 cho năm)
    if (thang) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdBaoCao,
        range: `${sheetNameBCNhanVien}!D3`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[thang]],
        },
      });
    }

    if (nam) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdBaoCao,
        range: `${sheetNameBCNhanVien}!I3`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[nam]],
        },
      });
    }

    // Lấy thông tin tháng/năm báo cáo từ D3 và I3
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCNhanVien}!D3:I3`,
    });
    const headerRow = headerResponse.data.values?.[0] || [];
    const thangBaoCao = headerRow[0] || "";
    const namBaoCao = headerRow[5] || ""; // I3 is 5 columns after D3

    // Lấy dữ liệu bảng 1 (theo tháng) từ row 6 trở đi - cột A:D
    const thangResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCNhanVien}!A6:D`,
    });

    const thangRows = thangResponse.data.values || [];
    let tongDoanhThuThang = 0;
    let tongLoiNhuanThang = 0;

    const parsedThangRows: BaoCaoNhanVienTheoThangRow[] = thangRows
      .filter((row) => row[0] && row[1] && !String(row[1]).toUpperCase().includes("TỔNG CỘNG"))
      .map((row) => {
        const doanhThu = parseNumber(row[2]);
        const loiNhuan = parseNumber(row[3]);
        tongDoanhThuThang += doanhThu;
        tongLoiNhuanThang += loiNhuan;
        return {
          stt: parseInt(row[0]) || 0,
          nhanVien: row[1] || "",
          doanhThu: doanhThu,
          loiNhuanGop: loiNhuan,
        };
      });

    // Lấy dữ liệu bảng 2 (theo năm) từ row 6 trở đi - cột F:I
    const namResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCNhanVien}!F6:I`,
    });

    const namRows = namResponse.data.values || [];
    let tongDoanhThuNam = 0;
    let tongLoiNhuanNam = 0;

    const parsedNamRows: BaoCaoNhanVienTheoNamRow[] = namRows
      .filter((row) => row[0] && row[1] && !String(row[1]).toUpperCase().includes("TỔNG CỘNG"))
      .map((row) => {
        const doanhThu = parseNumber(row[2]);
        const loiNhuan = parseNumber(row[3]);
        tongDoanhThuNam += doanhThu;
        tongLoiNhuanNam += loiNhuan;
        return {
          stt: parseInt(row[0]) || 0,
          nhanVien: row[1] || "",
          doanhThuNam: doanhThu,
          loiNhuanNam: loiNhuan,
        };
      });

    return {
      theoThang: {
        rows: parsedThangRows,
        thangBaoCao,
        tongDoanhThu: tongDoanhThuThang,
        tongLoiNhuan: tongLoiNhuanThang,
      },
      theoNam: {
        rows: parsedNamRows,
        namBaoCao,
        tongDoanhThu: tongDoanhThuNam,
        tongLoiNhuan: tongLoiNhuanNam,
      },
    };
  } catch (error) {
    console.error("Error fetching Bao Cao Nhan Vien:", error);
    throw error;
  }
}

// ============================================
// BÁO CÁO MUA HÀNG CỦA KHÁCH HÀNG
// ============================================

// Interface cho báo cáo mua hàng của khách hàng - theo tháng
export interface BaoCaoKhachHangTheoThangRow {
  stt: number;
  khachHang: string;
  doanhThu: number;
  loiNhuanGop: number;
}

// Interface cho báo cáo mua hàng của khách hàng - theo năm
export interface BaoCaoKhachHangTheoNamRow {
  stt: number;
  khachHang: string;
  doanhThuNam: number;
  loiNhuanNam: number;
}

export interface BaoCaoKhachHangData {
  theoThang: {
    rows: BaoCaoKhachHangTheoThangRow[];
    thangBaoCao: string; // "1/2026"
    tongDoanhThu: number;
    tongLoiNhuan: number;
  };
  theoNam: {
    rows: BaoCaoKhachHangTheoNamRow[];
    namBaoCao: string; // "2026"
    tongDoanhThu: number;
    tongLoiNhuan: number;
  };
}

// Lấy dữ liệu báo cáo mua hàng của khách hàng (cả 2 bảng)
export async function getBaoCaoKhachHang(thang?: string, nam?: string) {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format: 98.229.600)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      // Remove dots (thousands separator) and replace comma with dot (decimal separator)
      const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Cập nhật tháng/năm báo cáo nếu có
    if (thang) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdBaoCao,
        range: `${sheetNameBCKhachHang}!D3`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[thang]],
        },
      });
    }

    if (nam) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdBaoCao,
        range: `${sheetNameBCKhachHang}!I3`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[nam]],
        },
      });
    }

    // Lấy thông tin tháng/năm báo cáo từ D3 và I3
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCKhachHang}!D3:I3`,
    });
    const headerRow = headerResponse.data.values?.[0] || [];
    const thangBaoCao = headerRow[0] || "";
    const namBaoCao = headerRow[5] || ""; // I3 is 5 columns after D3

    // Lấy dữ liệu bảng 1 (theo tháng) từ row 6 trở đi - cột A:D
    const thangResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCKhachHang}!A6:D`,
    });

    const thangRows = thangResponse.data.values || [];
    let tongDoanhThuThang = 0;
    let tongLoiNhuanThang = 0;

    const parsedThangRows: BaoCaoKhachHangTheoThangRow[] = thangRows
      .filter((row) => row[0] && row[1] && !String(row[1]).toUpperCase().includes("TỔNG CỘNG"))
      .map((row) => {
        const doanhThu = parseNumber(row[2]);
        const loiNhuan = parseNumber(row[3]);
        tongDoanhThuThang += doanhThu;
        tongLoiNhuanThang += loiNhuan;
        return {
          stt: parseInt(row[0]) || 0,
          khachHang: row[1] || "",
          doanhThu: doanhThu,
          loiNhuanGop: loiNhuan,
        };
      });

    // Lấy dữ liệu bảng 2 (theo năm) từ row 6 trở đi - cột F:J
    const namResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdBaoCao,
      range: `${sheetNameBCKhachHang}!F6:J`,
    });

    const namRows = namResponse.data.values || [];
    let tongDoanhThuNam = 0;
    let tongLoiNhuanNam = 0;

    const parsedNamRows: BaoCaoKhachHangTheoNamRow[] = namRows
      .filter((row) => row[0] && row[1] && !String(row[1]).toUpperCase().includes("TỔNG CỘNG"))
      .map((row) => {
        const doanhThu = parseNumber(row[2]);
        const loiNhuan = parseNumber(row[3]);
        tongDoanhThuNam += doanhThu;
        tongLoiNhuanNam += loiNhuan;
        return {
          stt: parseInt(row[0]) || 0,
          khachHang: row[1] || "",
          doanhThuNam: doanhThu,
          loiNhuanNam: loiNhuan,
        };
      });

    return {
      theoThang: {
        rows: parsedThangRows,
        thangBaoCao,
        tongDoanhThu: tongDoanhThuThang,
        tongLoiNhuan: tongLoiNhuanThang,
      },
      theoNam: {
        rows: parsedNamRows,
        namBaoCao,
        tongDoanhThu: tongDoanhThuNam,
        tongLoiNhuan: tongLoiNhuanNam,
      },
    };
  } catch (error) {
    console.error("Error fetching Bao Cao Khach Hang:", error);
    throw error;
  }
}

// ============================================
// CÔNG NỢ PHẢI THU KHÁCH HÀNG (CNPT KH)
// ============================================

const spreadsheetIdCnptKh = process.env.GOOGLE_SPREADSHEET_ID_RIOMIO_BAN_HANG || "1bIXymFQLB6BJgYDS5qJYQl0SRUu7TtL_4XzzO0LPSis";
const sheetNameCnptKh = process.env.GOOGLE_SHEET_NAME_CNPT_KH_RIOMIO || "CNPT KH";

// Interface cho Bảng 1: Công nợ phải thu theo tháng
export interface CnptKhTheoThangItem {
  id: number;
  stt: number;
  khachHang: string;
  duDauKy: number;
  phatSinh: number;
  thanhToan: number;
  duCuoiKy: number;
}

// Interface cho Bảng 2: Công nợ khách hàng đến ngày
export interface CnptKhDenNgayItem {
  id: number;
  stt: number;
  khachHang: string;
  soTien: number;
}

// Interface cho dữ liệu Bảng 1
export interface CnptKhTheoThangData {
  data: CnptKhTheoThangItem[];
  tieuDe: string;
  currentDate: string; // Format: "M/YYYY" e.g., "1/2026"
}

// Interface cho dữ liệu Bảng 2
export interface CnptKhDenNgayData {
  data: CnptKhDenNgayItem[];
  tieuDe: string;
  currentDate: string; // Format: "DD/MM/YYYY" e.g., "31/12/2025"
}

/**
 * Lấy dữ liệu Bảng 1: Công nợ phải thu theo tháng
 * Sheet CNPT KH, cột A-F, header dòng 4, data từ dòng 5
 * Ngày tháng ở ô C3 (format: M/YYYY)
 */
export async function getCnptKhTheoThangFromSheet(): Promise<CnptKhTheoThangData> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      const str = String(value).trim();
      if (str === "" || str === "#N/A") return 0;
      const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Lấy tiêu đề (dòng 2) và ngày hiện tại (ô C3)
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdCnptKh,
      range: `${sheetNameCnptKh}!A2:C3`,
    });
    const headerRows = headerResponse.data.values || [];
    const tieuDe = headerRows[0]?.[0] || "BẢNG KÊ CÔNG NỢ PHẢI THU KHÁCH HÀNG";
    const currentDate = headerRows[1]?.[2] || ""; // C3

    // Lấy dữ liệu từ dòng 5
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdCnptKh,
      range: `${sheetNameCnptKh}!A5:F`,
    });

    const rows = dataResponse.data.values || [];
    const data: CnptKhTheoThangItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseInt(row[0]) || index + 1,
        khachHang: row[1] || "",
        duDauKy: parseNumber(row[2]),
        phatSinh: parseNumber(row[3]),
        thanhToan: parseNumber(row[4]),
        duCuoiKy: parseNumber(row[5]),
      }))
      .filter((item) => item.khachHang.trim() !== "" && !item.khachHang.includes("#N/A"));

    return { data, tieuDe, currentDate };
  } catch (error) {
    console.error("Error fetching CNPT KH theo thang from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật ngày tháng cho Bảng 1 (ô C3)
 * @param date - Format: "M/YYYY" e.g., "1/2026"
 */
export async function updateCnptKhTheoThangDate(date: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdCnptKh,
      range: `${sheetNameCnptKh}!C3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[date]],
      },
    });

    console.log(`Successfully updated CNPT KH theo thang date to: ${date}`);
  } catch (error) {
    console.error("Error updating CNPT KH theo thang date:", error);
    throw error;
  }
}

/**
 * Lấy dữ liệu Bảng 2: Công nợ khách hàng đến ngày
 * Sheet CNPT KH, cột H-J, header dòng 4, data từ dòng 5
 * Ngày ở ô J3 (format: DD/MM/YYYY)
 */
export async function getCnptKhDenNgayFromSheet(): Promise<CnptKhDenNgayData> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Helper function to parse number (Vietnamese format)
    const parseNumber = (value: any): number => {
      if (!value) return 0;
      const str = String(value).trim();
      if (str === "" || str === "#N/A") return 0;
      const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
      return parseFloat(cleaned) || 0;
    };

    // Lấy tiêu đề (dòng 2) và ngày hiện tại (ô J3)
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdCnptKh,
      range: `${sheetNameCnptKh}!H2:J3`,
    });
    const headerRows = headerResponse.data.values || [];
    const tieuDe = headerRows[0]?.[0] || "BẢNG KÊ CÔNG NỢ KHÁCH HÀNG";
    const currentDate = headerRows[1]?.[2] || ""; // J3

    // Lấy dữ liệu từ dòng 5
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdCnptKh,
      range: `${sheetNameCnptKh}!H5:J`,
    });

    const rows = dataResponse.data.values || [];
    const data: CnptKhDenNgayItem[] = rows
      .map((row, index) => ({
        id: index + 1,
        stt: parseInt(row[0]) || index + 1,
        khachHang: row[1] || "",
        soTien: parseNumber(row[2]),
      }))
      .filter((item) => item.khachHang.trim() !== "" && !item.khachHang.includes("#N/A"));

    return { data, tieuDe, currentDate };
  } catch (error) {
    console.error("Error fetching CNPT KH den ngay from Google Sheets:", error);
    throw error;
  }
}

/**
 * Cập nhật ngày cho Bảng 2 (ô J3)
 * @param date - Format: "DD/MM/YYYY" e.g., "31/12/2025"
 */
export async function updateCnptKhDenNgayDate(date: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdCnptKh,
      range: `${sheetNameCnptKh}!J3`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[date]],
      },
    });

    console.log(`Successfully updated CNPT KH den ngay date to: ${date}`);
  } catch (error) {
    console.error("Error updating CNPT KH den ngay date:", error);
    throw error;
  }
}
