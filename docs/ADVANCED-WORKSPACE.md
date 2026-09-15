# Leletív – helyi kvantitatív képi munkatér

Az új munkatér a **Képek és leletek → Kvantitatív munkatér** menüpontban, a `/advanced` útvonalon érhető el. Az öt modul külső szolgáltatás, fizetős előfizetés és API-kulcs nélkül működik. A React felület a gépen futó, kizárólag loopback címre kötött Python HTTP API-val kommunikál. A telepítéshez és a nyílt modellsúlyok első letöltéséhez internet kell; az elemzéshez nem.

**Kutatási prototípus, szintetikus bemenetekhez.** A számítások működésének tesztelése nem klinikai validálás. A termék nem diagnosztizál, nem helyettesíti az orvosi leletezést és nem bizonyít magyarországi piaci kizárólagosságot.

## Közös munkafolyamat

1. Válasszon modult, megnevezést, dátumot és opcionálisan egy meglévő bemutatóesetet.
2. Töltsön fel megfelelő képet/maszkot, vagy vegyen át egy korábbi futásból eredményt. Az átvett forrás futásazonosítója és ellenőrzési változata bekerül a paraméterek közé. A modulok geometriai és formátumellenőrzése ilyenkor is lefut.
3. Indítsa a helyi feldolgozást. Az állapot, a lépések és a megszakítás elérhetők a felületen. Egyszerre egy új kvantitatív futás dolgozik, összesen legfeljebb három aktív/várakozó futás lehet. A régi MONAI-szolgáltatás külön sorral rendelkezik; a nagy feladatokat érdemes egymás után futtatni.
4. Vizsgálja meg a metszeteket és a 3D nézetet, válasszon rávetített térképet, ellenőrizze az illesztést és a méréseket. A régiólistából a célkereszt az adott régióra ugrik.
5. Javítsa a párosítást, a sejtek besorolását vagy a PET-összesítésbe bevont régiókat. Rögzítsen ellenőrzőt és megjegyzést. Az ellenőrzés külön, verziózott esemény; az eredeti automatikus eredmény megmarad.
6. Nyissa meg a mentett állapotból készülő jelentést, majd válassza a **Mentés PDF-ként / nyomtatás** műveletet. A tényleges PDF-mentést a böngésző nyomtatási ablaka végzi. A teljes géppel olvasható JSON-csomag és az egyes NIfTI/PNG eredmények külön letölthetők.

A futások, a bemenetek és a verziózott ellenőrzések a `data/advanced/` alatt tárolódnak. Újraindítás után visszanyithatók; az éppen futó feladat megszakadtként jelenik meg, nem indul újra automatikusan. A tárolás jelenleg nem titkosított, nem többfelhasználós, és nincs automatikus megőrzési idő vagy felületi végleges törlés. Ne tároljon benne valódi betegadatot. A könyvtár nem része a nyilvános forráscsomagnak.

## 1. Elváltozások időbeli követése

**Bemenet:** egy kiinduló és 1–4 kontroll CT/MR, mindegyikhez a saját rácsán álló, egész címkéket tartalmazó maszk. Minden külön követett elváltozáshoz külön címke szükséges. A maszk a meglévő 3D munkatérben készülhet, modellel előállítható vagy importálható. Ez a modul nem általános, automatikus daganatkereső.

- Merev, hat szabadságfokú SimpleITK-regisztráció a kiinduló képhez, több felbontáson, kölcsönös információ alapján.
- Térben korlátozott, egy-egy értelmű régiópárosítási javaslat; a nem párosított régiók külön láthatók.
- Natív maszkrácson számolt térfogat (ml), hogy az újramintavételezés ne torzítsa az időbeli térfogatváltozást.
- Illesztett kontroll, címkemaszk és közös / csak kontroll / csak kiinduló területeket jelző változástérkép.
- Javítható RECIST 1.1 munkalap: legfeljebb öt célelváltozás, szervenként legfeljebb kettő; kiinduló átmérőösszeg, korábbi nadir, százalékos változás, célelváltozás- és összesített kategória. A nem célelváltozásokat és az új elváltozásokat külön kell értékelni.

A maszkból számolt síkbeli átmérő csak kezdőérték. Nyirokcsomóhoz a rövid tengely orvos által ellenőrzött értéke kell. Ismeretlen kontrollmérést nem helyettesítünk automatikusan nullával. A munkalap nem ellenőrzi az összes beválasztási, megerősítési és protokollfeltételt, nem számol legjobb összesített választ, és nem RANO vagy iRECIST.

## 2. 3D anatómiai térkép és testösszetétel

**Bemenet:** HU-kalibrált CT, a testösszetételi indexhez testmagasság. NIfTI vagy egyetlen, geometriailag szabályos DICOM-sorozat ZIP-ben. A testösszetételhez orthogonalis axialis geometria és látható L3 csigolya kell; oblique sorozatot előbb reformálni szükséges.

- A TotalSegmentator nyílt `total` feladata készíti a szervmaszkot, helyben, CPU-n, 3 mm-es gyors modellel. A modell címkeszótára 117 anatómiai struktúrát tartalmaz; nem minden struktúra szerepel minden felvételen.
- Az L3 szintjét a csigolyamaszk középső metszete adja. A Stanford MIMI `multilevel_muscle_adipose_tissue` v0.0.2 modell a kiválasztott, háromszeletes L3-részleten készít szövetmaszkot.
- Mérhető az izom keresztmetszeti területe, átlagos HU-értéke, a magasságra normalizált vázizomindex, valamint a visceralis, subcutan és intermuscularis zsírterület.
- Saját, ellenőrzött szerv- és szövetmaszk is importálható. Szövetcímkék: 1 izom, 2 VAT, 3 SAT, 4 IMAT; 0 háttér. A részleges izomcsoport-mérés és a teljes izomindex eltérő mezőben szerepel.

L3 hiányában nem készül L3-mérés. A modellmaszkok és a szint kiválasztása ellenőrzendő; az eredmény nem szarkopéniadiagnózis. A modell nem szegmentál általánosan daganatokat. A térkép a felvételben látható anatómia rekonstrukciója, nem teljes emberi digitális iker.

## 3. PET/CT és metabolikus aktivitás

**Bemenet:** közös fizikai térben lévő CT és mennyiségi PET. SUVbw közvetlenül használható. Bq/ml esetén meg kell adni a testtömeget, nettó beadott aktivitást, felezési időt, eltelt időt és a bomláskorrekció referenciaidejét. A támogatott konvenció: a vizsgálat kezdetére korrigált aktivitáskoncentráció.

- PET-aktivitás rávetítése a CT-re, ellenőrizhető szeletnézetekben és 3D-ben.
- SUV-küszöb és minimális régiótérfogat szerinti összefüggő aktivitásrégiók, illetve importált natív PET-maszk.
- Natív PET-rácson számolt SUVmean, SUVmax és régiótérfogat. FDG esetén TLG = SUVmean × régiótérfogat.
- Az összesítésbe csak a felhasználó által kiválasztott régiók kerülnek. A kiválasztást verziózott ellenőrzés rögzíti.

A küszöbölés élettani aktivitást is jelöl, ezért nem önálló daganatdetektálás. Nem számít SUVpeak/SUL értéket, nem PERCIST-értékelés és nem automatikus stádiummeghatározás. A PET és CT fizikai összetartozását a felhasználó ellenőrzi; a modul nem korrigál légzési elmozdulást.

## 4. Digitális szövettan és sejtmag-pozitivitás

**Bemenet:** hematoxilin–DAB festésű PNG/JPEG/TIFF vagy az OpenSlide által támogatott SVS/NDPI metszet, ismert µm/pixel. A metszet előnézete kattintással kijelölhető vizsgálati régiót mutat; a régió koordinátái és mérete számszerűen is módosítható.

- Festékszétválasztás HED színtérben, majd sejtmagok keresése és watershed-alapú elválasztása.
- Beállítható sejtmagméret, felismerési és DAB-pozitivitási küszöb.
- Sejtenkénti hely, terület, DAB-jel és pozitív / negatív / kizárt állapot.
- A képen a legközelebbi sejtmag kiválasztható; a besorolás javítása után újraszámolódik a beszámított sejtmagok pozitív aránya.

Ez determinisztikus képfeldolgozás, nem tanított rákszövettani diagnosztikai modell. Nem ismer fel automatikusan malignitást vagy szövettani altípust. A tumorrégiót patológus jelöli ki, a nem tumorsejteket ki kell zárni. A pozitív arány csak megfelelő Ki-67 festés és szakértői ellenőrzés mellett értelmezhető Ki-67-mérésként; nem hitelesített Ki-67-index.

## 5. Multiparametrikus agyi MR

**Bemenet:** anatómiai MR, valamint kész ADC/perfúziós térkép vagy mozgáskorrigált 4D DWI/DSC. DWI-nél képkockánkénti b-érték; DSC-nél TE, időlépés, bázisképkockák és bolusablak szükséges.

- Monoexponenciális, loglineáris ADC-illesztés (mm²/s), nem érvényes voxelértékek kizárásával.
- DSC első átmeneti ΔR2*-integrál. Kijelölt normál referenciaszövet esetén relatív rCBV-normalizálás.
- Választható merev regisztráció: a DWI legkisebb b-értékű képe, illetve a DSC bázisképe illeszkedik az anatómiai referenciához; a transzformáció a származtatott térképre is alkalmazódik. Ez nem a dinamikus képkockák mozgáskorrekciója.
- Több térkép közös megjelenítése; ROI-nként érvényes voxelszám, medián, 10. és 90. percentilis.

Kész térképeknél ismert közös fizikai tér szükséges. A DSC-számítás nem végez szivárgáskorrekciót, AIF-dekonvolúciót, CBF/MTT- vagy DCE/Ktrans-számítást. Nem osztályoz tumorgrádust, progressziót vagy sugárnekrózist.

## Telepítés és korlátok

Meglévő Python 3.12 virtuális környezet esetén:

```sh
npm run advanced:setup
npm run advanced:body-model
npm run dev:full
```

Új környezethez előbb `python3.12 -m venv .venv-inference`. A telepítő az `inference/requirements-advanced.txt` rögzített verzióit használja. A TotalSegmentator és Stanford MIMI súlyok külön letöltések; nem részei a kódnak. Az archívumok és a betöltött modellek SHA-256 ellenőrzése rögzített értékek ellen történik. A modelladapterek nem olvasnak felhasználói fiók-/licenckonfigurációt és nem küldenek telemetriát. Fizetős TotalSegmentator-feladatot nem használunk.

Egy feltöltés legfeljebb 128 MB, egy kérés összesen 260 MB. A kibontott képmennyiség legfeljebb 512 MB, a NIfTI legfeljebb 64 millió voxel (4D-ben az idődimenzióval együtt). Maszkonként legfeljebb 500 régió. DICOM ZIP: egyetlen sorozat, legfeljebb 2500 egyképkockás, szabályos geometriájú szelet. Enhanced/multiframe, döntött gantry, hiányzó/ismételt szelet elutasításra kerül. WSI esetén legfeljebb 4096×4096 pixeles régió elemezhető; nagyobb metszethez kivágat szükséges a fájlméretkorlát miatt. JPEG/PNG-ből nem állítható helyre HU, SUV vagy ADC kalibráció.

A CPU-futtatás valódi, de nagy CT-k lassúak és sok memóriát igényelhetnek. Az adat- és eredménykezelés a helyi géphez kötött; ez nem távoli, többfelhasználós klinikai szolgáltatás.

## Műszaki ellenőrzés

`npm run check` és `.venv-inference/bin/python -m pytest inference -q`.

A tesztek ismert geometriájú szintetikus képeken ellenőrzik az ADC-t, a térfogatokat, SUV-értékeket, rCBV-normalizálást, sejtmagdarabszámot, regisztrációt, párosítást, RECIST-küszöböket, multipart feltöltést, mentést, verzióütközést és a HTTP-hozzáférés határait. A felületen minden modulnak saját szintetikus mintája van. A testösszetételi minta ismert maszkokkal teszteli a mérést; a szervmodell külön is futtatható a szintetikus CT-n. Egy geometriai fantomon a tanított szervmodell üres maszkot is adhat; ezt nem tekintjük anatómiai pontossági bizonyítéknak.

## Elsődleges források és modellek

- [RECIST 1.1 eredeti irányelv, NCI](https://dctd.cancer.gov/research/ctep-trials/for-sites/recist-guidelines-v11.pdf)
- [SimpleITK regisztrációs API](https://simpleitk.org/doxygen/latest/html/classitk_1_1simple_1_1ImageRegistrationMethod.html)
- [TotalSegmentator, feladatok és licencek](https://github.com/wasserth/TotalSegmentator)
- [Stanford MIMI Comp2Comp](https://github.com/StanfordMIMI/Comp2Comp) és [rögzített modellkiadás](https://huggingface.co/stanfordmimi/multilevel_muscle_adipose_tissue/tree/8263e675956f871f37dbe0a4f698069efa8cf38e)
- [OpenSlide](https://openslide.org/) és [scikit-image](https://scikit-image.org/docs/stable/)

Az eredeti kereskedelmi inspirációk: Siemens syngo.via MM Oncology, FUJIFILM SYNAPSE 3D, MIM Encore, Aiforia és Olea Sphere. A Leletív megvalósítása saját, szűkebb kutatási munkafolyamat; nem állítjuk, hogy ezekkel egyenértékű, azonos pontosságú vagy azonos hatósági státuszú.
