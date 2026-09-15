import type { ClinicalCase, ClinicalTask, Requirement, RequirementStatus } from "./types";

export const caseStatusLabels: Record<ClinicalCase["status"], string> = {
  triage: "Triage",
  incomplete: "Incomplete",
  "board-ready": "Board ready",
  "decision-recorded": "Decision recorded",
  scheduled: "Scheduled",
  monitoring: "Monitoring",
};

export const taskStatusLabels: Record<ClinicalTask["status"], string> = {
  open: "Open",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const requirementStatusLabels: Record<RequirementStatus, string> = {
  pending: "Pending",
  "in-progress": "In progress",
  blocked: "Blocked",
  "at-risk": "At risk",
  ready: "Ready",
  "not-required": "Not required",
};

export function calculateAge(birthDate: string, today = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function readinessScore(requirements: Requirement[]): number {
  const relevant = requirements.filter((item) => item.status !== "not-required");
  if (relevant.length === 0) return 0;
  const weights: Record<RequirementStatus, number> = {
    ready: 1,
    "not-required": 1,
    "in-progress": 0.55,
    pending: 0.25,
    "at-risk": 0.15,
    blocked: 0,
  };
  const score = relevant.reduce((sum, item) => sum + weights[item.status], 0) / relevant.length;
  return Math.round(score * 100);
}

export function isTaskOverdue(task: ClinicalTask, now = new Date()): boolean {
  return task.status !== "done" && new Date(task.due_at).getTime() < now.getTime();
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "No file attached";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
