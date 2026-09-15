import {localize as l,recordText,useLanguage} from '../lib/i18n';
import { Brain, DownloadSimple, HardDrives, Info, Plus, Scan, UploadSimple } from "@phosphor-icons/react";
import { Link,useSearchParams } from "react-router-dom";
import { lazy, Suspense, type FormEvent, useState } from "react";
import { useAppData } from '../lib/workspace';
import { Modal, PageHeader, StatusBadge, formatDate } from "../components/ui";
import { formatFileSize } from "../shared/workflow";


export default function ImagingPage() {
  useLanguage();
  const { data, uploadStudy } = useAppData();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState("study-01");
  const [saving, setSaving] = useState(false);
  const [failure,setFailure]=useState("");
  const [params]=useSearchParams();const caseFilter=params.get('case');
  if (!data) return null;
  const visibleStudies=data.studies.filter(s=>!caseFilter||s.case_id===caseFilter);
  const study = visibleStudies.find((item) => item.id === selectedStudy) ?? visibleStudies[0];
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try { await uploadStudy(new FormData(event.currentTarget)); setUploadOpen(false); } catch(e){setFailure(e instanceof Error?e.message:"Upload failed");} finally { setSaving(false); }
  };
  return (
    <>
      <PageHeader eyebrow={l("Imaging operations")} title={l("Imaging workspace")} description={l("Track acquisition, quality checks, transfers, and review readiness in one place.")} actions={<button className="button primary" onClick={() => setUploadOpen(true)}><UploadSimple size={17} />{l(" Upload study")}</button>} />
      {caseFilter&&<Link className="text-button" to="/imaging">Teljes képalkotási archívum →</Link>}<div className="imaging-layout">
        <section className="panel study-browser"><header className="panel-header"><div><h2>{l("Study archive")}</h2><p>{l(visibleStudies.length)}{l(" linked studies")}</p></div><HardDrives size={19} /></header><div className="study-list">{l(visibleStudies.map((item) => <button key={item.id} className={item.id === study?.id ? "active" : ""} onClick={() => setSelectedStudy(item.id)}><span className="modality-box">{l(item.modality)}</span><span><strong>{recordText(item.patient_name)}</strong><small>{recordText(item.description)}</small><em>{l(formatDate(item.study_date))}{l(" · ")}{l(item.series_count)}{l(" series")}</em></span><StatusBadge status={item.status} /></button>))}</div></section>
        <section className="imaging-main">
          <div className="scan-context-card archive-volume-link"><Brain size={36}/><span className="section-kicker">{l("Volumetric review")}</span><h2>{l("Real voxels. Clear spatial context.")}</h2><p>{l("Review a NIfTI scan in linked slice views and 3D. Import a matching region mask to inspect its shape and volume.")}</p><Link className="button primary" to={study?.object_key&&/\.nii(\.gz)?$/i.test(study.file_name||'')?`/volume-lab?study=${study.id}`:"/volume-lab"}>{l("Open 3D scan lab")}</Link><small>{study?.object_key&&/\.nii(\.gz)?$/i.test(study.file_name||'')?"A kiválasztott felvétel közvetlenül megnyílik; az eredmények visszamenthetők az esethez.":"NIfTI-képanyag választható a 3D munkatérben. DICOM-sorozatot előbb konvertálj."}</small></div>
          <div className="imaging-info-bar"><div><span className="modality-box large">{l(study?.modality)}</span><span><small>{l("Selected study")}</small><strong>{recordText(study?.patient_name)}{l(" · ")}{recordText(study?.description)}</strong></span></div><div><span><small>{l("Series")}</small><strong>{l(study?.series_count)}</strong></span><span><small>{l("Study date")}</small><strong>{l(study && formatDate(study.study_date))}</strong></span><span><small>{l("Stored file")}</small><strong>{l(formatFileSize(study?.file_size ?? null))}</strong></span></div>{l(study?.object_key && <a className="button secondary" href={`/api/studies/${study.id}/download`}><DownloadSimple size={17} />{l(" Download")}</a>)}</div>
        </section>
        <aside className="panel imaging-inspector"><header className="panel-header"><div><h2>{l("Review context")}</h2><p>{l("Non-diagnostic demo")}</p></div><Scan size={19} /></header><div className="inspector-section"><small>{l("Archive context")}</small><p>{l("File storage and recorded review state")}</p></div><div className="inspector-section"><small>{l("Workflow state")}</small><dl><div><dt>{l("Acquisition")}</dt><dd><StatusBadge status={study?.object_key ? "uploaded" : "metadata-only"} /></dd></div><div><dt>{l("Quality check")}</dt><dd><StatusBadge status={study?.status ?? "uploaded"} /></dd></div><div><dt>{l("Case linked")}</dt><dd><StatusBadge status={study?.case_id ? "ready":"pending"} /></dd></div></dl></div><div className="clinical-notice"><Info size={18} /><p><strong>{l("Portfolio visualisation")}</strong>{l("Archive entries are records, not diagnostic interpretations. Use the 3D scan lab for supported volumes.")}</p></div></aside>
      </div>
      {l(uploadOpen && <Modal title={l("Upload imaging study")} description={l("Attach a synthetic study file to its patient pathway.")} onClose={() => setUploadOpen(false)}><form className="form-grid" onSubmit={submit}>{l(failure&&<p className="mutation-error" role="alert">{l(failure)}</p>)}<label className="span-two upload-drop"><UploadSimple size={24} /><span>{l("Choose a local study file")}</span><small>{l("Maximum 25 MB for this demonstration")}</small><input type="file" name="file" required /></label><label><span>{l("Patient pathway")}</span><select name="case_id" required>{l(data.cases.map((item) => <option key={item.id} value={item.id}>{recordText(item.patient_name)}{l(" · ")}{l(item.hospital_id)}</option>))}</select></label><label><span>{l("Modality")}</span><select name="modality"><option value="MR">{l("MR")}</option><option value="CT">{l("CT")}</option><option value="PET">{l("PET")}</option></select></label><label className="span-two"><span>{l("Description")}</span><input name="description" defaultValue={l("Uploaded imaging study")} /></label><div className="form-actions span-two"><button type="button" className="button secondary" onClick={() => setUploadOpen(false)}>{l("Cancel")}</button><button className="button primary" disabled={saving}>{l(saving ? "Uploading..." : "Add to archive")}</button></div></form></Modal>)}
    </>
  );
}
