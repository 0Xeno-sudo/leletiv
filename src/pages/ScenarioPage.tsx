import {localize as l,useLanguage,recordText} from '../lib/i18n';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DownloadSimple } from '@phosphor-icons/react';
import { useAppData } from '../lib/workspace';
import { PageHeader, Modal, formatDate } from '../components/ui';
import { baselineInput, csv, horizon, modelVersion, simulate, stages, type ScenarioInput } from '../shared/simulation';
import type { ClinicalCase } from '../shared/types';
import { apiRequest } from '../lib/api';
import { downloadText } from '../lib/download';

type Saved = {id:string;name:string;inputs:ScenarioInput;cohort:ClinicalCase[];modelVersion:string;createdAt:string};
const clock = (minutes:number) => `${String(8+Math.floor(minutes/60)).padStart(2,'0')}:${String(Math.round(minutes%60)).padStart(2,'0')}`;
const controls: {field:keyof ScenarioInput;label:string;detail:string;min:number;max:number;step:number;unit:string}[] = [
  {field:'scanners',label:'MRI scanners',detail:'45 min per study',min:1,max:4,step:1,unit:'units'},
  {field:'theatres',label:'Theatre rooms',detail:'150 min per procedure',min:1,max:4,step:1,unit:'rooms'},
  {field:'recoveryBays',label:'Recovery capacity',detail:'180 min per admission',min:1,max:8,step:1,unit:'bays'},
  {field:'scannerDelay',label:'MRI downtime',detail:'Unavailable at start of shift',min:0,max:240,step:30,unit:'min'},
  {field:'cohortCopies',label:'Demand waves',detail:'Replicates the active case mix',min:1,max:6,step:1,unit:'waves'},
];

export default function ScenarioPage() {
  useLanguage();
  const {data} = useAppData();
  const [input,setInput] = useState<ScenarioInput>(baselineInput);
  const [saved,setSaved] = useState<Saved[]>([]);
  const [snapshot,setSnapshot] = useState<Saved|null>(null);
  const [selection,setSelection] = useState<string|null>(null);
  const [saveOpen,setSaveOpen] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  useEffect(()=>{apiRequest<Saved[]>('/api/scenarios').then(setSaved).catch(e=>setError(e.message));},[]);
  const cohort = snapshot?.cohort ?? data?.cases ?? [];
  const result = useMemo(()=>simulate(cohort,input),[cohort,input]);
  const baseline = useMemo(()=>simulate(cohort,{...baselineInput,cohortCopies:input.cohortCopies}),[cohort,input.cohortCopies]);
  const selected = result.visits.find(v=>v.id===selection);
  const exportReport = () => downloadText('leletiv-capacity-scenario.csv',csv([
    ['Leletív capacity model',modelVersion],['Source',snapshot?.name??'Current synthetic pathways'],['Planning horizon (min)',horizon],
    ...controls.map(c=>[c.label,input[c.field]]),['Completed',result.completed],['Beyond shift',result.backlog],['Mean queue (min)',result.meanWait],
    ['Visit','Case','Stage','Start (min)','Finish (min)','Queue (min)','Resource slot'],
    ...result.visits.flatMap(v=>v.segments.map(s=>[v.label,v.caseId,stages[s.stage],s.start,s.end,s.wait,s.slot+1]))
  ].map(row=>row.map(recordText))));
  return <>
    <PageHeader title={l("Capacity lab")} description={l("Explore the operational cost of a constraint before it reaches the patient.")} actions={<><button className="button secondary" onClick={exportReport}><DownloadSimple size={15}/>{l("Export analysis")}</button><button className="button primary" disabled={!!snapshot||!cohort.length} onClick={()=>setSaveOpen(true)}>{l("Save scenario")}</button></>}/>
    <div className="lab-subnav"><span className="small-label">{l("Scenario modelling")}</span><span>{l("12-hour shift · deterministic model")}</span><Link to="/operations">{l("Resource overview ")}<ArrowRight size={14}/></Link></div>
    {l(error&&<p role="alert" className="error-banner">{l(error)}</p>)}{l(notice&&<p role="status" className="inline-notice">{l(notice)}</p>)}
    <div className="lab-layout">
      <aside className="lab-controls">
        <div className="section-heading"><h2>{l("Assumptions")}</h2><button className="text-button" onClick={()=>{setInput(baselineInput);setSnapshot(null);setSelection(null);}}>{l("Reset")}</button></div>
        <p className="subtle-copy">{l("Change a resource. Follow the effect through the whole pathway.")}</p>
        {l(controls.map(c=><label className="range-control" key={c.field}><span><strong>{l(c.label)}</strong><output>{l(input[c.field])} <small>{l(c.unit)}</small></output></span><input aria-label={l(c.label)} type="range" min={c.min} max={c.max} step={c.step} value={input[c.field]} onChange={e=>setInput({...input,[c.field]:Number(e.target.value)})}/><small>{l(c.detail)}</small></label>))}
        <div className="saved-scenarios"><h3>{l("Saved scenarios ")}<span>{l(saved.length)}</span></h3><button className={!snapshot?'selected':''} onClick={()=>{setSnapshot(null);setInput(baselineInput);}}>{l("Current pathways ")}<span>{l("Current source")}</span></button>{l(saved.map(s=><button className={snapshot?.id===s.id?'selected':''} key={s.id} onClick={()=>{setSnapshot(s);setInput(s.inputs);setSelection(null);}}>{recordText(s.name)}<span>{l(formatDate(s.createdAt))}</span></button>))}</div>
      </aside>
      <div className="lab-results">
        <div className="section-heading"><h2>{snapshot ? recordText(snapshot.name) : l('Baseline vs. your scenario')}</h2><span className="small-label">{l(result.visits.length)}{l(" simulated visits")}</span></div>
        <div className="lab-metrics" aria-live="polite">
          {l([{label:'Completed in shift',before:baseline.completed,after:result.completed,unit:'visits'},{label:'Beyond shift',before:baseline.backlog,after:result.backlog,unit:'visits'},{label:'Average queue time',before:baseline.meanWait,after:result.meanWait,unit:'min'}].map(m=><div key={m.label}><span>{l(m.label)}</span><div><s>{l(m.before)}</s><ArrowRight size={15}/><strong>{l(m.after)}</strong><small>{l(m.unit)}</small></div><p>{l(m.after===m.before?'Unchanged from baseline':`${Math.abs(m.after-m.before)} ${m.unit==='visits'&&Math.abs(m.after-m.before)===1?'visit':m.unit} ${m.after>m.before?'more':'fewer'} than baseline`)}</p></div>))}
        </div>
        <div className="simulation-flow" aria-label={l("Queue and resource utilization by stage")}>{l(stages.map((stage,i)=><div key={stage} className={result.bottleneck===stage?'constraint':''}><span className="stage-index">{l("0")}{l(i+1)}</span><strong>{l(stage)}</strong><span>{l(result.utilization[i])}{l("% busy")}</span><div className="capacity-track"><i style={{width:`${result.utilization[i]}%`}}/></div><small>{l(result.visits.length?Math.round(result.queueMinutes[i]/result.visits.length):0)}{l(" min average queue")}</small>{l(result.bottleneck===stage&&<em>{l("Largest queue")}</em>)}</div>))}</div>
        <div className="insight-line"><span className="insight-mark"/><p><strong>{l("Main constraint:")} {l(result.bottleneck)}.</strong> {l(result.backlog)}{l(" of ")}{l(result.visits.length)}{l(" simulated visits finish after the shift. Try adding capacity here and compare the queue downstream.")}</p></div>
        <div className="section-heading schedule-heading"><h2>{l("Pathway timeline")}</h2><div className="timeline-legend">{l(stages.map((s,i)=><span key={s}><i className={`stage-${i}`}/>{l(s)}</span>))}<span><i className="waiting"/>{l("Queue")}</span></div></div>
        <div className="timeline-scroll"><div className="schedule-axis"><span>{l("Visit / priority")}</span><div>{l([0,120,240,360,480,600,720].map(n=><span key={n} style={{left:`${n/horizon*100}%`}}>{l(clock(n))}</span>))}</div></div>
          {l(result.visits.map(v=><button className={`schedule-row ${selection===v.id?'selected':''}`} key={v.id} onClick={()=>setSelection(selection===v.id?null:v.id)} aria-label={l(`Inspect ${v.label}`)}><span><strong>{l(v.label)}</strong><small>{l(v.priority)}{l(" · ")}{l(v.segments[2].end>horizon?'beyond shift':`finish ${clock(v.segments[2].end)}`)}</small></span><div className="schedule-track">{l(v.segments.map(s=><span key={s.stage}>{l(s.wait>0&&<i className="schedule-wait" style={{left:`${Math.min(s.start-s.wait,horizon)/horizon*100}%`,width:`${Math.max(0,Math.min(s.start,horizon)-Math.min(s.start-s.wait,horizon))/horizon*100}%`}}/>)}{l(s.start<horizon&&<i title={l(`${stages[s.stage]}: ${s.start}–${s.end} min`)} className={`schedule-bar stage-${s.stage}`} style={{left:`${s.start/horizon*100}%`,width:`${(Math.min(s.end,horizon)-s.start)/horizon*100}%`}}/>)}</span>))}</div></button>))}
        </div>
        {l(selected&&<div className="visit-inspector"><div className="section-heading"><h3>{l(selected.label)}</h3><Link to={`/cases/${selected.caseId}`}>{l("Open source pathway ")}<ArrowRight size={14}/></Link></div><div>{l(selected.segments.map(s=><section key={s.stage}><strong>{l(stages[s.stage])}</strong><p>{l("Start +")}{l(s.start)}{l(" min · finish +")}{l(s.end)}{l(" min")}</p><small>{l("Queue ")}{l(s.wait)}{l(" min · resource ")}{l(s.slot+1)}</small></section>))}</div></div>)}
        <details className="model-notes"><summary>{l("How this model works")}</summary><p>{l("Each active pathway generates ")}{l(input.cohortCopies)}{l(" synthetic demand waves. Arrivals are 10 minutes apart, with waves 60 minutes apart. Every simulated visit follows imaging (45 min), theatre (150 min), and recovery (180 min). This is a capacity exercise, not a treatment recommendation.")}</p><p>{l("Queues are first-ready-first-served, with priority breaking ties. Each stage has independent resources; staff constraints, stochastic variation, overnight calendars and upstream blocking are not modelled. Resource occupancy is measured within 08:00 to 20:00; queue time includes work beyond the shift. Saved scenarios retain the source cohort and model version for reproducibility.")}</p></details>
      </div>
    </div>
    {l(saveOpen&&<Modal title={l("Save capacity scenario")} description={l("Keep these assumptions and a snapshot of the source cohort.")} onClose={()=>setSaveOpen(false)}><form className="form-grid" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);setSaving(true);setError('');try {await apiRequest('/api/scenarios',{method:'POST',body:JSON.stringify({name:form.get('name'),inputs:input})});setSaved(await apiRequest('/api/scenarios'));setSaveOpen(false);setNotice('Scenario saved with its source cohort.');}catch(e){setError(e instanceof Error?e.message:'Could not save scenario');}finally{setSaving(false);}}}>{l(error&&<p className="mutation-error span-two" role="alert">{l(error)}</p>)}<label className="span-two"><span>{l("Scenario name")}</span><input name="name" required maxLength={100} placeholder={l("Two theatres, four recovery bays")} autoFocus/></label><div className="form-actions span-two"><button type="button" className="button secondary" onClick={()=>setSaveOpen(false)}>{l("Cancel")}</button><button className="button primary" disabled={saving}>{l(saving?'Saving…':'Save scenario')}</button></div></form></Modal>)}
  </>;
}
