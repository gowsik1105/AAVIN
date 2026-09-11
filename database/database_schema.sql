-- ==============================================================================
-- AAVIN SANGAM (ஆவின் சங்கம்)
-- Database Architecture & Schema Specification
-- Target: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- Enable UUID and cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS FOR STRICT DATA INTEGRITY
-- ------------------------------------------------------------------------------

CREATE TYPE user_role_enum AS ENUM (
    'member',
    'sangam_admin',
    'district_admin',
    'state_admin',
    'government_official'
);

CREATE TYPE issue_priority_enum AS ENUM (
    'critical',   -- 🔴 Critical
    'high',       -- 🟠 High
    'medium',     -- 🟡 Medium
    'normal'      -- 🟢 Normal
);

CREATE TYPE issue_status_enum AS ENUM (
    'submitted',
    'admin_verification',
    'verified',
    'forwarded',
    'assigned',
    'action_in_progress',
    'resolved',
    'closed',
    'escalated'
);

CREATE TYPE news_category_enum AS ENUM (
    'government_updates',
    'aavin_updates',
    'district_news',
    'official_announcements',
    'events',
    'important_notices'
);

CREATE TYPE task_status_enum AS ENUM (
    'pending',
    'in_progress',
    'completed'
);

-- Controlled Facility Types (STRICT: BMCs and Booths are REJECTED)
CREATE TYPE facility_type_enum AS ENUM (
    'MAIN_DAIRY',
    'DAIRY_PLANT',
    'PROCESSING_UNIT',
    'FEEDER_BALANCING_DAIRY',
    'SPECIALISED_DAIRY_PLANT'
);

-- Source Verification Status
CREATE TYPE dairy_verification_status_enum AS ENUM (
    'VERIFIED',
    'CROSS_VERIFIED',
    'NEEDS_VERIFICATION'
);

-- ------------------------------------------------------------------------------
-- 2. DISTRICTS & ADMINISTRATIVE DIVISIONS
-- ------------------------------------------------------------------------------

CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,                -- e.g., 'MDU', 'CBE', 'SLM', 'CHN'
    name_en VARCHAR(100) NOT NULL,                   -- 'Madurai'
    name_ta VARCHAR(100) NOT NULL,                   -- 'மதுரை'
    headquarters VARCHAR(150),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_districts_code ON districts(code);

-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- 3. AAVIN MAIN DAIRIES & PROCESSING UNITS (1 PER DISTRICT)
-- ------------------------------------------------------------------------------

CREATE TABLE aavin_dairies (
    id VARCHAR(50) PRIMARY KEY,
    district_id UUID REFERENCES districts(id),
    district_code VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,                       -- e.g., 'Aavin Madurai Main Dairy'
    official_name VARCHAR(300) NOT NULL,              -- e.g., 'Madurai District Cooperative Milk Producers Union Ltd - Main Dairy'
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    facility_type facility_type_enum NOT NULL DEFAULT 'MAIN_DAIRY',
    union_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    source_url TEXT NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    verification_status dairy_verification_status_enum NOT NULL DEFAULT 'VERIFIED',
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_dairy_name_pincode UNIQUE(name, pincode)
);

CREATE INDEX idx_aavin_dairies_district ON aavin_dairies(district);
CREATE INDEX idx_aavin_dairies_coords ON aavin_dairies(latitude, longitude);

-- ------------------------------------------------------------------------------
-- 4. AAVIN THOZHILAR SANGAMS (WORKERS' SANGAM: 1 PER DISTRICT & MAIN DAIRY)
-- ------------------------------------------------------------------------------

CREATE TABLE sangams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,                  -- e.g., 'sgm-mdu', 'sgm-slm'
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    dairy_id VARCHAR(50) NOT NULL REFERENCES aavin_dairies(id) ON DELETE RESTRICT,
    registration_no VARCHAR(50) UNIQUE NOT NULL,       -- e.g., 'TN-MDU-TS-001'
    name_en VARCHAR(200) NOT NULL,                     -- 'Aavin Madurai Thozhilar Sangam'
    name_ta VARCHAR(200) NOT NULL,                     -- 'ஆவின் மதுரை தொழிலாளர் சங்கம்'
    address TEXT NOT NULL,
    pincode VARCHAR(10),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    president_en VARCHAR(150),
    president_ta VARCHAR(150),
    secretary_en VARCHAR(150),
    secretary_ta VARCHAR(150),
    treasurer_en VARCHAR(150),
    treasurer_ta VARCHAR(150),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    active_member_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- STRICT RULE: 1 District = 1 Main Dairy = 1 Associated Thozhilar Sangam
    CONSTRAINT uq_sangam_district UNIQUE(district_id),
    CONSTRAINT uq_sangam_dairy UNIQUE(dairy_id)
);

CREATE INDEX idx_sangams_district ON sangams(district_id);
CREATE INDEX idx_sangams_dairy ON sangams(dairy_id);
CREATE INDEX idx_sangams_registration ON sangams(registration_no);

-- ------------------------------------------------------------------------------
-- 4. USERS & PROFILES
-- ------------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'member',
    district_id UUID REFERENCES districts(id),
    sangam_id UUID REFERENCES sangams(id),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name_en VARCHAR(150) NOT NULL,
    full_name_ta VARCHAR(150),
    father_or_spouse_name VARCHAR(150),
    avatar_url TEXT,
    aadhar_hash VARCHAR(64),                          -- Secure SHA-256 hash, never raw Aadhar
    preferred_language VARCHAR(5) DEFAULT 'ta',      -- 'ta' or 'en'
    cattle_count INT DEFAULT 0,
    bank_account_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. OFFICE BEARERS (VERIFIED ELECTED/APPOINTED OFFICIALS)
-- ------------------------------------------------------------------------------

CREATE TABLE office_bearers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sangam_id UUID NOT NULL REFERENCES sangams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    designation_en VARCHAR(100) NOT NULL,             -- 'President', 'Secretary', 'Treasurer'
    designation_ta VARCHAR(100) NOT NULL,             -- 'தலைவர்', 'செயலாளர்', 'பொருளாளர்'
    name_en VARCHAR(150) NOT NULL,
    name_ta VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    term_start DATE NOT NULL,
    term_end DATE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_office_bearers_sangam ON office_bearers(sangam_id);

-- ------------------------------------------------------------------------------
-- 6. DIGITAL MEMBERSHIP IDS
-- ------------------------------------------------------------------------------

CREATE TABLE digital_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id_code VARCHAR(50) UNIQUE NOT NULL,      -- e.g., 'TN-MDU-2026-8841'
    sangam_id UUID NOT NULL REFERENCES sangams(id),
    district_id UUID NOT NULL REFERENCES districts(id),
    qr_verification_hash VARCHAR(128) NOT NULL,      -- Cryptographic signature for tamper verification
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 years'),
    is_approved_by_admin BOOLEAN DEFAULT TRUE,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. OFFICIAL NEWS & ANNOUNCEMENTS
-- ------------------------------------------------------------------------------

CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id),
    category news_category_enum NOT NULL,
    district_id UUID REFERENCES districts(id),       -- NULL = Statewide notice
    sangam_id UUID REFERENCES sangams(id),           -- NULL = District/State wide
    title_en VARCHAR(300) NOT NULL,
    title_ta VARCHAR(300) NOT NULL,
    content_en TEXT NOT NULL,
    content_ta TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    attachment_doc_url TEXT,
    publishing_authority VARCHAR(200) NOT NULL,      -- 'Department of Dairy Development, GoTN'
    is_pinned BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_district ON news(district_id);

-- ------------------------------------------------------------------------------
-- 8. SMART ISSUE / COMPLAINT SYSTEM & AUDIT TRAIL
-- ------------------------------------------------------------------------------

CREATE TABLE government_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,                -- 'DAIRY_DEV', 'ANIMAL_HUSBANDRY', 'TNEB', 'PWD'
    name_en VARCHAR(200) NOT NULL,
    name_ta VARCHAR(200) NOT NULL,
    nodal_officer_name VARCHAR(150),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20)
);

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_code VARCHAR(50) UNIQUE NOT NULL,          -- e.g., 'MDU-ISSUE-1042'
    reporter_id UUID NOT NULL REFERENCES users(id),
    district_id UUID NOT NULL REFERENCES districts(id),
    sangam_id UUID NOT NULL REFERENCES sangams(id),
    category VARCHAR(100) NOT NULL,                  -- 'Infrastructure', 'Milk Testing', 'Cold Storage'
    title_en VARCHAR(300) NOT NULL,
    title_ta VARCHAR(300),
    description TEXT NOT NULL,
    location_text TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    
    -- Smart prioritization & clustering attributes
    cluster_group_id UUID,                           -- Links similar duplicate issues together
    related_reports_count INT DEFAULT 1,             -- e.g., 27 related reports detected
    calculated_priority issue_priority_enum DEFAULT 'normal',
    final_verified_priority issue_priority_enum DEFAULT 'normal',
    is_admin_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,

    -- Forwarding & escalation
    forwarded_to_dept_id UUID REFERENCES government_departments(id),
    forwarded_at TIMESTAMPTZ,
    status issue_status_enum NOT NULL DEFAULT 'submitted',
    days_unresolved INT DEFAULT 0,
    escalation_level INT DEFAULT 0,                  -- 0: Sangam, 1: District, 2: State Higher Authority
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issues_code ON issues(issue_code);
CREATE INDEX idx_issues_sangam ON issues(sangam_id);
CREATE INDEX idx_issues_district ON issues(district_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_cluster ON issues(cluster_group_id);

CREATE TABLE issue_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    file_type VARCHAR(20) NOT NULL,                  -- 'photo', 'video', 'document', 'audio'
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE issue_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    previous_status issue_status_enum,
    new_status issue_status_enum NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    officer_designation VARCHAR(150),
    comments TEXT,
    forwarded_dept_name VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. MEETINGS, VIDEO CONFERENCES & DECISIONS
-- ------------------------------------------------------------------------------

CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users(id),
    district_id UUID NOT NULL REFERENCES districts(id),
    sangam_id UUID REFERENCES sangams(id),           -- NULL if District-wide
    title_en VARCHAR(250) NOT NULL,
    title_ta VARCHAR(250) NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_started_at TIMESTAMPTZ,
    actual_ended_at TIMESTAMPTZ,
    meeting_room_id VARCHAR(50) UNIQUE NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    is_concluded BOOLEAN DEFAULT FALSE,
    attendance_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    hand_raised BOOLEAN DEFAULT FALSE,
    attendance_verified BOOLEAN DEFAULT TRUE
);

CREATE TABLE meeting_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    recording_url TEXT NOT NULL,
    duration_seconds INT NOT NULL,
    file_size_mb NUMERIC(8, 2),
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES users(id),
    agenda_point VARCHAR(300) NOT NULL,
    discussion_summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    decision_text_en TEXT NOT NULL,
    decision_text_ta TEXT NOT NULL,
    assigned_officer_name VARCHAR(150),
    assigned_department VARCHAR(150),
    due_date DATE,
    task_status task_status_enum DEFAULT 'pending',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. NOTIFICATIONS & AUDIT LOGS
-- ------------------------------------------------------------------------------

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,                   -- 'issue', 'meeting', 'announcement', 'digital_id'
    title_en VARCHAR(250) NOT NULL,
    title_ta VARCHAR(250) NOT NULL,
    body_en TEXT NOT NULL,
    body_ta TEXT NOT NULL,
    link_url TEXT,
    is_priority BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,                    -- 'ISSUE_VERIFY', 'ISSUE_FORWARD', 'NEWS_PUBLISH'
    target_entity VARCHAR(50) NOT NULL,
    target_id UUID,
    ip_address INET,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Member can read own digital ID and issue reports
CREATE POLICY member_own_digital_id ON digital_ids
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY member_read_own_issues ON issues
    FOR SELECT USING (
        auth.uid() = reporter_id 
        OR EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('sangam_admin', 'district_admin', 'state_admin')
        )
    );

-- Admins can update issue status and forwarding
CREATE POLICY admin_update_issues ON issues
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('sangam_admin', 'district_admin', 'state_admin')
        )
    );

-- Sangams Table RLS
ALTER TABLE sangams ENABLE ROW LEVEL SECURITY;

-- Anyone (Members, Admins, Public) can view verified Sangam locations and profiles
CREATE POLICY sangams_read_verified ON sangams
    FOR SELECT USING (is_verified = TRUE OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('sangam_admin', 'district_admin', 'state_admin')
    ));

-- Only authorized administrators can insert, update, or delete Sangam locations
CREATE POLICY admins_modify_sangams ON sangams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('sangam_admin', 'district_admin', 'state_admin')
        )
    );

-- ------------------------------------------------------------------------------
-- 12. AAVIN MAIN DAIRIES RLS POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE aavin_dairies ENABLE ROW LEVEL SECURITY;

-- Public and verified members can view verified main dairies
CREATE POLICY public_view_verified_dairies ON aavin_dairies
    FOR SELECT USING (true);

-- Admins can insert, update, or delete dairy records
CREATE POLICY admin_manage_dairies ON aavin_dairies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('district_admin', 'state_admin')
        )
    );

-- ------------------------------------------------------------------------------
-- 13. SEED DATA FOR AAVIN MAIN DAIRIES ACROSS TAMIL NADU
-- ------------------------------------------------------------------------------

INSERT INTO aavin_dairies (
    id, name, official_name, district, city, address, pincode, latitude, longitude,
    facility_type, union_name, phone, email, website, source_name, source_url, verification_status
) VALUES
(
    'dairy-mdu-001',
    'Madurai Aavin Main Dairy',
    'Madurai District Cooperative Milk Producers'' Union Ltd - Main Dairy',
    'Madurai',
    'Madurai',
    'Sivagangai Main Road, Sathamangalam, Madurai - 625020',
    '625020',
    9.9248437,
    78.1466085,
    'FEEDER_BALANCING_DAIRY',
    'Madurai District Cooperative Milk Producers Union Ltd.',
    '0452-2529561',
    'admin@aavinmadurai.com',
    'http://aavinmadurai.com',
    'Tamil Nadu Dairy Development Department & Madurai DCMPU Official Gazette',
    'https://aavin.tn.gov.in',
    'VERIFIED'
),
(
    'dairy-mdu-002',
    'Madurai Aavin Specialised Ice Cream Plant',
    'Madurai DCMPU Sathamangalam Products & Ice Cream Processing Plant',
    'Madurai',
    'Madurai',
    'Aavin Complex, Sivagangai Main Road, Sathamangalam, Madurai - 625020',
    '625020',
    9.9251200,
    78.1469000,
    'SPECIALISED_DAIRY_PLANT',
    'Madurai District Cooperative Milk Producers Union Ltd.',
    '0452-2529561',
    'products@aavinmadurai.com',
    'http://aavinmadurai.com',
    'Dairy Development Policy Note & Madurai Union Technical Specs',
    'https://aavin.tn.gov.in',
    'VERIFIED'
),
(
    'dairy-chn-001',
    'Chennai Sholinganallur Central Dairy',
    'Tamil Nadu Co-operative Milk Producers'' Federation Ltd - Sholinganallur Central Dairy',
    'Chennai',
    'Chennai',
    'Rajiv Gandhi Salai (OMR), Sholinganallur, Chennai - 600119',
    '600119',
    12.9010375,
    80.2278486,
    'MAIN_DAIRY',
    'Tamil Nadu Co-operative Milk Producers'' Federation Ltd. (TCMPF)',
    '044-24501254',
    'aavinsholi@gmail.com',
    'https://aavin.tn.gov.in',
    'TCMPF Metro Dairies Official Registry',
    'https://aavin.tn.gov.in',
    'VERIFIED'
),
(
    'dairy-chn-002',
    'Chennai Madhavaram Central Dairy & Aavin Illam',
    'Tamil Nadu Co-operative Milk Producers'' Federation Ltd - Madhavaram Central Dairy',
    'Chennai',
    'Chennai',
    'MMC Main Road, Madhavaram Milk Colony, Chennai - 600051',
    '600051',
    13.1481232,
    80.2312641,
    'MAIN_DAIRY',
    'Tamil Nadu Co-operative Milk Producers'' Federation Ltd. (TCMPF)',
    '044-23464500',
    'aavinillam@gmail.com',
    'https://aavin.tn.gov.in',
    'TCMPF Head Office Gazette & Central Dairy Records',
    'https://aavin.tn.gov.in',
    'VERIFIED'
),
(
    'dairy-chn-003',
    'Chennai Ambattur Product Dairy & Processing Plant',
    'Tamil Nadu Co-operative Milk Producers'' Federation Ltd - Ambattur Product Dairy',
    'Chennai',
    'Chennai',
    'Plot No. 29 & 30, Industrial Estate, Ambattur, Chennai - 600098',
    '600098',
    13.0984852,
    80.1618394,
    'SPECIALISED_DAIRY_PLANT',
    'Tamil Nadu Co-operative Milk Producers'' Federation Ltd. (TCMPF)',
    '044-23464528',
    'aavinambattur@gmail.com',
    'https://aavin.tn.gov.in',
    'TCMPF Specialised Products Dairy Registry',
    'https://aavin.tn.gov.in',
    'VERIFIED'
),
(
    'dairy-cbe-001',
    'Coimbatore Aavin Main Dairy Complex',
    'The Coimbatore District Co-operative Milk Producers'' Union Ltd - New Dairy Complex',
    'Coimbatore',
    'Coimbatore',
    'New Dairy Complex, Pachapalayam, Kalampalayam Post, Perur Via, Coimbatore - 641010',
    '641010',
    10.9632857,
    76.8973681,
    'MAIN_DAIRY',
    'The Coimbatore District Co-operative Milk Producers'' Union Ltd.',
    '0422-2645678',
    'gm.cbeaavin@tn.gov.in',
    'http://aavincoimbatore.com',
    'Coimbatore DCMPU Registered Office & NCDFI Market Directory',
    'http://aavincoimbatore.com',
    'VERIFIED'
),
(
    'dairy-slm-001',
    'Salem Aavin Feeder Balancing Dairy',
    'The Salem District Cooperative Milk Producers'' Union Ltd - Feeder Balancing Dairy',
    'Salem',
    'Salem',
    'Steel Plant Road, Sithanur, Thalavaipatty Post, Salem - 636302',
    '636302',
    11.6643194,
    78.0931258,
    'FEEDER_BALANCING_DAIRY',
    'The Salem District Cooperative Milk Producers'' Union Ltd.',
    '0427-2386871',
    'slm_aavinslm@yahoo.co.in',
    'https://salemaavin.com',
    'Salem DCMPU Official Gazette & TN Dairy Policy Note',
    'https://salemaavin.com',
    'VERIFIED'
),
(
    'dairy-erd-001',
    'Erode Aavin Feeder Balancing Dairy & Powder Plant',
    'The Erode District Cooperative Milk Producers'' Union Ltd - Feeder Balancing Dairy',
    'Erode',
    'Erode',
    'Sri Vasavi College Post, Chithode, Erode - 638316',
    '638316',
    11.4116492,
    77.6749321,
    'FEEDER_BALANCING_DAIRY',
    'The Erode District Cooperative Milk Producers'' Union Ltd.',
    '+91 88836 00103',
    'aavinerode@gmail.com',
    'https://aavinerode.com',
    'Erode DCMPU Official Records & Government Dairy Directorate',
    'https://aavinerode.com',
    'VERIFIED'
),
(
    'dairy-try-001',
    'Tiruchirappalli Aavin Main Dairy',
    'The Tiruchirappalli District Co-operative Milk Producers'' Union Ltd - Main Dairy',
    'Tiruchirappalli',
    'Tiruchirappalli',
    'Pudukkottai Main Road, Kottapattu, Tiruchirappalli - 620023',
    '620023',
    10.7785312,
    78.7104281,
    'MAIN_DAIRY',
    'The Tiruchirappalli District Co-operative Milk Producers'' Union Ltd.',
    '0431-2333001',
    'gm.trichyaavin@tn.gov.in',
    'https://trichyaavin.com',
    'Tiruchirappalli DCMPU & TNSTC Industrial Directory',
    'https://trichyaavin.com',
    'VERIFIED'
),
(
    'dairy-tnv-001',
    'Tirunelveli Aavin Main Dairy',
    'The Tirunelveli District Co-operative Milk Producers'' Union Ltd - Main Dairy',
    'Tirunelveli',
    'Tirunelveli',
    'Reddiarpatti Road, Perumalpuram Post, Tirunelveli - 627007',
    '627007',
    8.6948215,
    77.7289412,
    'MAIN_DAIRY',
    'The Tirunelveli District Co-operative Milk Producers'' Union Ltd.',
    '0462-2552004',
    'aavintny@gmail.com',
    'https://tirunelveli.nic.in',
    'Tirunelveli District Administration & DCMPU Registry',
    'https://tirunelveli.nic.in',
    'VERIFIED'
)
ON CONFLICT (id) DO NOTHING;

