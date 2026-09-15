import {localize as l,recordText,useLanguage,locale,getLanguage} from '../lib/i18n';
import { ArrowLeft, CaretRight, WarningCircle, X } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { ClinicalCase, Priority, RequirementStatus, TaskStatus, TeamMember } from "../shared/types";
import { caseStatusLabels, requirementStatusLabels, taskStatusLabels } from "../shared/workflow";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  useLanguage();
  return (
    <div className="page-header">
      <div>{l(eyebrow && <p className="eyebrow">{l(eyebrow)}</p>)}<h1>{l(title)}</h1><p>{l(description)}</p></div>
      {l(actions && <div className="page-actions">{l(actions)}</div>)}
    </div>
  );
}

export function StatusBadge({ status }: { status: ClinicalCase["status"] | TaskStatus | RequirementStatus | string }) {
  useLanguage();
  const label = caseStatusLabels[status as ClinicalCase["status"]] ?? taskStatusLabels[status as TaskStatus] ?? requirementStatusLabels[status as RequirementStatus] ?? status.replaceAll("-", " ");
  return <span className={`status-badge status-${status}`}><i aria-hidden="true" /><span className="status-label">{status==="open"&&getLanguage()==="hu"?"Nyitott":l(label)}</span></span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  useLanguage();
  return <span className={`priority-badge priority-${priority}`}>{l(priority)}</span>;
}

export function PersonAvatar({ person, size = "normal" }: { person?: TeamMember | null; size?: "small" | "normal" | "large" }) {
  useLanguage();
  if (!person) return <span className={`person-avatar avatar-${size} is-empty`}>{l("?")}</span>;
  return <span className={`person-avatar avatar-${size}`} style={{ backgroundColor: person.color }}>{l(person.initials)}</span>;
}

export function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=dialog.current;el?.showModal();return ()=>el?.close();},[]);
  return (
      <dialog ref={dialog} className="modal-panel" aria-label={l(title)} onCancel={onClose}>
        <header><div><h2>{l(title)}</h2>{l(description && <p>{l(description)}</p>)}</div><button className="icon-button" onClick={onClose} aria-label={l("Close dialog")}><X size={20} /></button></header>
        {l(children)}
      </dialog>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  useLanguage();
  return <div className="empty-state"><WarningCircle size={24} /><strong>{l(title)}</strong><p>{l(text)}</p></div>;
}

export function CaseLink({ item, compact = false }: { item: ClinicalCase; compact?: boolean }) {
  useLanguage();
  return (
    <Link className={`case-link ${compact ? "compact" : ""}`} to={`/cases/${item.id}`}>
      <span><strong>{recordText(item.patient_name)}</strong><small>{l(item.hospital_id)}{l(" · ")}{recordText(item.working_diagnosis)}</small></span><CaretRight size={17} />
    </Link>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  useLanguage();
  return <Link className="back-link" to={to}><ArrowLeft size={16} />{l(children)}</Link>;
}

export function LoadingPanel() {
  useLanguage();
  return <div className="inline-loading"><span /><span /><span /></div>;
}

export function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat(locale(), { day: "2-digit", month: "short", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(new Date(value));
}
