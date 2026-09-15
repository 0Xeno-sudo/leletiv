import {localize as l,recordText,useLanguage} from '../lib/i18n';
import { CalendarDots, Check, Clock, FileText, Plus, UsersThree, WarningCircle } from "@phosphor-icons/react";
import { type FormEvent, useState } from "react";
import { useAppData } from '../lib/workspace';
import { CaseLink, Modal, PageHeader, PriorityBadge, StatusBadge } from "../components/ui";
import { Link } from "react-router-dom";
import { readinessScore } from "../shared/workflow";

export default function BoardPage() {
  useLanguage();
  const { data, addDecision } = useAppData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure,setFailure]=useState("");
  if (!data) return null;
  const queue = data.cases.filter((item) => ["board-ready", "incomplete", "triage"].includes(item.status));
  const selected = data.cases.find((item) => item.id === selectedId);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try { await addDecision({ case_id: selected.id, recommendation: String(form.get("recommendation")), rationale: String(form.get("rationale")), recorded_by: String(form.get("recorded_by")) }); setSelectedId(null); } catch(e) { setFailure(e instanceof Error?e.message:"Could not save decision"); } finally { setSaving(false); }
  };
  return (
    <>
      <PageHeader eyebrow={l("Multidisciplinary review")} title={l("Tumour board")} description={l("Prepare the agenda, surface missing evidence, and capture an accountable decision.")} actions={<span className="small-label">{l(queue.length)}{l(" cases awaiting review")}</span>} />
      <Link className="button secondary" to="/care">Döntések végrehajtásának követése →</Link><section className="board-session-banner"><span className="board-date"><CalendarDots size={22} /></span><div><small>{l("Demonstration session")}</small><strong>{l("Monday, 14 September · 09:30 Budapest")}</strong><p>{l("Conference room 4 · 6 clinical team members")}</p></div><div className="board-participants">{l(data.team.slice(0, 5).map((person) => <span key={person.id} style={{ background: person.color }}>{l(person.initials)}</span>))}<em>{l("+1")}</em></div><Link className="button secondary" to="/team">{l("View clinical team")}</Link></section>
      <div className="board-columns">
        <section className="board-column"><header><span><i className="dot-ready" />{l("Ready for review")}</span><em>{l(queue.filter((item) => item.status === "board-ready").length)}</em></header>{l(queue.filter((item) => item.status === "board-ready").map((item) => <article className="board-card" key={item.id}><div className="board-card-head"><PriorityBadge priority={item.priority} /><span className="readiness-chip"><Check size={13} /> {l(readinessScore(data.requirements.filter((entry) => entry.case_id === item.id)))}{l("% ready")}</span></div><CaseLink item={item} /><p>{recordText(item.summary)}</p><footer><span><FileText size={15} /> {l(data.studies.filter((entry) => entry.case_id === item.id).length)}{l(" studies")}</span><button onClick={() => setSelectedId(item.id)}>{l("Record outcome")}</button></footer></article>))}</section>
        <section className="board-column"><header><span><i className="dot-risk" />{l("Needs attention")}</span><em>{l(queue.filter((item) => item.status !== "board-ready").length)}</em></header>{l(queue.filter((item) => item.status !== "board-ready").map((item) => <article className="board-card" key={item.id}><div className="board-card-head"><PriorityBadge priority={item.priority} /><span className="readiness-chip risk"><WarningCircle size={13} /> {l(readinessScore(data.requirements.filter((entry) => entry.case_id === item.id)))}{l("% ready")}</span></div><CaseLink item={item} /><p>{recordText(item.summary)}</p><div className="blocker-line"><WarningCircle size={15} /><span>{l(data.requirements.find((entry) => entry.case_id === item.id && ["blocked", "pending"].includes(entry.status))?.label ?? "Clinical intake in progress")}</span></div><footer><span><Clock size={15} /> {recordText(item.next_milestone)}</span><StatusBadge status={item.status} /></footer></article>))}</section>
        <section className="board-column"><header><span><i className="dot-complete" />{l("Recent decisions")}</span><em>{l(data.decisions.length)}</em></header>{l(data.decisions.map((decision) => { const item = data.cases.find((entry) => entry.id === decision.case_id); return item && <article className="board-card decision-card" key={decision.id}><CaseLink item={item} /><blockquote>{recordText(decision.recommendation)}</blockquote><footer><span>{l(decision.recorded_by)}</span><StatusBadge status="confirmed" /></footer></article>; }))}</section>
      </div>
      {l(selected && <Modal title={l("Record board decision")} description={l(`${selected.patient_name} · ${selected.hospital_id}`)} onClose={() => setSelectedId(null)}><form className="form-grid" onSubmit={submit}>{l(failure&&<p className="mutation-error" role="alert">{l(failure)}</p>)}<label className="span-two"><span>{l("Recommendation")}</span><textarea name="recommendation" rows={3} required placeholder={l("Record the agreed clinical recommendation")} /></label><label className="span-two"><span>{l("Rationale")}</span><textarea name="rationale" rows={4} required placeholder={l("Summarise the evidence and discussion")} /></label><label className="span-two"><span>{l("Recorded by")}</span><input name="recorded_by" defaultValue={l("Dr. Lilla Tóth")} required /></label><div className="form-actions span-two"><button type="button" className="button secondary" onClick={() => setSelectedId(null)}>{l("Cancel")}</button><button className="button primary" disabled={saving}>{l(saving ? "Recording..." : "Confirm decision")}</button></div></form></Modal>)}
    </>
  );
}
