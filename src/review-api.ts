import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { reviewDataset, visibleReviewDocuments, visibleReviewEvidence } from "./shared/review-scope";
import {
  validateDocument,
  validateEvidence,
  validateMeasurement,
  validateFollowup,
  transitionFollowup,
  type Followup,
} from "./shared/review";

export const reviewApi = new Hono<{ Bindings: WorkerBindings }>();
reviewApi.use(
  "*",
  bodyLimit({
    maxSize: 9 * 1024 * 1024,
    onError: (c) =>
      c.json({ error: "Review uploads are limited to 8 MB." }, 413),
  }),
);
reviewApi.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  await next();
});
reviewApi.use("*", async (c, next) => {
  if (
    ["POST", "PATCH"].includes(c.req.method) &&
    !c.req.path.endsWith("/documents")
  ) {
    const body = await c.req.json<unknown>();
    if (!body || typeof body !== "object" || Array.isArray(body))
      return c.json({ error: "Expected a JSON object." }, 400);
  }
  await next();
});
const stamp = () => new Date().toISOString();
const exists = (
  db: D1Database,
  table: "cases" | "team_members",
  id: unknown,
) =>
  typeof id === "string"
    ? db.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(id).first()
    : Promise.resolve(null);
const evidenceInCase = (db: D1Database, id: unknown, caseId: string, dataset: string) =>
  typeof id === "string"
    ? db
        .prepare("SELECT e.id FROM review_evidence e JOIN review_documents d ON d.id=e.document_id WHERE e.id = ? AND e.case_id = ? AND d.dataset = ?")
        .bind(id, caseId, dataset)
        .first()
    : Promise.resolve(null);

reviewApi.get("/summary", async (c) => {
  const result = await c["env"].DB.prepare(
    `SELECT f.*, p.name AS patient_name FROM review_followups f JOIN cases c ON c.id=f.case_id JOIN patients p ON p.id=c.patient_id WHERE f.status != 'completed' AND f.evidence_id IN (${visibleReviewEvidence}) ORDER BY f.due_date ASC`,
  ).bind(reviewDataset(c.req.header("X-Review-Dataset")), c.req.query("language") === "hu" ? "hu" : "en").all();
  return c.json(result.results);
});
reviewApi.get("/cases/:caseId", async (c) => {
  const id = c.req.param("caseId");
  const db = c["env"].DB;
  const scope = [id, reviewDataset(c.req.header("X-Review-Dataset")), c.req.query("language") === "hu" ? "hu" : "en"];
  if (!(await exists(db, "cases", id)))
    return c.json({ error: "Case not found." }, 404);
  const [documents, evidence, measurements, followups, events] = await db.batch<
    Record<string, unknown>
  >([
    db
      .prepare(
        `SELECT id,case_id,title,study_date,modality,pages_json,file_name,sha256,created_at,sample_language FROM review_documents WHERE case_id=? AND id IN (${visibleReviewDocuments}) ORDER BY study_date DESC,created_at DESC`,
      )
      .bind(...scope),
    db
      .prepare(
        `SELECT * FROM review_evidence WHERE case_id=? AND id IN (${visibleReviewEvidence}) ORDER BY created_at DESC`,
      )
      .bind(...scope),
    db
      .prepare(
        `SELECT * FROM review_measurements WHERE case_id=? AND evidence_id IN (${visibleReviewEvidence}) ORDER BY measured_at,created_at`,
      )
      .bind(...scope),
    db
      .prepare(
        `SELECT * FROM review_followups WHERE case_id=? AND evidence_id IN (${visibleReviewEvidence}) ORDER BY due_date,created_at`,
      )
      .bind(...scope),
    db
      .prepare(
        `SELECT e.* FROM review_events e JOIN review_followups f ON f.id=e.followup_id WHERE f.case_id=? AND f.evidence_id IN (${visibleReviewEvidence}) ORDER BY e.occurred_at DESC`,
      )
      .bind(...scope),
  ]);
  return c.json({
    documents: documents.results.map(({ pages_json, ...d }) => ({
      ...d,
      pages: JSON.parse(String(pages_json)),
    })),
    evidence: evidence.results,
    measurements: measurements.results.map((m) => ({
      ...m,
      comparable: !!m.comparable,
    })),
    followups: followups.results,
    events: events.results,
  });
});
reviewApi.post("/cases/:caseId/documents", async (c) => {
  const caseId = c.req.param("caseId");
  const db = c["env"].DB;
  if (!(await exists(db, "cases", caseId)))
    return c.json({ error: "Case not found." }, 404);
  const form = await c.req.formData();
  const sampleLanguage = form.get("sample_language");
  if (sampleLanguage !== null && sampleLanguage !== "en" && sampleLanguage !== "hu")
    return c.json({ error: "Invalid example language." }, 400);
  const file = form.get("file");
  if (form.get("synthetic") !== "yes")
    return c.json(
      { error: "Only synthetic demonstration documents may be uploaded." },
      400,
    );
  if (
    !(file instanceof File) ||
    !file.size ||
    file.size > 8 * 1024 * 1024 ||
    !/\.(pdf|txt)$/i.test(file.name)
  )
    return c.json(
      { error: "Choose a PDF or UTF-8 text file up to 8 MB." },
      400,
    );
  const b = {
    title: form.get("title"),
    study_date: form.get("study_date"),
    modality: form.get("modality"),
    pages: JSON.parse(String(form.get("pages"))),
  };
  const error = validateDocument(b);
  if (error) return c.json({ error }, 400);
  const bytes = await file.arrayBuffer();
  const pdf = /\.pdf$/i.test(file.name);
  if (pdf && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
    return c.json({ error: "The selected file is not a PDF." }, 400);
  if (
    !pdf &&
    (b.pages.length !== 1 ||
      b.pages[0] !== new TextDecoder("utf-8", { fatal: true }).decode(bytes))
  )
    return c.json(
      { error: "Text content must match the uploaded source." },
      400,
    );
  const hash = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
  const duplicate = await db
    .prepare("SELECT id FROM review_documents WHERE case_id=? AND sha256=?")
    .bind(caseId, hash)
    .first();
  if (duplicate)
    return c.json(
      { error: "This source is already attached to this case." },
      409,
    );
  const id = crypto.randomUUID(),
    key = `review/${caseId}/${id}`,
    at = stamp();
  await c["env"].IMAGING.put(key, bytes, {
    httpMetadata: {
      contentType: pdf ? "application/pdf" : "text/plain; charset=utf-8",
    },
  });
  try {
    await db
      .prepare(
        "INSERT INTO review_documents (id,case_id,title,study_date,modality,pages_json,object_key,file_name,content_type,sha256,created_at,dataset,sample_language) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        caseId,
        b.title,
        b.study_date,
        b.modality,
        JSON.stringify(b.pages),
        key,
        file.name.slice(0, 200),
        pdf ? "application/pdf" : "text/plain; charset=utf-8",
        hash,
        at,
        reviewDataset(c.req.header("X-Review-Dataset")),
        sampleLanguage,
      )
      .run();
  } catch (error) {
    await c["env"].IMAGING.delete(key);
    throw error;
  }
  return c.json({ id }, 201);
});
reviewApi.get("/documents/:id/source", async (c) => {
  const doc = await c["env"].DB.prepare(
    "SELECT object_key,content_type FROM review_documents WHERE id=? AND dataset=?",
  )
    .bind(c.req.param("id"), reviewDataset(c.req.header("X-Review-Dataset")))
    .first<{ object_key: string; content_type: string }>();
  if (!doc) return c.json({ error: "Source not found." }, 404);
  const object = await c["env"].IMAGING.get(doc.object_key);
  if (!object) return c.json({ error: "Source not found." }, 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": doc.content_type,
      "Content-Disposition": "attachment",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
});
reviewApi.post("/cases/:caseId/evidence", async (c) => {
  const caseId = c.req.param("caseId"),
    b = await c.req.json(),
    db = c["env"].DB;
  const doc =
    typeof b.document_id === "string"
      ? await db
          .prepare(
            "SELECT pages_json FROM review_documents WHERE id=? AND case_id=? AND dataset=?",
          )
          .bind(b.document_id, caseId, reviewDataset(c.req.header("X-Review-Dataset")))
          .first<{ pages_json: string }>()
      : null;
  if (!doc) return c.json({ error: "Source not found in this case." }, 400);
  const error = validateEvidence(b, JSON.parse(doc.pages_json));
  if (error) return c.json({ error }, 400);
  if (!(await exists(db, "team_members", b.reviewer_id)))
    return c.json({ error: "Team member not found." }, 400);
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO review_evidence (id,case_id,document_id,page,quote,note,reviewer_id,created_at) VALUES (?,?,?,?,?,?,?,?)",
    )
    .bind(
      id,
      caseId,
      b.document_id,
      b.page,
      b.quote,
      b.note ?? "",
      b.reviewer_id,
      stamp(),
    )
    .run();
  return c.json({ id }, 201);
});
reviewApi.post("/cases/:caseId/measurements", async (c) => {
  const caseId = c.req.param("caseId"),
    b = await c.req.json(),
    db = c["env"].DB;
  const error = validateMeasurement(b);
  if (error) return c.json({ error }, 400);
  if (
    !(await evidenceInCase(db, b.evidence_id, caseId, reviewDataset(c.req.header("X-Review-Dataset")))) ||
    !(await exists(db, "team_members", b.reviewer_id))
  )
    return c.json(
      { error: "Select reviewed evidence and a reviewer from this case." },
      400,
    );
  const source = await db
    .prepare(
      "SELECT d.study_date FROM review_evidence e JOIN review_documents d ON d.id=e.document_id WHERE e.id=?",
    )
    .bind(b.evidence_id)
    .first<{ study_date: string }>();
  if (source?.study_date !== b.measured_at)
    return c.json(
      { error: "The measurement date must match its source study date." },
      400,
    );
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO review_measurements (id,case_id,evidence_id,region,value,unit,method,protocol,measured_at,reviewer_id,comparable,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .bind(
      id,
      caseId,
      b.evidence_id,
      b.region.trim(),
      b.value,
      b.unit,
      b.method,
      b.protocol.trim(),
      b.measured_at,
      b.reviewer_id,
      b.comparable ? 1 : 0,
      stamp(),
    )
    .run();
  return c.json({ id }, 201);
});
reviewApi.patch("/measurements/:id/void", async (c) => {
  const b = await c.req.json();
  if (
    typeof b.reason !== "string" ||
    b.reason.trim().length < 3 ||
    b.reason.length > 1000
  )
    return c.json(
      { error: "Record a reason for excluding this measurement." },
      400,
    );
  const result = await c["env"].DB.prepare(
    "UPDATE review_measurements SET void_reason=? WHERE id=? AND void_reason IS NULL AND evidence_id IN (SELECT e.id FROM review_evidence e JOIN review_documents d ON d.id=e.document_id WHERE d.dataset=?)",
  )
    .bind(b.reason, c.req.param("id"), reviewDataset(c.req.header("X-Review-Dataset")))
    .run();
  if (!result.meta.changes)
    return c.json({ error: "Measurement not found or already excluded." }, 409);
  return c.json({ ok: true });
});
reviewApi.post("/cases/:caseId/followups", async (c) => {
  const caseId = c.req.param("caseId"),
    b = await c.req.json(),
    db = c["env"].DB;
  const error = validateFollowup(b);
  if (error) return c.json({ error }, 400);
  if (
    !(await evidenceInCase(db, b.evidence_id, caseId, reviewDataset(c.req.header("X-Review-Dataset")))) ||
    !(await exists(db, "team_members", b.owner_id))
  )
    return c.json(
      {
        error:
          "Select reviewed evidence and a named owner from this workspace.",
      },
      400,
    );
  const id = crypto.randomUUID(),
    at = stamp();
  await db.batch([
    db
      .prepare(
        "INSERT INTO review_followups (id,case_id,evidence_id,recommendation,owner_id,due_date,priority,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        caseId,
        b.evidence_id,
        b.recommendation,
        b.owner_id,
        b.due_date,
        b.priority,
        at,
        at,
      ),
    db
      .prepare(
        "INSERT INTO review_events (id,followup_id,action,actor_id,note,occurred_at) VALUES (?,?,?,?,?,?)",
      )
      .bind(
        crypto.randomUUID(),
        id,
        "assigned",
        b.owner_id,
        b.recommendation,
        at,
      ),
  ]);
  return c.json({ id }, 201);
});
reviewApi.patch("/followups/:id", async (c) => {
  const b = await c.req.json(),
    db = c["env"].DB,
    id = c.req.param("id");
  const item = await db
    .prepare("SELECT * FROM review_followups WHERE id=? AND evidence_id IN (SELECT e.id FROM review_evidence e JOIN review_documents d ON d.id=e.document_id WHERE d.dataset=?)")
    .bind(id, reviewDataset(c.req.header("X-Review-Dataset")))
    .first<Followup>();
  if (!item) return c.json({ error: "Follow-up not found." }, 404);
  if (b.version !== item.version)
    return c.json(
      { error: "This record changed. Refresh before saving." },
      409,
    );
  const error = transitionFollowup(item.status, b);
  if (error) return c.json({ error }, 400);
  if (!(await exists(db, "team_members", b.actor_id)))
    return c.json({ error: "Team member not found." }, 400);
  if (
    b.action === "complete" &&
    (!(await evidenceInCase(db, b.result_evidence_id, item.case_id, reviewDataset(c.req.header("X-Review-Dataset")))) ||
      b.result_evidence_id === item.evidence_id)
  )
    return c.json(
      { error: "Attach a different reviewed result from the same case." },
      400,
    );
  if (b.action === "complete") {
    const dates = await db
      .prepare(
        "SELECT e.id,d.study_date FROM review_evidence e JOIN review_documents d ON d.id=e.document_id WHERE e.id IN (?,?)",
      )
      .bind(item.evidence_id, b.result_evidence_id)
      .all<{ id: string; study_date: string }>();
    const initial = dates.results.find((e) => e.id === item.evidence_id),
      result = dates.results.find((e) => e.id === b.result_evidence_id);
    if (!initial || !result || result.study_date < initial.study_date)
      return c.json(
        { error: "Result evidence cannot predate the recommendation source." },
        400,
      );
  }
  const status =
    b.action === "complete"
      ? "completed"
      : b.action === "acknowledge"
        ? "acknowledged"
        : "open";
  const at = stamp(),
    resultId = b.action === "complete" ? b.result_evidence_id : null;
  const result = await db.batch([
    db
      .prepare(
        "INSERT INTO review_events (id,followup_id,action,actor_id,note,result_evidence_id,occurred_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT id FROM review_followups WHERE id=? AND version=?)",
      )
      .bind(
        crypto.randomUUID(),
        id,
        b.action,
        b.actor_id,
        b.note,
        resultId,
        at,
        id,
        b.version,
      ),
    db
      .prepare(
        "UPDATE review_followups SET status=?,result_evidence_id=?,updated_at=?,version=version+1 WHERE id=? AND version=?",
      )
      .bind(status, resultId, at, id, b.version),
  ]);
  if (!result[1].meta.changes)
    return c.json(
      { error: "This record changed. Refresh before saving." },
      409,
    );
  return c.json({ ok: true });
});
