import { NextRequest, NextResponse } from "next/server";
import { getCustomerDebtRows } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

/**
 * GET /api/customer-debt-history?customer=<name>
 * Trả về TOÀN BỘ lịch sử công nợ của KH (mảng {noiDung, duCuoi}).
 * Frontend cache kết quả → các đơn cùng KH không cần gọi lại API.
 */
export async function GET(request: NextRequest) {
  try {
    const customer = request.nextUrl.searchParams.get("customer");
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Missing 'customer' query param" },
        { status: 400 },
      );
    }
    const rows = await getCustomerDebtRows(customer);
    return NextResponse.json({ success: true, rows });
  } catch (error: any) {
    console.error("Error fetching customer debt history:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed" },
      { status: 500 },
    );
  }
}
