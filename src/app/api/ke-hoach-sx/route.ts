import { NextResponse } from "next/server";
import { getKeHoachSXFromSheet } from "@/lib/googleSheets";

// Helper function to extract URL from =IMAGE("url") formula (for legacy data)
function extractImageUrl(value: string): string {
  if (!value) return "";
  // Match =IMAGE("url") or =IMAGE('url')
  const match = value.match(/=IMAGE\(["'](.+?)["']\)/i);
  if (match) {
    return match[1];
  }
  return value;
}

/**
 * GET /api/ke-hoach-sx
 * Lấy danh sách kế hoạch sản xuất từ Google Sheets
 */
export async function GET() {
  try {
    const keHoachList = await getKeHoachSXFromSheet();

    // Extract image URLs from =IMAGE() formula for legacy data
    const processedList = keHoachList.map((item) => ({
      ...item,
      image: extractImageUrl(item.image),
    }));

    return NextResponse.json({
      success: true,
      data: processedList,
    });
  } catch (error: any) {
    console.error("Error fetching ke hoach SX:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch ke hoach SX from Google Sheets",
      },
      { status: 500 }
    );
  }
}
