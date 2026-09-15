CREATE TABLE review_documents (
 id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id), title TEXT NOT NULL,
 study_date TEXT NOT NULL, modality TEXT NOT NULL, pages_json TEXT NOT NULL,
 object_key TEXT NOT NULL, file_name TEXT NOT NULL, content_type TEXT NOT NULL,
 sha256 TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(case_id,sha256)
);
CREATE TABLE review_evidence (
 id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id), document_id TEXT NOT NULL REFERENCES review_documents(id),
 page INTEGER NOT NULL CHECK(page>0), quote TEXT NOT NULL, note TEXT NOT NULL, reviewer_id TEXT NOT NULL REFERENCES team_members(id), created_at TEXT NOT NULL
);
CREATE TABLE review_measurements (
 id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id), evidence_id TEXT NOT NULL REFERENCES review_evidence(id),
 region TEXT NOT NULL, value REAL NOT NULL CHECK(value>=0), unit TEXT NOT NULL CHECK(unit IN ('mm','mL')),
 method TEXT NOT NULL, protocol TEXT NOT NULL, measured_at TEXT NOT NULL,
 reviewer_id TEXT NOT NULL REFERENCES team_members(id), comparable INTEGER NOT NULL CHECK(comparable IN (0,1)),
 created_at TEXT NOT NULL, void_reason TEXT
);
CREATE TABLE review_followups (
 id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id), evidence_id TEXT NOT NULL REFERENCES review_evidence(id),
 recommendation TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES team_members(id), due_date TEXT NOT NULL, priority TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','completed')), version INTEGER NOT NULL DEFAULT 1,
 result_evidence_id TEXT REFERENCES review_evidence(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE review_events (
 id TEXT PRIMARY KEY, followup_id TEXT NOT NULL REFERENCES review_followups(id), action TEXT NOT NULL,
 actor_id TEXT NOT NULL REFERENCES team_members(id), note TEXT NOT NULL, result_evidence_id TEXT REFERENCES review_evidence(id), occurred_at TEXT NOT NULL
);
CREATE INDEX review_documents_case ON review_documents(case_id);
CREATE INDEX review_evidence_case ON review_evidence(case_id);
CREATE INDEX review_measurements_case ON review_measurements(case_id);
CREATE INDEX review_followups_case ON review_followups(case_id);
CREATE INDEX review_events_followup ON review_events(followup_id);
