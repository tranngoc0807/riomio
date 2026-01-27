-- Supabase SQL migration for contracts table
-- Run this in your Supabase SQL editor

-- Table for storing all contracts/documents
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_type VARCHAR(50) NOT NULL, -- 'hop_dong_lao_dong', 'kpi_kinh_doanh', etc.
  employee_id INTEGER, -- Reference to employee (optional)
  employee_name VARCHAR(255),

  -- Common fields
  contract_number VARCHAR(50),
  year INTEGER DEFAULT 2026,
  month INTEGER,

  -- Employee info (for HDLD)
  danh_xung VARCHAR(10), -- Ông/Bà
  ngay_sinh DATE,
  cccd VARCHAR(20),
  ngay_cap_cccd DATE,
  noi_cap_cccd VARCHAR(255),
  que_quan VARCHAR(255),
  dia_chi_hien_tai TEXT,
  vi_tri VARCHAR(100),
  muc_luong DECIMAL(15,0),
  ngay_bat_dau DATE,
  ngay_ket_thuc DATE,

  -- KPI fields
  doanh_so DECIMAL(15,0),
  ti_le_hoan_thanh DECIMAL(5,2),
  xep_loai VARCHAR(10), -- A, B, C
  hoa_hong DECIMAL(15,0),
  thuong_dat_chi_tieu DECIMAL(15,0),
  tong_luong_hieu_qua DECIMAL(15,0),

  -- JSON field for additional dynamic data
  extra_data JSONB,

  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, signed, archived
  signed_date DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_contracts_type ON contracts(contract_type);
CREATE INDEX idx_contracts_employee ON contracts(employee_id);
CREATE INDEX idx_contracts_year ON contracts(year);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on contracts" ON contracts
  FOR ALL USING (true);
