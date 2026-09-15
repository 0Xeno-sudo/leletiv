import { Hono } from "hono";
import type { NewCaseInput, RequirementStatus, TaskStatus } from "./shared/types";
import { validScenario, modelVersion } from './shared/simulation';
import {demoApi} from './demo-api';
import {scanApi} from './scan-api';
import {careApi} from './care-api';
import {reviewApi} from './review-api';
import {textFieldsError} from './shared/input';

const app = new Hono<{ Bindings: WorkerBindings }>();
const nowIso = () => new Date().toISOString();
const textValue = (value: unknown, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

app.use("/api/*", async (c, next) => {
  const origin=c.req.header('Origin');
  if(origin && origin!==new URL(c.req.url).origin)return c.json({error:'Same-origin access required.'},403);
  c.header('Cache-Control','no-store');
  c.header('X-Content-Type-Options','nosniff');
  const started = Date.now();
  await next();
  console.log(JSON.stringify({
    message: "request_complete",
    method: c.req.method,
    route: c.req.routePath,
    status: c.res.status,
    duration_ms: Date.now() - started,
  }));
});

app.post('/api/team', async c => {
  const body=await c.req.json();
  const error=textFieldsError(body,{name:120,role:100,specialty:100});
  if(error)return c.json({error},400);
  const name=textValue(body.name,120),role=textValue(body.role,100),specialty=textValue(body.specialty,100);
  if(!name||!role||!specialty)return c.json({error:'Name, role and specialty are required.'},400);
  const id=crypto.randomUUID(),initials=name.split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();
  await c['env'].DB.prepare("INSERT INTO team_members(id,name,initials,role,specialty,color,availability) VALUES(?,?,?,?,?,'#425466','available')").bind(id,name,initials,role,specialty).run();
  return c.json({id},201);
});

app.get("/api/ping", (c) => c.json({ ok: true }));
app.route('/api/review',reviewApi);
app.route('/api/care',careApi);
app.route('/api/scans',scanApi);
app.route('/api/demo',demoApi);

app.get('/api/scenarios', async c => {
  const rows = await c['env'].DB.prepare('SELECT * FROM scenarios ORDER BY created_at DESC LIMIT 30').all();
  return c.json(rows.results.map(r => ({id:r.id,name:r.name,inputs:JSON.parse(String(r.inputs_json)),cohort:JSON.parse(String(r.cohort_json)),modelVersion:r.model_version,createdAt:r.created_at})));
});
app.post('/api/scenarios', async c => {
  const body = await c.req.json();
  const name = textValue(body.name,100);
  if (!name || !validScenario(body.inputs)) return c.json({error:'A name and valid capacity assumptions are required.'},400);
  const cohort = await c['env'].DB.prepare("SELECT c.id, p.name AS patient_name, c.priority, c.status FROM cases c JOIN patients p ON p.id = c.patient_id ORDER BY CASE c.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, c.target_date ASC").all();
  const id = crypto.randomUUID();
  await c['env'].DB.prepare('INSERT INTO scenarios (id,name,inputs_json,cohort_json,model_version,created_at) VALUES (?,?,?,?,?,?)').bind(id,name,JSON.stringify(body.inputs),JSON.stringify(cohort.results),modelVersion,nowIso()).run();
  return c.json({id},201);
});
app.patch('/api/tasks/:id/owner', async c => {
  const body = await c.req.json();
  const owner = textValue(body.owner_id,80) || null;
  const db = c['env'].DB;
  if (owner && !await db.prepare('SELECT id FROM team_members WHERE id = ?').bind(owner).first()) return c.json({error:'Team member not found.'},400);
  const task = await db.prepare('SELECT case_id,title FROM tasks WHERE id = ?').bind(c.req.param('id')).first<{case_id:string;title:string}>();
  if (!task) return c.json({error:'Task not found.'},404);
  await db.batch([
    db.prepare('UPDATE tasks SET owner_id = ? WHERE id = ?').bind(owner,c.req.param('id')),
    db.prepare('INSERT INTO activity_log (id,case_id,actor,action,detail,occurred_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),task.case_id,'Workspace coordinator','Ownership changed',task.title,nowIso())
  ]);
  return c.json({ok:true});
});

app.get("/api/health", async (c) => {
  const result = await c["env"].DB.prepare("SELECT COUNT(*) AS count FROM cases").first<{ count: number }>();
  return c.json({
    status: "ok",
    runtime: "cloudflare-workers",
    database: "d1",
    cases: result?.count ?? 0,
    timestamp: nowIso(),
  });
});

app.get("/api/bootstrap", async (c) => {
  const db = c["env"].DB;
  const results = await db.batch([
    db.prepare(`
      SELECT c.*, p.name AS patient_name, p.hospital_id, p.birth_date, p.sex, p.city,
        coordinator.name AS coordinator_name, lead.name AS lead_clinician_name
      FROM cases c
      JOIN patients p ON p.id = c.patient_id
      LEFT JOIN team_members coordinator ON coordinator.id = c.coordinator_id
      LEFT JOIN team_members lead ON lead.id = c.lead_clinician_id
      ORDER BY CASE c.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, c.target_date ASC
    `),
    db.prepare(`
      SELECT t.*, p.name AS patient_name, p.hospital_id, owner.name AS owner_name, owner.initials AS owner_initials
      FROM tasks t
      JOIN cases c ON c.id = t.case_id
      JOIN patients p ON p.id = c.patient_id
      LEFT JOIN team_members owner ON owner.id = t.owner_id
      ORDER BY CASE t.status WHEN 'blocked' THEN 0 WHEN 'in-progress' THEN 1 WHEN 'open' THEN 2 ELSE 3 END, t.due_at ASC
    `),
    db.prepare("SELECT * FROM team_members ORDER BY name"),
    db.prepare("SELECT * FROM resources ORDER BY CASE status WHEN 'at-risk' THEN 0 WHEN 'limited' THEN 1 ELSE 2 END, utilization DESC"),
    db.prepare(`SELECT r.*, m.name AS owner_name FROM case_requirements r
      LEFT JOIN team_members m ON m.id = r.owner_id ORDER BY r.updated_at DESC`),
    db.prepare(`SELECT s.*, p.name AS patient_name, p.hospital_id FROM imaging_studies s
      JOIN cases c ON c.id = s.case_id JOIN patients p ON p.id = c.patient_id ORDER BY s.study_date DESC`),
    db.prepare("SELECT * FROM board_decisions ORDER BY decided_at DESC"),
    db.prepare("SELECT * FROM activity_log ORDER BY occurred_at DESC LIMIT 30"),
  ]);
  const [cases, tasks, team, resources, requirements, studies, decisions, activity] = results;
  return c.json({
    cases: cases.results,
    tasks: tasks.results,
    team: team.results,
    resources: resources.results,
    requirements: requirements.results,
    studies: studies.results,
    decisions: decisions.results,
    activity: activity.results,
    generated_at: nowIso(),
  });
});

app.post("/api/cases", async (c) => {
  const body = (await c.req.json()) as Partial<NewCaseInput>;
  const inputError=textFieldsError(body,{patient_name:120,hospital_id:40,working_diagnosis:160,summary:600,city:80,pathway:80,sex:30});
  if(inputError)return c.json({error:inputError},400);
  const patientName = textValue(body.patient_name, 120);
  const hospitalId = textValue(body.hospital_id, 40).toUpperCase();
  const diagnosis = textValue(body.working_diagnosis, 160);
  if (!patientName || !hospitalId || !diagnosis || !body.birth_date) {
    return c.json({ error: "Patient name, hospital ID, birth date, and working diagnosis are required." }, 400);
  }
  const birthDate = textValue(body.birth_date, 10);
  const parsedBirth = new Date(birthDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(parsedBirth.getTime()) || parsedBirth.toISOString().slice(0,10) !== birthDate || parsedBirth > new Date()) return c.json({error:'Enter a valid birth date that is not in the future.'},400);
  const db = c["env"].DB;
  const existing = await db.prepare("SELECT id FROM patients WHERE hospital_id = ?")
    .bind(hospitalId).first<{ id: string }>();
  if (existing) return c.json({ error: "This hospital ID already exists." }, 409);

  const patientId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const timestamp = nowIso();
  const priority = body.priority === "urgent" || body.priority === "high" ? body.priority : "routine";
  await db.batch([
    db.prepare(`INSERT INTO patients (id, hospital_id, name, birth_date, sex, city, synthetic, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)`)
      .bind(patientId, hospitalId, patientName, textValue(body.birth_date, 10), textValue(body.sex, 30) || "Unspecified", textValue(body.city, 80) || "Hungary", timestamp),
    db.prepare(`INSERT INTO cases (id, patient_id, pathway, working_diagnosis, priority, status, coordinator_id, lead_clinician_id, next_milestone, target_date, progress, summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'triage', NULL, NULL, 'Complete clinical intake', ?, 18, ?, ?, ?)`)
      .bind(caseId, patientId, textValue(body.pathway, 80) || "CNS tumour", diagnosis, priority, new Date(Date.now() + 86400000).toISOString(), textValue(body.summary, 600) || "New synthetic referral awaiting clinical triage.", timestamp, timestamp),
    db.prepare("INSERT INTO activity_log (id, case_id, actor, action, detail, occurred_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), caseId, "Workspace coordinator", "Case created", "Synthetic referral entered and assigned for triage.", timestamp),
  ]);
  return c.json({ id: caseId }, 201);
});

app.patch("/api/cases/:id/status", async (c) => {
  const allowed = ["triage", "incomplete", "board-ready", "decision-recorded", "scheduled", "monitoring"];
  const body = (await c.req.json()) as { status?: string };
  if (!body.status || !allowed.includes(body.status)) return c.json({ error: "Invalid case status." }, 400);
  const db = c["env"].DB;
  const timestamp = nowIso();
  const result = await db.prepare("UPDATE cases SET status = ?, updated_at = ? WHERE id = ?")
    .bind(body.status, timestamp, c.req.param("id")).run();
  if (!result.meta.changes) return c.json({ error: "Case not found." }, 404);
  await db.prepare("INSERT INTO activity_log (id, case_id, actor, action, detail, occurred_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), c.req.param("id"), "Workspace coordinator", "Status updated", `Case moved to ${body.status}.`, timestamp).run();
  return c.json({ ok: true });
});

app.post("/api/tasks", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  const inputError=textFieldsError(body,{title:160,description:500,category:60});
  if(inputError)return c.json({error:inputError},400);
  const caseId = textValue(body.case_id, 80);
  const title = textValue(body.title, 160);
  if (!caseId || !title) return c.json({ error: "Case and task title are required." }, 400);
  const db = c["env"].DB;
  const caseRecord = await db.prepare("SELECT id FROM cases WHERE id = ?").bind(caseId).first();
  if (!caseRecord) return c.json({ error: "Case not found." }, 404);
  const owner = textValue(body.owner_id,80);
  if (owner && !await db.prepare('SELECT id FROM team_members WHERE id = ?').bind(owner).first()) return c.json({error:'Team member not found.'},400);
  if (body.due_at && !Number.isFinite(new Date(String(body.due_at)).getTime())) return c.json({error:'Enter a valid due date.'},400);
  if (body.priority && !['routine','high','urgent'].includes(String(body.priority))) return c.json({error:'Invalid task priority.'},400);
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  await db.batch([
    db.prepare(`INSERT INTO tasks (id, case_id, title, description, owner_id, status, priority, due_at, category, created_at)
      VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`)
      .bind(id, caseId, title, textValue(body.description, 500), textValue(body.owner_id, 80) || null, textValue(body.priority, 20) || "routine", textValue(body.due_at, 40) || new Date(Date.now() + 86400000).toISOString(), textValue(body.category, 60) || "Coordination", timestamp),
    db.prepare("INSERT INTO activity_log (id, case_id, actor, action, detail, occurred_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), caseId, "Workspace coordinator", "Task created", title, timestamp),
  ]);
  return c.json({ id }, 201);
});

app.patch("/api/tasks/:id", async (c) => {
  const allowed: TaskStatus[] = ["open", "in-progress", "blocked", "done"];
  const body = (await c.req.json()) as { status?: TaskStatus };
  if (!body.status || !allowed.includes(body.status)) return c.json({ error: "Invalid task status." }, 400);
  const db = c["env"].DB;
  const task = await db.prepare("SELECT case_id, title FROM tasks WHERE id = ?")
    .bind(c.req.param("id")).first<{ case_id: string; title: string }>();
  if (!task) return c.json({ error: "Task not found." }, 404);
  if(body.status!=="done" && await db.prepare("SELECT id FROM decision_steps WHERE task_id=? AND reviewed_at IS NOT NULL").bind(c.req.param("id")).first()) return c.json({error:"Az ellenőrzött tervlépés nem nyitható vissza. A további teendőt új lépésként rögzítsd."},409);
  const completedAt = body.status === "done" ? nowIso() : null;
  const result = await db.batch([
    db.prepare("UPDATE tasks SET status = ?, completed_at = ? WHERE id = ? AND (?='done' OR NOT EXISTS(SELECT 1 FROM decision_steps WHERE task_id=tasks.id AND reviewed_at IS NOT NULL))").bind(body.status, completedAt, c.req.param("id"),body.status),
    db.prepare("INSERT INTO activity_log (id, case_id, actor, action, detail, occurred_at) SELECT ?, ?, ?, ?, ?, ? WHERE changes()>0")
      .bind(crypto.randomUUID(), task.case_id, "Current user", "Task updated", `${task.title}: ${body.status}`, nowIso()),
  ]);
  if(!result[0].meta.changes)return c.json({error:"A feladat időközben ellenőrzötté vált. Frissítsd az oldalt."},409);
  return c.json({ ok: true });
});

app.patch("/api/requirements/:id", async (c) => {
  const allowed: RequirementStatus[] = ["pending", "in-progress", "blocked", "at-risk", "ready", "not-required"];
  const body = (await c.req.json()) as { status?: RequirementStatus };
  if (!body.status || !allowed.includes(body.status)) return c.json({ error: "Invalid requirement status." }, 400);
  const db = c["env"].DB;
  const requirement = await db.prepare("SELECT case_id, label FROM case_requirements WHERE id = ?")
    .bind(c.req.param("id")).first<{ case_id: string; label: string }>();
  if (!requirement) return c.json({ error: "Requirement not found." }, 404);
  const timestamp = nowIso();
  await db.batch([
    db.prepare("UPDATE case_requirements SET status = ?, updated_at = ? WHERE id = ?").bind(body.status, timestamp, c.req.param("id")),
    db.prepare("INSERT INTO activity_log (id, case_id, actor, action, detail, occurred_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), requirement.case_id, "Current user", "Readiness updated", `${requirement.label}: ${body.status}`, timestamp),
  ]);
  return c.json({ ok: true });
});

app.post("/api/decisions", async (c) => {
  const body = (await c.req.json()) as Record<string, unknown>;
  const inputError=textFieldsError(body,{recommendation:1000,rationale:1400,recorded_by:120});
  if(inputError)return c.json({error:inputError},400);
  const caseId = textValue(body.case_id, 80);
  const recommendation = textValue(body.recommendation, 1000);
  const rationale = textValue(body.rationale, 1400);
  if (!caseId || !recommendation || !rationale) {
    return c.json({ error: "Case, recommendation, and rationale are required." }, 400);
  }
  const db = c["env"].DB;
  const timestamp = nowIso();
  const author = textValue(body.recorded_by, 120) || "Current user";
  if (!await db.prepare('SELECT id FROM cases WHERE id = ?').bind(caseId).first()) return c.json({error:'Case not found.'},404);
  await db.batch([
    db.prepare("INSERT INTO board_decisions (id, case_id, recommendation, rationale, recorded_by, decided_at, status) VALUES (?, ?, ?, ?, ?, ?, 'confirmed')")
      .bind(crypto.randomUUID(), caseId, recommendation, rationale, author, timestamp),
    db.prepare("UPDATE cases SET status = 'decision-recorded', progress = 86, next_milestone = 'Coordinate follow-up', updated_at = ? WHERE id = ?").bind(timestamp, caseId),
    db.prepare("INSERT INTO activity_log (id, case_id, actor, action, detail, occurred_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), caseId, author, "Decision recorded", recommendation, timestamp),
  ]);
  return c.json({ ok: true }, 201);
});

app.post("/api/studies/upload", async (c) => {
  const form = await c.req.raw.formData();
  const upload = form.get("file");
  const caseId = textValue(form.get("case_id"), 80);
  const description = textValue(form.get("description"), 160) || "Uploaded imaging study";
  const modality = textValue(form.get("modality"), 12).toUpperCase() || "MR";
  if (!(upload instanceof File) || !caseId) return c.json({ error: "A case and file are required." }, 400);
  if (upload.size > 25 * 1024 * 1024) {
    return c.json({ error: "Local demonstration uploads are limited to 25 MB per file." }, 413);
  }
  const db = c["env"].DB;
  const caseRecord = await db.prepare("SELECT id FROM cases WHERE id = ?").bind(caseId).first();
  if (!caseRecord) return c.json({ error: "Case not found." }, 404);

  const id = crypto.randomUUID();
  const safeName = upload.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `studies/${caseId}/${id}/${safeName}`;
  await c["env"].IMAGING.put(objectKey, upload.stream(), {
    httpMetadata: { contentType: upload.type || "application/dicom" },
    customMetadata: { caseId, studyId: id },
  });
  const timestamp = nowIso();
  await db.batch([
    db.prepare(`INSERT INTO imaging_studies (id, case_id, modality, description, study_date, series_count, status, object_key, file_name, file_size, content_type, created_at)
      VALUES (?, ?, ?, ?, ?, 1, 'uploaded', ?, ?, ?, ?, ?)`)
      .bind(id, caseId, modality, description, timestamp.slice(0, 10), objectKey, upload.name, upload.size, upload.type || "application/dicom", timestamp),
    db.prepare("INSERT INTO activity_log (id, case_id, actor, action, detail, occurred_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), caseId, "Current user", "Study uploaded", `${upload.name} stored in the imaging archive.`, timestamp),
  ]);
  return c.json({ id, file_name: upload.name, file_size: upload.size }, 201);
});

app.get("/api/studies/:id/download", async (c) => {
  const study = await c["env"].DB.prepare("SELECT object_key, file_name, content_type FROM imaging_studies WHERE id = ?")
    .bind(c.req.param("id"))
    .first<{ object_key: string | null; file_name: string | null; content_type: string | null }>();
  if (!study?.object_key) return c.json({ error: "No uploaded file is attached to this study." }, 404);
  const object = await c["env"].IMAGING.get(study.object_key);
  if (!object) return c.json({ error: "Imaging object not found." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", study.content_type || "application/dicom");
  headers.set("ETag", object.httpEtag);
  headers.set('Content-Disposition', 'attachment');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
});

app.notFound((c) => c.json({ error: "API route not found." }, 404));
app.onError((error, c) => {
  if (error instanceof SyntaxError) return c.json({error:'Invalid JSON request.'},400);
  console.error(JSON.stringify({ message: "request_failed", route: c.req.routePath, error: "internal_failure" }));
  return c.json({ error: "The request could not be completed." }, 500);
});

export default app;
