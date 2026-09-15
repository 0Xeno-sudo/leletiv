PRAGMA foreign_keys = ON;

CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT NOT NULL,
  specialty TEXT NOT NULL,
  color TEXT NOT NULL,
  availability TEXT NOT NULL DEFAULT 'available'
);

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  sex TEXT NOT NULL,
  city TEXT NOT NULL,
  synthetic INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  pathway TEXT NOT NULL,
  working_diagnosis TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  coordinator_id TEXT,
  lead_clinician_id TEXT,
  next_milestone TEXT NOT NULL,
  target_date TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (coordinator_id) REFERENCES team_members(id),
  FOREIGN KEY (lead_clinician_id) REFERENCES team_members(id)
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_id TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  due_at TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES team_members(id)
);

CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  next_available TEXT NOT NULL,
  utilization INTEGER NOT NULL,
  detail TEXT NOT NULL
);

CREATE TABLE case_requirements (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  owner_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES team_members(id)
);

CREATE TABLE imaging_studies (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  modality TEXT NOT NULL,
  description TEXT NOT NULL,
  study_date TEXT NOT NULL,
  series_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  object_key TEXT,
  file_name TEXT,
  file_size INTEGER,
  content_type TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE board_decisions (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  rationale TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE INDEX idx_cases_patient ON cases(patient_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_tasks_case ON tasks(case_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_requirements_case ON case_requirements(case_id);
CREATE INDEX idx_studies_case ON imaging_studies(case_id);
CREATE INDEX idx_activity_case ON activity_log(case_id);

