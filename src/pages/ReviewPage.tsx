import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  CheckCircle,
  ChartLine,
  Clock,
} from "@phosphor-icons/react";
import { useLanguage, localize as l, locale } from "../lib/i18n";
import { useAppData } from "../lib/workspace";
import { apiRequest } from "../lib/api";
import { downloadText } from "../lib/download";
import { extractReport } from "../lib/reports";
import { reviewExamples } from "../shared/review-examples";
import { ReportOriginal } from "../components/ReportOriginal";
import { PageHeader } from "../components/ui";
import {
  compareMeasurements,
  type ReviewWorkspace,
  type Measurement,
  type Evidence,
  type Followup,
} from "../shared/review";
import type { TeamMember, ClinicalCase } from "../shared/types";

type Translator = (en: string, hu: string) => string;
const number = (n: number) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(n);
const date = (s: string) =>
  new Intl.DateTimeFormat(locale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${s.slice(0, 10)}T12:00:00`));
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const blank: ReviewWorkspace = {
  documents: [],
  evidence: [],
  measurements: [],
  followups: [],
  events: [],
};
const formValues = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget));
};
function MemberSelect({
  team,
  t,
  name = "reviewer_id",
}: {
  team: TeamMember[];
  t: Translator;
  name?: string;
}) {
  return (
    <label className="span-two">
      <span>
        {name === "owner_id"
          ? t("Responsible clinician", "Felelős orvos")
          : t("Recorded reviewer", "Rögzített ellenőrző")}
      </span>
      <select name={name} required defaultValue="">
        <option value="" disabled>
          {t("Select team member", "Válasszon munkatársat")}
        </option>
        {team.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ReviewPage() {
  const language = useLanguage(),
    t: Translator = (en, hu) => (language === "hu" ? hu : en);
  const { data } = useAppData();
  const [params, setParams] = useSearchParams();
  const caseId = params.get("case") ?? data?.cases[0]?.id;
  const item = data?.cases.find((c) => c.id === caseId);
  if (!data) return null;
  return (
    <div className="review-page">
      <PageHeader
        title={t("Evidence & follow-up", "Leletek és utánkövetés")}
        description={t(
          "From the original report to measured change and a documented outcome.",
          "Az eredeti lelettől a mérhető változásig és a dokumentált eredményig.",
        )}
        actions={
          <Link className="button secondary" to="/volume-lab">
            {t("3D scan lab", "3D képalkotó műhely")}
            <ArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="review-case-picker">
        <label>
          <span>{t("Case in review", "Áttekintett eset")}</span>
          <select
            aria-label={t("Case in review", "Áttekintett eset")}
            value={caseId ?? ""}
            onChange={(e) => setParams({ case: e.target.value })}
          >
            {data.cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.patient_name} · {c.hospital_id}
              </option>
            ))}
          </select>
        </label>
        {item && (
          <Link to={`/cases/${item.id}`}>
            {t("Open pathway", "Betegút megnyitása")}
            <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
      <p className="review-safety">
        {t(
          "Demo workspace · Fictional cases, not for patient care. Recorded reviews are not authenticated clinical signatures. Documents stay local.",
          "Bemutató munkatér · Kitalált esetek, betegellátásra nem használhatók. A rögzített ellenőrzések nem hitelesített orvosi aláírások. A dokumentumok helyben maradnak.",
        )}
      </p>
      {item ? (
        <ReviewCase key={`${item.id}-${language}`} item={item} team={data.team} t={t} />
      ) : (
        <p role="alert">{t("Case not found.", "Az eset nem található.")}</p>
      )}
    </div>
  );
}

function ReviewCase({
  item,
  team,
  t,
}: {
  item: ClinicalCase;
  team: TeamMember[];
  t: Translator;
}) {
  const { data: appData } = useAppData();
  const language = useLanguage();
  const [workspace, setWorkspace] = useState<ReviewWorkspace>(blank),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [tab, setTab] = useState<"evidence" | "measurements" | "followup">(
    "evidence",
  );
  const [docId, setDocId] = useState(""),
    [page, setPage] = useState(1),
    [quote, setQuote] = useState(""),
    [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false),
    [region, setRegion] = useState("");
  const base = `/api/review/cases/${item.id}`;
  const readUrl = `${base}?language=${language}`;
  const reload = useCallback(async () => {
    const result = await apiRequest<ReviewWorkspace>(readUrl);
    setWorkspace(result);
    return result;
  }, [readUrl]);
  useEffect(() => {
    let active = true;
    void apiRequest<ReviewWorkspace>(readUrl)
      .then((result) => {
        if (active) {
          setWorkspace(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [readUrl, appData?.generated_at]);
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      await reload();
      setSuccess(
        t("Saved to the local database.", "Mentve a helyi adatbázisba."),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The request could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }
  const post = async (path: string, b: unknown) =>
    apiRequest<{ id: string }>(`${base}/${path}`, {
      method: "POST",
      body: JSON.stringify(b),
    });
  const doc =
    workspace.documents.find((d) => d.id === docId) ?? workspace.documents[0];
  const selectedPage = doc ? Math.min(page, doc.pages.length) : 1;
  const pageText = doc?.pages[selectedPage - 1] ?? "";
  const ownerName = (id: string) => team.find((m) => m.id === id)?.name ?? id;
  const sourceName = (id: string) =>
    workspace.documents.find((d) => d.id === id)?.title ??
    t("Source", "Forrás");
  const evidenceName = (e: Evidence) =>
    `${sourceName(e.document_id)} · ${t("p.", "o.")} ${e.page} · ${e.quote.slice(0, 75)}`;
  const openEvidence = (id: string) => {
    const e = workspace.evidence.find((x) => x.id === id);
    if (e) {
      setDocId(e.document_id);
      setPage(e.page);
      setQuote(e.quote);
      setTab("evidence");
    }
  };
  const pending = workspace.followups.filter((f) => f.status !== "completed");
  const overdue = pending.filter((f) => f.due_date < today());
  const regions = [
    ...new Set(
      workspace.measurements.filter((m) => !m.void_reason).map((m) => m.region),
    ),
  ];
  const activeRegion = regions.includes(region) ? region : regions[0];
  const measurements = workspace.measurements.filter(
    (m) => !m.void_reason && m.region === activeRegion,
  );
  const baseline = measurements[0],
    latest = measurements.at(-1);
  const comparison =
    baseline && latest && baseline !== latest
      ? compareMeasurements(baseline, latest)
      : null;
  function EvidenceSelect({
    name = "evidence_id",
    exclude,
  }: {
    name?: string;
    exclude?: string;
  }) {
    return (
      <label className="span-two">
        <span>
          {name === "result_evidence_id"
            ? t("Reviewed result evidence", "Ellenőrzött eredménylelet")
            : t("Reviewed source quotation", "Ellenőrzött forrásidézet")}
        </span>
        <select name={name} required defaultValue="">
          <option value="" disabled>
            {t("Select evidence", "Válasszon forrásidézetet")}
          </option>
          {workspace.evidence
            .filter((e) => e.id !== exclude)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {evidenceName(e)}
              </option>
            ))}
        </select>
      </label>
    );
  }
  async function upload(e: FormEvent<HTMLFormElement>) {
    const element = e.currentTarget;
    e.preventDefault();
    const form = new FormData(element),
      file = form.get("file");
    if (!(file instanceof File)) return;
    await run(async () => {
      form.set("pages", JSON.stringify(await extractReport(file)));
      const result = await apiRequest<{ id: string }>(`${base}/documents`, {
        method: "POST",
        body: form,
      });
      setDocId(result.id);
      setPage(1);
      setQuote("");
      setUploadOpen(false);
    });
  }
  async function demo() {
    await run(async () => {
      for (const { title: name, day, body } of reviewExamples(language)) {
        if (workspace.documents.some((d) => d.pages.length === 1 && d.pages[0] === body)) continue;
        const form = new FormData();
        form.set(
          "file",
          new File([body], `brain-mri-${day}-${language}.txt`, { type: "text/plain" }),
        );
        form.set("title", name);
        form.set("study_date", day);
        form.set("modality", "MR");
        form.set("pages", JSON.stringify([body]));
        form.set("synthetic", "yes");
        form.set("sample_language", language);
        try {
          await apiRequest(`${base}/documents`, { method: "POST", body: form });
        } catch (e) {
          if (!(e instanceof Error && "status" in e && e.status === 409))
            throw e;
        }
      }
    });
  }
  function exportBundle() {
    downloadText(
      `case-review-${item.hospital_id}.json`,
      JSON.stringify(
        {
          schema: "clinical-review.v1",
          syntheticOnly: true,
          diagnosticUse: false,
          exportedAt: new Date().toISOString(),
          case: { id: item.id, hospitalId: item.hospital_id },
          ...workspace,
        },
        null,
        2,
      ),
      "application/json",
    );
  }
  if (loading)
    return (
      <p role="status">
        {t("Loading recorded evidence…", "Rögzített leletek betöltése…")}
      </p>
    );
  return (
    <>
      <div className="review-metrics">
        <div>
          <FileText size={18} />
          <span>
            {t("Source documents", "Forrásdokumentumok")}
            <strong>{workspace.documents.length}</strong>
          </span>
        </div>
        <div>
          <CheckCircle size={18} />
          <span>
            {t("Reviewed quotations", "Ellenőrzött idézetek")}
            <strong>{workspace.evidence.length}</strong>
          </span>
        </div>
        <div>
          <ChartLine size={18} />
          <span>
            {t("Tracked regions", "Követett régiók")}
            <strong>{regions.length}</strong>
          </span>
        </div>
        <div className={overdue.length ? "needs-attention" : ""}>
          <Clock size={18} />
          <span>
            {t("Overdue follow-ups", "Lejárt utánkövetések")}
            <strong>{overdue.length}</strong>
          </span>
        </div>
      </div>
      <div className="review-tabbar">
        <div
          role="tablist"
          aria-label={t("Review tools", "Áttekintési eszközök")}
        >
          {(
            [
              ["evidence", t("Source review", "Forrásellenőrzés")],
              ["measurements", t("Longitudinal tracking", "Időbeli követés")],
              [
                "followup",
                t("Closed-loop follow-up", "Lezárásig követett teendők"),
              ],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="text-button"
          disabled={busy || !workspace.documents.length}
          onClick={exportBundle}
        >
          {t("Export audit bundle", "Ellenőrzési csomag exportálása")}
        </button>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {l(error)}
          <button
            className="text-button"
            onClick={() => void run(async () => {})}
          >
            {t("Refresh", "Frissítés")}
          </button>
        </div>
      )}
      {success && (
        <p className="review-success" role="status">
          {success}
        </p>
      )}
      <fieldset className="review-fieldset" disabled={busy}>
        {tab === "evidence" && (
          <div role="tabpanel">
            <div className="review-section-heading">
              <div>
                <h2>
                  {t(
                    "Every observation has a source",
                    "Minden megfigyelésnek van forrása",
                  )}
                </h2>
                <p>
                  {t(
                    "Original pages, exact quotations and recorded review. Uploaded reports retain their original language; text search does not detect cancer.",
                    "Eredeti oldalak, pontos idézetek, rögzített ellenőrzés. A feltöltött leletek nyelve változatlan marad; a szövegkeresés nem daganatfelismerés.",
                  )}
                </p>
              </div>
              <div className="review-inline-actions">
                <button className="text-button" onClick={() => void demo()}>
                  {t("Load example reports", "Mintaleletek betöltése")}
                </button>
                <button
                  className="button primary"
                  onClick={() => setUploadOpen(!uploadOpen)}
                >
                  {t("Add report", "Lelet hozzáadása")}
                </button>
              </div>
            </div>
            {uploadOpen && (
              <form className="form-grid review-form" onSubmit={upload}>
                <label>
                  <span>{t("Document title", "Dokumentum címe")}</span>
                  <input name="title" maxLength={160} required />
                </label>
                <label>
                  <span>{t("Study date", "Vizsgálat dátuma")}</span>
                  <input name="study_date" type="date" required />
                </label>
                <label>
                  <span>{t("Document type", "Dokumentum típusa")}</span>
                  <select name="modality">
                    <option>MR</option>
                    <option>CT</option>
                    <option value="Pathology">
                      {t("Pathology", "Patológia")}
                    </option>
                    <option value="Other">{t("Other", "Egyéb")}</option>
                  </select>
                </label>
                <label>
                  <span>{t("PDF or text file", "PDF- vagy szövegfájl")}</span>
                  <input name="file" type="file" accept=".pdf,.txt" required />
                </label>
                <p className="span-two review-hint">
                  {t(
                    "Up to 8 MB / 50 pages. Text-readable PDFs and UTF-8 text only. No OCR or image diagnosis. Verify PDF extraction against the original page.",
                    "Legfeljebb 8 MB / 50 oldal. Szövegréteges PDF és UTF-8 szöveg. Nincs OCR vagy képalapú diagnózis. A kinyert szöveget az eredeti oldallal kell összevetni.",
                  )}
                </p>
                <label className="review-check span-two">
                  <input
                    name="synthetic"
                    type="checkbox"
                    value="yes"
                    required
                  />
                  <span>
                    {t(
                      "This document contains fictional example data only, not patient data.",
                      "A dokumentum kizárólag kitalált példaadatokat tartalmaz, nem betegadatokat.",
                    )}
                  </span>
                </label>
                <div className="form-actions span-two">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setUploadOpen(false)}
                  >
                    {t("Cancel", "Mégse")}
                  </button>
                  <button className="button primary">
                    {t(
                      "Extract and save source",
                      "Szöveg kinyerése és forrás mentése",
                    )}
                  </button>
                </div>
              </form>
            )}
            {doc ? (
              <div className="evidence-layout">
                <section className="source-reader">
                  <div className="source-controls">
                    <label>
                      <span>
                        {t("Original document", "Eredeti dokumentum")}
                      </span>
                      <select
                        value={doc.id}
                        onChange={(e) => {
                          setDocId(e.target.value);
                          setPage(1);
                          setQuote("");
                        }}
                      >
                        {workspace.documents.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <a
                      className="text-button"
                      href={`/api/review/documents/${doc.id}/source`}
                      download
                    >
                      {t("Download original", "Eredeti letöltése")}
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                  <div className="source-meta">
                    <span>
                      {date(doc.study_date)} · {l(doc.modality)}
                    </span>
                    <span>
                      {t("Page", "Oldal")}{" "}
                      <select
                        aria-label={t("Source page", "Forrásoldal")}
                        value={selectedPage}
                        onChange={(e) => {
                          setPage(Number(e.target.value));
                          setQuote("");
                        }}
                      >
                        {doc.pages.map((_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>{" "}
                      / {doc.pages.length}
                    </span>
                  </div>
                  <ReportOriginal
                    key={`${doc.id}-${selectedPage}`}
                    document={doc}
                    page={selectedPage}
                  />
                  <details className="extracted-text" open>
                    <summary>
                      {t(
                        "Extracted text · select a quotation",
                        "Kinyert szöveg · jelöljön ki egy idézetet",
                      )}
                    </summary>
                    <pre
                      onMouseUp={(e) => {
                        const selection = window.getSelection();
                        if (
                          selection &&
                          e.currentTarget.contains(selection.anchorNode)
                        ) {
                          const value = selection.toString();
                          if (
                            value.length >= 3 &&
                            value.length <= 3000 &&
                            pageText.includes(value)
                          )
                            setQuote(value);
                        }
                      }}
                    >
                      {pageText ||
                        t(
                          "No text on this page. Inspect the original.",
                          "Ezen az oldalon nincs szöveg. Ellenőrizze az eredetit.",
                        )}
                    </pre>
                    <button
                      className="text-button"
                      disabled={!pageText.trim() || pageText.length > 3000}
                      onClick={() => setQuote(pageText)}
                    >
                      {t(
                        "Use page text as quotation",
                        "Oldalszöveg használata idézetként",
                      )}
                    </button>
                  </details>
                  <details className="source-hash">
                    <summary>
                      {t(
                        "File fingerprint & provenance",
                        "Fájlujjlenyomat és eredet",
                      )}
                    </summary>
                    <small>SHA-256</small>
                    <code>{doc.sha256}</code>
                    <p>
                      {t(
                        "Original bytes are stored in local R2. PDF text is extracted in the browser and requires manual source review.",
                        "Az eredeti fájlt a helyi R2 tárolja. A PDF szövegét a böngésző nyeri ki; kézi forrásellenőrzés szükséges.",
                      )}
                    </p>
                  </details>
                </section>
                <aside className="evidence-notebook">
                  <h3>
                    {t(
                      "Record a source-linked observation",
                      "Forráshoz kötött megfigyelés",
                    )}
                  </h3>
                  <form
                    className="form-grid"
                    key={`${doc.id}-${selectedPage}`}
                    onSubmit={(e) => {
                      const b = formValues(e);
                      void run(async () => {
                        await post("evidence", {
                          ...b,
                          document_id: doc.id,
                          page: selectedPage,
                          quote,
                          verified: b.verified === "yes",
                        });
                        setQuote("");
                      });
                    }}
                  >
                    <label className="span-two">
                      <span>{t("Exact quotation", "Pontos idézet")}</span>
                      <textarea
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        rows={6}
                        minLength={3}
                        maxLength={3000}
                        required
                      />
                    </label>
                    <label className="span-two">
                      <span>
                        {t(
                          "Review note · optional",
                          "Ellenőrzési megjegyzés · nem kötelező",
                        )}
                      </span>
                      <textarea name="note" rows={3} maxLength={2000} />
                    </label>
                    <MemberSelect team={team} t={t} />
                    <label className="review-check span-two">
                      <input
                        type="checkbox"
                        name="verified"
                        value="yes"
                        required
                      />
                      <span>
                        {t(
                          "I checked the original page, including negation, units and context. This is not a diagnostic endorsement.",
                          "Ellenőriztem az eredeti oldalt, a tagadást, a mértékegységeket és a szövegkörnyezetet is. Ez nem diagnosztikai jóváhagyás.",
                        )}
                      </span>
                    </label>
                    <button className="button primary span-two">
                      {t(
                        "Save reviewed quotation",
                        "Ellenőrzött idézet mentése",
                      )}
                    </button>
                  </form>
                </aside>
              </div>
            ) : (
              <div className="review-empty">
                <FileText size={28} />
                <h3>
                  {t(
                    "Start with an original report",
                    "Kezdje egy eredeti lelettel",
                  )}
                </h3>
                <p>
                  {t(
                    "Add a fictional example report, or load the baseline and follow-up examples to explore the review workflow.",
                    "Adjon hozzá egy kitalált mintaleletet, vagy töltse be a kiinduló és kontroll-leletet a munkafolyamat kipróbálásához.",
                  )}
                </p>
              </div>
            )}
            <div className="review-section-heading">
              <h2>
                {t("Reviewed evidence library", "Ellenőrzött forrásidézetek")}
              </h2>
              <input
                className="review-search"
                aria-label={t("Search quotations", "Keresés az idézetekben")}
                placeholder={t(
                  "Search exact report text…",
                  "Keresés a lelet szövegében…",
                )}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="evidence-library">
              {workspace.evidence
                .filter((e) =>
                  `${e.quote} ${e.note}`
                    .toLocaleLowerCase()
                    .includes(query.toLocaleLowerCase()),
                )
                .map((e) => (
                  <article key={e.id}>
                    <header>
                      <button
                        className="text-button"
                        onClick={() => openEvidence(e.id)}
                      >
                        {sourceName(e.document_id)} · {t("p.", "o.")} {e.page}
                        <ArrowUpRight size={14} />
                      </button>
                      <span>{t("Source checked", "Forrás ellenőrizve")}</span>
                    </header>
                    <blockquote>{e.quote}</blockquote>
                    {e.note && <p>{e.note}</p>}
                    <small>
                      {ownerName(e.reviewer_id)} · {date(e.created_at)}
                    </small>
                  </article>
                ))}
            </div>
            {!workspace.evidence.length && (
              <p className="review-hint">
                {t(
                  "No source quotations have been reviewed yet.",
                  "Még nincs ellenőrzött forrásidézet.",
                )}
              </p>
            )}
          </div>
        )}
        {tab === "measurements" && (
          <div role="tabpanel">
            <div className="review-section-heading">
              <div>
                <h2>
                  {t(
                    "Track the same region over time",
                    "Ugyanazon régió követése időben",
                  )}
                </h2>
                <p>
                  {t(
                    "Source-linked measurements, not automatic tumour detection or a treatment-response classification.",
                    "Forráshoz kötött mérések; nem automatikus daganatfelismerés vagy terápiásválasz-besorolás.",
                  )}
                </p>
              </div>
              {regions.length > 0 && (
                <select
                  aria-label={t("Tracked region", "Követett régió")}
                  value={activeRegion}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  {regions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="measurement-layout">
              <section className="measurement-chart-panel">
                <div className="measurement-heading">
                  <span>
                    {activeRegion ??
                      t("No tracked region", "Nincs követett régió")}
                  </span>
                  {comparison && !comparison.reason && (
                    <strong>
                      {comparison.percent === null
                        ? t("Baseline is zero", "A kiinduló érték nulla")
                        : `${comparison.percent > 0 ? "+" : ""}${number(comparison.percent)}%`}
                      <small>{t("measured change", "mért változás")}</small>
                    </strong>
                  )}
                </div>
                {measurements.length ? (
                  <TrendChart points={measurements} t={t} />
                ) : (
                  <div className="review-empty">
                    <ChartLine size={28} />
                    <p>
                      {t(
                        "Save two dated observations to compare change.",
                        "Mentsen két különböző dátumú megfigyelést az összehasonlításhoz.",
                      )}
                    </p>
                  </div>
                )}
                {comparison?.reason && (
                  <p className="review-warning">{l(comparison.reason)}</p>
                )}
                {comparison && !comparison.reason && (
                  <p className="review-hint">
                    {t("Absolute difference", "Abszolút különbség")}:{" "}
                    {number(comparison.absolute!)} {latest?.unit}.{" "}
                    {t(
                      "No RECIST / RANO classification is assigned. Measurement variability and treatment context must be reviewed.",
                      "Nem történik RECIST- vagy RANO-besorolás. A mérési eltéréseket és a kezelési körülményeket külön kell értékelni.",
                    )}
                  </p>
                )}
                <div className="measurement-history">
                  {workspace.measurements
                    .filter((m) => m.region === activeRegion)
                    .map((m) => (
                      <div
                        key={m.id}
                        className={m.void_reason ? "is-void" : ""}
                      >
                        <span>
                          {date(m.measured_at)}
                          <small>
                            {m.protocol} ·{" "}
                            {t(
                              m.method === "longest-diameter"
                                ? "Longest diameter"
                                : "Segmented volume",
                              m.method === "longest-diameter"
                                ? "Legnagyobb átmérő"
                                : "Szegmentált térfogat",
                            )}
                          </small>
                        </span>
                        <strong>
                          {number(m.value)} {m.unit}
                        </strong>
                        <button
                          className="text-button"
                          onClick={() => openEvidence(m.evidence_id)}
                        >
                          {t("Source", "Forrás")}
                        </button>
                        {m.void_reason ? (
                          <small>
                            {t("Excluded", "Kizárva")}: {m.void_reason}
                          </small>
                        ) : (
                          <details>
                            <summary>{t("Correct", "Javítás")}</summary>
                            <form
                              onSubmit={(e) => {
                                const b = formValues(e);
                                void run(async () => {
                                  await apiRequest(
                                    `/api/review/measurements/${m.id}/void`,
                                    {
                                      method: "PATCH",
                                      body: JSON.stringify(b),
                                    },
                                  );
                                });
                              }}
                            >
                              <label>
                                <span>
                                  {t("Reason for exclusion", "Kizárás indoka")}
                                </span>
                                <input
                                  name="reason"
                                  minLength={3}
                                  maxLength={1000}
                                  required
                                />
                              </label>
                              <button className="text-button">
                                {t(
                                  "Exclude from comparison",
                                  "Kizárás az összehasonlításból",
                                )}
                              </button>
                            </form>
                          </details>
                        )}
                      </div>
                    ))}
                </div>
              </section>
              <section className="review-form">
                <h3>
                  {t(
                    "Add a measured observation",
                    "Mért megfigyelés hozzáadása",
                  )}
                </h3>
                <form
                  className="form-grid"
                  onSubmit={(e) => {
                    const element = e.currentTarget,
                      b = formValues(e);
                    const source = workspace.evidence.find(
                      (x) => x.id === b.evidence_id,
                    );
                    const sourceDoc = workspace.documents.find(
                      (d) => d.id === source?.document_id,
                    );
                    void run(async () => {
                      await post("measurements", {
                        ...b,
                        value: Number(b.value),
                        method:
                          b.unit === "mL"
                            ? "segmented-volume"
                            : "longest-diameter",
                        comparable: b.comparable === "yes",
                        measured_at: sourceDoc?.study_date,
                      });
                      setRegion(String(b.region));
                      element.reset();
                    });
                  }}
                >
                  <EvidenceSelect />
                  <label className="span-two">
                    <span>
                      {t("Stable region identifier", "Állandó régióazonosító")}
                    </span>
                    <input
                      name="region"
                      required
                      maxLength={100}
                      list="known-regions"
                      placeholder={t(
                        "e.g. Region A · left frontal",
                        "pl. A régió · bal frontális",
                      )}
                    />
                    <datalist id="known-regions">
                      {regions.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    <span>{t("Measured value", "Mért érték")}</span>
                    <input
                      name="value"
                      type="number"
                      min={0}
                      max={100000}
                      step="any"
                      required
                    />
                  </label>
                  <label>
                    <span>
                      {t("Method and unit", "Módszer és mértékegység")}
                    </span>
                    <select name="unit">
                      <option value="mm">
                        {t("Longest diameter · mm", "Legnagyobb átmérő · mm")}
                      </option>
                      <option value="mL">
                        {t(
                          "Segmented volume · mL",
                          "Szegmentált térfogat · mL",
                        )}
                      </option>
                    </select>
                  </label>
                  <label className="span-two">
                    <span>
                      {t(
                        "Protocol / sequence / measurement plane",
                        "Protokoll / szekvencia / mérési sík",
                      )}
                    </span>
                    <input
                      name="protocol"
                      maxLength={160}
                      required
                      placeholder={t("MRI T1 post-contrast, axial, 1 mm", "MR T1 kontrasztanyaggal, axiális, 1 mm")}
                    />
                  </label>
                  <MemberSelect team={team} t={t} />
                  <p className="review-hint span-two">
                    {t(
                      "The date is taken from the source study. Use the same region identifier and protocol only after checking that the measurements are comparable.",
                      "A dátumot a forráslelet adja. Azonos régióazonosítót és protokollt csak az összehasonlíthatóság ellenőrzése után használjon.",
                    )}
                  </p>
                  <label className="review-check span-two">
                    <input name="comparable" type="checkbox" value="yes" />
                    <span>
                      {t(
                        "I checked region identity, sequence, technique and units for longitudinal comparison.",
                        "Ellenőriztem a régió azonosságát, a szekvenciát, a mérési technikát és a mértékegységeket az időbeli összehasonlításhoz.",
                      )}
                    </span>
                  </label>
                  <button
                    className="button primary span-two"
                    disabled={!workspace.evidence.length}
                  >
                    {t("Save measurement", "Mérés mentése")}
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}
        {tab === "followup" && (
          <div role="tabpanel">
            <div className="review-section-heading">
              <div>
                <h2>
                  {t(
                    "A recommendation is not a completed action",
                    "A javaslat még nem elvégzett teendő",
                  )}
                </h2>
                <p>
                  {t(
                    "Assign → acknowledge → review the result → close. Overdue status is calculated locally; no messages are sent.",
                    "Kiosztás → átvétel → eredmény ellenőrzése → lezárás. A késést helyben számítjuk; üzenetet nem küldünk.",
                  )}
                </p>
              </div>
            </div>
            <div className="followup-layout">
              <section className="followup-list">
                {!workspace.followups.length && (
                  <div className="review-empty">
                    <Clock size={28} />
                    <h3>
                      {t(
                        "No follow-up recorded",
                        "Nincs rögzített utánkövetés",
                      )}
                    </h3>
                    <p>
                      {t(
                        "Turn a reviewed report recommendation into an owned, traceable action.",
                        "Az ellenőrzött lelet javaslatából készítsen felelőshöz rendelt, követhető teendőt.",
                      )}
                    </p>
                  </div>
                )}
                {workspace.followups.map((f) => (
                  <article className="followup-card" key={f.id}>
                    <header>
                      <span className={`review-state ${f.status}`}>
                        {f.status === "completed"
                          ? t(
                              "Result reviewed · closed",
                              "Eredmény ellenőrizve · lezárva",
                            )
                          : f.status === "acknowledged"
                            ? t("Acknowledged", "Átvéve")
                            : t("Awaiting acknowledgement", "Átvételre vár")}
                      </span>
                      {f.status !== "completed" && f.due_date < today() && (
                        <span className="review-overdue">
                          {t("Overdue", "Lejárt")}
                        </span>
                      )}
                      <span>{l(f.priority)}</span>
                    </header>
                    <h3>{f.recommendation}</h3>
                    <p>
                      {ownerName(f.owner_id)} · {date(f.due_date)}
                    </p>
                    <div className="review-inline-actions">
                      <button
                        className="text-button"
                        onClick={() => openEvidence(f.evidence_id)}
                      >
                        {t("Recommendation source", "Javaslat forrása")}
                        <ArrowUpRight size={14} />
                      </button>
                      {f.result_evidence_id && (
                        <button
                          className="text-button"
                          onClick={() => openEvidence(f.result_evidence_id!)}
                        >
                          {t("Reviewed result", "Ellenőrzött eredmény")}
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                    <details className="followup-action">
                      <summary>
                        {f.status === "completed"
                          ? t("Reopen with a reason", "Újranyitás indoklással")
                          : t(
                              "Record next action",
                              "Következő lépés rögzítése",
                            )}
                      </summary>
                      <form
                        className="form-grid"
                        onSubmit={(e) => {
                          const b = formValues(e);
                          void run(async () => {
                            await apiRequest(`/api/review/followups/${f.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({
                                ...b,
                                version: f.version,
                              }),
                            });
                          });
                        }}
                      >
                        <MemberSelect name="actor_id" team={team} t={t} />
                        <label>
                          <span>{t("Action", "Művelet")}</span>
                          <select
                            name="action"
                            defaultValue={
                              f.status === "open"
                                ? "acknowledge"
                                : f.status === "acknowledged"
                                  ? "complete"
                                  : "reopen"
                            }
                          >
                            {f.status === "open" ? (
                              <option value="acknowledge">
                                {t(
                                  "Record acknowledgement",
                                  "Átvétel rögzítése",
                                )}
                              </option>
                            ) : f.status === "acknowledged" ? (
                              <>
                                <option value="complete">
                                  {t(
                                    "Close with reviewed result",
                                    "Lezárás ellenőrzött eredménnyel",
                                  )}
                                </option>
                                <option value="reopen">
                                  {t("Reopen", "Újranyitás")}
                                </option>
                              </>
                            ) : (
                              <option value="reopen">
                                {t("Reopen", "Újranyitás")}
                              </option>
                            )}
                          </select>
                        </label>
                        {f.status === "acknowledged" && (
                          <label className="span-two">
                            <span>
                              {t(
                                "Result source · required to close",
                                "Eredmény forrása · lezáráshoz kötelező",
                              )}
                            </span>
                            <select name="result_evidence_id" defaultValue="">
                              <option value="">
                                {t(
                                  "Select reviewed result",
                                  "Válasszon ellenőrzött eredményt",
                                )}
                              </option>
                              {workspace.evidence
                                .filter((e) => e.id !== f.evidence_id)
                                .map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {evidenceName(e)}
                                  </option>
                                ))}
                            </select>
                          </label>
                        )}
                        <label className="span-two">
                          <span>
                            {t(
                              "Communication / outcome note",
                              "Kommunikációs / eredmény-megjegyzés",
                            )}
                          </span>
                          <textarea
                            name="note"
                            required
                            minLength={3}
                            maxLength={2000}
                            rows={2}
                          />
                        </label>
                        <button className="button secondary span-two">
                          {t("Save action", "Művelet mentése")}
                        </button>
                      </form>
                    </details>
                    <details className="followup-audit">
                      <summary>
                        {t("Action history", "Műveleti előzmények")} ·{" "}
                        {
                          workspace.events.filter((e) => e.followup_id === f.id)
                            .length
                        }
                      </summary>
                      <ol>
                        {workspace.events
                          .filter((e) => e.followup_id === f.id)
                          .map((e) => (
                            <li key={e.id}>
                              <strong>
                                {t(
                                  e.action === "assigned"
                                    ? "Assigned"
                                    : e.action === "acknowledge"
                                      ? "Acknowledged"
                                      : e.action === "complete"
                                        ? "Completed"
                                        : "Reopened",
                                  e.action === "assigned"
                                    ? "Kiosztva"
                                    : e.action === "acknowledge"
                                      ? "Átvéve"
                                      : e.action === "complete"
                                        ? "Lezárva"
                                        : "Újranyitva",
                                )}
                              </strong>
                              <span>
                                {ownerName(e.actor_id)} ·{" "}
                                {new Date(e.occurred_at).toLocaleString(
                                  locale(),
                                )}
                              </span>
                              <p>{e.note}</p>
                            </li>
                          ))}
                      </ol>
                    </details>
                  </article>
                ))}
              </section>
              <section className="review-form">
                <h3>{t("Create a follow-up", "Utánkövetés létrehozása")}</h3>
                <form
                  className="form-grid"
                  onSubmit={(e) => {
                    const element = e.currentTarget,
                      b = formValues(e);
                    void run(async () => {
                      await post("followups", b);
                      element.reset();
                    });
                  }}
                >
                  <EvidenceSelect />
                  <label className="span-two">
                    <span>
                      {t(
                        "Action from the recommendation",
                        "A javaslatból következő teendő",
                      )}
                    </span>
                    <textarea
                      name="recommendation"
                      required
                      maxLength={1000}
                      rows={3}
                    />
                  </label>
                  <MemberSelect name="owner_id" team={team} t={t} />
                  <label>
                    <span>{t("Agreed due date", "Egyeztetett határidő")}</span>
                    <input name="due_date" type="date" required />
                  </label>
                  <label>
                    <span>{t("Priority", "Prioritás")}</span>
                    <select name="priority">
                      <option value="routine">{t("Routine", "Rutin")}</option>
                      <option value="high">{t("High", "Magas")}</option>
                      <option value="urgent">{t("Urgent", "Sürgős")}</option>
                    </select>
                  </label>
                  <p className="span-two review-hint">
                    {t(
                      "A clinician sets the deadline; the app does not prescribe a follow-up interval. Recording an action does not send a notification.",
                      "A határidőt orvos határozza meg; az alkalmazás nem ír elő kontrollidőpontot. A rögzítés nem küld értesítést.",
                    )}
                  </p>
                  <button
                    className="button primary span-two"
                    disabled={!workspace.evidence.length}
                  >
                    {t("Assign follow-up", "Utánkövetés kiosztása")}
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}
      </fieldset>
      {busy && (
        <p className="review-saving" role="status">
          {t("Processing and saving…", "Feldolgozás és mentés…")}
        </p>
      )}
    </>
  );
}

function TrendChart({ points, t }: { points: Measurement[]; t: Translator }) {
  const sameUnit = points.every(
    (p) => p.unit === points[0].unit && p.method === points[0].method,
  );
  if (!sameUnit)
    return (
      <p className="review-warning">
        {t(
          "Chart withheld: mixed units or measurement methods. Review the source entries below.",
          "A diagram nem jeleníthető meg: eltérő mértékegységek vagy módszerek. Ellenőrizze az alábbi forrásbejegyzéseket.",
        )}
      </p>
    );
  const max = Math.max(1, ...points.map((p) => p.value)) * 1.2,
    start = Date.parse(points[0].measured_at),
    end = Date.parse(points.at(-1)!.measured_at);
  const x = (p: Measurement) =>
      end === start
        ? 330
        : 65 + ((Date.parse(p.measured_at) - start) / (end - start)) * 520,
    y = (p: Measurement) => 210 - (p.value / max) * 165;
  return (
    <svg
      className="trend-chart"
      viewBox="0 0 660 265"
      role="img"
      aria-label={t(
        "Recorded region measurements over time. See the exact values below.",
        "Rögzített régiómérések időben. A pontos értékek alább olvashatók.",
      )}
    >
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line
            x1="65"
            x2="585"
            y1={210 - v * 165}
            y2={210 - v * 165}
            stroke="#e8edf3"
          />
          <text x="53" y={214 - v * 165} textAnchor="end">
            {number(max * v)}
          </text>
        </g>
      ))}
      <text x="65" y="23">
        {points[0].unit}
      </text>
      {points
        .slice(1)
        .map(
          (p, i) =>
            !compareMeasurements(points[i], p).reason && (
              <line
                key={p.id}
                x1={x(points[i])}
                y1={y(points[i])}
                x2={x(p)}
                y2={y(p)}
                stroke="#1681db"
                strokeWidth="2.5"
              />
            ),
        )}
      {points.map((p) => (
        <g key={p.id}>
          <circle
            cx={x(p)}
            cy={y(p)}
            r="5"
            fill={p.comparable ? "#1681db" : "#8b9aaa"}
            stroke="white"
            strokeWidth="2"
          >
            <title>
              {date(p.measured_at)}: {number(p.value)} {p.unit}
            </title>
          </circle>
          <text x={x(p)} y={y(p) - 13} textAnchor="middle">
            {number(p.value)}
          </text>
        </g>
      ))}
      <text x="65" y="247">
        {date(points[0].measured_at)}
      </text>
      {end !== start && (
        <text x="585" y="247" textAnchor="end">
          {date(points.at(-1)!.measured_at)}
        </text>
      )}
    </svg>
  );
}
