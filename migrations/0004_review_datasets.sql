ALTER TABLE review_documents ADD COLUMN dataset TEXT NOT NULL DEFAULT 'workspace'
  CHECK(dataset IN ('workspace','verification','archived'));
ALTER TABLE review_documents ADD COLUMN sample_language TEXT
  CHECK(sample_language IS NULL OR sample_language IN ('hu','en'));
CREATE INDEX review_documents_scope ON review_documents(case_id,dataset,sample_language);

