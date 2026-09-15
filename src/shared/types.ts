export type Priority = "urgent" | "high" | "routine";
export type CaseStatus = "triage" | "incomplete" | "board-ready" | "decision-recorded" | "scheduled" | "monitoring";
export type TaskStatus = "open" | "in-progress" | "blocked" | "done";
export type RequirementStatus = "pending" | "in-progress" | "blocked" | "at-risk" | "ready" | "not-required";

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  specialty: string;
  color: string;
  availability: string;
}

export interface ClinicalCase {
  id: string;
  patient_id: string;
  patient_name: string;
  hospital_id: string;
  birth_date: string;
  sex: string;
  city: string;
  pathway: string;
  working_diagnosis: string;
  priority: Priority;
  status: CaseStatus;
  coordinator_id: string;
  coordinator_name: string;
  lead_clinician_id: string;
  lead_clinician_name: string;
  next_milestone: string;
  target_date: string;
  progress: number;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicalTask {
  id: string;
  case_id: string;
  patient_name: string;
  hospital_id: string;
  title: string;
  description: string;
  owner_id: string | null;
  owner_name: string | null;
  owner_initials: string | null;
  status: TaskStatus;
  priority: Priority;
  due_at: string;
  category: string;
  created_at: string;
  completed_at: string | null;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  next_available: string;
  utilization: number;
  detail: string;
}

export interface Requirement {
  id: string;
  case_id: string;
  label: string;
  category: string;
  status: RequirementStatus;
  owner_id: string | null;
  owner_name: string | null;
  updated_at: string;
}

export interface ImagingStudy {
  id: string;
  case_id: string;
  patient_name: string;
  hospital_id: string;
  modality: string;
  description: string;
  study_date: string;
  series_count: number;
  status: string;
  object_key: string | null;
  file_name: string | null;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

export interface BoardDecision {
  id: string;
  case_id: string;
  recommendation: string;
  rationale: string;
  recorded_by: string;
  decided_at: string;
  status: string;
}

export interface ActivityItem {
  id: string;
  case_id: string | null;
  actor: string;
  action: string;
  detail: string;
  occurred_at: string;
}

export interface BootstrapPayload {
  cases: ClinicalCase[];
  tasks: ClinicalTask[];
  team: TeamMember[];
  resources: Resource[];
  requirements: Requirement[];
  studies: ImagingStudy[];
  decisions: BoardDecision[];
  activity: ActivityItem[];
  generated_at: string;
}

export interface NewCaseInput {
  patient_name: string;
  hospital_id: string;
  birth_date: string;
  sex: string;
  city: string;
  pathway: string;
  working_diagnosis: string;
  priority: Priority;
  summary: string;
}
