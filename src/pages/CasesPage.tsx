import {localize as l,recordText,useLanguage} from '../lib/i18n';
import { Funnel, MagnifyingGlass, Plus, Rows, SquaresFour } from "@phosphor-icons/react";
import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from '../lib/workspace';
import { Modal, PageHeader, PriorityBadge, StatusBadge, formatDate } from "../components/ui";
import { calculateAge } from "../shared/workflow";
import type { CaseStatus, NewCaseInput, Priority } from "../shared/types";

const initialCase: NewCaseInput = { patient_name: "", hospital_id: "", birth_date: "", sex: "Female", city: "Budapest", pathway: "CNS tumour", working_diagnosis: "", priority: "routine", summary: "" };

export default function CasesPage() {
  const language=useLanguage();
  const { data, loading, addCase } = useAppData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CaseStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewCaseInput>(initialCase);
  const [saving, setSaving] = useState(false);
  const [formError,setFormError] = useState('');
  const [view,setView] = useState<'table'|'board'>('table');
  const navigate = useNavigate();
  const filtered = useMemo(() => (data?.cases ?? []).filter((item) => {
    const matchesQuery = l(`${item.patient_name} ${item.hospital_id} ${item.working_diagnosis} ${item.pathway}`).toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || item.status === status);
  }), [data, query, status, language]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const id = await addCase(form);
      setModalOpen(false);
      setForm(initialCase);
      navigate(`/cases/${id}`);
    } catch(e) { setFormError(e instanceof Error?e.message:'Could not create case'); } finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader eyebrow={l("Case management")} title={l("Patient pathways")} description={l("Coordinate every dependency from referral to decision and treatment.")} actions={<button className="button primary" onClick={() => setModalOpen(true)}><Plus size={17} />{l(" New synthetic case")}</button>} />
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="view-tabs"><button className={view==='table'?'active':''} onClick={()=>setView('table')} aria-pressed={view==='table'}><Rows size={17} />{l(" Table")}</button><button className={view==='board'?'active':''} onClick={()=>setView('board')} aria-pressed={view==='board'}><SquaresFour size={17} />{l(" Board")}</button></div>
          <label className="search-field"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={l("Search pathways")} /></label>
        </div>
        <div className="filter-row"><Funnel size={17} /><select value={status} onChange={(event) => setStatus(event.target.value as CaseStatus | "all")}><option value="all">{l("All statuses")}</option><option value="triage">{l("Triage")}</option><option value="incomplete">{l("Incomplete")}</option><option value="board-ready">{l("Board ready")}</option><option value="decision-recorded">{l("Decision recorded")}</option><option value="scheduled">{l("Scheduled")}</option><option value="monitoring">{l("Monitoring")}</option></select><span>{l(filtered.length)}{l(" pathways")}</span></div>
        {l(view==='board' ? <div className="case-board">{l(['triage','incomplete','board-ready','decision-recorded','scheduled','monitoring'].map(stage=><section key={stage}><h3>{l(stage.replaceAll('-',' '))}{l(" · ")}{l(filtered.filter(c=>c.status===stage).length)}</h3>{l(filtered.filter(c=>c.status===stage).map(c=><Link key={c.id} to={`/cases/${c.id}`}><strong>{recordText(c.patient_name)}</strong><small>{recordText(c.working_diagnosis)}</small><small>{recordText(c.next_milestone)}</small></Link>))}</section>))}</div> : <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>{l("Patient")}</th><th>{l("Pathway")}</th><th>{l("Priority")}</th><th>{l("Status")}</th><th>{l("Lead")}</th><th>{l("Next milestone")}</th><th>{l("Progress")}</th></tr></thead>
            <tbody>{l(!loading && filtered.map((item) => <tr key={item.id} onClick={() => navigate(`/cases/${item.id}`)}>
              <td><Link className="patient-cell" to={`/cases/${item.id}`}><span className="patient-monogram">{l(item.patient_name.split(" ").map((part) => part[0]).join("").slice(0, 2))}</span><span><strong>{recordText(item.patient_name)}</strong><small>{l(item.hospital_id)}{l(" · ")}{l(calculateAge(item.birth_date))}{l(" years")}</small></span></Link></td>
              <td><strong className="regular-weight">{l(item.pathway)}</strong><small>{recordText(item.working_diagnosis)}</small></td>
              <td><PriorityBadge priority={item.priority} /></td><td><StatusBadge status={item.status} /></td><td>{l(item.lead_clinician_name)}</td>
              <td><strong className="regular-weight">{recordText(item.next_milestone)}</strong><small>{l(formatDate(item.target_date, true))}</small></td>
              <td><div className="table-progress"><span><i style={{ width: `${item.progress}%` }} /></span><small>{l(item.progress)}{l("%")}</small></div></td>
            </tr>))}</tbody>
          </table>
          {l(!loading && filtered.length === 0 && <div className="empty-state"><strong>{l("No matching pathways")}</strong><p>{l("Adjust your search or status filter.")}</p></div>)}
        </div>)}
      </section>
      {l(modalOpen && <Modal title={l("Create synthetic case")} description={l("Portfolio mode never uses real patient information.")} onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          {l(formError&&<p className="mutation-error" role="alert">{l(formError)}</p>)}
          <label><span>{l("Patient name")}</span><input required value={form.patient_name} onChange={(event) => setForm({ ...form, patient_name: event.target.value })} placeholder={l("Synthetic name")} /></label>
          <label><span>{l("Hospital ID")}</span><input required value={form.hospital_id} onChange={(event) => setForm({ ...form, hospital_id: event.target.value })} placeholder={l("NF-260300")} /></label>
          <label><span>{l("Birth date")}</span><input type="date" required value={form.birth_date} onChange={(event) => setForm({ ...form, birth_date: event.target.value })} /></label>
          <label><span>{l("Sex")}</span><select value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })}><option value="Female">{l("Female")}</option><option value="Male">{l("Male")}</option><option value="Unspecified">{l("Unspecified")}</option></select></label>
          <label><span>{l("City")}</span><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
          <label><span>{l("Pathway")}</span><select value={form.pathway} onChange={(event) => setForm({ ...form, pathway: event.target.value })}><option value="CNS tumour">{l("CNS tumour")}</option><option value="CNS metastasis">{l("CNS metastasis")}</option><option value="Pituitary pathway">{l("Pituitary pathway")}</option><option value="Surveillance">{l("Surveillance")}</option></select></label>
          <label className="span-two"><span>{l("Working diagnosis")}</span><input required value={form.working_diagnosis} onChange={(event) => setForm({ ...form, working_diagnosis: event.target.value })} placeholder={l("Clinical working diagnosis")} /></label>
          <label><span>{l("Priority")}</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}><option value="routine">{l("Routine")}</option><option value="high">{l("High")}</option><option value="urgent">{l("Urgent")}</option></select></label>
          <label className="span-two"><span>{l("Referral summary")}</span><textarea rows={3} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></label>
          <div className="form-actions span-two"><button type="button" className="button secondary" onClick={() => setModalOpen(false)}>{l("Cancel")}</button><button className="button primary" disabled={saving}>{l(saving ? "Creating..." : "Create pathway")}</button></div>
        </form>
      </Modal>)}
    </>
  );
}
