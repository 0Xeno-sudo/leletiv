CREATE TABLE scenarios (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 inputs_json TEXT NOT NULL,
 cohort_json TEXT NOT NULL,
 model_version TEXT NOT NULL,
 created_at TEXT NOT NULL
);
