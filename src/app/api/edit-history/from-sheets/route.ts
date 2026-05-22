import { NextResponse } from 'next/server';
import { logEdit } from '@/lib/editHistory';

// Map Google Sheet tab name -> internal table_key (chỉ cần cho các bảng pilot)
const SHEET_TO_TABLE_KEY: Record<string, string> = {
  'Dòng tiền': 'dong-tien',
  'DS KH': 'khach-hang',
  'Thông tin tài khoản': 'tai-khoan-so-quy',
  'Chi phí bán hàng trực tiếp': 'chi-phi-ban-hang',
};

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-sheets-secret');
    if (!secret || secret !== process.env.SHEETS_LOG_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sheetName,
      rowIndex,
      columnIndex,
      columnLetter,
      oldValue,
      newValue,
      userEmail,
    } = body as {
      sheetName?: string;
      rowIndex?: number;
      columnIndex?: number;
      columnLetter?: string;
      oldValue?: string | null;
      newValue?: string | null;
      userEmail?: string | null;
    };

    if (!sheetName || rowIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing sheetName or rowIndex' },
        { status: 400 }
      );
    }

    const tableKey = SHEET_TO_TABLE_KEY[sheetName] ?? `sheets:${sheetName}`;
    const fieldKey = columnLetter ?? (columnIndex !== undefined ? `col${columnIndex}` : 'value');

    await logEdit({
      source: 'sheets_ui',
      action: 'update',
      tableKey,
      sheetName,
      rowIndex,
      userEmail: userEmail ?? null,
      oldData: { [fieldKey]: oldValue ?? null },
      newData: { [fieldKey]: newValue ?? null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[edit-history/from-sheets] error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
