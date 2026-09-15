import { describe, expect, it } from "vitest";
import { calculateAge, isTaskOverdue, readinessScore } from "./workflow";
import type { ClinicalTask, Requirement } from "./types";

describe("clinical workflow utilities", () => {
  it("calculates age before and after a birthday", () => {
    expect(calculateAge("1990-09-14", new Date("2026-09-13T12:00:00Z"))).toBe(35);
    expect(calculateAge("1990-09-12", new Date("2026-09-13T12:00:00Z"))).toBe(36);
  });

  it("calculates readiness without counting non-required items", () => {
    const requirements = [
      { status: "ready" },
      { status: "in-progress" },
      { status: "not-required" },
    ] as Requirement[];
    expect(readinessScore(requirements)).toBe(78);
  });

  it("does not mark completed work as overdue", () => {
    const task = { status: "done", due_at: "2026-01-01T00:00:00Z" } as ClinicalTask;
    expect(isTaskOverdue(task, new Date("2026-09-13T00:00:00Z"))).toBe(false);
  });
});
