import { NextRequest, NextResponse } from "next/server";
import { getCustomerCurrentDebt } from "@/lib/googleSheets";

/**
 * GET /api/customer-debt?customer=<name>
 * Trả về công nợ hiện tại của khách hàng (giá trị cuối cùng cột Dư cuối
 * trong sheet "Theo dõi công nợ từng khách hàng" sau khi filter theo tên).
 */
export async function GET(request: NextRequest) {
  try {
    const customer = request.nextUrl.searchParams.get("customer");
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Missing 'customer' query param" },
        { status: 400 }
      );
    }

    const debt = await getCustomerCurrentDebt(customer);
    return NextResponse.json({ success: true, debt });
  } catch (error: any) {
    console.error("Error fetching customer debt:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer debt" },
      { status: 500 }
    );
  }
}
