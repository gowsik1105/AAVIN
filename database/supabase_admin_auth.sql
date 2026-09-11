-- ==============================================================================
-- AAVIN SANGAM (ஆவின் சங்கம்)
-- Supabase Role-Based Admin Authentication & Row Level Security (RLS) Schema
-- ==============================================================================
-- Roles:
-- 1. tamil_nadu_admin  -> State-wide executive oversight & main dairy management
-- 2. district_admin    -> District-specific union administration (e.g. Madurai)
-- 3. sangam_admin      -> Primary village cooperative / Sangam administration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ADMIN PROFILES TABLE (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('tamil_nadu_admin', 'district_admin', 'sangam_admin')),
    district_code VARCHAR(10),            -- e.g. 'MDU', 'CBE', 'SLM' (For district_admin)
    district_name VARCHAR(100),
    sangam_id VARCHAR(50),                -- e.g. 'sgm-mdu' (For sangam_admin)
    sangam_name VARCHAR(150),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast role & email lookups
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_district ON public.admin_profiles(district_code);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_sangam ON public.admin_profiles(sangam_id);

-- ------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES ON ADMIN PROFILES
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current authenticated user's role securely
CREATE OR REPLACE FUNCTION public.get_auth_admin_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.admin_profiles WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Policy 1: Admins can view their own profile; Tamil Nadu Admin can view all
CREATE POLICY "Admins can view own profile or TN Admin can view all"
ON public.admin_profiles
FOR SELECT
USING (
    auth.uid() = id 
    OR public.get_auth_admin_role() = 'tamil_nadu_admin'
);

-- Policy 2: Only Tamil Nadu Admin can insert or update roles
CREATE POLICY "Only TN Admin can manage admin profiles"
ON public.admin_profiles
FOR ALL
USING (
    public.get_auth_admin_role() = 'tamil_nadu_admin'
);

-- ------------------------------------------------------------------------------
-- 3. RLS POLICIES FOR PROTECTED APPLICATION DATA
-- ------------------------------------------------------------------------------

-- Ensure issues table has RLS enabled
ALTER TABLE IF EXISTS public.issues ENABLE ROW LEVEL SECURITY;

-- Issues Policy: Tamil Nadu Admin sees all; District Admin sees district; Sangam Admin sees sangam
CREATE POLICY IF NOT EXISTS "Role-scoped issue access"
ON public.issues
FOR ALL
USING (
    public.get_auth_admin_role() = 'tamil_nadu_admin'
    OR (public.get_auth_admin_role() = 'district_admin' AND district_code = (SELECT district_code FROM public.admin_profiles WHERE id = auth.uid()))
    OR (public.get_auth_admin_role() = 'sangam_admin' AND sangam_id = (SELECT sangam_id FROM public.admin_profiles WHERE id = auth.uid()))
    OR auth.role() = 'anon' -- Allows public member reporting
);

-- ------------------------------------------------------------------------------
-- 4. INSTRUCTIONS TO SETUP THE 3 ADMIN USERS IN SUPABASE DASHBOARD
-- ------------------------------------------------------------------------------
/*
STEP 1: Open your Supabase Project Dashboard -> Authentication -> Users -> "Add User" (or "Invite User").
Create 3 users with your desired secure passwords (passwords are hashed by Supabase bcrypt):

User 1:
  - Email: tn.admin@aavin.tn.gov.in (or your state admin email)
  - Auto Confirm Email: YES

User 2:
  - Email: district.admin@aavin.tn.gov.in (or your district admin email)
  - Auto Confirm Email: YES

User 3:
  - Email: sangam.admin@aavin.tn.gov.in (or your sangam admin email)
  - Auto Confirm Email: YES

STEP 2: Run the SQL below in Supabase SQL Editor to link their IDs to roles:

-- Replace the email addresses with your exact configured emails:

INSERT INTO public.admin_profiles (id, email, full_name, role, district_code, district_name, sangam_id, sangam_name)
SELECT 
    id, 
    email, 
    'Thiru S. Rajendran, IAS (State Secretary)', 
    'tamil_nadu_admin', 
    'ALL', 
    'Tamil Nadu State Headquarters', 
    'ALL', 
    'State Secretariat'
FROM auth.users 
WHERE email = 'tn.admin@aavin.tn.gov.in'
ON CONFLICT (id) DO UPDATE 
SET role = 'tamil_nadu_admin', updated_at = NOW();

INSERT INTO public.admin_profiles (id, email, full_name, role, district_code, district_name, sangam_id, sangam_name)
SELECT 
    id, 
    email, 
    'Er. M. Saravanan (District Milk Officer)', 
    'district_admin', 
    'MDU', 
    'Madurai District', 
    'sgm-mdu', 
    'Madurai District Cooperative Milk Producers Union'
FROM auth.users 
WHERE email = 'district.admin@aavin.tn.gov.in'
ON CONFLICT (id) DO UPDATE 
SET role = 'district_admin', district_code = 'MDU', updated_at = NOW();

INSERT INTO public.admin_profiles (id, email, full_name, role, district_code, district_name, sangam_id, sangam_name)
SELECT 
    id, 
    email, 
    'Thiru S. Palanivel (Sangam Secretary)', 
    'sangam_admin', 
    'MDU', 
    'Madurai District', 
    'sgm-mdu', 
    'Aavin Madurai Thozhilar Sangam'
FROM auth.users 
WHERE email = 'sangam.admin@aavin.tn.gov.in'
ON CONFLICT (id) DO UPDATE 
SET role = 'sangam_admin', sangam_id = 'sgm-mdu', updated_at = NOW();
*/
