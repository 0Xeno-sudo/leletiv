# Végigkövethető demóbetegutak

A munkatér minden oldalán megjelenik a **Szintetikus demó** doboz. A **Követett demóeset** mezővel választható betegút; a **Következő lépés** gomb és a lenyitható állomáslista az esethez tartozó oldalakra vezet.

## Három kitalált történet

- **Szalai Borbála – DEMO-LV-001:** bal frontalis eltérés kivizsgálása, onkoteamre előkészített eset. A döntésrögzítés, konzílium, feladat és külön eredményellenőrzés próbálható ki.
- **Hegedűs András – DEMO-LV-002:** mellkasi eltérés kivizsgálása, beérkezésre váró végleges szövettani lelet. A hiánypótlás, elakadt feladat és vizsgálati állapotváltások követhetők.
- **Fodor Júlia – DEMO-LV-003:** korábbi ellátás utáni neuro-onkológiai kontroll. A két lelet összehasonlítása, az áttekintett eredmény és a következő kontroll egyeztetése tesztelhető.

Esetenként két forráslelet, két pontos idézet és összevethető mérés, négy feladat, három egymásra épülő végrehajtási lépés, egy korábbi előkészítő döntés, egy utánkövetés és egy állapottörténettel rendelkező vizsgálat tartozik a csomaghoz. Három kitalált munkatárs, MR-erőforrás és egy mentett kapacitásforgatókönyv is szerepel benne.

## Képi próbák

Esetenként két 48×48 képpontos, 48 szeletből álló, mindhárom irányban 2 mm-es felbontású NIfTI-próbakép és a hozzájuk tartozó területkijelölés kerül a helyi archívumba. A mentett régió, a mérések és a forrás SHA-256 lenyomata együtt visszanyitható. Az összehasonlító oldal a demóbetegútból érkezve automatikusan megnyitja a két próbaképet. A próbaképek a működést mutatják be; nem a leletekben leírt anatómia rekonstrukciói.

A kvantitatív munkatérben az MR-minta Borbálához, az időbeli követési minta Júliához, a PET/CT-, testösszetételi és szövettani képfeldolgozási minták András demóbetegútjához kapcsolódnak. Ez a feldolgozási kapcsolat kipróbálását jelenti, nem a kitalált beteg igazolt klinikai eredményét. Az eredmények kezdetben nem ellenőrzöttek: a felhasználó javíthatja és mentheti saját próbaellenőrzését.

## Betöltés és mentés

Üres helyi munkatérben a demódoboz **Három demóbetegút betöltése** gombja telepíti az eseteket. A képfeldolgozóval együtt teljesen előkészített mintákhoz:

```sh
npm run demo:seed
```

Ehhez a helyi webalkalmazásnak és a kvantitatív mintákhoz a Python-feldolgozónak futnia kell. A parancs kizárólag a 127.0.0.1 címet használja. A már meglévő demóeseteket és elmentett módosításokat nem írja felül; nem töröl más esetet. Távoli telepítést nem végez.

A demóban a valódi alkalmazás mentési műveletei használhatók. Például állítson egy feladatot Készre, töltse újra az oldalt, majd a Döntéstől az eredményig oldalon külön rögzítse az eredmény ellenőrzését. A tervlépésnek nem elég csak a feladatállapotot lezárni.

## Ellenőrzés

A `src/shared/demo.test.ts` ellenőrzi az idegen kulcsokat, a kapcsolt rekordokat, a valódi NIfTI-bájtokat, a fizikai térfogatot, a helyi telepítési határt és a módosítások megőrzését. A `node scripts/verify-demo.mjs` a futó alkalmazás API-ján ellenőrzi mindhárom betegút leleteit, a forrásfájlok lenyomatait, a képeket/maszkokat és az ismételt betöltés változatlanságát.

Kizárólag kitalált személyek, szerkesztett oktatási leletek és generált képek szerepelnek benne. A demó nem betegellátási rendszer vagy hitelesített orvosi dokumentáció.

Ellenőrzés dátuma: 2026. szeptember 15. TypeScript és kiadási build sikeres; 60 alkalmazásteszt és 33 Python-teszt sikeres. A futó API-n mindhárom demóbetegút és az ismételt betöltés ellenőrzött. Böngészőben a feladatmódosítás megmaradt a másik oldalon történő visszanyitáskor; a leletgrafikon, archív kép/maszk, automatikus képpár és a mentett MR-demó megjelent, konzolhiba nélkül. A demóútmutató a teljes közös oldalkeret része.
