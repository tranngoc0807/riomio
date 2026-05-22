import { NextResponse } from 'next/server';
import { getEditHistory } from '@/lib/editHistory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableKey = searchParams.get('tableKey') ?? undefined;
    const rowIndexRaw = searchParams.get('rowIndex');
    const limitRaw = searchParams.get('limit');

    const rowIndex =
      rowIndexRaw !== null && rowIndexRaw !== '' ? parseInt(rowIndexRaw) : undefined;
    const limit =
      limitRaw !== null && limitRaw !== '' ? parseInt(limitRaw) : undefined;

    const data = await getEditHistory({ tableKey, rowIndex, limit });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
