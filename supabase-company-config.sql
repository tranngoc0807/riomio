-- Create company_config table
CREATE TABLE IF NOT EXISTS public.company_config (
  id BIGSERIAL PRIMARY KEY,

  -- Basic Info
  name TEXT NOT NULL,
  tax_code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  founded_date DATE,
  employees INTEGER,
  capital TEXT,
  industry TEXT,
  representative TEXT,
  position TEXT,
  logo TEXT,

  -- Hero Section
  hero_title1 TEXT,
  hero_title2 TEXT,
  hero_description TEXT,

  -- Content Sections
  about_us TEXT,
  vision TEXT,
  mission TEXT,

  -- JSON fields
  business_areas JSONB DEFAULT '[]'::jsonb,
  quick_links JSONB DEFAULT '[]'::jsonb,
  announcements JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.company_config ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read company config"
  ON public.company_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow all users (including anonymous) to read for public page
CREATE POLICY "Allow public to read company config"
  ON public.company_config
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Only admins can update
CREATE POLICY "Allow admins to update company config"
  ON public.company_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert
CREATE POLICY "Allow admins to insert company config"
  ON public.company_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS company_config_updated_at ON public.company_config;
CREATE TRIGGER company_config_updated_at
  BEFORE UPDATE ON public.company_config
  FOR EACH ROW
  EXECUTE FUNCTION update_company_config_updated_at();
