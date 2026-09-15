import {useState} from 'react';
import {apiRequest} from '../lib/api';
import {localize as l,useLanguage} from '../lib/i18n';
import { CheckCircle, Clock, DotsThree, UsersThree } from "@phosphor-icons/react";
import { useAppData } from '../lib/workspace';
import { PageHeader, PersonAvatar, StatusBadge } from "../components/ui";

export default function TeamPage() {
  useLanguage();
  const { data, reload } = useAppData();
  const [saving,setSaving]=useState(false);const [error,setError]=useState('');
  if (!data) return null;
  return (
    <>
      <PageHeader eyebrow={l("People and ownership")} title={l("Clinical team")} description={l("See role coverage, availability, and assigned work across the pathway.")} actions={<div className="team-summary"><UsersThree size={18} /> {l(data.team.length)}{l(" active members")}</div>} />
      <section className="care-panel" style={{marginBottom:24}}><h2>{l('Add team member')}</h2><p>{l('Use fictional names in this research workspace.')}</p><form className="care-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const values=new FormData(form);setSaving(true);setError('');try{await apiRequest('/api/team',{method:'POST',body:JSON.stringify(Object.fromEntries(values))});await reload();form.reset();}catch(err){setError(err instanceof Error?err.message:'Save failed');}finally{setSaving(false);}}}><label>{l('Name')}<input name="name" required maxLength={120}/></label><label>{l('Role')}<input name="role" required maxLength={100}/></label><label>{l('Specialty')}<input name="specialty" required maxLength={100}/></label><button className="button primary" disabled={saving}>{l(saving?'Saving…':'Add team member')}</button></form>{error&&<p role="alert">{l(error)}</p>}</section>
      <section className="panel team-table-panel"><div className="team-table-head"><span>{l("Team member")}</span><span>{l("Role and specialty")}</span><span>{l("Recorded availability")}</span><span>{l("Open work")}</span><span>{l("Completion")}</span><span /></div>{l(data.team.map((person) => { const tasks = data.tasks.filter((task) => task.owner_id === person.id); const done = tasks.filter((task) => task.status === "done").length; const rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0; return <div className="team-row" key={person.id}><div><PersonAvatar person={person} size="normal" /><span><strong>{l(person.name)}</strong><small>{l("Central Neuro Centre")}</small></span></div><span><strong>{l(person.role)}</strong><small>{l(person.specialty)}</small></span><span><StatusBadge status={person.availability} /></span><span className="work-count"><Clock size={16} /> {l(tasks.filter((task) => task.status !== "done").length)}{l(" tasks")}</span><span className="completion-cell"><span><i style={{ width: `${rate}%` }} /></span><em>{l(tasks.length ? `${rate}%` : "—")}</em></span></div>; }))}</section>
      <div className="team-insight-grid"><section className="panel"><header className="panel-header"><div><h2>{l("Role coverage")}</h2><p>{l("Recorded assignments · not a live staffing rota")}</p></div></header><div className="coverage-list">{l(data.team.map(person => <div key={person.id}><span><strong>{l(person.role)}</strong><small>{l(person.name)}{l(" · ")}{l(person.availability.replaceAll("-"," "))}</small></span></div>))}</div></section><section className="panel workload-panel"><header className="panel-header"><div><h2>{l("Workload distribution")}</h2><p>{l("Open tasks by owner")}</p></div></header>{l(data.team.map((person) => { const count = data.tasks.filter((task) => task.owner_id === person.id && task.status !== "done").length; return <div className="workload-row" key={person.id}><span>{l(person.name)}</span><div><i style={{ width: `${count / Math.max(1, ...data.team.map(p => data.tasks.filter(t => t.owner_id === p.id && t.status !== "done").length)) * 100}%` }} /></div><strong>{l(count)}</strong></div>; }))}</section></div>
    </>
  );
}
