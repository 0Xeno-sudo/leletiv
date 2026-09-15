import { describe, it, expect } from "vitest";
import {
  validateDocument,
  validateEvidence,
  validateMeasurement,
  compareMeasurements,
  validateFollowup,
  transitionFollowup,
} from "./review";

const doc = {
  title: "Synthetic MR report",
  study_date: "2026-08-01",
  modality: "MR",
  pages: ["Synthetic report. No new lesion. Region A measures 12 mm."],
};
const evidence = {
  document_id: "doc1",
  page: 1,
  quote: "No new lesion.",
  note: "Preserve the negation",
  reviewer_id: "tm-01",
  verified: true,
};
const measurement = {
  evidence_id: "e1",
  region: "Region A",
  value: 12,
  unit: "mm",
  method: "longest-diameter",
  protocol: "MR T1c axial 1 mm",
  measured_at: "2026-08-01",
  reviewer_id: "tm-01",
  comparable: true,
};
describe("evidence integrity", () => {
  it("requires bounded text and real calendar dates", () => {
    expect(validateDocument(doc)).toBeNull();
    expect(validateDocument({ ...doc, study_date: "2026-02-30" })).toBeTruthy();
    expect(validateDocument({ ...doc, pages: [""] })).toBeTruthy();
    expect(
      validateDocument({ ...doc, pages: Array(51).fill("x") }),
    ).toBeTruthy();
  });
  it("requires an exact quotation and explicit source review", () => {
    expect(validateEvidence(evidence, doc.pages)).toBeNull();
    expect(
      validateEvidence({ ...evidence, quote: "new tumour" }, doc.pages),
    ).toBeTruthy();
    expect(validateEvidence({ ...evidence, page: 2 }, doc.pages)).toBeTruthy();
    expect(
      validateEvidence({ ...evidence, verified: false }, doc.pages),
    ).toBeTruthy();
  });
});
describe("longitudinal measurements", () => {
  it("validates units, methods, values and review", () => {
    expect(validateMeasurement(measurement)).toBeNull();
    for (const value of [-1, NaN, Infinity])
      expect(validateMeasurement({ ...measurement, value })).toBeTruthy();
    expect(validateMeasurement({ ...measurement, unit: "mL" })).toBeTruthy();
  });
  it("compares like-for-like reviewed observations without inferring progression", () => {
    expect(
      compareMeasurements(measurement, {
        ...measurement,
        value: 15,
        measured_at: "2026-09-01",
      }),
    ).toEqual({ absolute: 3, percent: 25, reason: null });
  });
  it("blocks mixed protocols, regions, dates, methods and unconfirmed comparisons", () => {
    for (const changed of [
      { protocol: "CT" },
      { region: "Region B" },
      { comparable: false },
      { measured_at: "2026-07-01" },
      { unit: "mL", method: "segmented-volume" },
    ])
      expect(
        compareMeasurements(measurement, {
          ...measurement,
          ...changed,
        } as typeof measurement).reason,
      ).toBeTruthy();
  });
  it("does not divide by zero", () => {
    expect(
      compareMeasurements(
        { ...measurement, value: 0 },
        { ...measurement, value: 1, measured_at: "2026-09-01" },
      ).percent,
    ).toBeNull();
  });
});
describe("closed-loop follow-up", () => {
  const item = {
    evidence_id: "e1",
    recommendation: "Repeat synthetic imaging",
    owner_id: "tm-01",
    due_date: "2026-10-01",
    priority: "routine",
  };
  it("requires a named owner and real due date", () => {
    expect(validateFollowup(item)).toBeNull();
    expect(validateFollowup({ ...item, owner_id: "" })).toBeTruthy();
    expect(validateFollowup({ ...item, due_date: "2026-11-31" })).toBeTruthy();
  });
  it("requires acknowledgement before closure and result evidence", () => {
    expect(
      transitionFollowup("open", {
        action: "complete",
        actor_id: "tm-01",
        note: "Done",
        result_evidence_id: "e2",
      }),
    ).toBeTruthy();
    expect(
      transitionFollowup("open", {
        action: "acknowledge",
        actor_id: "tm-01",
        note: "Accepted",
      }),
    ).toBeNull();
    expect(
      transitionFollowup("acknowledged", {
        action: "complete",
        actor_id: "tm-01",
        note: "Done",
      }),
    ).toBeTruthy();
    expect(
      transitionFollowup("acknowledged", {
        action: "complete",
        actor_id: "tm-01",
        note: "Result reviewed",
        result_evidence_id: "e2",
      }),
    ).toBeNull();
  });
  it("allows an explained reopening, never silent overwriting", () => {
    expect(
      transitionFollowup("completed", {
        action: "acknowledge",
        actor_id: "tm-01",
        note: "Accepted",
      }),
    ).toBeTruthy();
    expect(
      transitionFollowup("completed", {
        action: "reopen",
        actor_id: "tm-01",
        note: "Result needs clarification",
      }),
    ).toBeNull();
  });
});
