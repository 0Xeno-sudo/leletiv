# Leletív – kvantitatív munkatér műszaki ellenőrzése

Dátum: 2026. szeptember 15. Kizárólag generált szintetikus bemenetek. Ez a fejlesztés korábbi ellenőrzési jegyzete; a későbbi, 60 alkalmazástesztet és 33 Python-tesztet tartalmazó kiadási próbát a [RELEASE-VERIFICATION.md](RELEASE-VERIFICATION.md) rögzíti.

## Sikeres ellenőrzések

- TypeScript típusellenőrzés, 53 alkalmazásteszt és a kliens/Worker kiadási build: sikeres az eredeti projektben és a helyi, publikálásra előkészített forrásmásolatban.
- Python: 32 teszt sikeres mindkét forrásmásolaton. A 14 új kvantitatív teszteset lefedi az öt számítási folyamatot, geometriai hibákat, RECIST-határértékeket, feltöltést, verzióütközést, mentett javításokat, előnézetet és megszakítást.
- Futó HTTP-szolgáltatás: mind az öt modul valódi multipart feltöltéssel végigfutott; a letöltött eredmények SHA-256 értékei egyeztek. A mentett ellenőrzés és előzménye visszaolvasható.
- A helyi Python-szolgáltatás leállítása és újraindítása után mind az öt eredmény, az első ellenőrzési változat, az előzmény és minden ellenőrzött eredményfájl változatlan maradt.
- Böngésző: öt modul eredményének megjelenítése; metszeti és 3D nézet; ADC/rCBV rávetítés váltása; javítható elváltozáspárosítás és RECIST-munkalap; PET-régió kiválasztása és mentése; sejtmag kizárása és mentése. A korábban mentett RECIST-adatok újraindítás és oldalbetöltés után is visszatértek.
- Böngészős PNG-feltöltés, metszetelőnézet és feldolgozás: a geometriai mintán 88 sejtmag, 29 DAB-pozitív. Mentett képi eredmény átvétele után az új feldolgozás ugyanezt adta; a forrásfutás és eredményfájl kapcsolata megmaradt.
- A végső megjelenítési és feltöltési próbák alatt nem jelentkezett böngészőkonzol-hiba. A fejlesztés közben észlelt térképváltási hibát és címkehátteret javítottuk.
- A Worker/D1 egészségellenőrzése és a helyi feldolgozó képességellenőrzése sikeres.

## Modellsúlyok tényleges futtatása

A rögzített SHA-256 értékekkel ellenőrzött TotalSegmentator és Stanford MIMI súlyok telepítve vannak a fejlesztői gépen. Mindkét modell ténylegesen lefutott CPU-n. A TotalSegmentator a geometriai fantomra üres szervmaszkot adott; ez futási bizonyíték, nem az anatómiai pontosság tesztje. A Stanford-modell szintetikus, ismert L3-részleten szövetmaszkot és belőle mérési eredményt készített. Valódi betegvizsgálaton nem teszteltük.

## Az ellenőrzés határai

A nyomtatható jelentésoldal és a mentett adatok megjelenítése ellenőrzött. A PDF-fájl tényleges mentését a böngésző nyomtatási ablaka végzi; mentett PDF-fájlt nem ellenőriztünk. Mobil eszközön, nagy WSI-n és klinikai DICOM-adatbázison nem történt teljes körű vizsgálat. A build nem blokkoló csomagméret/wasm-kompatibilitási figyelmeztetéseket, a Python függőségei elavulási figyelmeztetéseket adnak.

Ez műszaki működésellenőrzés, nem klinikai validálás, diagnosztikai teljesítménymérés vagy orvostechnikai megfelelőségigazolás. Helyi adat, virtuális környezet és modellsúly nem része a közzétett forrásnak.
