import {localize as l,recordText,useLanguage,getLanguage} from '../lib/i18n';
import { Brain, CalendarBlank, CheckCircle, Clock, Plus, User } from "@phosphor-icons/react";
import { lazy, Suspense, type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppData } from '../lib/workspace';
import { BackLink, EmptyState, Modal, PersonAvatar, PriorityBadge, StatusBadge, formatDate } from "../components/ui";
import { calculateAge, readinessScore } from "../shared/workflow";
import type { CaseStatus, RequirementStatus, TaskStatus } from "../shared/types";
import {FollowupSummary} from '../components/FollowupSummary';


export default function CaseDetailPage() {
  useLanguage();
  const { caseId } = useParams();
  const { data, setCaseStatus, setRequirementStatus, setTaskStatus, addTask } = useAppData();
  const [taskOpen, setTaskOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState('');
  const item = data?.cases.find((entry) => entry.id === caseId);
  if (!data || !item) return <EmptyState title={l("Case not found")} text={l("The requested pathway is not available in this workspace.")} />;
  const tasks = data.tasks.filter((entry) => entry.case_id === item.id);
  const requirements = data.requirements.filter((entry) => entry.case_id === item.id);
  const studies = data.studies.filter((entry) => entry.case_id === item.id);
  const decisions = data.decisions.filter((entry) => entry.case_id === item.id);
  const score = readinessScore(requirements);

  const submitTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFailure('');
    try {
      await addTask({ case_id: item.id, title: String(form.get("title")), description: String(form.get("description")), owner_id: String(form.get("owner_id")), priority: String(form.get("priority")), due_at: new Date(String(form.get("due_at"))).toISOString(), category: String(form.get("category")) });
      setTaskOpen(false);
    } catch (error) { setFailure(error instanceof Error ? error.message : 'Could not save task.'); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="case-back-row"><Link className="button primary" to={`/care?case=${caseId}`}>Végrehajtási terv és várt vizsgálatok</Link><BackLink to="/cases">{l("Patient pathways")}</BackLink><Link className="button secondary" to={`/cases/${caseId}/brief`}>{l("Handoff brief")}</Link></div>
      {l(failure && <p className="error-banner" role="alert">{l(failure)}</p>)}
      <div className="case-detail-header">
        <div><div className="case-title-row"><h1>{recordText(item.patient_name)}</h1><PriorityBadge priority={item.priority} /><StatusBadge status={item.status} /></div><p>{l(item.hospital_id)}{l(" · ")}{l(calculateAge(item.birth_date))}{l(" years · ")}{l(item.sex)}{l(" · ")}{l(item.city)}</p></div>
        <label className="status-control"><span>{l("Pathway status")}</span><select value={item.status} onChange={(event) => void setCaseStatus(item.id, event.target.value as CaseStatus).catch(() => {})}><option value="triage">{l("Triage")}</option><option value="incomplete">{l("Incomplete")}</option><option value="board-ready">{l("Board ready")}</option><option value="decision-recorded">{l("Decision recorded")}</option><option value="scheduled">{l("Scheduled")}</option><option value="monitoring">{l("Monitoring")}</option></select></label>
      </div>
      <div className="case-summary-strip">
        <div><Brain size={18} /><span><small>{l("Working diagnosis")}</small><strong>{recordText(item.working_diagnosis)}</strong></span></div>
        <div><User size={18} /><span><small>{l("Lead clinician")}</small><strong>{l(item.lead_clinician_name)}</strong></span></div>
        <div><CalendarBlank size={18} /><span><small>{l("Next milestone")}</small><strong>{recordText(item.next_milestone)}</strong></span></div>
        <div><Clock size={18} /><span><small>{l("Target")}</small><strong>{l(formatDate(item.target_date, true))}</strong></span></div>
      </div>
      <div className="case-workspace-grid">
        <div className="span-two"><FollowupSummary caseId={item.id}/></div>
        <section className="panel case-overview"><header className="panel-header"><div><h2>{l("Clinical overview")}</h2><p>{l(item.pathway)}</p></div></header><p className="clinical-summary">{recordText(item.summary)}</p><div className="readiness-bar"><div><strong>{l("Recorded pathway progress")}</strong><span>{l(item.progress)}{l("%")}</span></div><span><i style={{ width: `${item.progress}%` }} /></span></div></section>
        <section className="panel case-readiness"><header className="panel-header"><div><h2>{l("Decision readiness")}</h2><p>{l("Workflow completeness · illustrative weighted score")}</p></div><strong className="large-score">{l(score)}{l("%")}</strong></header><div className="requirement-list">{l(requirements.map((entry) => <div key={entry.id}><span><strong>{l(entry.label)}</strong><small>{l(entry.category)}{l(" · ")}{l(entry.owner_name ?? "Unassigned")}</small></span><select aria-label={l(`Readiness for ${entry.label}`)} value={entry.status} onChange={(event) => void setRequirementStatus(entry.id, event.target.value as RequirementStatus).catch(() => {})}><option value="pending">{l("Pending")}</option><option value="in-progress">{l("In progress")}</option><option value="blocked">{l("Blocked")}</option><option value="at-risk">{l("At risk")}</option><option value="ready">{l("Ready")}</option><option value="not-required">{l("Not required")}</option></select></div>))}</div></section>
        <section className="panel imaging-preview"><header className="panel-header"><div><h2>{l("Imaging context")}</h2><p>{l(studies.length)}{l(" linked studies")}</p></div></header><div className="scan-context-card"><Brain size={32}/><h3>{l("From source images to spatial context")}</h3><p>{l("Open a scan volume and its segmentation in the dedicated 3D workspace. No generic model is attached to this patient.")}</p><Link className="button secondary" to="/volume-lab">{l("Open 3D scan lab")}</Link></div></section>
        <section className="panel case-tasks"><header className="panel-header"><div><h2>{l("Case tasks")}</h2><p>{l(tasks.filter((entry) => entry.status !== "done").length)}{l(" open actions")}</p></div><button className="button compact secondary" onClick={() => setTaskOpen(true)}><Plus size={15} />{l(" Add task")}</button></header><div className="task-detail-list">{l(tasks.map((task) => { const person = data.team.find((member) => member.id === task.owner_id); return <div key={task.id}><PersonAvatar person={person} size="small" /><span><strong>{recordText(task.title)}</strong><small>{l(formatDate(task.due_at, true))}{l(" · ")}{l(task.category)}</small></span><select aria-label={l(`Status for ${task.title}`)} value={task.status} onChange={(event) => void setTaskStatus(task.id, event.target.value as TaskStatus).catch(() => {})}><option value="open">{getLanguage()==="hu"?"Nyitott":"Open"}</option><option value="in-progress">{l("In progress")}</option><option value="blocked">{l("Blocked")}</option><option value="done">{l("Done")}</option></select></div>; }))}</div></section>
        <section className="panel decision-history"><header className="panel-header"><div><h2>{l("Decision record")}</h2><p>{l("Multidisciplinary outcome")}</p></div></header>{l(decisions.length ? decisions.map((decision) => <article key={decision.id}><CheckCircle size={21} /><div><strong>{recordText(decision.recommendation)}</strong><p>{recordText(decision.rationale)}</p><small>{l(decision.recorded_by)}{l(" · ")}{l(formatDate(decision.decided_at, true))}</small></div></article>) : <EmptyState title={l("No decision recorded")} text={l("This case has not completed board review.")} />)}</section>
      </div>
      {l(taskOpen && <Modal title={l("Add coordination task")} onClose={() => setTaskOpen(false)}><form className="form-grid" onSubmit={submitTask}>{l(failure && <p className="mutation-error span-two" role="alert">{l(failure)}</p>)}<label className="span-two"><span>{l("Task title")}</span><input name="title" required /></label><label className="span-two"><span>{l("Description")}</span><textarea name="description" rows={3} /></label><label><span>{l("Owner")}</span><select name="owner_id"><option value="">{l("Unassigned")}</option>{l(data.team.map((member) => <option key={member.id} value={member.id}>{l(member.name)}</option>))}</select></label><label><span>{l("Priority")}</span><select name="priority"><option value="routine">{l("Routine")}</option><option value="high">{l("High")}</option><option value="urgent">{l("Urgent")}</option></select></label><label><span>{l("Due date")}</span><input name="due_at" type="datetime-local" required /></label><label><span>{l("Category")}</span><input name="category" defaultValue={l("Coordination")} /></label><div className="form-actions span-two"><button type="button" className="button secondary" onClick={() => setTaskOpen(false)}>{l("Cancel")}</button><button className="button primary" disabled={saving}>{l(saving ? "Saving..." : "Add task")}</button></div></form></Modal>)}
    </>
  );
}
