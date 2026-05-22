# Apps Script `onEdit` — gửi log về Riomio Shop

File này hướng dẫn cài Google Apps Script trên Google Sheet để mọi chỉnh sửa **thủ công trên UI Google Sheets** đều được log về bảng `edit_history` trên Supabase.

> Chỉnh sửa do app Next.js gọi API sẽ được log riêng (`source = 'app'`) bằng helper backend, **không** đi qua Apps Script. Hai nguồn không trùng nhau.

---

## 1. Mở Apps Script editor

1. Mở Google Sheet cần log (ví dụ: spreadsheet chứa các sheet "Dòng tiền", "DS KH", v.v.)
2. Menu **Extensions → Apps Script**
3. Sẽ mở 1 dự án Apps Script gắn với spreadsheet đó

## 2. Paste code

Thay nội dung `Code.gs` bằng đoạn dưới đây.

**LƯU Ý:**
- Thay `ENDPOINT` bằng URL production thật (sau khi deploy Vercel)
- `SECRET` lấy từ `.env.local` → `SHEETS_LOG_SECRET` (đã có sẵn)
- `WATCHED_SHEETS` là tên các tab cần log (case-sensitive, đúng tên trên Google Sheet)

```javascript
const ENDPOINT = "https://YOUR-APP.vercel.app/api/edit-history/from-sheets";
const SECRET = "ffb06e6339da0484346437c0a4e286ba42e64b0c0021f37f729d0b6007e01646";

// Chỉ log các sheet trong danh sách này (để giảm noise)
const WATCHED_SHEETS = [
  "Dòng tiền",
  "DS KH",
  "Thông tin tài khoản",
  "Chi phí bán hàng trực tiếp",
];

/**
 * Installable onEdit trigger.
 * KHÔNG đặt tên hàm là `onEdit` để tránh chạy như simple-trigger (simple trigger không gọi được URL ngoài).
 */
function onEditInstallable(e) {
  try {
    if (!e || !e.range) return;

    const sheet = e.range.getSheet();
    const sheetName = sheet.getName();
    if (WATCHED_SHEETS.indexOf(sheetName) === -1) return;

    // Bỏ qua khi user paste nhiều ô cùng lúc (chỉ log single-cell edit để đơn giản)
    const numRows = e.range.getNumRows();
    const numCols = e.range.getNumColumns();
    if (numRows > 1 || numCols > 1) return;

    const rowIndex = e.range.getRow();
    const columnIndex = e.range.getColumn();
    const columnLetter = columnToLetter(columnIndex);

    const payload = {
      sheetName: sheetName,
      rowIndex: rowIndex,
      columnIndex: columnIndex,
      columnLetter: columnLetter,
      oldValue: e.oldValue !== undefined ? e.oldValue : null,
      newValue: e.value !== undefined ? e.value : null,
      userEmail: getUserEmailSafe(),
    };

    UrlFetchApp.fetch(ENDPOINT, {
      method: "post",
      contentType: "application/json",
      headers: { "x-sheets-secret": SECRET },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
  } catch (err) {
    console.error("onEditInstallable error:", err);
  }
}

function columnToLetter(col) {
  let letter = "";
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

function getUserEmailSafe() {
  try {
    return Session.getActiveUser().getEmail() || null;
  } catch (e) {
    return null;
  }
}
```

## 3. Cài installable trigger

Simple `onEdit(e)` trigger **không** gọi được URL ngoài (UrlFetchApp). Phải dùng installable trigger.

1. Trong Apps Script editor, click icon **đồng hồ** (Triggers) ở sidebar trái
2. Click **+ Add Trigger** (góc dưới phải)
3. Chọn:
   - Function: `onEditInstallable`
   - Deployment: `Head`
   - Event source: `From spreadsheet`
   - Event type: `On edit`
4. Save → Google sẽ yêu cầu authorize → cấp quyền (chấp nhận warning "App này chưa verified")

## 4. Test

1. Mở Google Sheet, vào tab `Dòng tiền`, sửa 1 ô bất kỳ
2. Vào Supabase → SQL Editor → chạy:
   ```sql
   select * from edit_history
   where source = 'sheets_ui'
   order by created_at desc
   limit 5;
   ```
3. Nếu thấy row mới có `user_email`, `old_data`, `new_data` → OK

## 5. Lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| Không có row mới trong `edit_history` | Check **Executions** trong Apps Script (sidebar trái) — xem trigger có chạy không và log lỗi gì |
| 401 Unauthorized | `SECRET` trong code không khớp với `SHEETS_LOG_SECRET` trên server |
| 404 / không reach được URL | Kiểm tra `ENDPOINT` đã deploy chưa; Apps Script không gọi được `localhost` |
| `user_email` = null | Session.getActiveUser() chỉ work nếu user trong cùng Google Workspace với owner sheet; với account ngoài Workspace sẽ ẩn email |
| Nhiều log dồn dập khi paste 1 vùng | Code đã skip multi-cell edit; nếu cần log paste vùng thì bỏ check `numRows > 1` |

## 6. Mở rộng sang sheet khác

Khi muốn log thêm sheet:
1. Thêm tên tab vào `WATCHED_SHEETS` trong Apps Script
2. Thêm mapping `sheetName → tableKey` trong `src/app/api/edit-history/from-sheets/route.ts` (object `SHEET_TO_TABLE_KEY`)
3. Nếu không thêm mapping thì vẫn log, nhưng `table_key` sẽ là `sheets:<sheetName>` (không match được với UI app)
