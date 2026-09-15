CREATE TABLE decision_steps (
 id TEXT PRIMARY KEY, decision_id TEXT NOT NULL REFERENCES board_decisions(id),
 task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id), prerequisite_id TEXT REFERENCES decision_steps(id),
 expected_result TEXT NOT NULL, result_note TEXT NOT NULL DEFAULT '', reviewed_by TEXT REFERENCES team_members(id),
 reviewed_at TEXT, created_at TEXT NOT NULL
);
CREATE INDEX decision_steps_decision ON decision_steps(decision_id);
CREATE TABLE expected_exams (
 id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id), title TEXT NOT NULL,
 owner_id TEXT NOT NULL REFERENCES team_members(id), due_date TEXT NOT NULL, appointment_date TEXT,
 status TEXT NOT NULL CHECK(status IN ('requested','scheduled','performed','received','reviewed','missed','cancelled')),
 study_id TEXT REFERENCES imaging_studies(id), document_id TEXT REFERENCES review_documents(id),
 note TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE exam_events (
 id TEXT PRIMARY KEY, exam_id TEXT NOT NULL REFERENCES expected_exams(id),
 status TEXT NOT NULL, note TEXT NOT NULL, actor_id TEXT NOT NULL REFERENCES team_members(id), occurred_at TEXT NOT NULL
);
CREATE TABLE scan_analyses (
 id TEXT PRIMARY KEY, study_id TEXT NOT NULL REFERENCES imaging_studies(id), source_hash TEXT NOT NULL,
 mask_key TEXT, mask_hash TEXT, region_id TEXT NOT NULL, method TEXT NOT NULL,
 measurements_json TEXT NOT NULL, parameters_json TEXT NOT NULL, note TEXT NOT NULL,
 review_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK(review_status IN ('unreviewed','reviewed')),
 reviewer_id TEXT REFERENCES team_members(id), reviewed_at TEXT, created_at TEXT NOT NULL
);
CREATE INDEX scan_analyses_study ON scan_analyses(study_id);
