import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useLanguage, locale } from "../lib/i18n";
import { useAppData } from "../lib/workspace";
import type { Followup } from "../shared/review";
export function FollowupSummary({ caseId }: { caseId?: string }) {
  const hu = useLanguage() === "hu";
  const { data } = useAppData();
  const [rows, setRows] = useState<
      (Followup & { patient_name: string })[] | null
    >(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    void apiRequest<(Followup & { patient_name: string })[]>(
      `/api/review/summary?language=${hu ? "hu" : "en"}`,
    )
      .then((r) => {
        if (active) setRows(r);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [data?.generated_at, hu]);
  const filtered = rows?.filter((f) => !caseId || f.case_id === caseId);
  return (
    <section className="followup-summary">
      <header>
        <h2>{hu ? "Nyitott utánkövetések" : "Open follow-ups"}</h2>
        <Link to={`/review${caseId ? `?case=${caseId}` : ""}`}>
          {hu ? "Leletek és utánkövetés" : "Evidence & follow-up"} ↗
        </Link>
      </header>
      {failed ? (
        <p role="alert">
          {hu
            ? "Az utánkövetések nem tölthetők be. Nyissa meg a leletmunkateret az újrapróbáláshoz."
            : "Follow-ups could not be loaded. Open the evidence workspace to retry."}
        </p>
      ) : filtered === undefined ? (
        <p>{hu ? "Betöltés…" : "Loading…"}</p>
      ) : filtered.length ? (
        <div className="followup-summary-list">
          {filtered.map((f) => (
            <Link key={f.id} to={`/review?case=${f.case_id}`}>
              <span>
                <strong>{f.recommendation}</strong>
                <small>
                  {f.patient_name} ·{" "}
                  {data?.team.find((t) => t.id === f.owner_id)?.name}
                </small>
              </span>
              <time>
                {new Date(`${f.due_date}T12:00:00`).toLocaleDateString(
                  locale(),
                )}
              </time>
              <span>
                {f.status === "open"
                  ? hu
                    ? "Átvételre vár"
                    : "Awaiting acknowledgement"
                  : hu
                    ? "Átvéve"
                    : "Acknowledged"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p>
          {hu
            ? "Nincs nyitott utánkövetés rögzítve. Ez önmagában nem igazolja az ellátás teljességét."
            : "No open follow-up is recorded. This alone does not establish completeness of care."}
        </p>
      )}
    </section>
  );
}
