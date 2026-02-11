-- ============================================
-- CREATE ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-gray-500',
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed existing roles
INSERT INTO public.roles (id, display_name, color, is_system, sort_order) VALUES
  ('admin', 'Admin', 'bg-red-500', true, 0),
  ('tong_hop', 'Tổng hợp', 'bg-blue-500', false, 1),
  ('ke_toan', 'Kế toán', 'bg-green-500', false, 2),
  ('pattern', 'Pattern', 'bg-purple-500', false, 3),
  ('may_mau', 'May mẫu', 'bg-pink-500', false, 4),
  ('thiet_ke', 'Thiết kế', 'bg-indigo-500', false, 5),
  ('quan_ly_don_hang', 'Quản lý đơn hàng', 'bg-orange-500', false, 6),
  ('sale_si', 'Sale sỉ', 'bg-yellow-500', false, 7),
  ('sale_san', 'Sale sàn', 'bg-amber-500', false, 8),
  ('thu_kho', 'Thủ kho', 'bg-teal-500', false, 9),
  ('hinh_anh', 'Hình ảnh', 'bg-cyan-500', false, 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DROP CHECK CONSTRAINT ON profiles.role
-- ============================================
-- Find and drop the existing CHECK constraint
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE rel.relname = 'profiles'
    AND nsp.nspname = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%role%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No CHECK constraint found on profiles.role';
  END IF;
END $$;

-- ============================================
-- RLS POLICIES FOR ROLES TABLE
-- ============================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read roles
CREATE POLICY "Anyone can read roles" ON public.roles
  FOR SELECT USING (true);

-- Only admin can manage roles
CREATE POLICY "Admin can insert roles" ON public.roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update roles" ON public.roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete roles" ON public.roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
