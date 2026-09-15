export interface ReviewDocument {
  id: string;
  case_id: string;
  title: string;
  study_date: string;
  modality: string;
  pages: string[];
  file_name: string;
  sha256: string;
  created_at: string;
  sample_language?: "en" | "hu" | null;
}
export interface Evidence {
  id: string;
  case_id: string;
  document_id: string;
  page: number;
  quote: string;
  note: string;
  reviewer_id: string;
  created_at: string;
}
export interface Measurement {
  id: string;
  case_id: string;
  evidence_id: string;
  region: string;
  value: number;
  unit: string;
  method: string;
  protocol: string;
  measured_at: string;
  reviewer_id: string;
  comparable: boolean;
  created_at: string;
  void_reason: string | null;
}
export interface Followup {
  id: string;
  case_id: string;
  evidence_id: string;
  recommendation: string;
  owner_id: string;
  due_date: string;
  priority: string;
  status: "open" | "acknowledged" | "completed";
  version: number;
  result_evidence_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface FollowupEvent {
  id: string;
  followup_id: string;
  action: string;
  actor_id: string;
  note: string;
  result_evidence_id: string | null;
  occurred_at: string;
}
export interface ReviewWorkspace {
  documents: ReviewDocument[];
  evidence: Evidence[];
  measurements: Measurement[];
  followups: Followup[];
  events: FollowupEvent[];
}
const text = (x: unknown, max: number, min = 1) =>
  typeof x === "string" && x.trim().length >= min && x.length <= max;
export function validDay(x: unknown): x is string {
  return (
    typeof x === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(x) &&
    Number.isFinite(Date.parse(x)) &&
    new Date(x).toISOString().slice(0, 10) === x
  );
}
export function validateDocument(b: Record<string, unknown>): string | null {
  if (
    !text(b.title, 160) ||
    !validDay(b.study_date) ||
    !["MR", "CT", "Pathology", "Other"].includes(String(b.modality))
  )
    return "Enter a title, valid study date and document type.";
  if (
    !Array.isArray(b.pages) ||
    !b.pages.length ||
    b.pages.length > 50 ||
    b.pages.some((p) => typeof p !== "string") ||
    b.pages.join("").length > 120000 ||
    !b.pages.join("").trim()
  )
    return "Use a text-readable document: up to 50 pages and 120,000 characters. Scanned PDFs need external OCR and manual verification.";
  return null;
}
export function validateEvidence(
  b: Record<string, unknown>,
  pages: string[],
): string | null {
  if (
    !text(b.document_id, 80) ||
    !Number.isInteger(b.page) ||
    Number(b.page) < 1 ||
    Number(b.page) > pages.length ||
    !text(b.quote, 3000, 3) ||
    !pages[Number(b.page) - 1].includes(String(b.quote))
  )
    return "The quotation must match the selected source page exactly.";
  if (
    b.verified !== true ||
    !text(b.reviewer_id, 80) ||
    !text(b.note ?? "", 2000, 0)
  )
    return "Select a reviewer and verify the quotation against the original source.";
  return null;
}
export function validateMeasurement(b: Record<string, unknown>): string | null {
  if (
    !text(b.evidence_id, 80) ||
    !text(b.region, 100) ||
    typeof b.value !== "number" ||
    !Number.isFinite(b.value) ||
    b.value < 0 ||
    b.value > 100000 ||
    !validDay(b.measured_at) ||
    !text(b.reviewer_id, 80) ||
    !text(b.protocol, 160) ||
    typeof b.comparable !== "boolean"
  )
    return "Enter a finite non-negative measurement, source, region, date, protocol and reviewer.";
  if (
    !(
      (b.unit === "mm" && b.method === "longest-diameter") ||
      (b.unit === "mL" && b.method === "segmented-volume")
    )
  )
    return "Use mm for longest diameter or mL for segmented volume.";
  return null;
}
type Comparable = Pick<
  Measurement,
  | "region"
  | "value"
  | "unit"
  | "method"
  | "protocol"
  | "measured_at"
  | "comparable"
>;
export function compareMeasurements(
  a: Comparable,
  b: Comparable,
): { absolute: number | null; percent: number | null; reason: string | null } {
  if (
    a.region !== b.region ||
    a.unit !== b.unit ||
    a.method !== b.method ||
    a.protocol.trim().toLowerCase() !== b.protocol.trim().toLowerCase() ||
    !a.comparable ||
    !b.comparable ||
    !validDay(a.measured_at) ||
    !validDay(b.measured_at) ||
    b.measured_at <= a.measured_at ||
    ![a.value, b.value].every((v) => Number.isFinite(v) && v >= 0)
  )
    return {
      absolute: null,
      percent: null,
      reason:
        "Comparison withheld: confirm matching region, units, method, protocol and chronological dates.",
    };
  return {
    absolute: b.value - a.value,
    percent: a.value === 0 ? null : ((b.value - a.value) / a.value) * 100,
    reason: null,
  };
}
export function validateFollowup(b: Record<string, unknown>): string | null {
  return text(b.evidence_id, 80) &&
    text(b.recommendation, 1000) &&
    text(b.owner_id, 80) &&
    validDay(b.due_date) &&
    ["routine", "high", "urgent"].includes(String(b.priority))
    ? null
    : "A source, recommendation, named owner, valid due date and priority are required.";
}
export function transitionFollowup(
  status: Followup["status"],
  b: Record<string, unknown>,
): string | null {
  if (!text(b.actor_id, 80) || !text(b.note, 2000, 3))
    return "Record who performed the action and an explanatory note.";
  if (b.action === "acknowledge" && status === "open") return null;
  if (
    b.action === "complete" &&
    status === "acknowledged" &&
    text(b.result_evidence_id, 80)
  )
    return null;
  if (b.action === "reopen" && status !== "open") return null;
  return "Acknowledge before completion, attach reviewed result evidence, or reopen with a reason.";
}
