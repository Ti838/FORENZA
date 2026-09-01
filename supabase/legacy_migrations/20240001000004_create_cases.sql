-- =============================================================
-- Migration 004: Cases
-- =============================================================

CREATE TABLE cases (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number             TEXT        NOT NULL UNIQUE,
    title                   TEXT        NOT NULL,
    crime_type              TEXT        NOT NULL,
    description             TEXT,
    -- Crime scene GPS coordinates
    crime_scene_latitude    DECIMAL(10, 8),
    crime_scene_longitude   DECIMAL(11, 8),
    incident_datetime       TIMESTAMPTZ,
    -- Assigned investigating officer
    assigned_officer_id     UUID        REFERENCES profiles(id),
    status                  case_status NOT NULL DEFAULT 'ACTIVE',
    -- Creator (Admin or Supervisor)
    created_by              UUID        NOT NULL REFERENCES profiles(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT case_number_format CHECK (case_number ~ '^[A-Z0-9\-]+$'),
    CONSTRAINT case_title_length CHECK (char_length(title) >= 3),
    CONSTRAINT case_latitude_range CHECK (
        crime_scene_latitude IS NULL OR
        (crime_scene_latitude >= -90 AND crime_scene_latitude <= 90)
    ),
    CONSTRAINT case_longitude_range CHECK (
        crime_scene_longitude IS NULL OR
        (crime_scene_longitude >= -180 AND crime_scene_longitude <= 180)
    )
);

CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_assigned_officer ON cases(assigned_officer_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_at ON cases(created_at);

CREATE TRIGGER cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Judicial case access grants (explicit grant required for JUDGE access)
CREATE TABLE case_judicial_access (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    judge_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    granted_by  UUID        NOT NULL REFERENCES profiles(id),
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ,
    is_active   BOOLEAN     NOT NULL DEFAULT true,

    UNIQUE (case_id, judge_id)
);

CREATE INDEX idx_case_judicial_access_case ON case_judicial_access(case_id);
CREATE INDEX idx_case_judicial_access_judge ON case_judicial_access(judge_id);
