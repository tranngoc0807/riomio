-- Migration: cho phép 1 user có nhiều role
-- Chạy 1 lần trên Supabase SQL Editor.
-- An toàn: idempotent (chạy lại không lỗi), giữ cột `role` cũ làm fallback.

-- 1. Thêm cột roles text[] nếu chưa có
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}';

-- 2. Backfill từ cột role cũ → roles[] cho các row chưa có roles
UPDATE public.profiles
SET roles = ARRAY[role]
WHERE (roles IS NULL OR array_length(roles, 1) IS NULL)
  AND role IS NOT NULL;

-- 3. Index để query nhanh khi cần tìm user theo role
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN (roles);

-- 4. Verify
SELECT id, email, full_name, role, roles FROM public.profiles ORDER BY created_at DESC LIMIT 10;
