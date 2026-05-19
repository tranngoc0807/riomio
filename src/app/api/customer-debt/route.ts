import { NextRequest, NextResponse } from "next/server";
import { getCustomerCurrentDebt } from "@/lib/googleSheets";

/**
 * GET /api/customer-debt?customer=<name>&orderCode=<code>
 * Trả về công nợ "cũ" của khách hàng — dư cuối TRƯỚC khi tính đơn `orderCode`.
 * Nếu không truyền orderCode hoặc không tìm thấy trong sheet → trả về dư cuối cuối cùng.
 */
export async function GET(request: NextRequest) {
  try {
    const customer = request.nextUrl.searchParams.get("customer");
    const orderCode =
      request.nextUrl.searchParams.get("orderCode") || undefined;
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Missing 'customer' query param" },
        { status: 400 }
      );
    }

    const debt = await getCustomerCurrentDebt(customer, orderCode);
    return NextResponse.json({ success: true, debt });
  } catch (error: any) {
    console.error("Error fetching customer debt:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer debt" },
      { status: 500 }
    );
  }
}
