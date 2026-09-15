/** Dataset selection is test-data isolation, NOT authentication or authorization. */
export const reviewDataset = (selector?: string) =>
  selector === "verification" ? "verification" : "workspace";

/** Only authored examples are locale-filtered. Uploaded originals have a NULL language. */
export const reviewDocumentScope =
  "dataset = ? AND (sample_language IS NULL OR sample_language = ?)";
export const visibleReviewDocuments = `SELECT id FROM review_documents WHERE ${reviewDocumentScope}`;
export const visibleReviewEvidence = `SELECT id FROM review_evidence WHERE document_id IN (${visibleReviewDocuments})`;
