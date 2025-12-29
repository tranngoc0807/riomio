-- Update roles constraint in profiles table
-- Drop old constraint if exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with all department roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN (
  'admin',
  'tong_hop',         -- Tổng hợp
  'ke_toan',          -- Kế toán
  'pattern',          -- Pattern
  'may_mau',          -- May mẫu
  'thiet_ke',         -- Thiết kế
  'quan_ly_don_hang', -- Quản lý đơn hàng
  'sale_si',          -- Sale sỉ
  'sale_san',         -- Sale sàn
  'thu_kho',          -- Thủ kho
  'hinh_anh'          -- Hình ảnh
));

-- Update default value for new profiles
ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'tong_hop';

-- Optional: Update existing non-admin users to tong_hop
-- Uncomment if you want to migrate existing staff/manager to tong_hop
-- UPDATE public.profiles
-- SET role = 'tong_hop'
-- WHERE role NOT IN ('admin');
