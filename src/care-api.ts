import {Hono} from 'hono';
import {examTransitions,requiredText,validDate} from './shared/care';
const api=new Hono<{Bindings:WorkerBindings}>();
const now=()=>new Date().toISOString();
api.get('/cases/:id',async c=>{
 const db=c['env'].DB,id=c.req.param('id');
 const r=await db.batch([
 db.prepare('SELECT s.*,t.title,t.status,t.due_at,m.name owner_name FROM decision_steps s JOIN tasks t ON t.id=s.task_id JOIN board_decisions d ON d.id=s.decision_id LEFT JOIN team_members m ON m.id=t.owner_id WHERE d.case_id=? ORDER BY s.created_at').bind(id),
 db.prepare('SELECT e.*,m.name owner_name FROM expected_exams e JOIN team_members m ON m.id=e.owner_id WHERE e.case_id=? ORDER BY e.due_date').bind(id),
 db.prepare('SELECT a.*,s.description,s.study_date FROM scan_analyses a JOIN imaging_studies s ON s.id=a.study_id WHERE s.case_id=? ORDER BY a.created_at DESC').bind(id),
 db.prepare('SELECT v.* FROM exam_events v JOIN expected_exams e ON e.id=v.exam_id WHERE e.case_id=? ORDER BY v.occurred_at DESC').bind(id),
 db.prepare("SELECT id,title FROM review_documents WHERE case_id=? AND dataset='workspace'").bind(id)
 ]);return c.json({steps:r[0].results,exams:r[1].results,analyses:r[2].results,events:r[3].results,documents:r[4].results});
});
api.post('/decisions/:id/steps',async c=>{
 const b=await c.req.json(),db=c['env'].DB,decision=c.req.param('id');
 if(!requiredText(b.title,160)||!requiredText(b.expected_result)||!validDate(b.due_date)||!requiredText(b.owner_id,80))return c.json({error:'Cím, elvárt eredmény, felelős és érvényes határidő szükséges.'},400);
 const d=await db.prepare('SELECT case_id FROM board_decisions WHERE id=?').bind(decision).first<{case_id:string}>();
 if(!d)return c.json({error:'A döntés nem található.'},404);
 if(!await db.prepare('SELECT id FROM team_members WHERE id=?').bind(b.owner_id).first())return c.json({error:'A felelős nem található.'},400);
 const prerequisite=b.prerequisite_id||null;
 if(prerequisite&&!await db.prepare('SELECT id FROM decision_steps WHERE id=? AND decision_id=?').bind(prerequisite,decision).first())return c.json({error:'Az előfeltételnek ugyanahhoz a döntéshez kell tartoznia.'},400);
 const id=crypto.randomUUID(),task=crypto.randomUUID(),date=now();
 await db.batch([
 db.prepare("INSERT INTO tasks(id,case_id,title,description,owner_id,status,priority,due_at,category,created_at) VALUES(?,?,?,?,?,'open','routine',?,'Onkoteam végrehajtási terv',?)").bind(task,d.case_id,b.title,b.expected_result,b.owner_id,b.due_date+'T12:00:00.000Z',date),
 db.prepare('INSERT INTO decision_steps(id,decision_id,task_id,prerequisite_id,expected_result,created_at) VALUES(?,?,?,?,?,?)').bind(id,decision,task,prerequisite,b.expected_result,date),
 db.prepare('INSERT INTO activity_log(id,case_id,actor,action,detail,occurred_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),d.case_id,'Koordinátor','Végrehajtási lépés rögzítve',b.title,date)
 ]);return c.json({id,task_id:task},201);
});
api.post('/steps/:id/review',async c=>{
 const b=await c.req.json(),db=c['env'].DB;
 if(!requiredText(b.note)||!requiredText(b.actor_id,80))return c.json({error:'Eredmény és ellenőrző személy szükséges.'},400);
 if(!await db.prepare('SELECT id FROM team_members WHERE id=?').bind(b.actor_id).first())return c.json({error:'Ismeretlen ellenőrző.'},400);
 const r=await db.prepare(`UPDATE decision_steps SET result_note=?,reviewed_by=?,reviewed_at=? WHERE id=? AND reviewed_at IS NULL AND EXISTS(SELECT 1 FROM tasks WHERE tasks.id=decision_steps.task_id AND status='done') AND (prerequisite_id IS NULL OR EXISTS(SELECT 1 FROM decision_steps p WHERE p.id=decision_steps.prerequisite_id AND p.reviewed_at IS NOT NULL))`).bind(b.note,b.actor_id,now(),c.req.param('id')).run();
 if(!r.meta.changes)return c.json({error:'Előbb zárd le a feladatot és ellenőrizd az előfeltételét. A már ellenőrzött eredmény nem írható felül.'},409);
 return c.json({ok:true});
});
api.post('/cases/:id/exams',async c=>{
 const b=await c.req.json(),db=c['env'].DB,id=crypto.randomUUID(),date=now();
 if(!requiredText(b.title,160)||!validDate(b.due_date)||!requiredText(b.owner_id,80))return c.json({error:'Vizsgálat, felelős és leletvárási határidő szükséges.'},400);
 if(!await db.prepare('SELECT id FROM cases WHERE id=?').bind(c.req.param('id')).first()||!await db.prepare('SELECT id FROM team_members WHERE id=?').bind(b.owner_id).first())return c.json({error:'Az eset vagy felelős nem található.'},400);
 await db.batch([db.prepare("INSERT INTO expected_exams(id,case_id,title,owner_id,due_date,status,created_at,updated_at) VALUES(?,?,?,?,?,'requested',?,?)").bind(id,c.req.param('id'),b.title,b.owner_id,b.due_date,date,date),db.prepare("INSERT INTO exam_events(id,exam_id,status,note,actor_id,occurred_at) VALUES(?,?,'requested','Vizsgálat nyilvántartásba véve',?,?)").bind(crypto.randomUUID(),id,b.owner_id,date)]);return c.json({id},201);
});
api.patch('/exams/:id',async c=>{
 const b=await c.req.json(),db=c['env'].DB,id=c.req.param('id');
 const e=await db.prepare('SELECT * FROM expected_exams WHERE id=?').bind(id).first<{status:string;case_id:string;version:number}>();
 if(!e)return c.json({error:'Vizsgálat nem található.'},404);
 if(b.version!==e.version||!examTransitions[e.status]?.includes(b.status))return c.json({error:'Az állapot megváltozott vagy a lépés nem megengedett. Frissítsd az oldalt.'},409);
 if(!requiredText(b.actor_id,80)||!requiredText(b.note)||!await db.prepare('SELECT id FROM team_members WHERE id=?').bind(b.actor_id).first())return c.json({error:'Érvényes rögzítő és megjegyzés szükséges.'},400);
 if((b.status==='scheduled'||b.appointment_date)&&!validDate(b.appointment_date))return c.json({error:'Érvényes vizsgálati időpont szükséges.'},400);
 for(const [field,table] of [['study_id','imaging_studies'],['document_id','review_documents']] as const){if(b[field]&&!await db.prepare(`SELECT id FROM ${table} WHERE id=? AND case_id=?${field==='document_id'?" AND dataset='workspace'":""}`).bind(b[field],e.case_id).first())return c.json({error:'Csak az esethez tartozó eredmény kapcsolható.'},400);}
 if(b.status==='received'&&!b.study_id&&!b.document_id)return c.json({error:'Kapcsold a beérkezett vizsgálatot vagy leletet.'},400);
 const date=now();
 const r=await db.batch([
 db.prepare('INSERT INTO exam_events(id,exam_id,status,note,actor_id,occurred_at) SELECT ?,id,?,?,?,? FROM expected_exams WHERE id=? AND version=?').bind(crypto.randomUUID(),b.status,b.note,b.actor_id,date,id,b.version),
 db.prepare('UPDATE expected_exams SET status=?,note=?,appointment_date=COALESCE(?,appointment_date),study_id=COALESCE(?,study_id),document_id=COALESCE(?,document_id),version=version+1,updated_at=? WHERE id=? AND version=?').bind(b.status,b.note,b.appointment_date||null,b.study_id||null,b.document_id||null,date,id,b.version)
 ]);if(!r[1].meta.changes)return c.json({error:'Egy másik módosítás megelőzte ezt. Frissítsd az oldalt.'},409);return c.json({ok:true});
});
export {api as careApi};
