-- =============================================================
-- Migration 002: Profiles, Roles, User Roles
-- =============================================================

-- Extended user profiles (linked to Supabase Auth users)
CREATE TABLE profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT        NOT NULL UNIQUE,
    full_name       TEXT        NOT NULL,
    badge_number    TEXT        UNIQUE,
    department      TEXT,
    phone           TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    mfa_enabled     BOOLEAN     NOT NULL DEFAULT false,
    last_login_at   TIMESTAMPTZ,
    created_by      UUID        REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT profiles_full_name_check CHECK (char_length(full_name) >= 2)
);

-- Application roles definition table
CREATE TABLE roles (
    id          SERIAL      PRIMARY KEY,
    name        app_role    NOT NULL UNIQUE,
    description TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO roles (name, description) VALUES
    ('ADMIN',                 'System administrator with user management access'),
    ('INVESTIGATING_OFFICER', 'Field officer responsible for evidence capture'),
    ('SUPERVISOR',            'Supervisor with override and case management authority'),
    ('VAULT_CUSTODIAN',       'Evidence vault manager responsible for secure storage'),
    ('LAB_ANALYST',           'Forensic laboratory analyst'),
    ('JUDGE',                 'Judicial officer with read-only case access'),
    ('AUDITOR',               'Compliance auditor with read-only audit access');

-- User-role assignments (many-to-many)
CREATE TABLE user_roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role        app_role    NOT NULL,
    assigned_by UUID        REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, role)
);

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper: get roles for current auth user
CREATE OR REPLACE FUNCTION get_user_roles(user_id UUID)
RETURNS app_role[] AS $$
    SELECT ARRAY_AGG(role) FROM user_roles WHERE user_roles.user_id = $1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if current user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(check_role app_role)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = check_role
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if current user has any of the given roles
CREATE OR REPLACE FUNCTION user_has_any_role(check_roles app_role[])
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ANY(check_roles)
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
