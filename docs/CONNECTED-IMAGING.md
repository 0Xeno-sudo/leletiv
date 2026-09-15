# Összekapcsolt betegút és képi kutatási eszközök

2026. szeptember 15. – helyi Leletiv-prototípus, szintetikus bemutatóadatokkal.

## A megvalósított hat funkció

### 1. Onkoteam-döntésből végrehajtási terv

A **Döntéstől az eredményig** oldalon az eset rögzített onkoteam-döntéséhez teendők rendelhetők: felelős, határidő, elvárt eredmény és másik tervlépés mint előfeltétel. Minden lépés valódi feladatként jelenik meg a Feladatkoordinációban is. A feladat elkészülte és az eredmény ellenőrzése két külön állapot. Az ellenőrzéshez befejezett feladat, ellenőrzött előfeltétel, áttekintő személy és szöveges eredmény szükséges. Az ellenőrzött tervlépés nem írható felül és nem nyitható észrevétlenül vissza; további munka új lépésként rögzíthető.

### 2. Várt vizsgálatok és beérkező leletek követése

Ugyanitt nyilvántartható a kért vizsgálat, a felelős, a vizsgálati időpont és a lelet várható beérkezése. Külön követhető az időpont-egyeztetés, a vizsgálat megtörténte, az eredmény beérkezése és az orvosi áttekintés. Elmaradt vizsgálat újraütemezhető. Az állapotváltásokhoz megjegyzés és rögzítő személy tartozik; az előzmények megmaradnak. Beérkezéskor az adott eset archív képanyaga vagy a munkatérbe rögzített dokumentuma kapcsolható. A lejárt leletvárási határidő látható. Ez belső követés: nem kér le automatikusan leleteket az EESZT-ből vagy intézményi rendszerekből.

### 3. Archívumhoz kötött képértékelési napló

A **3D képi munkatér** és a **Képalkotási munkatér** között közvetlen kapcsolat van. Az archivált NIfTI-forráskép megnyitható a nézőben. A forrásképhez maszk, állandó régióazonosító, megjegyzés, módszer, paraméterek és a voxelekből számolt térfogat menthető. A szerver ellenőrzi a forrás SHA-256-azonosságát és a maszk térbeli egyezését, majd maga számítja újra a térfogatot. A képfájlok R2-ben, az eredmény és a forráshivatkozás D1-ben maradnak meg. A forrás és a maszk visszanyitható; az áttekintő személy és időpont külön rögzíthető. A modell dobozjelölése nem menthető régiótérfogatként.

### 4. Helyi AI a mellkasi CT tüdőgócjelöltjeihez

A **3D képi munkatér / Tüdőgócjelöltek** eszköz az Apache 2.0 licencű MONAI RetinaNet tényleges előtanított súlyaival fut. A CT-ből jelöltlistát, modellpontszámot és térbeli befoglaló dobozokat ad. Egy jelöltre kattintva a megfelelő metszethez lehet ugrani. Jelöltenként szöveges áttekintési megjegyzés készíthető; a lista, a megjegyzések és a feldolgozási eredetadatok JSON-ba exportálhatók. Az ideiglenes futás törölhető. A feldolgozás nem igényel külső API-kulcsot, és nem küldi szolgáltatóhoz a felvételt.

Ez **nem rosszindulatúság-besorolás**, nem sejtszintű vizsgálat és nem hitelesített daganatdiagnózis. A pontszám detektorpontszám; nem a rák százalékos valószínűsége. A doboz nem léziómaszk, ezért nincs belőle térfogatmérés. Üres eredmény sem zár ki betegséget.

Szükséges: egyetlen térfogati mellkasi NIfTI-1 CT, ismert orientációval, mm-kalibrációval és HU-intenzitásokkal. A JPG/PNG-sorozat nem biztosítja ezeket, ezért ehhez a modellhez nem fogadható el. A fájl legfeljebb 64 MB, a bemenet 12 millió voxel; az újramintavételezett térfogat legfeljebb 16 millió voxel. A helyi profil CPU-ra korlátozott, nem teljes klinikai terhelésre méretezett.

### 5. Félautomatikus térbeli régiókijelölés

A **Régiókijelölés** eszközben a metszeten kiválasztott pontból indítható régiónövesztés. Megadható az intenzitástartomány és a maximális fizikai sugár. A feldolgozás a szomszédos, megfelelő intenzitású voxeleket követi, és térben korlátozott maszkot képez. A maszk a forrásképre kerül, mérhető, letölthető és az esethez menthető. Ismert milliméteres geometria kell hozzá.

Ez determinisztikus képfeldolgozás, **nem AI-alapú daganatfelismerés**. Az intenzitás önmagában nem határozza meg a szövettani típust; a határok helyességét a felhasználónak kell ellenőriznie. MR-en az értékek nem HU-egységek. Az új régiómaszk a néző aktuális maszkját cseréli le.

### 6. Két időpont képi összehasonlítása

A **Vizsgálatok összehasonlítása** oldalon egymás mellett nyitható meg kiinduló és kontroll NIfTI-felvétel, valamint mindkét vizsgálat régiómaszkja. Megadhatók a vizsgálati dátumok. Egyező voxelrács és kézzel megerősített előzetes anatómiai illesztés mellett összekapcsolhatók a metszetek. A kijelölt maszktérfogatok változása ml-ben és százalékosan ellenőrizhető.

A változástérkép megmutatja a közös, csak a kontrollban, illetve csak a kiinduló maszkban szereplő voxeleket. A térkép megjeleníthető és NIfTI-ként letölthető; az összehasonlítás forráshash-ekkel együtt JSON-ba exportálható. Beépített, ismert geometriájú szintetikus példa segít a kipróbálásban.

A rendszer nem végez automatikus képi regisztrációt. Azonos rács nem bizonyít azonos anatómiai helyzetet. A százalék a maszkok térfogatkülönbsége, nem RECIST-besorolás, progressziómegállapítás vagy terápiás válaszértékelés. A maszkok változó kijelölése önmagában is változtatja az eredményt.

## Nemzetközi minták és a kiválasztás indoka

A funkcióválasztást nyilvános termékleírások és nyílt kutatási modellek alapján végeztük, nem fizetős termék kódjának másolásával.

- [GE HealthCare Lung VCAR](https://www.gehealthcare.com/en-us/products/imaging-applications/advanced-visualization-applications/lung-vcar): tüdőgócok követése, szegmentálása és térfogat-összehasonlítása mint munkafolyamati referencia.
- [Siemens CT Oncology](https://www.siemens-healthineers.com/en-us/computed-tomography/ct-clinical-fields/ct-oncology): onkológiai képfeldolgozás és léziókövetés mint termékirány.
- [MONAI Model Zoo](https://github.com/Project-MONAI/model-zoo): hozzáférhető, reprodukálható kutatási modellek. A konkrét [tüdődetektor dokumentációja](https://huggingface.co/MONAI/lung_nodule_ct_detection/blob/9d6622fda0e52be0a4155fed2e0afb9c17bcd80b/docs/README.md) és [inferencia-konfigurációja](https://huggingface.co/MONAI/lung_nodule_ct_detection/blob/9d6622fda0e52be0a4155fed2e0afb9c17bcd80b/configs/inference.json) alapján készült az integráció.

Nem állítjuk, hogy ezek a funkciók Magyarországon nem léteznek, vagy hogy a prototípus pontossága és szolgáltatási szintje megegyezik a kereskedelmi termékekével. Ehhez piacfelmérés és megfelelő klinikai értékelés kellene.

## Nyílt forrás és modellproveniencia

A tüdőmodell rögzített verziója: `9d6622fda0e52be0a4155fed2e0afb9c17bcd80b`. Súlyfájl: 83 709 381 bájt; SHA-256: `b5e79231466adae93a6fe8e8594029e9add142914e223b879aa0343bb2402d01`. A letöltő és a futtató is ellenőrzi. A MONAI Apache 2.0 licenc a `inference/LUNG-MODEL-LICENSE.txt` fájlban található.

Az előfeldolgozás RAS-orientációra és 0,703125 × 0,703125 × 1,25 mm-re mintavételez, majd a −1024…300 HU-tartományt 0…1 közé skálázza. A helyi 192 × 192 × 80-as ablak **eltér** a közzétett 512 × 512 × 192-es konfigurációtól; a publikált teljesítmény nem vihető át erre a változatra. A megjelenítési küszöb 0,1, legfeljebb 50 jelölt jelenik meg. A metaadat mindezt tartalmazza.

Az integráció forrása helyben elkészült. A teljes projekt nyílt forrású kiadásához külön projektlicenc és a többi függőség licencellenőrzése szükséges. Ebben a munkában nem történt publikálás vagy telepítés távoli szolgáltatásra.

## Helyi indítás és adatok

`npm run dev:full` indítja a webalkalmazást és a Python-szolgáltatást. `npm run dev` csak a webalkalmazás. A helyi fejlesztőprogram a tényleges Worker, D1 és R2 futtatókörnyezetet használja. A Miniflare 5 helyi tára: `.wrangler/state/connected-care`. A nyilvános kiadás üres adatbázissal indul; nem importál korábbi helyi adatokat vagy képfájlokat. A helyi migrációkat az indító automatikusan alkalmazza; távoli migrációt nem futtat.

Új gépen a Python-környezet telepítése után: `npm run inference:model` és `npm run inference:lung-model`. A néző és a régió/összehasonlító eszközök a Python-modell nélkül is használhatók.

A felület PDF / nyomtatás művelete az aktuális nézet böngészős PDF-exportja. A JSON és NIfTI export őrzi a strukturált eredményt és a képi maszkot. A nézőben vagy jelöltlistán beírt, még nem exportált/archivált adatok nem jelentenek tartós dokumentációt.

## Ellenőrzési bizonyíték

- 53 TypeScript-egységteszt: geometria, forrásazonosság, régiónövesztés, maszkfájl és összehasonlítás, valamint a korábbi funkciók tesztjei.
- 15 korábbi Python-teszt és 3 új tüdőbemeneti/cancel teszt sikeres.
- Izolált valódi Worker–D1–R2 integráció: feladat/előfeltétel, ellenőrzési zár, vizsgálati átmenetek, verzióütközés, idegen eset elutasítása, feltöltés, hash-egyezés, pontos maszkletöltés. Újraindított futtatókörnyezettel is megmarad az eredmény.
- A tényleges RetinaNet-súlyok szintetikus CT-n végrehajtódtak; a HTTP-folyamat is befejeződött. Ez a futtathatóságot igazolja, nem klinikai pontosságot.
- TypeScript-ellenőrzés és önálló frontend production build sikeres; a DICOM WASM csomagból származó böngészős externalization- és nagy csomagméret-jelzések megmaradtak.

- Aside böngészőben: tervlépés létrehozása és újratöltés utáni megőrzése; CT-modellkimenet megnyitása; jelölthöz ugrás; 93 voxeles intenzitásalapú régió létrehozása; CT és maszk archiválása; visszanyitás az eset naplójából.
- Az ismert szintetikus képpár 1,419 ml-ről 0,925 ml-re változó maszkja −34,8%-ot mutatott; a szinkronizált nézet és a színes változástérkép megjelent.
- Asztali és 390 × 844-es iPhone 12 Pro emuláció: képi navigáció, archiválási űrlap és legördülő elrendezése megtekintve. A vizsgált képnéző konzoljában nem volt hibabejegyzés. Nem teljes eszköz- vagy böngészőmátrix.
- A korábbi helyi tár külön ideiglenes környezetbe történő importálása és ismételt futtatása sikeres: az esetszám változatlan, a csatolt képfájlok elérhetők, a legújabb migráció jelen van.

- Mindkét helyi szolgáltatás újraindítása után az Aside-ban is visszatöltődött a mentett forrás és a 93 voxeles maszk. A tényleges multipart CT-feltöltési modellút külön ellenőrzése: `inference/verify_lung_pipeline.py` (szintetikus adat, modellfuttatás, forráshash és geometria, saját ideiglenes futás törlése).
