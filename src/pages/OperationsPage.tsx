import {localize as l,useLanguage} from '../lib/i18n';
import { ArrowUpRight, CalendarCheck, Gauge, Package, Pulse, Warning } from "@phosphor-icons/react";
import { useAppData } from '../lib/workspace';
import { PageHeader, StatusBadge, formatDate } from "../components/ui";
import { readinessScore } from "../shared/workflow";
import { Link } from 'react-router-dom';
import { DependencyMatrix } from '../components/DependencyMatrix';

export default function OperationsPage() {
  useLanguage();
  const { data } = useAppData();
  if (!data) return null;
  const scheduled = data.cases.filter((item) => item.status === "scheduled");
  const averageUtilisation = Math.round(data.resources.reduce((sum, item) => sum + item.utilization, 0) / data.resources.length);
  return (
    <>
      <PageHeader title={l("Operations control")} description={l("Connect clinical demand with rooms, equipment, people and downstream capacity.")} actions={<Link className="button secondary" to="/scenarios">{l("Model a capacity change ")}<ArrowUpRight size={15}/></Link>} />
      <section className="operations-kpis"><article><span><Gauge size={19} /></span><div><small>{l("Average utilisation")}</small><strong>{l(averageUtilisation)}{l("%")}</strong><p>{l("Across ")}{l(data.resources.length)}{l(" tracked resources")}</p></div></article><article><span><CalendarCheck size={19} /></span><div><small>{l("Scheduled procedures")}</small><strong>{l(scheduled.length)}</strong><p>{l("Across current pathways")}</p></div></article><article><span className="attention"><Warning size={19} /></span><div><small>{l("At-risk dependencies")}</small><strong>{l(data.requirements.filter((item) => item.status === "at-risk" || item.status === "blocked").length)}</strong><p>{l("Requires owner action")}</p></div></article></section>
      <div className="operations-grid">
        <section className="panel resource-map"><header className="panel-header"><div><h2>{l("Resource readiness")}</h2><p>{l("Clinical capacity, equipment, and supply")}</p></div><Package size={20} /></header><div className="resource-table-head"><span>{l("Resource")}</span><span>{l("Location")}</span><span>{l("Next available")}</span><span>{l("Utilisation")}</span><span>{l("State")}</span></div>{l(data.resources.map((item) => <div className="resource-row" key={item.id}><span><strong>{l(item.name)}</strong><small>{l(item.type)}{l(" · ")}{l(item.detail)}</small></span><span>{l(item.location)}</span><span>{l(formatDate(item.next_available, true))}</span><span className="util-cell"><span><i style={{ width: `${item.utilization}%` }} /></span><em>{l(item.utilization)}{l("%")}</em></span><StatusBadge status={item.status} /></div>))}</section>
        <aside className="panel surgery-readiness"><header className="panel-header"><div><h2>{l("Procedure readiness")}</h2><p>{l("Scheduled pathways")}</p></div></header>{l(scheduled.map((item) => { const requirements = data.requirements.filter((entry) => entry.case_id === item.id); const score = readinessScore(requirements); return <article key={item.id}><div className="procedure-score"><span style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><strong>{l(score)}{l("%")}</strong></span><div><small>{l(item.hospital_id)}</small><strong>{l(item.patient_name)}</strong><p>{l(item.working_diagnosis)}</p></div></div><div className="procedure-meta"><span><small>{l("Target")}</small>{l(formatDate(item.target_date, true))}</span><span><small>{l("Requirements")}</small>{l(requirements.filter((entry) => entry.status === "ready").length)}{l("/")}{l(requirements.length)}{l(" ready")}</span></div><a href={`/cases/${item.id}`}>{l("Open readiness plan ")}<ArrowUpRight size={15} /></a></article>; }))}</aside>
      </div>
      <DependencyMatrix/>
    </>
  );
}
