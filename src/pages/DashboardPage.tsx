import {localize as l,recordText,useLanguage,locale} from '../lib/i18n';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAppData } from '../lib/workspace';
import { PageHeader, StatusBadge, PriorityBadge, formatDate } from '../components/ui';
import { caseStatusLabels } from '../shared/workflow';
import type { CaseStatus } from '../shared/types';
import {FollowupSummary} from '../components/FollowupSummary';

const pathwayStages:CaseStatus[]=['triage','incomplete','board-ready','decision-recorded','scheduled','monitoring'];
export default function DashboardPage(){
  useLanguage();
 const {data}=useAppData();const [selected,setSelected]=useState<CaseStatus|null>(null);
 if(!data)return null;
 const blocked=data.requirements.filter(r=>r.status==='blocked'||r.status==='at-risk');
 const open=data.tasks.filter(t=>t.status!=='done');
 const exceptions=selected?data.cases.filter(c=>c.status===selected):data.cases.filter(c=>c.status!=='monitoring');
 return <>
  <PageHeader title={l("Welcome to Leletív")} description={l("The full pathway. Every dependency. A clear next step.")} actions={<Link className="button secondary" to="/scenarios">{l("Explore capacity lab ")}<ArrowUpRight size={15}/></Link>}/>
  <div className="overview-meta"><span>{l("Central Neuro Centre")}</span><span>{l(new Intl.DateTimeFormat(locale(),{day:'numeric',month:'long',year:'numeric'}).format(new Date()))}</span><span>{l("Synthetic dataset")}</span></div>
  <section className="overview-numbers" aria-label={l("Operational summary")}>
   {l([['Active pathways',data.cases.filter(c=>c.status!=='monitoring').length,'Across all clinical stages'],['Ready for board',data.cases.filter(c=>c.status==='board-ready').length,'Prepared for multidisciplinary review'],['Open actions',open.length,`${open.filter(t=>!t.owner_id).length} awaiting an owner`],['Blocked dependencies',blocked.length,'Requires coordination']].map(([label,count,detail])=><div key={label}><span>{l(label)}</span><strong>{l(count)}</strong><small>{l(detail)}</small></div>))}
  </section>
  <FollowupSummary/>
  <section className="pathway-section"><div className="section-heading"><div><h2>{l("Pathway flow")}</h2><p>{l("Follow the queue from referral to surveillance.")}</p></div><button className="text-button" onClick={()=>setSelected(null)} disabled={!selected}>{l("Show all")}</button></div><div className="pathway-flow">{l(pathwayStages.map((stage,i)=>{const list=data.cases.filter(c=>c.status===stage);return <button key={stage} aria-pressed={selected===stage} className={selected===stage?'selected':''} onClick={()=>setSelected(selected===stage?null:stage)}><div><span className="stage-index">{l("0")}{l(i+1)}</span>{l(i<5&&<ArrowRight size={14}/>)}</div><strong>{l(list.length.toString().padStart(2,'0'))}</strong><span>{l(caseStatusLabels[stage])}</span><div className="flow-markers">{l(list.slice(0,12).map(c=><i key={c.id}/>))}</div></button>;}))}</div></section>
  <div className="overview-detail-grid"><section className="overview-pathways"><div className="section-heading"><h2>{l(selected?caseStatusLabels[selected]:'Active pathways')} <span>{l(exceptions.length)}</span></h2><Link to="/cases">{l("All pathways ")}<ArrowUpRight size={14}/></Link></div><div className="data-table-wrap"><table className="data-table overview-table"><thead><tr><th>{l("Patient")}</th><th>{l("Status")}</th><th>{l("Next milestone")}</th><th>{l("Priority")}</th></tr></thead><tbody>{l(exceptions.map(c=><tr key={c.id}><td><Link to={`/cases/${c.id}`}><strong>{recordText(c.patient_name)}</strong><small>{l(c.hospital_id)}</small></Link></td><td><StatusBadge status={c.status}/></td><td>{recordText(c.next_milestone)}<small>{l(formatDate(c.target_date))}</small></td><td><PriorityBadge priority={c.priority}/></td></tr>))}</tbody></table></div>{l(!exceptions.length&&<p className="empty-state">{l("No pathways at this stage.")}</p>)}</section>
  <aside className="attention-list"><div className="section-heading"><h2>{l("Needs attention")}</h2><span>{l(blocked.length)}</span></div>{l(blocked.map(r=>{const c=data.cases.find(c=>c.id===r.case_id);return <Link to={`/cases/${r.case_id}`} key={r.id}><span className="attention-dot"/><div><strong>{l(r.label)}</strong><p>{recordText(c?.patient_name)}{l(" · ")}{l(r.owner_name??'Unassigned')}</p><small>{l(r.category)}{l(" dependency")}</small></div><ArrowUpRight size={14}/></Link>}))}<div className="lab-teaser"><span className="small-label">{l("Scenario planning")}</span><h3>{l("What if the MRI goes offline?")}</h3><p>{l("Model the knock-on effect on queues, throughput and recovery capacity.")}</p><Link to="/scenarios">{l("Test a scenario ")}<ArrowRight size={14}/></Link></div></aside></div>
  <section className="overview-activity"><div className="section-heading"><h2>{l("Recent changes")}</h2><span>{l("Workspace audit trail")}</span></div>{l(data.activity.slice(0,4).map(a=><div key={a.id}><span className="audit-dot"/><span><strong>{l(a.action)}</strong><p>{l(a.detail)}</p></span><small>{l(a.actor)}</small><time>{l(formatDate(a.occurred_at,true))}</time></div>))}</section>
 </>;
}
