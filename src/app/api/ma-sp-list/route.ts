import { NextResponse } from "next/server";
import {
  getMaSPListFromSheet,
  getColorSizeListsFromSheet,
  getTonKhoFromSheet,
} from "@/lib/googleSheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [items, colorSize, tonKhoList] = await Promise.all([
      getMaSPListFromSheet(),
      getColorSizeListsFromSheet(),
      getTonKhoFromSheet().catch(() => []),
    ]);

    // Map maSP → tonCuoi (sum nếu trùng mã)
    const tonKhoByMaSP = new Map<string, number>();
    for (const t of tonKhoList) {
      const key = t.maSp.trim();
      if (!key) continue;
      tonKhoByMaSP.set(key, (tonKhoByMaSP.get(key) || 0) + (t.tonCuoi || 0));
    }

    const merged = items.map((item) => ({
      ...item,
      tonKho: tonKhoByMaSP.get(item.code) ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: merged,
      colors: colorSize.colors,
      sizes: colorSize.sizes,
    });
  } catch (error: any) {
    console.error("Error fetching Mã SP list:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch Mã SP list",
      },
      { status: 500 },
    );
  }
}
