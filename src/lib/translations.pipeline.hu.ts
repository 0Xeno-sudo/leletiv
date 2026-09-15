export const pipelineHungarian:Record<string,string>=Object.fromEntries(`
Scan-to-segmentation pipeline|A felvételtől a szegmentálásig
Local research data · no external upload|Helyi kutatási adatok · külső feltöltés nélkül
Recent local runs|Legutóbbi helyi futtatások
Choose a run|Futtatás kiválasztása
Synthetic check|Bemutatópróba
Research run|Kutatási futtatás
queued|várakozik
running|folyamatban
completed|elkészült
failed|sikertelen
cancelled|megszakítva
From acquisition to review|A képalkotástól az áttekintésig
Medical model workspace|Orvosi modell munkatere
Checking local engine…|Helyi feldolgozó ellenőrzése…
Local engine ready · CPU|Helyi feldolgozó kész · CPU
Model installation required|A modellt telepíteni kell
Local engine offline|A helyi feldolgozó nem érhető el
Reconnect|Újracsatlakozás
DICOM conversion stays in this browser. Running segmentation sends the four selected sequences only to the inference service on this computer, never to an external AI provider.|A DICOM-konverzió a böngészőben történik. A szegmentálás indításakor a négy kiválasztott MR-szekvencia kizárólag az ezen a számítógépen futó helyi feldolgozóhoz kerül, külső MI-szolgáltatóhoz nem.
Convert DICOM series|DICOM-sorozatok átalakítása
Select a scan folder. Each converted series remains separate so you can inspect and assign the correct MRI sequence.|Válassz ki egy képanyagmappát. Az átalakított sorozatok külön maradnak, így ellenőrizheted őket, és hozzárendelheted a megfelelő MR-szekvenciához.
Choose DICOM folder|DICOM-mappa kiválasztása
Convert synthetic DICOM demo|Bemutató DICOM-sorozat átalakítása
Converting DICOM…|DICOM-konverzió folyamatban…
View volume|Térfogat megtekintése
Conversion is not registration or skull stripping. Raw DICOM series may still need preprocessing before the model accepts them.|A konverzió nem térbeli illesztés vagy koponyaeltávolítás. A nyers DICOM-sorozatok a modell használata előtt további előfeldolgozást igényelhetnek.
Prepare four MRI sequences|Négy MR-szekvencia előkészítése
BraTS glioma model · T1c → T1 → T2 → FLAIR · 1 mm isotropic · matching RAS coordinates.|BraTS gliómamodell · T1c → T1 → T2 → FLAIR · 1 mm-es izotróp felbontás · egyező RAS-koordináták.
T1 + contrast|T1 + kontraszt
Choose NIfTI|NIfTI kiválasztása
Choose T1C sequence|T1c-szekvencia kiválasztása
Choose T1 sequence|T1-szekvencia kiválasztása
Choose T2 sequence|T2-szekvencia kiválasztása
Choose FLAIR sequence|FLAIR-szekvencia kiválasztása
Assign converted T1C series|Átalakított T1c-sorozat hozzárendelése
Assign converted T1 series|Átalakított T1-sorozat hozzárendelése
Assign converted T2 series|Átalakított T2-sorozat hozzárendelése
Assign converted FLAIR series|Átalakított FLAIR-sorozat hozzárendelése
Use converted series…|Átalakított sorozat használata…
These are de-identified research inputs: skull-stripped, co-registered and assigned to the correct sequences. I understand that this model is not validated for patient care.|Az adatok személyazonosításra nem alkalmas kutatási felvételek: a koponyán kívüli részek eltávolítása és a közös térbe illesztés megtörtént, a szekvenciák hozzárendelése helyes. Tudomásul veszem, hogy a modell betegellátásra nem validált.
Run tumour segmentation|Daganatszegmentálás indítása
Run synthetic model check|Modellpróba bemutatóadatokkal
The synthetic check runs the actual pretrained weights on a small geometric phantom. It proves execution, not medical accuracy.|A próba a valódi, előre betanított modellt futtatja egy kis geometriai fantomon. A működést ellenőrzi, nem az orvosi pontosságot.
Start both local services with:|Mindkét helyi szolgáltatás indítása:
Inspect model output|A modell eredményének ellenőrzése
A completed job provides a source-aligned mask, per-region volumes and a reproducible model/input record.|Az elkészült feladat a forráshoz illeszkedő maszkot, régiónkénti térfogatokat és a modell, illetve a bemeneti adatok visszakövethető leírását adja.
Progress indicates processing stages, not an estimated completion time.|A folyamatjelző a feldolgozási szakaszt mutatja, nem a hátralévő idő becslését.
Synthetic execution check · not patient imaging|Bemutató működési próba · nem betegfelvétel
Research MRI prediction · clinician review required|Kutatási MR-modellbecslés · orvosi ellenőrzést igényel
Non-enhancing / necrotic core|Nem halmozó / nekrotikus mag
Peritumoral edema|Peritumorális ödéma
Enhancing tumour|Kontraszthalmozó daganatrész
Reload result in viewer|Eredmény újratöltése
Open result in 3D|Eredmény megnyitása 3D-ben
I have visually inspected this research overlay. This is not clinical approval.|Szemrevételeztem ezt a kutatási fedvényt. Ez nem klinikai jóváhagyás.
Export model provenance|A modell eredetadatainak exportálása
Cancel job|Feldolgozás megszakítása
Clear local job files|Helyi feldolgozási fájlok törlése
Jobs are temporary: clear them here or they expire after one hour on the next service request. No files are saved to the patient archive automatically.|A feldolgozások ideiglenesek: itt törölhetők, vagy egy óra elteltével a következő szolgáltatáskéréskor lejárnak. A betegnyilvántartásba semmilyen fájl nem kerül automatikusan.
Preparing local job|Helyi feldolgozás előkészítése
Validating MRI sequences|MR-szekvenciák ellenőrzése
Loading verified model|Ellenőrzött modell betöltése
Running pretrained segmentation|Az előre betanított modell futtatása
Writing region mask|Régiómaszk létrehozása
Ready for human review|Személyes ellenőrzésre kész
Cancelled|Megszakítva
Failed|Sikertelen
MONAI candidate regions · unreviewed|MONAI által jelölt régiók · még nem ellenőrzött
Synthetic model test phantom|Geometriai fantom a modellpróbához
T1c research source|T1c kutatási forrásfelvétel
Opening a volume stays in this tab. The model workspace below sends selected research scans only to the local inference service when you run it.|A megnyitott térfogati felvétel ebben a böngészőlapon marad. Az alábbi modellmunkatér csak a futtatás indításakor küldi a kiválasztott kutatási felvételeket a helyi feldolgozóhoz.
Pretrained segmentation · research only|Előre betanított szegmentálás · kizárólag kutatásra
MONAI BraTS predicts candidate glioma regions from four prepared MRI sequences. It is not a general tumour detector, and its output is not validated for diagnosis or treatment planning in this app.|A MONAI BraTS négy előkészített MR-szekvenciából jelöl lehetséges gliómarégiókat. Nem általános daganatfelismerő; az alkalmazásban adott eredménye diagnózisra és kezeléstervezésre nem validált.
No voxels exceeded the model threshold. This does not rule out disease.|Egyetlen voxel sem lépte át a modell küszöbértékét. Ez nem zárja ki a betegséget.
Choose between 1 and 2,000 DICOM files.|Válassz 1–2000 DICOM-fájlt.
The DICOM selection exceeds 256 MB.|A kiválasztott DICOM-fájlok mérete meghaladja a 256 MB-ot.
DICOM conversion cancelled.|A DICOM-konverzió megszakítva.
No supported 3D series was found in these DICOM files.|Ezekben a DICOM-fájlokban nem található támogatott 3D-sorozat.
DICOM conversion timed out. Try a smaller series.|A DICOM-konverzió túllépte az időkorlátot. Próbálj kisebb sorozatot.
DICOM conversion failed.|A DICOM-konverzió sikertelen.
DICOM demo files are unavailable.|A bemutató DICOM-fájlok nem érhetők el.
The local inference request failed.|A helyi modellfeldolgozási kérés sikertelen.
Connection lost. Reconnect to inspect the job; it may still be running.|A kapcsolat megszakadt. Csatlakozz újra a feldolgozás ellenőrzéséhez; a futtatás folytatódhatott.
The result could not be loaded.|Az eredményt nem sikerült betölteni.
Cancellation requested. The current inference window must finish first.|Megszakítás kérve. Az aktuális feldolgozási ablaknak előbb be kell fejeződnie.
The viewer is busy. Try again after loading finishes.|A megjelenítő foglalt. Próbáld újra a betöltés befejezése után.
All four MRI sequences are required: T1c, T1, T2 and FLAIR.|Mind a négy MR-szekvencia szükséges: T1c, T1, T2 és FLAIR.
Each MRI sequence must be at most 64 MB.|Egy MR-szekvencia mérete legfeljebb 64 MB lehet.
The decompressed MRI volume is too large.|A kicsomagolt MR-térfogat túl nagy.
Use single 3D NIfTI-1 volumes: each dimension at least 16, total at most 12 million voxels.|Egyetlen 3D NIfTI-1 térfogatot adj meg: minden tengelyen legalább 16, összesen legfeljebb 12 millió voxel.
The model requires aligned 1 mm isotropic MRI scans with millimetre units.|A modell illesztett, 1 mm-es izotróp felbontású, milliméteres mértékegységű MR-felvételeket igényel.
Use preprocessed RAS-oriented, axis-aligned scans. Registration is not automatic.|Előfeldolgozott, RAS-tájolású, tengelyirányú felvételeket használj. A térbeli illesztés nem automatikus.
All sequences must share the same voxel grid and affine coordinates.|Minden szekvenciának azonos voxelrácsra és affin koordinátákra kell illeszkednie.
MRI intensities must be finite.|Az MR-intenzitásoknak véges értékűeknek kell lenniük.
Provide four distinct MRI sequences, not duplicate copies of one scan.|Négy különböző MR-szekvenciát adj meg, ne egy felvétel többszörözött példányait.
Every MRI sequence needs varying non-zero signal.|Minden MR-szekvenciában változó, nem nulla jel szükséges.
The verified model weights are missing. Run the model setup command.|Az ellenőrzött modellsúlyok hiányoznak. Futtasd a modelltelepítő parancsot.
The model is not installed. Run the model setup command.|A modell nincs telepítve. Futtasd a modelltelepítő parancsot.
Another segmentation is running. Wait or cancel it first.|Egy másik szegmentálás már fut. Várd meg, vagy szakítsd meg.
Clear an existing job before starting another.|Új feldolgozás indítása előtt törölj egy korábbi feladatot.
Segmentation failed. Verify the input format and model installation.|A szegmentálás sikertelen. Ellenőrizd a bemeneti formátumot és a modell telepítését.
Confirm that inputs are de-identified, skull-stripped and co-registered.|Erősítsd meg, hogy az adatok személyazonosításra nem alkalmasak, előfeldolgozottak és közös térbe illesztettek.
All four MRI sequences are required as NIfTI files.|Mind a négy MR-szekvenciát NIfTI-fájlként kell megadni.
Job expired or not found.|A feldolgozás lejárt vagy nem található.
The result is not ready.|Az eredmény még nem készült el.
Failed to fetch|A helyi feldolgozó nem érhető el.
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)];}));
