/**
 * Chuyển các lỗi từ Google APIs / mạng / hệ thống sang thông báo
 * tiếng Việt dễ hiểu cho người dùng cuối.
 *
 * Dùng ở cả server (googleSheets.ts, API routes) và client (nếu cần).
 */
export function translateApiError(input: unknown): string {
  const msg = extractRawMessage(input);
  if (!msg) return "Đã có lỗi xảy ra, vui lòng thử lại sau.";

  const lower = msg.toLowerCase();

  // Google Sheets API quota
  if (
    lower.includes("quota exceeded") ||
    lower.includes("quota metric") ||
    lower.includes("read requests per minute") ||
    lower.includes("write requests per minute") ||
    lower.includes("rate_limit_exceeded")
  ) {
    return "Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng chờ khoảng 30–60 giây rồi thử lại.";
  }

  // 429 Too Many Requests
  if (lower.includes("too many requests") || lower.includes("status code 429")) {
    return "Bạn đang thao tác quá nhanh. Vui lòng chờ vài giây rồi thử lại.";
  }

  // Permission denied / 403
  if (
    lower.includes("permission denied") ||
    lower.includes("forbidden") ||
    lower.includes("status code 403") ||
    lower.includes("the caller does not have permission")
  ) {
    return "Bạn không có quyền truy cập dữ liệu này. Vui lòng liên hệ quản trị viên.";
  }

  // Auth / 401
  if (
    lower.includes("unauthenticated") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid_grant") ||
    lower.includes("status code 401")
  ) {
    return "Phiên làm việc đã hết hạn hoặc thông tin xác thực không hợp lệ. Vui lòng đăng nhập lại.";
  }

  // Not found / 404
  if (lower.includes("requested entity was not found") || lower.includes("status code 404")) {
    return "Không tìm thấy dữ liệu yêu cầu trên Google Sheet.";
  }

  // Timeout / network
  if (
    lower.includes("etimedout") ||
    lower.includes("deadline exceeded") ||
    lower.includes("network timeout") ||
    lower.includes("socket hang up")
  ) {
    return "Kết nối đến Google Sheets bị chậm. Vui lòng thử lại.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower.includes("enotfound") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused")
  ) {
    return "Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng rồi thử lại.";
  }

  // 500 / internal
  if (
    lower.includes("internal error") ||
    lower.includes("internal server error") ||
    lower.includes("status code 500") ||
    lower.includes("backend error")
  ) {
    return "Máy chủ Google đang gặp sự cố. Vui lòng thử lại sau vài phút.";
  }

  // 503 / unavailable
  if (lower.includes("service unavailable") || lower.includes("status code 503")) {
    return "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.";
  }

  return msg;
}

function extractRawMessage(input: unknown): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (input instanceof Error) return input.message;
  if (typeof input === "object") {
    const anyInput = input as any;
    // googleapis lỗi thường có dạng: { errors: [...], response: { data: { error: { message } } } }
    if (anyInput.response?.data?.error?.message) {
      return String(anyInput.response.data.error.message);
    }
    if (anyInput.error?.message) return String(anyInput.error.message);
    if (anyInput.message) return String(anyInput.message);
    try {
      return JSON.stringify(anyInput);
    } catch {
      return "";
    }
  }
  return String(input);
}
