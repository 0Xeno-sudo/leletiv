import {pipelineHungarian} from './translations.pipeline.hu';
import {reviewHungarian} from './translations.review.hu';
import {pinHungarian} from './translations.pin.hu';
import {stackHungarian} from './translations.stack.hu';
export const hungarian:Record<string,string>={...pipelineHungarian,...reviewHungarian,...pinHungarian,...stackHungarian,...Object.fromEntries(`
Name|Név
Role|Szerepkör
Specialty|Szakterület
Add team member|Munkatárs felvétele
Use fictional names in this research workspace.|Ebben a kutatási munkatérben kitalált neveket használjon.
No scan loaded|Nincs megnyitott képanyag
Welcome to NeuroFlow|Üdvözöljük a NeuroFlow-ban
Clinical workspace|Klinikai munkatér
Central Neuro Centre|Központi Neurocentrum
Demo workspace|Bemutató munkatér
Workspace|Munkatér
Workspace owner|A munkatér tulajdonosa
Quick search|Gyorskeresés
Overview|Áttekintés
Operational overview|Működési áttekintés
Patient pathways|Betegutak
Patient pathway|Betegút
Tumour board|Onkoteam
Imaging workspace|Képalkotási munkatér
Task coordination|Feladatkoordináció
Planning & analytics|Tervezés és elemzés
Operations|Működés
Capacity lab|Kapacitástervező
3D scan lab|3D képi munkatér
Clinical team|Klinikai csapat
Local workspace|Helyi munkatér
Pathway coordinator|Betegút-koordinátor
Refresh|Frissítés
Refreshing…|Frissítés…
Refreshing workspace|A munkatér frissítése
Connection needs attention|Ellenőrizd a kapcsolatot
Skip to content|Ugrás a tartalomhoz
Open navigation|Menü megnyitása
Close navigation|Menü bezárása
Primary navigation|Fő navigáció
Search patient, ID, or diagnosis|Keresés név, azonosító vagy diagnózis alapján
Search across every active synthetic pathway.|Keresés a bemutató betegutak között.
No matching cases found.|Nincs találat.
Open|Megnyitás
The full pathway. Every dependency. A clear next step.|A teljes betegút. Minden előfeltétel. Egyértelmű következő lépés.
Explore capacity lab|Kapacitástervező megnyitása
Synthetic dataset|Mesterségesen létrehozott bemutatóadatok
Operational summary|Működési összefoglaló
Active pathways|Aktív betegutak
Across all clinical stages|A teljes ellátási folyamatban
Ready for board|Onkoteamre előkészítve
Prepared for multidisciplinary review|Multidiszciplináris megbeszélésre előkészítve
Open actions|Nyitott feladatok
awaiting an owner|feladat felelősre vár
Blocked dependencies|Elakadt előfeltételek
Requires coordination|Koordinációt igényel
Pathway flow|A betegutak folyamata
Follow the queue from referral to surveillance.|Kövesd az ellátást a beutalástól az utánkövetésig.
Show all|Összes megjelenítése
All pathways|Összes betegút
Patient|Beteg
Status|Állapot
Next milestone|Következő mérföldkő
Priority|Prioritás
No pathways at this stage.|Ebben a szakaszban nincs betegút.
Needs attention|Beavatkozást igényel
Unassigned|Nincs felelős
dependency|előfeltétel
Scenario planning|Forgatókönyv-tervezés
What if the MRI goes offline?|Mi történik, ha leáll az MR?
Model the knock-on effect on queues, throughput and recovery capacity.|Vizsgáld meg a várakozásra, az áteresztőképességre és a posztoperatív kapacitásra gyakorolt hatást.
Test a scenario|Forgatókönyv kipróbálása
Recent changes|Legutóbbi változások
Workspace audit trail|A munkatér eseménynaplója
Coordinate every dependency from referral to decision and treatment.|Hangold össze az előfeltételeket a beutalástól a döntésen át az ellátásig.
New synthetic case|Új bemutatóeset
Table|Táblázat
Board|Tábla
List|Lista
Search pathways|Betegutak keresése
All statuses|Minden állapot
pathways|betegút
Pathway|Betegút
Lead|Felelős orvos
Progress|Előrehaladás
years|éves
No matching pathways|Nincs megfelelő betegút
Adjust your search or status filter.|Módosítsd a keresést vagy az állapotszűrőt.
Create synthetic case|Bemutatóeset létrehozása
Portfolio mode never uses real patient information.|A portfólió bemutatóadatai nem valódi betegek adatai.
Patient name|Beteg neve
Synthetic name|Bemutatónév
Hospital ID|Intézményi azonosító
Birth date|Születési dátum
Sex|Nem
Female|Nő
Male|Férfi
Unspecified|Nincs megadva
City|Város
CNS tumour|Központi idegrendszeri daganat
CNS metastasis|Központi idegrendszeri áttét
Pituitary pathway|Hipofízis-betegút
Surveillance|Utánkövetés
Working diagnosis|Munkadiagnózis
Clinical working diagnosis|Klinikai munkadiagnózis
Referral summary|A beutalás összefoglalója
Cancel|Mégse
Create pathway|Betegút létrehozása
Creating...|Létrehozás…
Case not found|Az eset nem található
The requested pathway is not available in this workspace.|A kért betegút nem érhető el ebben a munkatérben.
Could not create case|Az esetet nem sikerült létrehozni
Case management|Esetkezelés
Case workspace|Eset munkatere
Triage|Előszűrés
Incomplete|Hiányos
Board ready|Onkoteamre kész
Decision recorded|Döntés rögzítve
Scheduled|Ütemezve
Monitoring|Utánkövetés
triage|előszűrés
incomplete|hiányos
board ready|onkoteamre kész
decision recorded|döntés rögzítve
scheduled|ütemezve
monitoring|utánkövetés
urgent|sürgős
high|kiemelt
routine|rutin
Urgent|Sürgős
High|Kiemelt
Routine|Rutin
open|nyitott
In progress|Folyamatban
in progress|folyamatban
Blocked|Elakadt
blocked|elakadt
Done|Kész
done|kész
Pending|Függőben
pending|függőben
At risk|Kockázatos
at risk|kockázatos
Ready|Kész
ready|kész
Not required|Nem szükséges
not required|nem szükséges
available|elérhető
reserved|lefoglalva
limited|korlátozott
rounds|viziten
in theatre|műtőben
reviewed|áttekintve
uploaded|feltöltve
confirmed|rögzítve
quality check|minőségellenőrzés
metadata only|csak metaadat
Pathway status|A betegút állapota
Lead clinician|Felelős orvos
Target|Céldátum
Clinical overview|Klinikai összefoglaló
Recorded pathway progress|Rögzített előrehaladás
Decision readiness|A döntés előkészítettsége
Workflow completeness · illustrative weighted score|A folyamat teljessége · szemléltető súlyozott mutató
Imaging context|Képalkotási háttér
linked studies|kapcsolt vizsgálat
Case tasks|Az eset feladatai
open actions|nyitott feladat
Add task|Feladat hozzáadása
Decision record|Döntési dokumentáció
Multidisciplinary outcome|A multidiszciplináris megbeszélés eredménye
No decision recorded|Nincs rögzített döntés
No decision recorded.|Nincs rögzített döntés.
This case has not completed board review.|Az eset onkoteam-megbeszélése még nem zárult le.
Add coordination task|Koordinációs feladat hozzáadása
Task title|Feladat megnevezése
Description|Leírás
Owner|Felelős
Due date|Határidő
Category|Kategória
Saving...|Mentés…
Saving…|Mentés…
Could not save task.|A feladatot nem sikerült menteni.
Could not save task|A feladatot nem sikerült menteni
Coordination|Koordináció
From source images to spatial context|Forrásképekből térbeli áttekintés
Open a scan volume and its segmentation in the dedicated 3D workspace. No generic model is attached to this patient.|Nyisd meg a térfogati felvételt és a szegmentálását a külön 3D munkatérben. Ehhez a beteghez nem kapcsolunk általános szemléltető modellt.
Open 3D scan lab|3D képi munkatér megnyitása
Handoff brief|Esetátadási összefoglaló
Clear ownership, visible blockers and a next action for every pathway.|Egyértelmű felelősök, látható elakadások és következő lépések minden betegúthoz.
All tasks|Összes feladat
Search tasks|Feladatok keresése
Filter task status|Szűrés a feladat állapotára
Task|Feladat
Due|Határidő
Overdue|Lejárt
No tasks match these filters.|Nincs a szűrőknek megfelelő feladat.
tasks|feladat
complete|kész
of|/
Status for|Feladat állapota:
Owner for|Feladat felelőse:
Readiness for|Előfeltétel állapota:
Prepare the agenda, surface missing evidence, and capture an accountable decision.|Állítsd össze a napirendet, tedd láthatóvá a hiányzó adatokat, és rögzítsd a döntést és annak felelősét.
cases awaiting review|eset vár megbeszélésre
Demonstration session|Bemutatóülés
Monday, 14 September · 09:30 Budapest|Szeptember 14., hétfő · 09:30, Budapest
Conference room 4 · 6 clinical team members|4. tárgyaló · 6 klinikai csapattag
View clinical team|Klinikai csapat megtekintése
Ready for review|Megbeszélésre előkészítve
Recent decisions|Legutóbbi döntések
Record outcome|Eredmény rögzítése
studies|vizsgálat
Clinical intake in progress|Klinikai adatfelvétel folyamatban
Record board decision|Onkoteam-döntés rögzítése
Recommendation|Javaslat
Record the agreed clinical recommendation|Rögzítsd az elfogadott klinikai javaslatot
Rationale|Indoklás
Summarise the evidence and discussion|Foglald össze az adatokat és a megbeszélést
Recorded by|Rögzítette
Confirm decision|Döntés rögzítése
Recording...|Rögzítés…
Could not save decision|A döntést nem sikerült menteni
Track acquisition, quality checks, transfers, and review readiness in one place.|Kövesd a vizsgálatokat, a minőségellenőrzést, az adatátadást és az előkészítettséget egy helyen.
Upload study|Vizsgálat feltöltése
Imaging operations|Képalkotási folyamatok
Study archive|Vizsgálati archívum
series|sorozat
Selected study|Kiválasztott vizsgálat
Series|Sorozatok
Study date|Vizsgálat dátuma
Stored file|Tárolt fájl
Download|Letöltés
Review context|Áttekintési háttér
Non-diagnostic demo|Nem diagnosztikai bemutató
Archive context|Archívum adatai
File storage and recorded review state|Fájltárolás és rögzített ellenőrzési állapot
Workflow state|Folyamatállapot
Acquisition|Képalkotás
Quality check|Minőségellenőrzés
Case linked|Esethez kapcsolva
Portfolio visualisation|Portfólió-szemléltetés
Archive entries are records, not diagnostic interpretations. Use the 3D scan lab for supported volumes.|Az archívum bejegyzései nyilvántartási adatok, nem diagnosztikai értékelések. A támogatott térfogati felvételekhez használd a 3D képi munkateret.
Upload imaging study|Képalkotó vizsgálat feltöltése
Attach a synthetic study file to its patient pathway.|Kapcsolj egy bemutató vizsgálati fájlt a betegúthoz.
Choose a local study file|Helyi vizsgálati fájl kiválasztása
Maximum 25 MB for this demonstration|A bemutatóban legfeljebb 25 MB
Modality|Modalitás
Uploaded imaging study|Feltöltött képalkotó vizsgálat
Add to archive|Hozzáadás az archívumhoz
Uploading...|Feltöltés…
Upload failed|A feltöltés sikertelen
Volumetric review|Térfogati áttekintés
Real voxels. Clear spatial context.|Valódi voxelek. Átlátható térbeli összefüggések.
Review a NIfTI scan in linked slice views and 3D. Import a matching region mask to inspect its shape and volume.|Tekintsd át a NIfTI-felvételt összekapcsolt metszeti és 3D nézetekben. Importálj hozzá illeszkedő régiómaszkot az alak és a térfogat vizsgálatához.
The volume workspace is separate from this archive selection.|A térfogati munkatér független az archívum itt kiválasztott elemétől.
Operations control|Működési központ
Connect clinical demand with rooms, equipment, people and downstream capacity.|Kapcsold össze az ellátási igényeket a helyiségekkel, eszközökkel, munkatársakkal és a további ellátás kapacitásával.
Model a capacity change|Kapacitásváltozás modellezése
Average utilisation|Átlagos kihasználtság
Across|Összesen
tracked resources|nyilvántartott erőforrás alapján
Scheduled procedures|Ütemezett beavatkozások
Across current pathways|Az aktuális betegutak között
At-risk dependencies|Kockázatos előfeltételek
Requires owner action|A felelős intézkedését igényli
Resource readiness|Erőforrások készenléte
Clinical capacity, equipment, and supply|Ellátási kapacitás, eszközök és készletek
Resource|Erőforrás
Location|Helyszín
Next available|Legközelebb elérhető
Utilisation|Kihasználtság
State|Állapot
Procedure readiness|Beavatkozási előkészítettség
Scheduled pathways|Ütemezett betegutak
Requirements|Előfeltételek
Open readiness plan|Előkészítési terv megnyitása
Dependency map|Előfeltételek térképe
Trace a missing input to its patient pathway and accountable owner.|Kövesd vissza a hiányzó feltételt az érintett betegúthoz és annak felelőséhez.
Select a dependency to inspect|Válassz egy előfeltételt a részletekhez
Blank cells have no recorded dependency; they do not imply readiness.|Az üres cellákban nincs rögzített előfeltétel; ez nem jelent készenlétet.
Open pathway and update readiness|Betegút megnyitása és előkészítettség frissítése
See role coverage, availability, and assigned work across the pathway.|Tekintsd át a szerepköröket, az elérhetőséget és a kiosztott feladatokat.
People and ownership|Csapat és felelősségi körök
active members|aktív munkatárs
Team member|Munkatárs
Role and specialty|Szerepkör és szakterület
Recorded availability|Rögzített elérhetőség
Open work|Nyitott feladatok
Completion|Teljesítés
Role coverage|Szerepkörök lefedettsége
Recorded assignments · not a live staffing rota|Rögzített szerepkörök · nem élő beosztás
Workload distribution|Feladatterhelés eloszlása
Open tasks by owner|Nyitott feladatok felelősönként
Explore the operational cost of a constraint before it reaches the patient.|Vizsgáld meg a kapacitáskorlátok működési hatását, mielőtt az elérné a beteget.
Export analysis|Elemzés exportálása
Save scenario|Forgatókönyv mentése
Scenario modelling|Forgatókönyv-modellezés
12-hour shift · deterministic model|12 órás műszak · determinisztikus modell
Resource overview|Erőforrás-áttekintés
Assumptions|Feltételezések
Reset|Alaphelyzet
Change a resource. Follow the effect through the whole pathway.|Módosíts egy erőforrást, és kövesd a hatást a teljes betegúton.
MRI scanners|MR-berendezések
Theatre rooms|Műtők
Recovery capacity|Posztoperatív kapacitás
MRI downtime|MR-kiesés
Demand waves|Igényhullámok
45 min per study|45 perc vizsgálatonként
150 min per procedure|150 perc beavatkozásonként
180 min per admission|180 perc betegenként
Unavailable at start of shift|Nem elérhető a műszak kezdetén
Replicates the active case mix|Az aktív esetösszetétel ismétlése
units|berendezés
rooms|műtő
bays|ágy
waves|hullám
min|perc
Saved scenarios|Mentett forgatókönyvek
Current pathways|Aktuális betegutak
Current source|Aktuális forrás
Baseline vs. your scenario|Alaphelyzet és saját forgatókönyv
simulated visits|szimulált ellátás
Completed in shift|Műszakon belül lezárva
Beyond shift|Műszakon túlra nyúlik
Average queue time|Átlagos várakozási idő
visits|ellátás
visit|ellátás
Unchanged from baseline|Az alaphelyzethez képest változatlan
more than baseline|több az alaphelyzetnél
fewer than baseline|kevesebb az alaphelyzetnél
Queue and resource utilization by stage|Várakozás és erőforrás-kihasználtság szakaszonként
Imaging|Képalkotás
Theatre|Műtő
Recovery|Posztoperatív ellátás
busy|kihasználtság
min average queue|perc átlagos várakozás
Largest queue|Leghosszabb várakozás
Main constraint:|Fő kapacitáskorlát:
NeuroFlow capacity model|NeuroFlow kapacitásmodell
Current synthetic pathways|Aktuális bemutató-betegutak
Planning horizon (min)|Tervezési időtáv (perc)
Mean queue (min)|Átlagos várakozás (perc)
Start (min)|Kezdés (perc)
Finish (min)|Befejezés (perc)
Queue (min)|Várakozás (perc)
Resource slot|Erőforrás sorszáma
simulated visits finish after the shift. Try adding capacity here and compare the queue downstream.|szimulált ellátás fejeződik be a műszak után. Növeld itt a kapacitást, majd vizsgáld meg a további szakaszok várakozását.
Pathway timeline|Betegút-idővonal
Queue|Várakozás
Visit / priority|Ellátás / prioritás
beyond shift|műszakon túl
finish|befejezés
demand|igényhullám
Inspect|Részletek:
Open source pathway|Forrásbetegút megnyitása
Start|Kezdés
resource|erőforrás
How this model works|A modell működése
Each active pathway generates|Minden aktív betegút
synthetic demand waves. Arrivals are 10 minutes apart, with waves 60 minutes apart. Every simulated visit follows imaging (45 min), theatre (150 min), and recovery (180 min). This is a capacity exercise, not a treatment recommendation.|bemutató igényhullámot hoz létre. Az érkezések között 10 perc, a hullámok között 60 perc telik el. Minden szimulált ellátás képalkotásból (45 perc), műtői szakaszból (150 perc) és posztoperatív ellátásból (180 perc) áll. Ez kapacitástervezési gyakorlat, nem kezelési javaslat.
Queues are first-ready-first-served, with priority breaking ties. Each stage has independent resources; staff constraints, stochastic variation, overnight calendars and upstream blocking are not modelled. Resource occupancy is measured within 08:00 to 20:00; queue time includes work beyond the shift. Saved scenarios retain the source cohort and model version for reproducibility.|A sorrendet az ellátásra kész állapot időpontja határozza meg; azonos időpontnál a prioritás dönt. A szakaszok erőforrásai függetlenek. A modell nem kezeli a személyzeti korlátokat, a véletlen ingadozást, az éjszakai beosztást és a korábbi szakaszok visszatorlódását. A kihasználtság 08:00–20:00 között értendő, a várakozás a műszakon túli munkát is tartalmazza. A mentett forgatókönyvek megőrzik a forráscsoportot és a modellverziót a reprodukálhatóság érdekében.
Save capacity scenario|Kapacitás-forgatókönyv mentése
Keep these assumptions and a snapshot of the source cohort.|A feltételezések és a forrás-esetcsoport pillanatképének mentése.
Scenario name|Forgatókönyv neve
Two theatres, four recovery bays|Két műtő, négy posztoperatív ágy
Scenario saved with its source cohort.|A forgatókönyvet a forrás-esetcsoporttal együtt mentettük.
Could not save scenario|A forgatókönyvet nem sikerült menteni
Two-theatre comparison|Kétműtős összehasonlítás
Close dialog|Párbeszédablak bezárása
Loading page|Oldal betöltése
Try again|Újrapróbálkozás
Unable to load the clinical workspace.|A klinikai munkateret nem sikerült betölteni.
The update could not be saved.|A módosítást nem sikerült menteni.
Synthetic case created|A bemutatóeset létrejött
Case status saved|Az eset állapotát mentettük
Task status saved|A feladat állapotát mentettük
Task owner saved|A feladat felelősét mentettük
Readiness updated|Az előkészítettség frissült
Task added|A feladatot hozzáadtuk
Board decision recorded|Az onkoteam döntését rögzítettük
Study added to archive|A vizsgálatot az archívumhoz adtuk
No file attached|Nincs csatolt fájl
Explore source voxels, inspect a labelled region, and keep every measurement traceable.|Vizsgáld meg a forrásképet és a jelölt régiót úgy, hogy minden mérés visszakövethető maradjon.
Load atlas demo|Atlaszbemutató betöltése
MNI152 population atlas|MNI152 populációs atlasz
Population template · not a patient scan|Populációs sablon · nem egy beteg felvétele
Local file · stays in this browser tab|Helyi fájl · ebben a böngészőlapon marad
Slices + 3D|Metszetek és 3D
Axial|Axiális
Coronal|Koronális
Sagittal|Szagittális
Interactive volumetric scan viewer|Interaktív térfogati képmegjelenítő
Loading volume…|Térfogati felvétel betöltése…
Drag to rotate in 3D. Scroll through slices. Right-drag to adjust contrast.|Húzással forgathatod a 3D nézetet. Görgetéssel válthatsz metszetet. Jobb gombos húzással állíthatod a kontrasztot.
R / L: anatomical right / left|R / L: anatómiai jobb / bal oldal
Region opacity|A régió fedettsége
3D cutaway|3D vágósík
Source & segmentation|Forrás és szegmentálás
Use de-identified research data only. Files stay local and are not sent to an AI service.|Csak személyazonosításra nem alkalmas kutatási adatot használj. A fájlok helyben maradnak, nem küldjük őket MI-szolgáltatásnak.
Open scan volume|Térfogati felvétel megnyitása
Import region mask|Régiómaszk importálása
NIfTI-1 · .nii / .nii.gz · up to 64 MB|NIfTI-1 · .nii / .nii.gz · legfeljebb 64 MB
Add simulated region|Szimulált régió hozzáadása
Region inspection|Régióvizsgálat
No region mask|Nincs régiómaszk
Simulated region · not a tumour finding|Szimulált régió · nem daganatos lelet
All non-zero labels combined|Az összes nem nulla címke együtt
Label|Címke
Remove mask|Maszk eltávolítása
Import a matching segmentation to display the labelled region. A scan alone does not identify a tumour.|A jelölt régió megjelenítéséhez importálj illeszkedő szegmentálást. A felvétel önmagában nem azonosít daganatot.
Voxel grid|Voxelrács
Voxel spacing|Voxeltávolság
Review notes|Áttekintési jegyzetek
Observations for the review, not an automated diagnosis|Megfigyelések az áttekintéshez, nem automatikus diagnózis
Export measurements|Mérések exportálása
Download mask (.nii)|Maszk letöltése (.nii)
Export AI job manifest|MI-feladatleíró exportálása
What this viewer does|A megjelenítő működése
Renders the actual scan volume and an imported label mask in matching coordinates. Measurements come from labelled voxels and physical spacing. They are not diagnostic conclusions.|A tényleges térfogati felvételt és az importált címkemaszkot azonos koordinátákban jeleníti meg. A mérések a címkézett voxelekből és a fizikai távolságokból származnak. Nem diagnosztikai következtetések.
AI segmentation · not connected|MI-szegmentálás · nincs csatlakoztatva
Automatic tumour segmentation needs a dedicated, validated medical model. OpenAI, Gemini and OpenRouter image generation are not substitutes. The job manifest and mask import define the future integration boundary; no API key is needed for this viewer.|Az automatikus daganatszegmentáláshoz erre a célra készült, validált orvosi modell szükséges. Az OpenAI, a Gemini és az OpenRouter képgenerálása ezt nem helyettesíti. A feladatleíró és a maszkimport adja a későbbi integráció alapját; ehhez a megjelenítőhöz nem kell API-kulcs.
Demo attribution|A bemutató forrása
MNI152 / ICBM average-brain atlas, McGill University, distributed by NiiVue. The optional red region is a synthetic demonstration, not a finding in the atlas.|MNI152 / ICBM átlagos agyi atlasz, McGill Egyetem, a NiiVue terjesztésében. A választható piros régió mesterséges szemléltetés, nem az atlaszon észlelt elváltozás.
Invalid NIfTI header.|Érvénytelen NIfTI-fejléc.
The viewer could not start.|A megjelenítőt nem sikerült elindítani.
The volume could not be loaded.|A térfogati felvételt nem sikerült betölteni.
The mask contains no labelled voxels.|A maszk nem tartalmaz címkézett voxeleket.
The mask does not match the scan grid. Registration is required.|A maszk nem illeszkedik a felvétel rácsához. Regisztráció szükséges.
The scan needs valid physical units for volume measurements.|A térfogatméréshez érvényes fizikai mértékegységek szükségesek.
Only a single 3D label volume is supported.|Csak egyetlen 3D címketérfogat támogatott.
Use an integer label mask with values from 0 to 255, not a probability map.|0 és 255 közötti egész értékű címkemaszkot használj, ne valószínűségi térképet.
Choose a NIfTI volume (.nii or .nii.gz). DICOM folders and photographs are not supported here.|Válassz NIfTI-térfogatot (.nii vagy .nii.gz). A DICOM-mappák és fényképek itt nem támogatottak.
The local viewer accepts files up to 64 MB.|A helyi megjelenítő legfeljebb 64 MB-os fájlokat fogad.
The decompressed volume is too large.|A kitömörített térfogat túl nagy.
Use a single-file NIfTI-1 volume.|Egyfájlos NIfTI-1 térfogatot használj.
Use one 3D volume with at most 32 million voxels.|Egyetlen, legfeljebb 32 millió voxeles 3D térfogatot használj.
The NIfTI voxel data is incomplete or unsupported.|A NIfTI voxeladatai hiányosak vagy nem támogatottak.
Case handoff brief|Esetátadási összefoglaló
A concise, source-based handover for the next team.|Tömör, forrásadatokra épülő átadás a következő csapatnak.
Back to pathway|Vissza a betegúthoz
Print / save PDF|Nyomtatás / PDF mentése
NeuroFlow · Synthetic demonstration|NeuroFlow · Mesterséges bemutatóadatok
Situation|Helyzetkép
Coordinator|Koordinátor
Evidence & blockers|Adatok és elakadások
No recorded dependencies. Readiness has not been established.|Nincsenek rögzített előfeltételek. Az előkészítettség nem igazolt.
Outstanding actions|Fennmaradó feladatok
No open tasks recorded.|Nincs rögzített nyitott feladat.
Recorded decision|Rögzített döntés
Imaging inventory|Képalkotási nyilvántartás
No linked studies.|Nincs kapcsolt vizsgálat.
Generated from recorded workspace data. Not an automated clinical recommendation.|A munkatérben rögzített adatokból készült. Nem automatikus klinikai javaslat.
Source|Forrás
Mask|Maszk
Grid|Rács
Notes|Jegyzetek
Voxels|Voxelek
Volume (mL)|Térfogat (mL)
Unvalidated research visualization|Nem validált kutatási szemléltetés
NeuroFlow capacity model|NeuroFlow kapacitásmodell
Current synthetic pathways|Aktuális bemutató-betegutak
Planning horizon (min)|Tervezési időtáv (perc)
Completed|Lezárva
Mean queue (min)|Átlagos várakozás (perc)
Visit|Ellátás
Case|Eset
Stage|Szakasz
Start (min)|Kezdés (perc)
Finish (min)|Befejezés (perc)
Queue (min)|Várakozás (perc)
Resource slot|Erőforráshely
Assign neuroradiology reviewer|Neuroradiológiai véleményező kijelölése
Assignment|Felelős kijelölése
Availability depends on two planned discharges|Az elérhetőség két tervezett elbocsátástól függ
Bed|Ágy
Board recommendation confirmed and follow-up task created.|Az onkoteam javaslatát rögzítették, az utánkövetési feladat létrejött.
Board summary completed and participant list confirmed.|Az onkoteam összefoglalója elkészült, a résztvevők listáját véglegesítették.
Book endocrine assessment|Endokrinológiai vizsgálat előjegyzése
Brain with contrast and advanced sequences|Kontrasztos agyi MR kiegészítő szekvenciákkal
Capacity|Kapacitás
Case created|Eset létrehozva
Case moved to board-ready.|Az eset onkoteamre előkészített állapotba került.
Case moved to monitoring.|Az eset utánkövetési állapotba került.
Case prepared|Eset előkészítve
Check symptom history and prior treatment records.|Ellenőrizd a tüneti előzményeket és a korábbi kezelési dokumentációt.
Clinical|Klinikai
Clinical neurophysiology|Klinikai neurofiziológia
Clinical pharmacist|Klinikai gyógyszerész
Complete clinical intake|Klinikai adatfelvétel befejezése
Condense referral, imaging, and clinical question.|Foglald össze a beutalást, a képalkotási adatokat és a klinikai kérdést.
Confirm anticoagulation and steroid therapy.|Ellenőrizd az alvadásgátló és szteroidkezelést.
Confirm blood products|Vérkészítmények visszaigazolása
Confirm spectroscopy series|Spektroszkópiás sorozat ellenőrzése
Confirm thin-slice sequence is transferred to theatre navigation.|Ellenőrizd, hogy a vékonyszeletes sorozat bekerült-e a műtéti navigációs rendszerbe.
Consultant oncologist|Onkológus szakorvos
Consultant radiologist|Radiológus szakorvos
Consumable set checked|A fogyóeszközkészlet ellenőrizve
Contact referring centre and confirm transfer receipt.|Vedd fel a kapcsolatot a beutaló intézménnyel, és igazold vissza az adatok átvételét.
Contrast MRI marked ready. Spectroscopy confirmation requested.|A kontrasztos MR elkészült. A spektroszkópia visszaigazolását kérték.
Coordinate follow-up appointment|Utánkövetési időpont egyeztetése
Coordinate follow-up|Utánkövetés egyeztetése
Coordinate specialist review before surgical consultation.|Egyeztesd a szakorvosi értékelést a sebészeti konzultáció előtt.
Dependency blocked|Előfeltétel elakadt
Endocrine review|Endokrinológiai értékelés
Equipment|Eszköz
Equipment store B|B eszközraktár
Hospital pharmacy|Intézeti gyógyszertár
ICU destination marked at risk pending planned discharges.|Az intenzív osztályos elhelyezés a tervezett elbocsátásokig kockázatos.
ICU north|Északi intenzív osztály
Imaging and visual field findings support specialist surgical assessment. Complete endocrine profile is required before final planning.|A képalkotási és látótérleletek alapján sebészeti szakorvosi értékelés indokolt. A végleges tervezéshez teljes endokrinológiai profil szükséges.
Imaging reviewed|Képalkotás áttekintve
Left frontal glioma|Bal frontális glioma
Left parietal lesion|Bal parietális elváltozás
Main pharmacy|Központi gyógyszertár
Medication|Gyógyszerelés
Microscope and navigation installed|A mikroszkóp és a navigációs rendszer telepítve
Navigation dataset verification is in progress.|A navigációs adatok ellenőrzése folyamatban van.
Neuro-oncology board|Neuroonkológiai onkoteam
Neuro-oncology|Neuroonkológia
Neuroradiology|Neuroradiológia
Neurosurgery theatre 3|3. idegsebészeti műtő
Neurosurgery|Idegsebészet
New synthetic referral awaiting clinical triage.|Új bemutatóbeutalás, klinikai előszűrésre vár.
New-onset focal seizure. Contrast MRI and advanced sequences available for multidisciplinary review.|Újonnan jelentkező fokális roham. Kontrasztos MR és kiegészítő szekvenciák rendelkezésre állnak a multidiszciplináris megbeszéléshez.
Nominate reviewer for first-pass MRI assessment.|Jelölj ki véleményezőt az első MR-értékeléshez.
On-call scientist confirmed|Az ügyeletes szakember visszaigazolva
One service window at 12:00|Egy karbantartási idősáv 12:00-kor
Outside CT references a posterior fossa lesion. Source imaging and current medication list remain outstanding.|A külső CT-lelet hátsó koponyagödri elváltozást ír le. Az eredeti képanyag és az aktuális gyógyszerlista még hiányzik.
Outside imaging transfer has not arrived from the referring centre.|A külső képanyag még nem érkezett meg a beutaló intézménytől.
Ownership changed|Felelős módosítva
Pathology lab|Patológiai labor
Pathology|Patológia
Perioperative operations|Perioperatív működés
Pituitary macroadenoma|Hipofízis-makroadenoma
Pituitary protocol|Hipofízis-protokoll
Portfolio verification record only. No clinical recommendation or real patient data.|Kizárólag portfólió-ellenőrzési bejegyzés. Nem tartalmaz klinikai javaslatot vagy valódi betegadatot.
Post-treatment surveillance|Kezelés utáni utánkövetés
Preoperative navigation dataset|Műtét előtti navigációs adatok
Prepare board summary|Onkoteam-összefoglaló készítése
Quality check started|Minőségellenőrzés elindítva
Radiation oncology|Sugárterápia
Radiology level 1|Radiológia, 1. szint
Readiness|Előkészítettség
Reconcile medication list|Gyógyszerlista egyeztetése
Records|Dokumentáció
Refer for endoscopic surgical assessment after endocrine review.|Endoszkópos sebészeti értékelésre irányítás az endokrinológiai vizsgálat után.
Referral documentation entered into the synthetic case record.|A beutalási dokumentációt rögzítették a bemutatóesethez.
Referral received with progressive right-sided sensory symptoms. Imaging review has not started.|Beutalás érkezett fokozódó jobb oldali érzészavar miatt. A képanyag értékelése még nem kezdődött el.
Resection scheduled pending final navigation dataset verification and blood product confirmation.|A reszekciót ütemezték; a navigációs adatok végső ellenőrzése és a vérkészítmények visszaigazolása még szükséges.
Reserve two cross-matched units for the planned procedure.|Foglalj le két keresztpróbázott egységet a tervezett beavatkozáshoz.
Reserved for case NF-260211|Lefoglalva az NF-260211 esethez
Retrieve outside DICOM study|Külső DICOM-vizsgálat beszerzése
Retrieve outside imaging|Külső képanyag beszerzése
Review referral documentation|Beutalási dokumentáció áttekintése
Right temporal high-grade lesion|Jobb temporális, magas grádusú elváltozás
Room|Helyiség
Scheduling|Időpont-egyeztetés
Six-month MRI|Hathónapos kontroll-MR
Solitary cerebellar lesion|Szoliter kisagyi elváltozás
Stable post-treatment appearance. Continue scheduled imaging surveillance.|Kezelés utáni stabil kép. A tervezett képalkotó utánkövetés folytatása.
Status updated|Állapot frissítve
Study uploaded|Vizsgálat feltöltve
Supply|Készlet
Surgical block B|B műtéti blokk
Synthetic R2 transfer verification|Bemutató R2-adatátvitel ellenőrzése
Synthetic referral entered and assigned for triage.|A bemutatóbeutalást rögzítették és előszűrésre osztották ki.
Synthetic surveillance referral|Bemutató utánkövetési beutalás
Synthetic workflow demonstration: follow-up coordination complete.|Bemutató munkafolyamat: az utánkövetés egyeztetése kész.
Task created|Feladat létrehozva
Task updated|Feladat frissítve
Team|Csapat
Team assigned to theatre 3|A csapat a 3. műtőhöz rendelve
Theatre manager|Műtőkoordinátor
Theatre readiness check|Műtői előkészítettség ellenőrzése
Treated oligodendroglioma|Kezelt oligodendroglioma
Triage started|Előszűrés elindítva
Two treatment units on hand|Két kezelési egység készleten
Verify navigation dataset|Navigációs adatok ellenőrzése
Verify sequence completeness before board review.|Ellenőrizd a szekvenciák teljességét az onkoteam előtt.
Visual field findings and endocrine laboratory results reviewed. Surgical assessment requested.|A látótérvizsgálatot és az endokrinológiai laboreredményeket áttekintették. Sebészeti értékelést kértek.
stored in the imaging archive.|tárolva a képalkotási archívumban.
Current user|Aktuális felhasználó
Workspace coordinator|Munkatér-koordinátor
in-progress|folyamatban
Neuro ICU bed|Neurointenzív ágy
3T MRI scanner|3 teslás MR-berendezés
5-ALA stock|5-ALA készlet
Intraoperative monitoring|Intraoperatív monitorozás
Stealth navigation unit|Stealth navigációs egység
CUSA console|CUSA konzol
Frozen section service|Fagyasztásos szövettan
ICU destination confirmed|Intenzív osztályos elhelyezés visszaigazolva
Navigation MRI transferred|Navigációs MR átadva
CUSA consumable set|CUSA fogyóeszközkészlet
Blood products reserved|Vérkészítmények lefoglalva
Clinical question documented|Klinikai kérdés dokumentálva
Outside imaging received|Külső képanyag beérkezett
Anaesthetic assessment|Aneszteziológiai vizsgálat
Medication reconciliation|Gyógyszeregyeztetés
Diagnostic MRI complete|Diagnosztikus MR elkészült
Pathology available|Patológiai lelet elérhető
Multidisciplinary review|Multidiszciplináris megbeszélés
A name and valid capacity assumptions are required.|Név és érvényes kapacitásfeltételezések szükségesek.
Team member not found.|A munkatárs nem található.
Task not found.|A feladat nem található.
Patient name, hospital ID, birth date, and working diagnosis are required.|A beteg neve, intézményi azonosítója, születési dátuma és munkadiagnózisa kötelező.
Enter a valid birth date that is not in the future.|Adj meg érvényes, nem jövőbeli születési dátumot.
This hospital ID already exists.|Ez az intézményi azonosító már létezik.
Invalid case status.|Érvénytelen esetállapot.
Case not found.|Az eset nem található.
Case and task title are required.|Az eset és a feladat megnevezése kötelező.
Enter a valid due date.|Adj meg érvényes határidőt.
Invalid task priority.|Érvénytelen feladatprioritás.
Invalid task status.|Érvénytelen feladatállapot.
Invalid requirement status.|Érvénytelen előfeltétel-állapot.
Requirement not found.|Az előfeltétel nem található.
Case, recommendation, and rationale are required.|Az eset, a javaslat és az indoklás kötelező.
A case and file are required.|Eset és fájl megadása szükséges.
Local demonstration uploads are limited to 25 MB per file.|A helyi bemutatóban fájlonként legfeljebb 25 MB tölthető fel.
No uploaded file is attached to this study.|Ehhez a vizsgálathoz nincs feltöltött fájl.
Imaging object not found.|A képalkotási fájl nem található.
API route not found.|Az API-végpont nem található.
Invalid JSON request.|Érvénytelen JSON-kérés.
The request could not be completed.|A kérést nem sikerült teljesíteni.
Use an unscaled integer mask. Rescale slope and intercept must be 1 and 0.|Nem skálázott egész értékű maszkot használj. A skálázási szorzó 1, az eltolás 0 legyen.
`.trim().split('\n').map(row=>row.split('|')))};
