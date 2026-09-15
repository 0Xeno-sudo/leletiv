# Evidence, measurement and follow-up workspace

Implemented locally on 14 September 2026 at `/review`.

## Is the model better than ChatGPT, Claude or Gemini?

That has not been established. No representative, blinded head-to-head diagnostic benchmark has been performed for this app. A pretrained segmentation model, a general multimodal assistant and a workflow application are different products; running inference successfully is not proof of diagnostic superiority.

The installed MONAI BraTS model accepts four specifically prepared MRI sequences and produces candidate glioma-region masks. It is not a general cancer detector. The app has no validated minimum detectable lesion size, sensitivity, specificity or calibrated confidence. Empty masks do not exclude disease. Generative image models are not used to invent patient anatomy or tumour boundaries.

The defensible differentiator is a structured, persistent workflow: original-source provenance, matched-geometry visualization, source-linked numerical observations, ownership, explicit result review and a history of actions. These features supplement clinical work rather than replacing clinical judgement.

## Three implemented workflows

### 1. Source-linked report review

- Upload synthetic text-readable PDF or UTF-8 TXT: maximum 8 MB, 50 pages and 120,000 extracted characters.
- PDF.js 6.3.289 extracts text in the browser. The app renders the original PDF page separately, so extraction can be checked against the source pixels. Image-only/scanned PDFs are not OCR'd or interpreted; documents with no extracted text are rejected.
- Original file bytes are saved through local R2, SHA-256 is computed server-side, and metadata/page text are persisted in D1. Exact duplicate files are rejected within a case.
- Save an exact page-linked quotation after an explicit source-check attestation. Backend checks page range, verbatim substring, named reviewer and case linkage. Search preserves full quotations, including negation; it does not classify mentions as cancer.
- Original documents and saved evidence are not silently rewritten. The export bundle includes source fingerprints, page numbers, notes and reviewer identifiers. PDF extraction itself is client-generated and remains subject to human verification; a file hash proves file identity, not truth or extraction correctness.

### 2. Longitudinal measurement tracking

- A user enters a reviewed, source-linked diameter in mm or segmented volume in mL, with a stable region identifier, protocol and reviewer. Values are **manually entered**, not automatically extracted or clinically validated by the app.
- Measurement date comes from the source study. The backend rejects mismatched dates, negative/non-finite numbers and mismatched units/methods.
- A time-scaled chart and absolute/percentage change are shown for like-for-like observations. Cross-region, method, protocol, unit or chronological mismatches withhold comparison. Zero baselines never produce an infinite percentage.
- A source-check control links back to the original evidence. Incorrect entries can be excluded with a reason while remaining in the audit export. No RECIST/RANO response category, progression decision or treatment recommendation is inferred.

### 3. Closed-loop follow-up

- A reviewed quotation anchors a recommendation, named owner, priority and clinician-chosen due date.
- The state machine is `open -> acknowledged -> completed`, with explained reopening. Closure needs a different reviewed result from the same case, not older than the recommendation source.
- D1 batches save state and event history together. Optimistic versions reject stale updates instead of overwriting a newer record.
- Overdue items are derived from Budapest calendar dates. Open items also appear on the dashboard, tasks, case details and printable handoff. No automatic messages, patient contact or background alert service is implied.
- Actors are recorded demo identities, **not authenticated signatures**. The initial assignment event names the assigned owner; it does not prove who made the assignment. This must be replaced by authenticated actor attribution before clinical use.

## Research grounding

These are selected contemporary workflow directions, not a claim that all three were invented in 2026 or are clinically validated here.

- [RSNA Radiology Reimagined 2026](https://www.rsna.org/artificial-intelligence/radiology-reimagined-ai): imaging AI orchestration, interoperability and evidence-linked multimedia reporting. Inspiration only; the app does not claim IHE, FHIR or DICOM SR conformance.
- [Evidence-Linked Radiology Reporting, May 2026](https://arxiv.org/abs/2605.25120): human-supervised source evidence and longitudinal comparison. This is a reference-architecture preprint with no validated diagnostic outcomes, not accuracy evidence.
- [ACR imaging-AI practice parameter announcement, May 2026](https://www.acr.org/News-and-Publications/Media-Center/2026/first-practice-parameter-for-imaging-ai): local acceptance testing, monitoring, model inventory and governance. These are practice-quality considerations, not certification of this app.
- [ACR actionable finding follow-up use case](https://www.acr.org/Data-Science-and-Informatics/AI-in-Your-Practice/AI-Use-Cases/Use-Cases/Actionable-Finding-Follow-Up): tracking recommendations through a documented result.
- [OpenAI Image Inputs FAQ](https://help.openai.com/en/articles/8400551-image-inputs-for-chatgpt-faq): cautions against interpreting specialized medical images. This does not prove another vendor or this app is more accurate.
- [Original MONAI BraTS model documentation](https://huggingface.co/MONAI/brats_mri_segmentation/blob/main/docs/README.md): model task and data preparation. Published model metrics are not this application's clinical performance.

## Clinical-use boundary

This is a synthetic local research/portfolio workspace, not a deployable clinical product. Before real patient use it needs a clinician-led intended-use specification; external representative validation including small-lesion/subgroup performance and false positives; quality-management and applicable regulatory assessment; authenticated roles and verified signatures; privacy, consent, retention and deletion controls; secure deployment and backups; PACS/EHR patient/study reconciliation; safety escalation and ongoing monitoring. It is not an emergency alert system, prescribing system or complete patient chart (e.g. medications, allergies and full clinical history are not managed).

The user should showcase systems engineering and traceability, not claim a universal detector or superior clinical accuracy. No external AI keys are required for these three workflows. Adding a provider later would require a separately evaluated, consent-aware integration; there is no unused API-key switch presented as a working feature.

## Reproduce the software checks

1. `npm run db:migrate:local` applies review migrations through `0004_review_datasets.sql` locally.
2. `npm run dev:full` starts the app and local inference service.
3. `npm run check` runs TypeScript, unit tests and the production build.
4. `npm run inference:test` tests the local inference contract.
6. `test-fixtures/synthetic-report.pdf` is a two-page, text-layer PDF for browser import testing. Regenerate optionally with ReportLab 4.4.3 using `inference/make_report_demo.py`.

No remote Cloudflare resources were created or changed.

## Example language and test-data separation

- `dataset` is immutable at upload: ordinary requests use `workspace`; the local contract script explicitly sends `X-Review-Dataset: verification`. This selector organizes test data; it is **not authentication or access control**.
- Authored example reports have `sample_language` (`en`/`hu`). Review queries and summaries select the current interface language. Each variant has its own original file, fingerprint, quotations and measurements; switching language never rewrites a source. These are separate fictional examples, not two copies of a real patient record.
- Uploaded reports have no example-language marker and remain visible in either interface language with their exact original text.
- No clinical accuracy claim, cancer-detection result or treatment-response classification is added by these examples.
