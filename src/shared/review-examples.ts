/** Authored fictional reports, never translations of an uploaded original. */
export function reviewExamples(language: "en" | "hu") {
  const hu = language === "hu";
  return [12, 15].map((value, index) => {
    const day = index === 0 ? "2026-08-01" : "2026-09-01";
    const quote = hu
      ? `A bal frontális, kontraszthalmozó elváltozás legnagyobb átmérője ${value} mm. Új kontraszthalmozó elváltozás nem látható.`
      : `The left frontal enhancing lesion measures ${value} mm in longest diameter. No new enhancing lesion is seen.`;
    const title = hu
      ? index === 0 ? "Koponya-MR · kiinduló vizsgálat" : "Koponya-MR · kontrollvizsgálat"
      : index === 0 ? "Brain MRI · baseline examination" : "Brain MRI · follow-up examination";
    const protocol = hu ? "MR T1 kontrasztanyaggal, axiális, 1 mm" : "MRI T1 post-contrast, axial, 1 mm";
    const recommendation = hu
      ? "A kiinduló és kontroll-MR közös áttekintése az onkoteamen; a további teendők dokumentálása."
      : "Review the baseline and follow-up MRI at the tumour board and document the next steps.";
    const body = hu
      ? `BEMUTATÓ LELET · Kitalált eset, nem használható betegellátáshoz.\n\nVizsgálat: ${title}\nDátum: ${day}\nIndikáció: ismert bal frontális elváltozás követése.\nTechnika: ${protocol}.\n\nLelet\n${quote}\n${index ? "Összehasonlítás: 2026-08-01, korábban 12 mm." : "Kiinduló mérés a későbbi összehasonlításhoz."}\n\nJavaslat\n${recommendation}\nA méretváltozás önmagában nem határozza meg a terápiás választ.`
      : `DEMO REPORT · Fictional case, not for patient care.\n\nExamination: ${title}\nDate: ${day}\nIndication: surveillance of a known left frontal lesion.\nTechnique: ${protocol}.\n\nFindings\n${quote}\n${index ? "Comparison: 2026-08-01, previously 12 mm." : "Baseline measurement for subsequent comparison."}\n\nRecommendation\n${recommendation}\nSize change alone does not determine treatment response.`;
    return { title, day, body, quote, value, protocol, recommendation,
      region: hu ? "Bal frontális elváltozás" : "Left frontal lesion",
      note: hu ? "A mérési hely, a mértékegység és a tagadó megállapítás egyeztetve a lelettel."
        : "Measurement site, unit and negative finding checked against the report.",
    };
  });
}
