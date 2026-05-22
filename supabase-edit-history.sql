-- Bảng lưu lịch sử chỉnh sửa dữ liệu Google Sheets (từ app Next.js và Apps Script onEdit)
-- Chạy file này trong Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.edit_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  user_email      text,
  source          text NOT NULL CHECK (source IN ('app', 'sheets_ui')),
  action          text NOT NULL CHECK (action IN ('add', 'update', 'delete')),
  table_key       text NOT NULL,
  sheet_name      text,
  row_index       integer,
  record_id       integer,
  old_data        jsonb,
  new_data        jsonb,
  changed_fields  text[]
);

CREATE INDEX IF NOT EXISTS edit_history_table_row_idx
  ON public.edit_history (table_key, row_index, created_at DESC);

CREATE INDEX IF NOT EXISTS edit_history_created_at_idx
  ON public.edit_history (created_at DESC);

CREATE INDEX IF NOT EXISTS edit_history_user_email_idx
  ON public.edit_history (user_email);

ALTER TABLE public.edit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edit_history_select_authenticated" ON public.edit_history;
CREATE POLICY "edit_history_select_authenticated"
  ON public.edit_history FOR SELECT
  TO authenticated
  USING (true);
