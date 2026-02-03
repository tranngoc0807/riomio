-- =====================================================
-- ROLE PERMISSIONS TABLE
-- Bảng lưu cấu hình phân quyền cho từng role
-- =====================================================

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read (để load permissions khi đăng nhập)
CREATE POLICY "Allow authenticated users to read role permissions"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert
CREATE POLICY "Allow admins to insert role permissions"
  ON public.role_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update
CREATE POLICY "Allow admins to update role permissions"
  ON public.role_permissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete
CREATE POLICY "Allow admins to delete role permissions"
  ON public.role_permissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS role_permissions_updated_at ON public.role_permissions;
CREATE TRIGGER role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_updated_at();

-- =====================================================
-- INSERT DEFAULT PERMISSIONS FOR ALL ROLES
-- Permissions format: Array of menu IDs that the role can access
-- Example: ["thong-tin-cong-ty", "san-xuat", "san-xuat/nguyen-phu-lieu", ...]
-- =====================================================

-- Admin: Full access to everything
INSERT INTO public.role_permissions (role, permissions) VALUES
('admin', '[
  "thong-tin-cong-ty",
  "san-xuat",
  "san-xuat/nguyen-phu-lieu",
  "san-xuat/gia-cong",
  "san-xuat/hinh-in",
  "san-xuat/ke-hoach",
  "san-xuat/gia-thanh",
  "san-xuat/cong-doan",
  "san-xuat/san-pham",
  "san-xuat/chi-phi-khac",
  "san-pham",
  "ban-hang",
  "ban-hang/don-hang",
  "ban-hang/khach-hang",
  "ban-hang/chuong-trinh",
  "ban-hang/chi-phi",
  "dong-tien",
  "quan-ly-tien-vay",
  "so-quy",
  "bao-cao",
  "bao-cao/tai-chinh",
  "bao-cao/ban-hang",
  "bao-cao/kho",
  "bao-cao/dong-tien",
  "bao-cao/chi-phi",
  "nhan-su",
  "nhan-su/danh-sach",
  "nhan-su/quy-che-hop-dong",
  "nhan-su/cham-cong",
  "nhan-su/bang-luong",
  "nhan-su/bao-hiem",
  "cau-hinh"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Tổng hợp: Access to production, products, sales
INSERT INTO public.role_permissions (role, permissions) VALUES
('tong_hop', '[
  "thong-tin-cong-ty",
  "san-xuat",
  "san-xuat/nguyen-phu-lieu",
  "san-xuat/gia-cong",
  "san-xuat/hinh-in",
  "san-xuat/ke-hoach",
  "san-xuat/gia-thanh",
  "san-xuat/cong-doan",
  "san-xuat/san-pham",
  "san-xuat/chi-phi-khac",
  "san-pham",
  "ban-hang",
  "ban-hang/don-hang",
  "ban-hang/khach-hang",
  "ban-hang/chuong-trinh",
  "ban-hang/chi-phi"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Kế toán: Access to financial menus
INSERT INTO public.role_permissions (role, permissions) VALUES
('ke_toan', '[
  "thong-tin-cong-ty",
  "san-xuat",
  "san-xuat/nguyen-phu-lieu",
  "san-xuat/gia-cong",
  "san-xuat/hinh-in",
  "san-xuat/ke-hoach",
  "san-xuat/gia-thanh",
  "san-xuat/cong-doan",
  "san-xuat/san-pham",
  "san-xuat/chi-phi-khac",
  "san-pham",
  "ban-hang",
  "ban-hang/don-hang",
  "ban-hang/khach-hang",
  "ban-hang/chuong-trinh",
  "ban-hang/chi-phi",
  "dong-tien",
  "quan-ly-tien-vay",
  "so-quy",
  "bao-cao",
  "bao-cao/tai-chinh",
  "bao-cao/ban-hang",
  "bao-cao/kho",
  "bao-cao/dong-tien",
  "bao-cao/chi-phi",
  "nhan-su",
  "nhan-su/danh-sach",
  "nhan-su/quy-che-hop-dong",
  "nhan-su/cham-cong",
  "nhan-su/bang-luong",
  "nhan-su/bao-hiem"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Pattern: Production focused
INSERT INTO public.role_permissions (role, permissions) VALUES
('pattern', '[
  "thong-tin-cong-ty",
  "san-xuat",
  "san-xuat/nguyen-phu-lieu",
  "san-xuat/ke-hoach",
  "san-xuat/cong-doan",
  "san-xuat/san-pham",
  "san-pham"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- May mẫu: Production focused
INSERT INTO public.role_permissions (role, permissions) VALUES
('may_mau', '[
  "thong-tin-cong-ty",
  "san-xuat",
  "san-xuat/nguyen-phu-lieu",
  "san-xuat/ke-hoach",
  "san-xuat/cong-doan",
  "san-xuat/san-pham",
  "san-pham"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Thiết kế: Design focused
INSERT INTO public.role_permissions (role, permissions) VALUES
('thiet_ke', '[
  "thong-tin-cong-ty",
  "san-xuat",
  "san-xuat/hinh-in",
  "san-xuat/san-pham",
  "san-pham"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Quản lý đơn hàng: Orders and sales focused
INSERT INTO public.role_permissions (role, permissions) VALUES
('quan_ly_don_hang', '[
  "thong-tin-cong-ty",
  "san-pham",
  "ban-hang",
  "ban-hang/don-hang",
  "ban-hang/khach-hang",
  "ban-hang/chuong-trinh",
  "ban-hang/chi-phi",
  "dong-tien",
  "quan-ly-tien-vay",
  "so-quy",
  "bao-cao",
  "bao-cao/tai-chinh",
  "bao-cao/ban-hang",
  "bao-cao/kho",
  "bao-cao/dong-tien",
  "bao-cao/chi-phi",
  "nhan-su",
  "nhan-su/danh-sach",
  "nhan-su/quy-che-hop-dong",
  "nhan-su/cham-cong",
  "nhan-su/bang-luong",
  "nhan-su/bao-hiem"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Sale sỉ: Sales focused
INSERT INTO public.role_permissions (role, permissions) VALUES
('sale_si', '[
  "thong-tin-cong-ty",
  "san-pham",
  "ban-hang",
  "ban-hang/don-hang",
  "ban-hang/khach-hang",
  "ban-hang/chuong-trinh"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Sale sàn: Sales focused
INSERT INTO public.role_permissions (role, permissions) VALUES
('sale_san', '[
  "thong-tin-cong-ty",
  "san-pham",
  "ban-hang",
  "ban-hang/don-hang",
  "ban-hang/khach-hang",
  "ban-hang/chuong-trinh"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Thủ kho: Warehouse focused
INSERT INTO public.role_permissions (role, permissions) VALUES
('thu_kho', '[
  "thong-tin-cong-ty",
  "san-xuat",
  "san-xuat/nguyen-phu-lieu",
  "san-pham"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Hình ảnh: Image/design focused
INSERT INTO public.role_permissions (role, permissions) VALUES
('hinh_anh', '[
  "thong-tin-cong-ty",
  "san-xuat",
  "san-xuat/hinh-in",
  "san-pham"
]'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Verify data
SELECT * FROM public.role_permissions;
