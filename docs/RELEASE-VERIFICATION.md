# Leletív – publikálás előtti ellenőrzés

2026. szeptember 15. Minden képi és betegúti próba szintetikus adatokkal történt. Ez műszaki működésellenőrzés, nem klinikai validálás.

## Eredmény

A forrás kutatási és bemutató alkalmazásként publikálható. Az alábbi ellenőrzések sikeresen lefutottak az eredeti munkatéren és a külön, üres indulásra előkészített kiadási példányon.

- **60 alkalmazásteszt**, TypeScript-típusellenőrzés, kliens- és Worker-build.
- **33 Python-teszt**, az öt kvantitatív munkafolyamat és hibás bemenetek ellenőrzésével.
- Üres adatbázisból indulás: első eset, munkatárs, feladat, döntés, feltöltés, fájlbájtok visszaolvasása és újraindítás utáni megmaradás. Idegen eredetű módosító kérés elutasítása.
- Három demóbetegút: dokumentumok, pontos forrásidézetek, mérési kapcsolatok, lépések, vizsgálatok, képfájlok és kijelölések. Az ismételt betöltés megőrzi a módosításokat.
- Összekapcsolt munkafolyamat: előfeltételek, lezárási védelem, vizsgálati állapotváltások, verzióütközések, előzmények, esetek közötti adatelkülönítés és eredményhez kötött utánkövetés.
- Valódi HTTP-feltöltéssel lefutott mind az öt kvantitatív modul. Az eredményfájlok ellenőrzőösszege, a mentett ellenőrzés és annak előzménye visszaolvasható.
- A MONAI agyi MR- és tüdőgócmodell a tényleges helyi súlyokkal is lefutott. A forrásazonosság és az eredmény térbeli geometriája ellenőrzött.
- A TotalSegmentator és a Stanford MIMI tényleges helyi súlyokkal is lefutott. A geometriai fantomra a szervmodell üres maszkot adott; az ismert L3-részleten a testösszetételi modell mérési eredményt készített. Ez futási bizonyíték, nem anatómiai pontosságmérés.
- Böngészőben megnyíltak a fő oldalak, a demóbetegút és az MR-eredmény. A feladat állapota újratöltés után is megmaradt. A képösszehasonlításban a kapcsolt metszetek, a változástérkép és a kontrollkijelölés visszaállítása működött. Az ellenőrzött oldalakon nem jelentkezett konzolhiba vagy vízszintes túllógás.

## A közzétett csomag

A kiadás forráskódot, sémát, teszteket és dokumentációt tartalmaz. Nem tartalmaz helyi adatbázist, feltöltött fájlokat, naplókat, virtuális környezetet, modellsúlyokat vagy betűtípusfájlokat. A kiadásra kijelölt szöveges forrásokban végzett kulcsminta- és helyiútvonal-ellenőrzés nem talált egyezést. Titkos konfigurációs fájlok nem kerültek megnyitásra vagy a csomagba.

## Ellenőrzési határok

A vizsgálat nem bizonyít teljes hibamentességet vagy diagnosztikai pontosságot. Valódi betegadatot nem használtunk. Mobil készüléken, natív Windows alatt, nagy szövettani metszeteken és klinikai DICOM-adatbázison nem történt teljes körű tesztelés. A nyomtatható jelentésoldal ellenőrzött; a böngésző nyomtatási ablakából ténylegesen elmentett PDF-fájlt nem vizsgáltuk. A build és egyes Python-függőségek nem blokkoló figyelmeztetéseket adnak.

A korábbi, részletes kvantitatív próbákat az [ADVANCED-VERIFICATION.md](ADVANCED-VERIFICATION.md) dokumentálja. A forrás publikálása nem jelent élő szolgáltatás telepítését.
