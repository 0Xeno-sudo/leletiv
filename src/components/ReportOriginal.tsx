import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/i18n";
import { pdfLibrary } from "../lib/reports";
import type { ReviewDocument } from "../shared/review";

/** Only source PDF pixels are rendered; this is not a generated medical image. */
export function ReportOriginal({
  document,
  page,
}: {
  document: ReviewDocument;
  page: number;
}) {
  const language = useLanguage(),
    canvas = useRef<HTMLCanvasElement>(null),
    [state, setState] = useState("loading");
  useEffect(() => {
    if (!/\.pdf$/i.test(document.file_name)) return;
    let disposed = false;
    const abort = new AbortController();
    let cleanup: (() => Promise<void>) | undefined;
    setState("loading");
    void (async () => {
      try {
        const response = await fetch(
          `/api/review/documents/${document.id}/source`,
          { signal: abort.signal },
        );
        if (!response.ok) throw new Error();
        const bytes = await response.arrayBuffer();
        if (disposed) return;
        const library = await pdfLibrary();
        if (disposed) return;
        const task = library.getDocument({ data: bytes, useSystemFonts: true });
        cleanup = () => task.destroy();
        const pdf = await task.promise;
        if (disposed) return;
        const source = await pdf.getPage(page);
        if (disposed || !canvas.current) return;
        const natural = source.getViewport({ scale: 1 });
        const viewport = source.getViewport({
          scale: Math.min(1.5, 1200 / natural.width),
        });
        const element = canvas.current;
        element.width = viewport.width;
        element.height = viewport.height;
        await source.render({ canvas: element, viewport }).promise;
        if (!disposed) setState("ready");
      } catch {
        if (!disposed) setState("error");
      }
    })();
    return () => {
      disposed = true;
      abort.abort();
      void cleanup?.();
    };
  }, [document.id, document.file_name, page]);
  if (!/\.pdf$/i.test(document.file_name)) return null;
  return (
    <div className="report-original">
      {state !== "ready" && (
        <p role="status">
          {state === "error"
            ? language === "hu"
              ? "Az eredeti PDF nem jeleníthető meg. Töltse le az ellenőrzéshez."
              : "The original PDF could not be rendered. Download it for review."
            : language === "hu"
              ? "Eredeti oldal betöltése…"
              : "Loading original page…"}
        </p>
      )}
      <canvas
        ref={canvas}
        aria-label={
          language === "hu" ? "Eredeti PDF-oldal" : "Original PDF page"
        }
      />
    </div>
  );
}
