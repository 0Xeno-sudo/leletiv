import { validateDocument } from "../shared/review";

export async function pdfLibrary() {
  const library = await import("pdfjs-dist");
  const { default: worker } = await import(
    "pdfjs-dist/build/pdf.worker.min.mjs?url"
  );
  library.GlobalWorkerOptions.workerSrc = worker;
  return library;
}
export async function extractReport(file: File): Promise<string[]> {
  if (
    !file.size ||
    file.size > 8 * 1024 * 1024 ||
    !/\.(pdf|txt)$/i.test(file.name)
  )
    throw new Error("Choose a PDF or UTF-8 text file up to 8 MB.");
  let pages: string[] = [];
  if (/\.txt$/i.test(file.name))
    pages = [
      new TextDecoder("utf-8", { fatal: true }).decode(
        await file.arrayBuffer(),
      ),
    ];
  else {
    const pdf = await pdfLibrary();
    const task = pdf.getDocument({
      data: await file.arrayBuffer(),
      useSystemFonts: true,
    });
    try {
      const document = await task.promise;
      if (document.numPages > 50)
        throw new Error(
          "Use a text-readable document: up to 50 pages and 120,000 characters. Scanned PDFs need external OCR and manual verification.",
        );
      let count = 0;
      for (let i = 1; i <= document.numPages; i++) {
        const page = await document.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) =>
            "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
          )
          .join("");
        count += text.length;
        if (count > 120000) throw new Error("The document text is too large.");
        pages.push(text);
      }
    } finally {
      await task.destroy();
    }
  }
  const error = validateDocument({
    title: "source",
    study_date: "2026-01-01",
    modality: "Other",
    pages,
  });
  if (error) throw new Error(error);
  return pages;
}
