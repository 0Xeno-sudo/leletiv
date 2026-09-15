/** Display labels for app-generated analysis metadata. Never apply to source reports or clinician notes. */
const labels: Record<string, string> = {
  'Importált kutatási maszk': 'Betöltött kutatási területkijelölés',
  'Modellből származó kutatási maszk': 'Modell által javasolt területkijelölés',
  'Félautomatikus régiónövesztés': 'Félautomatikus területkijelölés',
  'Egyetlen 3D NIfTI-1 CT szükséges, legfeljebb 12 millió voxellel.': 'Egyetlen 3D NIfTI-1 CT szükséges, legfeljebb 12 millió térbeli képponttal.',
  'Az újramintavételezett CT túl nagy. Legfeljebb 16 millió voxel támogatott a helyi CPU-profilban.': 'A felbontás egységesítése után a CT-képanyag túl nagy. A helyi feldolgozás legfeljebb 16 millió térbeli képpontot támogat.',
  'NIfTI-1 térfogat szükséges, legfeljebb 64 millió voxellel és a feladatnak megfelelő dimenzióval.': 'NIfTI-1 képanyag szükséges, legfeljebb 64 millió térbeli képponttal és a feladatnak megfelelő dimenzióval.',
  'Nyírt voxelrács nem regisztrálható; előzetes geometriai korrekció szükséges.': 'A felvétel térbeli torzulása miatt az illesztés nem végezhető el; előzetes képi korrekció szükséges.',
  'Rigid registration + gated spatial assignment; native-grid volumetry': 'Térbeli illesztés eltolással és forgatással; az elváltozások helyzet alapján történő párosítása. Térfogatmérés az eredeti felvételeken.',
  'Imported TotalSegmentator total label map': 'Betöltött szervkijelölések a TotalSegmentator total területazonosítói szerint.',
  'TotalSegmentator total / fast CPU': 'Szervek automatikus körülhatárolása a TotalSegmentator total modell gyors, helyi feldolgozásával.',
  'Selected labelled paraspinal/iliopsoas muscles at L3; not total skeletal muscle index': 'A kijelölt gerinc melletti és csípőhorpaszizmok mérése az L3 szintjében. Nem a teljes vázizomzatból számított izomindex.',
  'Importált teljes szövetmaszk': 'Betöltött izom- és zsírszövet-kijelölés.',
  'Stanford MIMI v0.0.2; automatikus L3 szövetmaszk, ellenőrzendő': 'Izom- és zsírszövet automatikus körülhatárolása az L3 szintjében (Stanford MIMI v0.0.2). Ellenőrzést igényel.',
  'Imported reviewed-region candidates on native PET grid': 'Betöltött területkijelölések az eredeti PET-felvételen; ellenőrzést igényelnek.',
  'SUV threshold connected components; includes physiological uptake': 'A megadott SUV-küszöb feletti összefüggő területek kijelölése. Élettani halmozást is tartalmazhat.',
  'HED colour deconvolution + watershed nuclei + DAB threshold (deterministic, not a trained cancer detector)': 'A festési színek szétválasztása, sejtmagok körülhatárolása és DAB-pozitivitás mérése a megadott küszöbbel. Képfeldolgozó eljárás, nem betanított daganatfelismerő modell.',
  'Multiparametric map fusion; monoexponential ADC; optional first-pass DSC integral': 'MR-térképek együttes megjelenítése; ADC-számítás egykomponensű exponenciális illesztéssel, illetve DSC esetén a kontrasztanyag első áthaladásához tartozó jelváltozás összegzése.',
  adcValidFraction: 'Értékelhető ADC-képpontok aránya',
  adcUnits: 'ADC mértékegysége és számítása',
  dwiRegistration: 'DWI térbeli illesztése',
  dscRegistration: 'DSC térbeli illesztése',
  dscMethod: 'DSC számítási eljárás',
  'mm²/s; monoexponential fit': 'mm²/s; egykomponensű exponenciális illesztés',
  'First-pass ΔR2* integral; no leakage correction, not deconvolved CBF/MTT': 'Az első áthaladás ΔR2*-jelváltozásának összegzése. Szivárgáskorrekció, CBF- és MTT-számítás nélkül.',
  'Anatómiai címkék': 'Körülhatárolt szervek',
  'Testösszetételi maszk': 'Izom- és zsírszövet kijelölése',
  'A szervmaszk nem daganatdetektálás.': 'A szervek körülhatárolása nem jelent daganatfelismerést.',
  'Az L3 szintjét és a teljes izom-/zsírmaszkot ellenőrizni kell; az index a megadott testmagasságból számolódik.': 'Az L3 szintjét és az izom- és zsírszövet teljes kijelölését ellenőrizni kell. Az index a megadott testmagasságból számolódik.',
  'A térképek ismert közös fizikai térben legyenek; a rácsra mintavételezés nem mozgáskorrekció.': 'A térképek térbeli helyzete és tájolása egyezzen meg. A felbontás egységesítése nem korrigálja a mozgásból eredő eltéréseket.',
};

export function medicalLabel(value: string): string {
  return labels[value] ?? value;
}

const organs: Record<string, string> = {
  spleen: 'Lép', kidney: 'Vese', kidney_cyst: 'Veseciszta', gallbladder: 'Epehólyag', liver: 'Máj', stomach: 'Gyomor', pancreas: 'Hasnyálmirigy', adrenal_gland: 'Mellékvese',
  lung_upper_lobe: 'Felső tüdőlebeny', lung_middle_lobe: 'Középső tüdőlebeny', lung_lower_lobe: 'Alsó tüdőlebeny',
  esophagus: 'Nyelőcső', trachea: 'Légcső', thyroid_gland: 'Pajzsmirigy', small_bowel: 'Vékonybél', duodenum: 'Patkóbél', colon: 'Vastagbél', urinary_bladder: 'Húgyhólyag', prostate: 'Prosztata',
  sacrum: 'Keresztcsont', heart: 'Szív', aorta: 'Aorta', pulmonary_vein: 'Tüdővéna', brachiocephalic_trunk: 'Kar-fej verőértörzs', subclavian_artery: 'Kulcscsont alatti verőér', common_carotid_artery: 'Közös nyaki verőér', brachiocephalic_vein: 'Kar-fej véna', atrial_appendage: 'Pitvari fülcse', superior_vena_cava: 'Felső üres véna', inferior_vena_cava: 'Alsó üres véna', portal_vein_and_splenic_vein: 'Kapuvéna és lépvéna', iliac_artery: 'Csípőverőér', iliac_vena: 'Csípővéna',
  humerus: 'Felkarcsont', scapula: 'Lapocka', clavicula: 'Kulcscsont', femur: 'Combcsont', hip: 'Medencecsont', spinal_cord: 'Gerincvelő', gluteus_maximus: 'Nagy farizom', gluteus_medius: 'Középső farizom', gluteus_minimus: 'Kis farizom', autochthon: 'Mély hátizmok', iliopsoas: 'Csípőhorpaszizom', brain: 'Agy', skull: 'Koponya', sternum: 'Szegycsont', costal_cartilages: 'Bordaporcok',
};

export function anatomyLabel(name: string | undefined): string {
  if (!name) return 'Névtelen régió';
  if (organs[name]) return organs[name];
  const vertebra = /^vertebrae_([CTLS]\d+)$/.exec(name);
  if (vertebra) return `${vertebra[1]} csigolya`;
  const rib = /^rib_(left|right)_(\d+)$/.exec(name);
  if (rib) return `${rib[1] === 'left' ? 'Bal' : 'Jobb'} ${rib[2]}. borda`;
  const side = /^(.*)_(left|right)$/.exec(name);
  if (side && organs[side[1]]) return `${side[2] === 'left' ? 'Bal' : 'Jobb'} ${organs[side[1]].toLocaleLowerCase('hu-HU')}`;
  return name;
}

/** Registration JSON remains in the downloaded result; the UI shows its meaningful summary. */
export function qualityValue(key: string, value: string | number): string {
  if (key === 'dwiRegistration' || key === 'dscRegistration') {
    try {
      const registration = JSON.parse(String(value)) as {coverageFraction?: number};
      if (typeof registration.coverageFraction === 'number' && Number.isFinite(registration.coverageFraction)) {
        return `Illesztés eltolással és forgatással. Közös látómező: ${(registration.coverageFraction * 100).toLocaleString('hu-HU', {maximumFractionDigits: 1})}%. Ez nem az illesztési pontosság mértéke. A részletes adatok az eredménycsomagban találhatók.`;
      }
    } catch { /* Unknown metadata stays available in the original result download. */ }
    return 'Az illesztés részletes adatai a letölthető eredménycsomagban találhatók.';
  }
  if (key === 'adcValidFraction' && typeof value === 'number') return `${(value * 100).toLocaleString('hu-HU', {maximumFractionDigits: 1})}%`;
  return typeof value === 'number' ? value.toLocaleString('hu-HU', {maximumFractionDigits: 6}) : medicalLabel(value);
}
