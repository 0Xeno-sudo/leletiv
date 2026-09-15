import {localize as l,recordText,useLanguage} from '../lib/i18n';
import { ListBullets, Kanban, MagnifyingGlass } from '@phosphor-icons/react';
import { useMemo,useState } from 'react';
import { Link,useSearchParams } from 'react-router-dom';
import { useAppData } from '../lib/workspace';
import { PageHeader,PriorityBadge,formatDate } from '../components/ui';
import { isTaskOverdue,taskStatusLabels } from '../shared/workflow';
import type {ClinicalTask,TaskStatus} from '../shared/types';
import {FollowupSummary} from '../components/FollowupSummary';

export default function TasksPage(){
  const language=useLanguage();
 const {data,setTaskStatus,setTaskOwner}=useAppData();const [params]=useSearchParams();const selectedCase=params.get('case');
 const [query,setQuery]=useState('');const [filter,setFilter]=useState('all');const [view,setView]=useState('list');const [error,setError]=useState('');const [pending,setPending]=useState<string[]>([]);
 const filtered=useMemo(()=>(data?.tasks??[]).filter(t=>(!selectedCase||t.case_id===selectedCase)&&l(`${t.title} ${t.patient_name} ${t.owner_name}`).toLowerCase().includes(query.toLowerCase())&&(filter==='all'||t.status===filter)),[data,query,filter,language,selectedCase]);
 if(!data)return null;
 const change=async(id:string,action:()=>Promise<void>)=>{setPending(p=>[...p,id]);setError('');try{await action();}catch(e){setError(e instanceof Error?e.message:'Could not save task');}finally{setPending(p=>p.filter(v=>v!==id));}};
 const status=(t:ClinicalTask)=><select aria-label={l(`Status for ${t.title}`)} disabled={pending.includes(t.id)} className="inline-status-select" value={t.status} onChange={e=>void change(t.id,()=>setTaskStatus(t.id,e.target.value as TaskStatus))}>{l(Object.entries(taskStatusLabels).map(([value,label])=><option value={value} key={value}>{label==="Open"&&language==="hu"?"Nyitott":l(label)}</option>))}</select>;
 const owner=(t:ClinicalTask)=><select aria-label={l(`Owner for ${t.title}`)} disabled={pending.includes(t.id)} className="inline-status-select" value={t.owner_id??''} onChange={e=>void change(t.id,()=>setTaskOwner(t.id,e.target.value))}><option value="">{l("Unassigned")}</option>{l(data.team.map(m=><option key={m.id} value={m.id}>{l(m.name)}</option>))}</select>;
 return <><PageHeader title={l("Task coordination")} description={l("Clear ownership, visible blockers and a next action for every pathway.")} actions={<span className="small-label">{l(data.tasks.filter(t=>(!selectedCase||t.case_id===selectedCase)&&t.status==='done').length)}{l(" of ")}{l(data.tasks.filter(t=>!selectedCase||t.case_id===selectedCase).length)}{l(" complete")}</span>}/>
 {l(error&&<p role="alert" className="error-banner">{l(error)}</p>)}
 <FollowupSummary caseId={selectedCase??undefined}/>{selectedCase&&<Link className="text-button" to="/tasks">Összes eset feladatai →</Link>}
 <section className="panel table-panel">
 <div className="table-toolbar"><div className="view-tabs"><button className={view==='list'?'active':''} onClick={()=>setView('list')}><ListBullets size={15}/>{l("List")}</button><button className={view==='board'?'active':''} onClick={()=>setView('board')}><Kanban size={15}/>{l("Board")}</button></div><label className="search-field"><MagnifyingGlass size={16}/><input aria-label={l("Search tasks")} placeholder={l("Search tasks")} value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
 <div className="filter-row"><select aria-label={l("Filter task status")} value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{l("All tasks")}</option>{l(Object.entries(taskStatusLabels).map(([v,label])=><option key={v} value={v}>{label==="Open"&&language==="hu"?"Nyitott":l(label)}</option>))}</select><span>{l(filtered.length)}{l(" tasks")}</span></div>
 {l(view==='list'?<div className="data-table-wrap"><table className="data-table task-table"><thead><tr><th>{l("Task")}</th><th>{l("Patient pathway")}</th><th>{l("Owner")}</th><th>{l("Priority")}</th><th>{l("Due")}</th><th>{l("Status")}</th></tr></thead><tbody>{l(filtered.map(t=><tr key={t.id}><td><strong>{recordText(t.title)}</strong><small>{l(t.category)}</small></td><td><Link to={`/cases/${t.case_id}`}>{recordText(t.patient_name)}<small>{l(t.hospital_id)}</small></Link></td><td>{l(owner(t))}</td><td><PriorityBadge priority={t.priority}/></td><td className={isTaskOverdue(t)?'due-overdue':''}>{l(formatDate(t.due_at,true))}{l(isTaskOverdue(t)&&<small>{l("Overdue")}</small>)}</td><td>{l(status(t))}</td></tr>))}</tbody></table></div>:<div className="case-board">{l(Object.entries(taskStatusLabels).map(([s,label])=><section key={s}><h3>{label==="Open"&&language==="hu"?"Nyitott":l(label)}{l(" · ")}{l(filtered.filter(t=>t.status===s).length)}</h3>{l(filtered.filter(t=>t.status===s).map(t=><article className="task-board-item" key={t.id}><strong>{recordText(t.title)}</strong><Link to={`/cases/${t.case_id}`}>{recordText(t.patient_name)}</Link><div>{l(owner(t))}{l(status(t))}</div></article>))}</section>))}</div>)}
 {l(!filtered.length&&<p className="empty-state">{l("No tasks match these filters.")}</p>)}</section></>;
}
