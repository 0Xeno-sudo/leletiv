import { describe, it, expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { reviewDocumentScope, reviewDataset } from "./review-scope";
import { reviewExamples } from "./review-examples";

describe("doctor-facing review records", () => {
  it("adds dataset columns without mutating any original records", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE review_documents(id TEXT, case_id TEXT, sha256 TEXT, pages_json TEXT)");
    const insert = db.prepare("INSERT INTO review_documents VALUES(?,?,?,?)");
    const id = "synthetic-record";
    const hash = "synthetic-hash";
    insert.run(id, "case-01", hash, "original example");
    insert.run("unrelated", "case-01", hash, "unrelated original");
    insert.run(id, "another-case", hash, "other case");
    insert.run(id, "case-01", "different-hash", "changed original");
    db.exec(readFileSync(new URL("../../migrations/0004_review_datasets.sql", import.meta.url), "utf8"));
    expect(db.prepare("SELECT pages_json FROM review_documents WHERE dataset='archived'").all()).toEqual([]);
    expect(db.prepare("SELECT COUNT(*) AS n FROM review_documents WHERE dataset='workspace'").get()?.n).toBe(4);
    expect(db.prepare("SELECT pages_json FROM review_documents WHERE id=? AND case_id=? AND sha256=?").get(id,"case-01",hash)?.pages_json).toBe("original example");
    db.close();
  });
  it("uses explicit dataset metadata, never keywords, to separate verification records", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE review_documents(id TEXT, dataset TEXT, sample_language TEXT, title TEXT)");
    const insert = db.prepare("INSERT INTO review_documents VALUES(?,?,?,?)");
    insert.run("original", "workspace", null, "API mentioned in an original report");
    insert.run("hu", "workspace", "hu", "Koponya-MR");
    insert.run("en", "workspace", "en", "Brain MRI");
    insert.run("qa", "verification", null, "QA report");
    insert.run("old", "archived", null, "Old bilingual example");
    const read = (dataset: string, language: string) => db.prepare(
      `SELECT id FROM review_documents WHERE ${reviewDocumentScope}`,
    ).all(dataset, language).map((r) => r.id);
    expect(read("workspace", "hu")).toEqual(["original", "hu"]);
    expect(read("workspace", "en")).toEqual(["original", "en"]);
    expect(read("verification", "en")).toEqual(["qa"]);
    expect(read("workspace", "unexpected")).toEqual(["original"]);
    db.close();
  });
  it("requires an explicit verification selector and never exposes the archive", () => {
    expect(reviewDataset(undefined)).toBe("workspace");
    expect(reviewDataset("verification")).toBe("verification");
    expect(reviewDataset("archived")).toBe("workspace");
  });
  it("authors single-language examples with exact source-linked quotations", () => {
    for (const language of ["hu", "en"] as const) {
      const examples = reviewExamples(language);
      expect(examples).toHaveLength(2);
      for (const example of examples) {
        expect(example.body).toContain(example.quote);
        expect(example.body).not.toMatch(/API|QA|portfolio| \/ /i);
        expect(example.title).not.toContain("Synthetic");
        expect(example.body).toContain(language === "hu" ? "BEMUTATÓ LELET" : "DEMO REPORT");
        expect(example.body).not.toContain(language === "hu" ? "No new lesion" : "Új elváltozás");
      }
    }
  });
});
