import {localize as l,recordText,useLanguage} from '../lib/i18n';
import {useParams,Link} from 'react-router-dom';
import {useAppData} from '../lib/workspace';
import {PageHeader,EmptyState,StatusBadge,formatDate} from '../components/ui';
import {calculateAge} from '../shared/workflow';
import {FollowupSummary} from '../components/FollowupSummary';
export default function BriefPage(){
  useLanguage();
 const {caseId}=useParams();const {data}=useAppData();const item=data?.cases.find(c=>c.id===caseId);
 if(!data||!item)return <EmptyState title={l("Case not found")} text={l("The requested pathway is not available in this workspace.")}/>;
 const tasks=data.tasks.filter(t=>t.case_id===caseId&&t.status!=='done');const requirements=data.requirements.filter(r=>r.case_id===caseId);const decisions=data.decisions.filter(d=>d.case_id===caseId);const studies=data.studies.filter(s=>s.case_id===caseId);
 return <div className="handoff-page"><PageHeader title={l("Case handoff brief")} description={l("A concise, source-based handover for the next team.")} actions={<><Link className="button secondary" to={`/cases/${caseId}`}>{l("Back to pathway")}</Link><button className="button primary" onClick={()=>window.print()}>{l("Print / save PDF")}</button></>}/><article className="handoff-document">
 <header><span className="section-kicker">{l("Synthetic demonstration")}</span><h1>{recordText(item.patient_name)}</h1><p>{l(item.hospital_id)}{l(" · ")}{l(calculateAge(item.birth_date))}{l(" years · ")}{l(item.sex)}</p><StatusBadge status={item.status}/></header>
 <section><h2>{l("Situation")}</h2><h3>{recordText(item.working_diagnosis)}</h3><p>{recordText(item.summary)}</p><div className="handoff-pair"><span>{l("Lead clinician")}<strong>{l(item.lead_clinician_name)}</strong></span><span>{l("Coordinator")}<strong>{l(item.coordinator_name)}</strong></span></div></section>
 <section><h2>{l("Next milestone")}</h2><p>{recordText(item.next_milestone)}{l(" · ")}{l(formatDate(item.target_date,true))}</p></section>
 <section><h2>{l("Evidence & blockers")}</h2>{l(requirements.length?requirements.map(r=><div className="handoff-line" key={r.id}><span>{l(r.label)}<small>{l(r.owner_name??'Unassigned')}</small></span><StatusBadge status={r.status}/></div>):<p>{l("No recorded dependencies. Readiness has not been established.")}</p>)}</section>
 <section><h2>{l("Outstanding actions")}</h2>{l(tasks.length?tasks.map(t=><div className="handoff-line" key={t.id}><span>{recordText(t.title)}<small>{l(t.owner_name??'Unassigned')}{l(" · ")}{l(formatDate(t.due_at,true))}</small></span><StatusBadge status={t.status}/></div>):<p>{l("No open tasks recorded.")}</p>)}</section>
 <section><h2>{l("Recorded decision")}</h2>{l(decisions.length?decisions.slice(0,1).map(d=><div key={d.id}><h3>{recordText(d.recommendation)}</h3><p>{recordText(d.rationale)}</p><small>{l(d.recorded_by)}{l(" · ")}{l(formatDate(d.decided_at,true))}</small></div>):<p>{l("No decision recorded.")}</p>)}</section>
 <section><h2>{l("Imaging inventory")}</h2>{l(studies.length?studies.map(s=><div className="handoff-line" key={s.id}><span>{recordText(s.description)}<small>{l(s.modality)}{l(" · ")}{l(formatDate(s.study_date))}</small></span><StatusBadge status={s.status}/></div>):<p>{l("No linked studies.")}</p>)}</section>
 <FollowupSummary caseId={caseId}/>
 <footer>{l("Generated from recorded workspace data. Not an automated clinical recommendation.")}<br/>{l(formatDate(new Date().toISOString(),true))}</footer>
 </article></div>;
}
