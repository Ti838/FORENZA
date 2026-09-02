-- =============================================================
-- Migration 006: Evidence Classifications
-- =============================================================

CREATE TABLE evidence_classifications (
    id                      UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id             UUID                    NOT NULL UNIQUE REFERENCES evidence(id) ON DELETE RESTRICT,
    -- AI Classification results (raw, never modified)
    ai_object               TEXT,
    ai_category             TEXT,
    ai_subcategory          TEXT,
    ai_confidence           DECIMAL(5, 2)           CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    ai_model_version        TEXT,
    ai_classified_at        TIMESTAMPTZ,
    ai_available            BOOLEAN                 NOT NULL DEFAULT false,
    -- Final human-confirmed classification
    final_object            TEXT                    NOT NULL,
    final_category          TEXT                    NOT NULL,
    final_subcategory       TEXT,
    final_description       TEXT,
    final_notes             TEXT,
    -- How was the final classification determined?
    classification_method   classification_method   NOT NULL,
    -- Who confirmed / manually classified?
    confirmed_by            UUID                    NOT NULL REFERENCES profiles(id),
    confirmed_at            TIMESTAMPTZ             NOT NULL DEFAULT now(),
    created_at              TIMESTAMPTZ             NOT NULL DEFAULT now(),

    CONSTRAINT classification_final_object_length CHECK (char_length(final_object) >= 1),
    CONSTRAINT classification_final_category_length CHECK (char_length(final_category) >= 1)
);

CREATE INDEX idx_evidence_classifications_evidence_id ON evidence_classifications(evidence_id);
CREATE INDEX idx_evidence_classifications_method ON evidence_classifications(classification_method);
