import { useLanguage } from "../lib/i18n";
export function ModelScope() {
  const hu = useLanguage() === "hu";
  return (
    <section className="model-scope">
      <h2>
        {hu
          ? "Mit tudunk az MR-gliómamodell pontosságáról?"
          : "What do we know about the MRI glioma model?"}
      </h2>
      <div>
        <p>
          {hu
            ? "A BraTS MR-modell négy előkészített MR-szekvenciából jelöl ki lehetséges gliomarégiókat. Nem általános daganatkereső; nem értékel PDF-leletet, szövettani képet vagy tetszőleges CT-t."
            : "The BraTS MRI model segments candidate glioma regions from four prepared MRI sequences. It is not a general cancer detector and does not interpret PDF reports, pathology images or arbitrary CT scans."}
        </p>
        <p>
          {hu
            ? "Ehhez az alkalmazáshoz nincs klinikai érzékenységi vizsgálat vagy ChatGPT-, Claude- és Gemini-összehasonlítás. Kis elváltozások kimaradhatnak. Az üres maszk nem zár ki betegséget."
            : "There is no clinical sensitivity study or head-to-head ChatGPT, Claude or Gemini benchmark for this application. Small lesions may be missed. An empty mask does not rule out disease."}
        </p>
      </div>
      <a
        href="https://huggingface.co/MONAI/brats_mri_segmentation/blob/main/docs/README.md"
        target="_blank"
        rel="noreferrer"
      >
        {hu
          ? "Eredeti modellleírás és korlátok ↗"
          : "Original model documentation and limitations ↗"}
      </a>
    </section>
  );
}
