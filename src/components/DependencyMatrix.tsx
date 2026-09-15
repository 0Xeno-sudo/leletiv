import {localize as l,useLanguage} from '../lib/i18n';
import { Link } from 'react-router-dom';
import { useAppData } from '../lib/workspace';
import { useState } from 'react';
import { Modal,StatusBadge } from './ui';
import type { Requirement } from '../shared/types';

export function DependencyMatrix(){
  useLanguage();
 const {data}=useAppData();const [selected,setSelected]=useState<Requirement|null>(null);
 if(!data)return null;
 const categories=[...new Set(data.requirements.map(r=>r.category))].sort();
 return <section className="dependency-matrix"><div className="section-heading"><div><h2>{l("Dependency map")}</h2><p>{l("Trace a missing input to its patient pathway and accountable owner.")}</p></div><span className="matrix-legend">{l("Select a dependency to inspect")}</span></div><div className="data-table-wrap"><table className="data-table matrix-table"><thead><tr><th>{l("Patient pathway")}</th>{l(categories.map(c=><th key={c}>{l(c)}</th>))}</tr></thead><tbody>{l(data.cases.filter(c=>c.status!=='monitoring').map(c=><tr key={c.id}><td><Link to={`/cases/${c.id}`}><strong>{l(c.patient_name)}</strong><small>{l(c.hospital_id)}</small></Link></td>{l(categories.map(cat=><td key={cat}><div className="matrix-cell">{l(data.requirements.filter(r=>r.case_id===c.id&&r.category===cat).map(r=><button key={r.id} title={l(r.label)} aria-label={l(`${r.label}: ${r.status}`)} className={['blocked','at-risk'].includes(r.status)?'risk':''} onClick={()=>setSelected(r)}>{l(r.status.replaceAll('-',' '))}</button>))}</div></td>))}</tr>))}</tbody></table></div><p className="subtle-copy" style={{marginTop:10}}>{l("Blank cells have no recorded dependency; they do not imply readiness.")}</p>{l(selected&&<Modal title={l(selected.label)} onClose={()=>setSelected(null)}><div className="dependency-detail"><StatusBadge status={selected.status}/><dl><dt>{l("Owner")}</dt><dd>{l(selected.owner_name??'Unassigned')}</dd><dt>{l("Category")}</dt><dd>{l(selected.category)}</dd><dt>{l("Patient")}</dt><dd>{l(data.cases.find(c=>c.id===selected.case_id)?.patient_name)}</dd></dl><Link className="button secondary" to={`/cases/${selected.case_id}`}>{l("Open pathway and update readiness")}</Link></div></Modal>)}</section>;
}
