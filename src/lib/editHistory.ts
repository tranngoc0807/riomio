import { getServiceRoleClient } from '@/lib/supabase/serviceRole';

export type EditAction = 'add' | 'update' | 'delete';
export type EditSource = 'app' | 'sheets_ui';

export interface LogEditParams {
  source: EditSource;
  action: EditAction;
  tableKey: string;
  sheetName?: string | null;
  rowIndex?: number | null;
  recordId?: number | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  userEmail?: string | null;
}

export interface EditHistoryRow {
  id: string;
  created_at: string;
  user_email: string | null;
  source: EditSource;
  action: EditAction;
  table_key: string;
  sheet_name: string | null;
  row_index: number | null;
  record_id: number | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
}

export function diffRecords(
  oldData: Record<string, unknown> | null | undefined,
  newData: Record<string, unknown> | null | undefined
): string[] {
  if (!oldData || !newData) return [];
  const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  const changed: string[] = [];
  for (const k of keys) {
    const a = oldData[k];
    const b = newData[k];
    if (normalize(a) !== normalize(b)) changed.push(k);
  }
  return changed;
}

function normalize(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(v);
  return String(v).trim();
}

export async function logEdit(params: LogEditParams): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    const changed_fields =
      params.action === 'update'
        ? diffRecords(params.oldData, params.newData)
        : null;

    // Bỏ qua update không có thay đổi gì
    if (params.action === 'update' && changed_fields && changed_fields.length === 0) {
      return;
    }

    const row = {
      source: params.source,
      action: params.action,
      table_key: params.tableKey,
      sheet_name: params.sheetName ?? null,
      row_index: params.rowIndex ?? null,
      record_id: params.recordId ?? null,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      changed_fields,
      user_email: params.userEmail ?? null,
    };
    const { error } = await supabase.from('edit_history').insert(row as never);

    if (error) {
      console.error('[editHistory] insert error:', error.message);
    }
  } catch (err) {
    console.error('[editHistory] unexpected error:', err);
  }
}

/**
 * Helper rút gọn cho API routes: tự fetch user email, source='app'.
 * Strip các trường không phải data (id, rowIndex) khỏi old/new để diff sạch.
 */
export async function logSheetEdit(params: {
  action: EditAction;
  tableKey: string;
  sheetName?: string;
  rowIndex?: number | null;
  recordId?: number | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}): Promise<void> {
  const { getCurrentUserEmail } = await import('@/lib/getUserEmail');
  const userEmail = await getCurrentUserEmail();
  await logEdit({
    source: 'app',
    action: params.action,
    tableKey: params.tableKey,
    sheetName: params.sheetName ?? null,
    rowIndex: params.rowIndex ?? null,
    recordId: params.recordId ?? null,
    oldData: params.oldData ? stripMeta(params.oldData) : null,
    newData: params.newData ? stripMeta(params.newData) : null,
    userEmail,
  });
}

function stripMeta(obj: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, rowIndex: _rowIndex, ...rest } = obj;
  void _id;
  void _rowIndex;
  return rest;
}

export async function getEditHistory(filters: {
  tableKey?: string;
  rowIndex?: number;
  limit?: number;
}): Promise<EditHistoryRow[]> {
  const supabase = getServiceRoleClient();
  let query = supabase
    .from('edit_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.tableKey) query = query.eq('table_key', filters.tableKey);
  if (filters.rowIndex !== undefined)
    query = query.eq('row_index', filters.rowIndex);

  const { data, error } = await query;
  if (error) {
    console.error('[editHistory] read error:', error.message);
    return [];
  }
  return (data as unknown as EditHistoryRow[]) ?? [];
}
