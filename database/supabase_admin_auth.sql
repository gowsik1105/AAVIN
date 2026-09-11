-- ==============================================================================
-- AAVIN SANGAM (ஆவின் சங்கம்)
-- EXACT 3 APPROVED ADMIN ACCOUNTS & ROW LEVEL SECURITY (RLS) SCHEMA
-- ==============================================================================
-- Approved Admin Whitelist:
-- 1. Tamil Nadu Admin  -> gowsik1105@gmail.com  (admin_type: tamil_nadu)
-- 2. District Admin    -> aavindis@admin.com    (admin_type: district)
-- 3. Sangam Admin      -> aavinsangam@admin.com (admin_type: sangam)
--
-- Every other account  -> role = 'user' (No admin privileges)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. UNIFIED PROFILES TABLE WITH STRICT ADMIN WHITELIST CONSTRAINT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150),
    full_name_ta VARCHAR(150),
    role VARCHAR(50) NOT NULL DEFAULT 'user' 
        CHECK (role IN ('user', 'admin')),
    admin_type VARCHAR(50) 
        CHECK (admin_type IS NULL OR admin_type IN ('tamil_nadu', 'district', 'sangam')),
    district_code VARCHAR(10) DEFAULT 'MDU',
    district_name VARCHAR(100) DEFAULT 'Madurai District',
    sangam_id VARCHAR(50) DEFAULT 'sgm-mdu',
    sangam_name VARCHAR(150) DEFAULT 'Aavin Madurai Thozhilar Sangam',
    phone VARCHAR(20),
    occupation VARCHAR(100) DEFAULT 'Farmer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- HARD DATABASE CONSTRAINT: ONLY the 3 approved emails can ever hold role='admin'
    CONSTRAINT check_admin_whitelist CHECK (
        role = 'user' OR (
            role = 'admin' AND email IN (
                'gowsik1105@gmail.com',
                'aavindis@admin.com',
                'aavinsangam@admin.com'
            )
        )
    )
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_type ON public.profiles(admin_type);

-- ------------------------------------------------------------------------------
-- 2. SECURITY DEFINER HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Get current authenticated user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current authenticated user's admin type
CREATE OR REPLACE FUNCTION public.get_auth_admin_type()
RETURNS VARCHAR AS $$
    SELECT admin_type FROM public.profiles WHERE id = auth.uid() AND is_active = TRUE AND role = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current authenticated user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND is_active = TRUE 
          AND role = 'admin'
          AND email IN ('gowsik1105@gmail.com', 'aavindis@admin.com', 'aavinsangam@admin.com')
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is Tamil Nadu State Admin (gowsik1105@gmail.com)
CREATE OR REPLACE FUNCTION public.is_tamil_nadu_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
          AND is_active = TRUE 
          AND role = 'admin'
          AND email = 'gowsik1105@gmail.com'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users see own profile, Admins see all profiles
CREATE POLICY "Users view own profile or Admins view all"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = id 
    OR public.is_admin()
);

-- INSERT Policy: Auto-registration or Admin insert
CREATE POLICY "Insert profile policy"
ON public.profiles
FOR INSERT
WITH CHECK (
    auth.uid() = id 
    OR public.is_admin()
);

-- UPDATE Policy: Normal users can update non-role fields; Only State Admin can edit roles
CREATE POLICY "Update profile policy"
ON public.profiles
FOR UPDATE
USING (
    auth.uid() = id 
    OR public.is_admin()
)
WITH CHECK (
    -- Normal users CANNOT change their role or admin_type
    (auth.uid() = id AND role = 'user' AND admin_type IS NULL)
    OR public.is_tamil_nadu_admin()
);

-- DELETE Policy: Only Tamil Nadu State Admin can delete
CREATE POLICY "Delete profile policy"
ON public.profiles
FOR DELETE
USING (
    public.is_tamil_nadu_admin()
);

-- ------------------------------------------------------------------------------
-- 4. AUTOMATIC NEW USER REGISTRATION TRIGGER (ALWAYS ASSIGNS role='user')
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        full_name_ta, 
        phone, 
        role, 
        admin_type,
        district_code, 
        district_name,
        sangam_id,
        sangam_name,
        occupation,
        is_active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Aavin Member'),
        COALESCE(NEW.raw_user_meta_data->>'full_name_ta', 'ஆவின் உறுப்பினர்'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        -- If signing up with one of the 3 approved admin emails, assign admin role & type
        CASE 
            WHEN NEW.email = 'gowsik1105@gmail.com' THEN 'admin'
            WHEN NEW.email = 'aavindis@admin.com' THEN 'admin'
            WHEN NEW.email = 'aavinsangam@admin.com' THEN 'admin'
            ELSE 'user'
        END,
        CASE 
            WHEN NEW.email = 'gowsik1105@gmail.com' THEN 'tamil_nadu'
            WHEN NEW.email = 'aavindis@admin.com' THEN 'district'
            WHEN NEW.email = 'aavinsangam@admin.com' THEN 'sangam'
            ELSE NULL
        END,
        COALESCE(NEW.raw_user_meta_data->>'district_code', 'MDU'),
        COALESCE(NEW.raw_user_meta_data->>'district_name', 'Madurai District'),
        COALESCE(NEW.raw_user_meta_data->>'sangam_id', 'sgm-mdu'),
        COALESCE(NEW.raw_user_meta_data->>'sangam_name', 'Aavin Madurai Thozhilar Sangam'),
        COALESCE(NEW.raw_user_meta_data->>'occupation', 'Farmer'),
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        admin_type = EXCLUDED.admin_type,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. SETUP / PROMOTION QUERY FOR THE 3 APPROVED ADMIN ACCOUNTS
-- ------------------------------------------------------------------------------
-- Run this in Supabase SQL Editor to initialize or promote the 3 approved accounts:

-- 1. Tamil Nadu Admin:
INSERT INTO public.profiles (id, email, full_name, role, admin_type, district_code, district_name, sangam_id, sangam_name)
SELECT 
    id, email, 'Tamil Nadu State Administrator', 'admin', 'tamil_nadu', 'ALL', 'Tamil Nadu State Headquarters', 'ALL', 'State Secretariat'
FROM auth.users WHERE email = 'gowsik1105@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', admin_type = 'tamil_nadu', updated_at = NOW();

-- 2. District Admin:
INSERT INTO public.profiles (id, email, full_name, role, admin_type, district_code, district_name, sangam_id, sangam_name)
SELECT 
    id, email, 'District Dairy Officer', 'admin', 'district', 'MDU', 'Madurai District', 'sgm-mdu', 'Madurai Cooperative Milk Producers Union'
FROM auth.users WHERE email = 'aavindis@admin.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', admin_type = 'district', district_code = 'MDU', updated_at = NOW();

-- 3. Sangam Admin:
INSERT INTO public.profiles (id, email, full_name, role, admin_type, district_code, district_name, sangam_id, sangam_name)
SELECT 
    id, email, 'Sangam Secretary', 'admin', 'sangam', 'MDU', 'Madurai District', 'sgm-mdu', 'Aavin Madurai Thozhilar Sangam'
FROM auth.users WHERE email = 'aavinsangam@admin.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', admin_type = 'sangam', sangam_id = 'sgm-mdu', updated_at = NOW();
