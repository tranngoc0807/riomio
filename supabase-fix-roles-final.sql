-- IMPORTANT: Run these steps in ORDER

-- Step 1: Drop old constraint FIRST (to allow UPDATE)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Update existing users with old roles to new default role
UPDATE public.profiles
SET role = 'tong_hop'
WHERE role IN ('staff', 'manager');

-- Step 3: Add new constraint with all department roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN (
  'admin',
  'tong_hop',
  'ke_toan',
  'pattern',
  'may_mau',
  'thiet_ke',
  'quan_ly_don_hang',
  'sale_si',
  'sale_san',
  'thu_kho',
  'hinh_anh'
));

-- Step 4: Update default value for new profiles
ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'tong_hop';
