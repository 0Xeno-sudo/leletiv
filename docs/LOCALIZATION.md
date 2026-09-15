# Hungarian and English interface

Hungarian is the initial default. The header HU/EN control updates all mounted sections without remounting the viewer and stores the preference as `neuroflow.language` in local storage. A reload retains it. Dates and volume measurements use the selected locale; document language and browser title follow it.

`src/lib/translations.hu.ts` contains authored Hungarian interface and demonstration-data translations. `src/lib/i18n.ts` supplies reactive language selection, display translation and exact-match demonstration-record translation. IDs, API status codes, stored data, selection values and event handlers are not translated. User-authored clinical narratives are not automatically translated; recognized seeded demonstration copy has curated Hungarian versions.

`scripts/localize-ui.mjs` was a one-time JSX migration helper. It emits an apply_patch patch and is idempotent for migrated files. New UI should call the localization functions directly and provide explicit `value` attributes for select options so translated labels cannot change API values.

The pure translation tests cover composed labels, identifiers, word boundaries and preserving arbitrary clinical notes. Browser checks cover language persistence, Hungarian search and both locale routes. A bilingual clinician should review medical terminology before adapting the project for clinical use.
