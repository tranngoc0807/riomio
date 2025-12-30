# Hướng dẫn tích hợp Google Sheets

## Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Click vào dropdown ở góc trên bên trái, chọn "New Project"
3. Đặt tên project: "Riomio Shop Integration"
4. Click "Create"

## Bước 2: Bật Google Sheets API

1. Ở trang chủ project, click vào menu bên trái, chọn "APIs & Services" > "Library"
2. Tìm kiếm "Google Sheets API"
3. Click vào "Google Sheets API"
4. Click nút "Enable"

## Bước 3: Tạo Service Account

1. Ở menu bên trái, chọn "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Điền thông tin:
   - Service account name: `riomio-sheets-service`
   - Service account ID: sẽ tự động tạo
   - Click "Create and Continue"
4. Ở phần "Permissions (optional)" - **BỎ QUA** bước này:
   - Click "Done" để hoàn tất
   - *Lưu ý: Bạn không cần gán role ở đây vì sẽ share Sheet trực tiếp với service account ở bước sau*

## Bước 4: Tạo JSON Key

1. Ở trang Credentials, tìm service account vừa tạo
2. Click vào service account đó
3. Chuyển sang tab "Keys"
4. Click "Add Key" > "Create new key"
5. Chọn type: "JSON"
6. Click "Create"
7. File JSON sẽ tự động download về máy

## Bước 5: Tạo Google Sheet

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo sheet mới hoặc mở sheet có sẵn
3. Đặt tên sheet: "Danh sách nhân viên Riomio"
4. Tạo header ở dòng đầu tiên:![alt text](image.png)

| id | name | position | phone | birthday | cccd | address | avatar |
|----|------|----------|-------|----------|------|---------|--------|

5. Copy SPREADSHEET_ID từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

## Bước 6: Share Sheet với Service Account

1. Mở file JSON key đã download
2. Tìm field `client_email`, copy email đó (dạng: `xxx@xxx.iam.gserviceaccount.com`)
3. Ở Google Sheet, click nút "Share" ở góc trên bên phải
4. Paste email service account vào
5. Chọn quyền: "Editor"
6. Bỏ tick "Notify people" (vì đây là service account)
7. Click "Share"

## Bước 7: Cấu hình Environment Variables

1. Mở file JSON key đã download
2. Copy toàn bộ nội dung file JSON
3. Tạo file `.env.local` ở thư mục gốc project (nếu chưa có)
4. Thêm các biến sau:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY="paste private_key từ JSON file"
GOOGLE_SHEETS_CLIENT_EMAIL="paste client_email từ JSON file"
GOOGLE_SPREADSHEET_ID="paste spreadsheet ID từ URL"
GOOGLE_SHEET_NAME="Sheet1"
```

**LƯU Ý QUAN TRỌNG về GOOGLE_SHEETS_PRIVATE_KEY:**
- Copy cả chuỗi private_key từ JSON file, bao gồm `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`
- Giữ nguyên ký tự `\n` trong chuỗi
- Ví dụ:
```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

## Bước 8: Cài đặt package

Chạy lệnh sau để cài đặt Google APIs client library:

```bash
npm install googleapis
```

## Bước 9: Kiểm tra

Sau khi hoàn thành các bước trên, bạn sẽ có:
- ✅ Google Cloud Project với Sheets API đã bật
- ✅ Service Account với JSON credentials
- ✅ Google Sheet đã share với service account
- ✅ File `.env.local` với đầy đủ thông tin cấu hình
- ✅ Package `googleapis` đã được cài đặt

## Bước tiếp theo

Sau khi hoàn thành setup, tôi sẽ tạo:
1. Google Sheets utility functions
2. API routes để đọc/ghi dữ liệu
3. Tích hợp vào trang danh sách nhân viên
